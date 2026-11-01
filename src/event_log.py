"""
event_log.py
------------
Keeps recent backend log records in memory so the Logs page can show them.

Records live only in this process and are cleared when the backend restarts.
Only the formatted message is stored. Tracebacks and exception text are left
out because they can contain customer text or credentials.
"""

import logging
from collections import deque
from datetime import datetime, timezone
from typing import TypedDict

MAX_ENTRIES = 500


class LogEntry(TypedDict):
    timestamp: str
    level: str
    message: str


class MemoryLogHandler(logging.Handler):
    def __init__(self, capacity: int = MAX_ENTRIES) -> None:
        super().__init__(level=logging.INFO)
        self._entries: deque[LogEntry] = deque(maxlen=capacity)

    def emit(self, record: logging.LogRecord) -> None:
        try:
            entry: LogEntry = {
                "timestamp": datetime.fromtimestamp(record.created, timezone.utc).isoformat(),
                "level": record.levelname.lower(),
                "message": record.getMessage(),
            }
            with self.lock:
                self._entries.append(entry)
        except Exception:
            self.handleError(record)

    def recent(self) -> list[LogEntry]:
        """Returns the stored entries, newest first."""
        with self.lock:
            return list(reversed(self._entries))

    def reset(self) -> None:
        """Clears all stored entries. For use in tests."""
        with self.lock:
            self._entries.clear()


memory_handler = MemoryLogHandler()


def install(logger: logging.Logger) -> None:
    """Sends INFO and above from `logger` and its children to the memory handler."""
    logger.setLevel(logging.INFO)
    if memory_handler not in logger.handlers:
        logger.addHandler(memory_handler)
