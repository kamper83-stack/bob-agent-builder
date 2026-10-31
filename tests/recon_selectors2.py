"""Reconnaissance: inspect test and improve pages."""
from playwright.sync_api import sync_playwright
import json

BASE = "http://localhost:3000"
COMPLAINT = (
    "I placed an order two weeks ago and it still hasn't arrived. "
    "I've sent three emails and called twice but no one has responded."
)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    # Pre-fill localStorage so /test is accessible
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.evaluate("""() => {
        localStorage.setItem('agent-studio:config', JSON.stringify({
            inputType: 'A customer complaint email',
            outputType: 'A response email draft and an internal action note',
            policyDocId: 'service_policy',
            agentInstructions: 'You are a customer service assistant. Write a professional response email and brief internal action note.'
        }));
    }""")

    # ── Test page ────────────────────────────────────────────────────────────
    page.goto(f"{BASE}/test")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/recon_test_empty.png", full_page=True)

    print("=== TEST: all inputs ===")
    for el in page.locator("input, textarea, select").all():
        t = el.get_attribute("type") or el.evaluate("e => e.tagName")
        ph = el.get_attribute("placeholder") or ""
        print(f"  [{t}] placeholder={repr(ph[:60])}")

    print("\n=== TEST: buttons ===")
    for el in page.locator("button").all():
        txt = (el.text_content() or "").strip()
        disabled = el.get_attribute("disabled")
        if txt:
            print(f"  text={repr(txt[:60])} disabled={disabled}")

    print("\n=== TEST: headings/labels ===")
    for el in page.locator("h1, h2, h3, label").all():
        print(f"  {repr((el.text_content() or '').strip()[:80])}")

    # ── Improve page (prefill localStorage) ──────────────────────────────────
    page.goto(f"{BASE}/improve")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/recon_improve.png", full_page=True)

    print("\n=== IMPROVE: all inputs ===")
    for el in page.locator("input, textarea, select, button[role='radio']").all():
        t = el.get_attribute("type") or el.evaluate("e => e.tagName")
        ph = el.get_attribute("placeholder") or ""
        aria = el.get_attribute("aria-label") or ""
        print(f"  [{t}] placeholder={repr(ph[:60])} aria={repr(aria[:40])}")

    print("\n=== IMPROVE: buttons ===")
    for el in page.locator("button").all():
        txt = (el.text_content() or "").strip()
        disabled = el.get_attribute("disabled")
        aria = el.get_attribute("aria-label") or ""
        if txt or aria:
            print(f"  text={repr(txt[:60])} aria={repr(aria[:40])} disabled={disabled}")

    print("\n=== IMPROVE: headings ===")
    for el in page.locator("h1, h2, h3, h4").all():
        print(f"  {repr((el.text_content() or '').strip()[:80])}")

    browser.close()
    print("\nDone.")
