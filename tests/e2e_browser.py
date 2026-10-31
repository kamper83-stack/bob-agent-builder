"""
e2e_browser.py
--------------
End-to-end browser test for Agent Studio following the SMOKE_TEST.md checklist.

Requires both servers to be running:
  - Backend:  uvicorn src.api:app --reload  (port 8000)
  - Frontend: cd app && npm run dev         (port 3000)

Run:
    python3 tests/e2e_browser.py
"""

import sys
import time
from playwright.sync_api import sync_playwright, Page

BASE = "http://localhost:3000"
COMPLAINT = (
    "I placed an order two weeks ago and it still hasn't arrived. "
    "I've sent three emails and called twice but no one has responded. "
    "This is completely unacceptable."
)

PASS = "\033[32m✓\033[0m"
FAIL = "\033[31m✗\033[0m"

failures: list[str] = []
passed_count = 0


def check(label: str, ok: bool, detail: str = "") -> None:
    global passed_count
    if ok:
        passed_count += 1
        print(f"  {PASS} {label}")
    else:
        msg = f"{label}{' — ' + detail if detail else ''}"
        print(f"  {FAIL} {msg}")
        failures.append(msg)


def screenshot(page: Page, name: str) -> None:
    path = f"/tmp/e2e_{name}.png"
    page.screenshot(path=path, full_page=True)
    print(f"      📸 {path}")


def seed_localstorage(page: Page) -> None:
    """
    Inject a minimal agentDef so /test and /improve are accessible
    without having to navigate through /define.
    """
    page.evaluate("""() => {
        localStorage.clear();
        localStorage.setItem('agent-studio:agentDef', JSON.stringify({
            inputType: 'A customer complaint email',
            outputType: 'A response email draft and an internal action note',
            policyDocId: 'service_policy',
            agentInstructions: 'You are a customer service assistant. Write a professional email reply and a brief internal action note.'
        }));
        localStorage.setItem('agent-studio:maxStep', '1');
    }""")


# ── Step 1: Home screen ───────────────────────────────────────────────────────

def test_home(page: Page) -> None:
    print("\n── Step 1: Home screen ─────────────────────────────────────────")
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    # Start fresh
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_load_state("networkidle")
    screenshot(page, "01_home")

    check("Page loads without application error",
          not page.locator("text=Application error").is_visible())

    heading = page.locator("h1, h2").first
    text = (heading.text_content() or "").strip()
    check(f"Heading visible: '{text}'", len(text) > 0)

    # The CTA button is "Build your first agent →"
    cta = page.get_by_role("button", name="Build your first agent")
    check('"Build your first agent" CTA button visible', cta.is_visible())

    # NavBar: "Define" is a link, "Test" and "Improve" are disabled spans
    define_link = page.locator("nav a[href='/define']")
    check("NavBar step 1 (Define) is a clickable link", define_link.count() > 0)

    disabled_steps = page.locator("nav span[aria-disabled='true']")
    check("NavBar steps 2 and 3 are disabled", disabled_steps.count() >= 2)


# ── Step 2: Define screen ─────────────────────────────────────────────────────

def test_define(page: Page) -> None:
    print("\n── Step 2: Define screen (/define) ─────────────────────────────")
    page.goto(f"{BASE}/define")
    page.wait_for_load_state("networkidle")
    screenshot(page, "02_define_empty")

    # "Save and continue" is disabled when both fields are empty
    save_btn = page.locator("button", has_text="Save and continue")
    is_disabled = save_btn.get_attribute("disabled") is not None
    check('"Save and continue" disabled when fields are empty', is_disabled)

    # Input fields (type=text, identified by id)
    input_field = page.locator("#input-type")
    output_field = page.locator("#output-type")
    policy_select = page.locator("#policy-doc")
    check("Input-type field present", input_field.count() > 0)
    check("Output-type field present", output_field.count() > 0)
    check("Policy-doc select present", policy_select.count() > 0)

    input_field.fill("A customer complaint email")
    output_field.fill("A response email draft and an internal action note")
    policy_select.select_option(value="service_policy")

    # Save button should now be enabled
    save_btn2 = page.locator("button", has_text="Save and continue")
    is_enabled = save_btn2.get_attribute("disabled") is None
    check('"Save and continue" enabled after filling fields', is_enabled)

    screenshot(page, "02_define_filled")
    save_btn2.click()
    # Next.js App Router uses client-side routing — wait for URL change
    page.wait_for_url("**/test", timeout=8000)
    check("Redirected to /test after saving", "/test" in page.url)
    screenshot(page, "02_define_after_save")


# ── Step 3: Test screen ───────────────────────────────────────────────────────

def test_run(page: Page) -> None:
    print("\n── Step 3: Test screen (/test) ──────────────────────────────────")
    # Ensure agent is configured (seed localStorage if needed)
    seed_localstorage(page)
    page.goto(f"{BASE}/test")
    page.wait_for_load_state("networkidle")
    screenshot(page, "03_test_empty")

    check("No 'not configured' warning banner",
          not page.locator("text=Agent not configured yet").is_visible())

    textarea = page.locator("textarea")
    check("Complaint textarea present", textarea.is_visible())

    # Run button should be disabled before input
    run_btn = page.locator("button", has_text="▶ Run")
    check('"▶ Run" button present', run_btn.is_visible())
    is_disabled_before = run_btn.get_attribute("disabled") is not None
    check('"▶ Run" disabled before input', is_disabled_before)

    textarea.fill(COMPLAINT)

    is_enabled_after = run_btn.get_attribute("disabled") is None
    check('"▶ Run" enabled after typing complaint', is_enabled_after)

    run_btn.click()

    # Loading state
    page.wait_for_selector("button:has-text('Running…')", timeout=8000)
    check("Loading state: button shows 'Running…'", True)

    # Wait for response (live API — up to 30s)
    page.wait_for_selector("button:has-text('▶ Run')", timeout=30000)
    page.wait_for_load_state("networkidle")
    screenshot(page, "03_test_result")

    # Output sections: "Email draft" label and "Action note" label
    email_label = page.locator("text=Email draft").or_(page.locator("text=Response"))
    action_label = page.locator("text=Action note")
    check('"Email draft" label visible in output', email_label.first.is_visible())
    check('"Action note" label visible in output', action_label.first.is_visible())

    # Rate button
    rate_btn = page.locator("button", has_text="Rate this output")
    check('"Rate this output →" button appears after run', rate_btn.is_visible())

    rate_btn.click()
    # Next.js App Router — wait for client-side URL change
    page.wait_for_url("**/improve", timeout=5000)
    check("Navigated to /improve after clicking Rate", "/improve" in page.url)
    screenshot(page, "03_test_navigated_improve")


# ── Step 4: Improve screen ────────────────────────────────────────────────────

def test_improve(page: Page) -> None:
    print("\n── Step 4: Improve screen (/improve) ───────────────────────────")
    page.wait_for_load_state("networkidle")
    screenshot(page, "04_improve_initial")

    # Last run preview
    last_run = page.locator("text=Last run output")
    check('"Last run output" preview section visible', last_run.is_visible())

    # Star rating: click 3rd star (aria-label="3 stars")
    star3 = page.get_by_role("button", name="3 stars")
    check('"3 stars" button found', star3.is_visible())
    star3.click()
    label_good = page.get_by_text("Good", exact=True)
    check('Rating label shows "Good" after 3 stars', label_good.is_visible())

    # Comment
    comment_area = page.locator("textarea#comment")
    comment_area.fill("Too formal — be more empathetic")
    check("Typed improvement comment", True)

    screenshot(page, "04_improve_filled")

    # Get suggestion (disabled until rating set — it is now set)
    suggest_btn = page.locator("button", has_text="Get improvement suggestion")
    is_enabled = suggest_btn.get_attribute("disabled") is None
    check('"Get improvement suggestion" enabled after rating', is_enabled)
    suggest_btn.click()

    # Loading state
    page.wait_for_selector("button:has-text('Getting suggestion…')", timeout=8000)
    check("Loading state: button shows 'Getting suggestion…'", True)

    # Wait for suggestion (live API — up to 30s)
    page.wait_for_selector("text=Suggested instruction change", timeout=30000)
    page.wait_for_load_state("networkidle")
    screenshot(page, "04_improve_suggestion")

    check('"Suggested instruction change" heading visible', True)

    # Accept
    accept_btn = page.get_by_role("button", name="Accept & update agent →")
    check('"Accept & update agent →" button visible', accept_btn.is_visible())
    accept_btn.click()
    page.wait_for_load_state("networkidle")
    screenshot(page, "04_improve_accepted")

    # Confirmation
    confirmation = page.locator("text=✓ Agent instructions updated")
    check('Confirmation "✓ Agent instructions updated" visible', confirmation.is_visible())

    # "Run agent again →" navigates to /build
    run_again = page.get_by_role("button", name="Run agent again →")
    check('"Run agent again →" button visible', run_again.is_visible())


# ── Step 6: Refresh resilience ────────────────────────────────────────────────

def test_refresh(page: Page) -> None:
    print("\n── Step 6: Refresh resilience ───────────────────────────────────")
    page.goto(f"{BASE}/test")
    page.wait_for_load_state("networkidle")
    page.reload()
    page.wait_for_load_state("networkidle")
    screenshot(page, "06_refresh")

    check("Page loads after refresh without error",
          not page.locator("text=Application error").is_visible())
    check("Agent not-configured warning absent (localStorage persisted)",
          not page.locator("text=Agent not configured yet").is_visible())
    check("Complaint textarea present after refresh",
          page.locator("textarea").is_visible())


# ── Step 7: Backend error handling ───────────────────────────────────────────

def test_error_handling(page: Page) -> None:
    print("\n── Step 7: Error handling (bad input → API error) ──────────────")
    seed_localstorage(page)
    page.goto(f"{BASE}/test")
    page.wait_for_load_state("networkidle")

    # Temporarily point to wrong backend to simulate error
    # We do this by filling a complaint and intercepting the response
    textarea = page.locator("textarea")
    textarea.fill("test complaint")

    def abort_route(route):
        route.abort()

    page.route("**/api/run", abort_route)

    run_btn = page.locator("button", has_text="▶ Run")
    run_btn.click()

    # Wait for error message — the error div shows "Failed to fetch" or an API error message
    try:
        page.wait_for_selector(
            "text=Failed to fetch, text=API error, text=Backend unavailable",
            timeout=8000
        )
        check("Error banner appears when backend fails", True)
    except Exception:
        # Also accept any visible red-text error div
        err_visible = page.locator(".text-red-700, .text-red-300").first.is_visible()
        check("Error banner appears when backend fails", err_visible,
              "no error message found within 8s")

    screenshot(page, "07_error_handling")
    page.unroute("**/api/run")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("Agent Studio — E2E Browser Test")
    print(f"Target: {BASE}")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        console_errors: list[str] = []
        page.on("console", lambda msg: console_errors.append(msg.text)
                if msg.type == "error" else None)

        try:
            test_home(page)
            test_define(page)
            test_run(page)
            test_improve(page)
            test_refresh(page)
            test_error_handling(page)
        except Exception as exc:
            import traceback
            print(f"\n  {FAIL} Unexpected exception: {exc}")
            traceback.print_exc()
            screenshot(page, "99_crash")
            failures.append(f"Unhandled exception: {exc}")
        finally:
            browser.close()

    print("\n" + "=" * 60)
    js_errors = [e for e in console_errors
                 if "hydration" not in e.lower()
                 and "version-staleness" not in e.lower()]
    if js_errors:
        print(f"⚠  Unexpected console errors ({len(js_errors)}):")
        for e in js_errors[:5]:
            print(f"   • {e[:120]}")

    total_fail = len(failures)
    total_pass = passed_count
    print(f"\nResult: {total_pass} passed, {total_fail} failed")

    if total_fail == 0:
        print(f"\n{PASS} ALL CHECKS PASSED")
        sys.exit(0)
    else:
        print(f"\n{FAIL} {total_fail} CHECK(S) FAILED:")
        for f in failures:
            print(f"   • {f}")
        sys.exit(1)


if __name__ == "__main__":
    main()
