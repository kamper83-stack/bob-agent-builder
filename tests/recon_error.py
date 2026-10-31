"""Check error state text after aborted API call."""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle")
    page.evaluate("""() => {
        localStorage.setItem("agent-studio:agentDef", JSON.stringify({
            inputType: "test", outputType: "test",
            policyDocId: "service_policy",
            agentInstructions: "test instructions"
        }));
        localStorage.setItem("agent-studio:maxStep", "1");
    }""")

    page.goto("http://localhost:3000/test")
    page.wait_for_load_state("networkidle")
    page.locator("textarea").fill("test complaint")

    def abort_route(route):
        route.abort()

    page.route("**/api/run", abort_route)
    page.locator("button", has_text="▶ Run").click()

    # Wait for error to appear
    time.sleep(5)

    print("=== All text that might be an error ===")
    for el in page.locator("div[class*='red'], p[class*='red'], div[class*='error']").all():
        t = (el.text_content() or "").strip()
        if t:
            print("RED:", repr(t[:100]))

    print("\n=== Full page text of visible divs ===")
    for el in page.locator("div").all():
        t = (el.text_content() or "").strip()
        if "error" in t.lower() or "failed" in t.lower() or "unavailable" in t.lower():
            print("MATCH:", repr(t[:120]))
            break

    print("\n=== Actual error element HTML ===")
    err = page.locator(".text-red-700, .text-red-300, [class*='text-red']").first
    if err.count() > 0:
        print(err.text_content())

    browser.close()
    print("Done.")
