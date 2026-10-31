"""Reconnaissance: inspect home and define pages to find real selectors."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    # ── Home page ────────────────────────────────────────────────────────────
    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/recon_home.png", full_page=True)

    print("=== HOME: buttons and links ===")
    for el in page.locator("a, button").all():
        txt = (el.text_content() or "").strip()
        href = el.get_attribute("href") or ""
        role = el.evaluate("e => e.tagName")
        if txt:
            print(f"  [{role}] text={repr(txt[:60])} href={repr(href)}")

    print("\n=== HOME: headings ===")
    for el in page.locator("h1, h2, h3").all():
        print(f"  {repr((el.text_content() or '').strip()[:80])}")

    # ── Define page ──────────────────────────────────────────────────────────
    page.goto("http://localhost:3000/define")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/recon_define.png", full_page=True)

    print("\n=== DEFINE: all inputs ===")
    for el in page.locator("input, textarea, select").all():
        t = el.get_attribute("type") or el.evaluate("e => e.tagName")
        ph = el.get_attribute("placeholder") or ""
        name = el.get_attribute("name") or el.get_attribute("id") or ""
        print(f"  [{t}] name={repr(name)} placeholder={repr(ph[:60])}")

    print("\n=== DEFINE: buttons ===")
    for el in page.locator("button").all():
        txt = (el.text_content() or "").strip()
        disabled = el.get_attribute("disabled")
        print(f"  text={repr(txt[:60])} disabled={disabled}")

    print("\n=== DEFINE: labels ===")
    for el in page.locator("label").all():
        print(f"  {repr((el.text_content() or '').strip()[:80])}")

    browser.close()
    print("\nDone.")
