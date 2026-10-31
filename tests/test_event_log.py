"""Tests for the in-memory event log and the /logs endpoint."""

import asyncio
import logging

import pytest
from fastapi.testclient import TestClient

from src import api, event_log
from src.event_log import MemoryLogHandler


@pytest.fixture
def client():
    event_log.memory_handler._entries.clear()
    return TestClient(api.app, raise_server_exceptions=False)


def make_record(message: str, exc_info=None) -> logging.LogRecord:
    return logging.LogRecord("src.test", logging.ERROR, __file__, 1, message, None, exc_info)


def messages(client: TestClient) -> list[str]:
    return [e["message"] for e in client.get("/logs").json()["entries"]]


def test_recent_returns_newest_first_and_drops_oldest():
    handler = MemoryLogHandler(capacity=2)
    for message in ("one", "two", "three"):
        handler.emit(make_record(message))
    assert [e["message"] for e in handler.recent()] == ["three", "two"]


def test_entry_has_timestamp_level_and_message():
    handler = MemoryLogHandler()
    handler.emit(make_record("boom"))
    entry = handler.recent()[0]
    assert entry["level"] == "error"
    assert entry["message"] == "boom"
    assert entry["timestamp"].endswith("+00:00")


def test_traceback_text_is_not_stored():
    handler = MemoryLogHandler()
    try:
        raise RuntimeError("secret-key-123")
    except RuntimeError as exc:
        handler.handle(make_record("failed", (type(exc), exc, exc.__traceback__)))
    assert "secret-key-123" not in str(handler.recent())


def test_request_is_logged_without_its_body(client):
    client.post("/improve", json={"current_instructions": "private text", "rating": 9})
    logged = messages(client)
    assert len(logged) == 1
    assert logged[0].startswith("POST /improve returned 422 in ")
    assert "private text" not in logged[0]


@pytest.mark.parametrize("status, level", [(200, "info"), (404, "warning"), (503, "error")])
def test_level_follows_status(client, status, level):
    async def fake_call_next(_request):
        return api.Response(status_code=status)

    request = api.Request({"type": "http", "method": "GET", "path": "/x", "headers": [],
                           "query_string": b"", "server": ("test", 80), "scheme": "http"})
    asyncio.run(api.log_requests(request, fake_call_next))
    assert event_log.memory_handler.recent()[0]["level"] == level


def test_reading_logs_is_not_logged(client):
    client.get("/logs")
    assert messages(client) == []


def test_unhandled_error_names_the_type_but_not_the_text(client, monkeypatch):
    def fail(**_kwargs):
        raise RuntimeError("secret-key-123")

    monkeypatch.setattr(api, "suggest_improvement", fail)
    res = client.post("/improve", json={"current_instructions": "x", "rating": 3})
    assert res.status_code == 502
    logged = messages(client)
    assert "Unhandled RuntimeError on /improve" in logged
    assert "secret-key-123" not in str(logged)
