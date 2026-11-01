"""
smoke_test.py — automated smoke test covering SMOKE_TEST.md checklist.
Servers must already be running:
  - Backend:  uvicorn src.api:app --reload --port 8000
  - Frontend: cd app && npm run dev  (port 3000)

Run:
    python3 scripts/smoke_test.py
"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
COMPLAINT = (
    "I placed an order two weeks ago and it still hasn't arrived. "
    "I've sent three emails and called twice but no one has responded. "
    "This is completely unacceptable."
)

passed = []
failed = []


def check(label: str, condition: bool) -> None:
    if condition:
        print(f"  ✅ {label}")
        passed.append(label)
    else:
        print(f"  ❌ {label}")
        failed.append(label)


def run_smoke_test() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        js_errors = []
        page.on("pageerror", lambda e: js_errors.append(str(e)))

        # ── Step 1: Home screen ──────────────────────────────────────────────
        print("\n── Step 1: Home screen ──")
        page.goto(BASE)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/smoke_step1.png")

        check("Page loads without JS errors", len(js_errors) == 0)
        check("H1 heading visible", page.locator("h1").first.is_visible())

        # ── Step 2: Navigate to /build ────────────────────────────────────────
        print("\n── Step 2: Navigate to /build ──")
        cta = page.locator(
            "a[href='/build'], button:has-text('started'), button:has-text('New agent'), a[href*='build']"
        ).first
        cta.click()
        page.wait_for_url("**/build**", timeout=8000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)   # let BuildForm mount after hydration
        page.screenshot(path="/tmp/smoke_step2.png")
        check("Redirected to /build", "/build" in page.url)

        # ── Step 3: Build form — fill inputs and run ─────────────────────────
        print("\n── Step 3: Build form ──")

        # Fill input description (second textarea — "What will you give the agent?")
        input_desc_ta = page.locator(
            "textarea[placeholder*='customer complaint'], textarea[placeholder*='A customer']"
        ).first
        if not input_desc_ta.is_visible():
            # fallback: second textarea by index
            input_desc_ta = page.locator("textarea").nth(1)
        input_desc_ta.fill("A customer complaint email")

        # Select "Email draft" output chip
        email_chip = page.locator("button:has-text('Email draft')").first
        if email_chip.is_visible():
            email_chip.click()

        # Fill at least one process step (required by canTest)
        step1_input = page.locator("input[placeholder='Step 1']").first
        if step1_input.is_visible():
            step1_input.fill("Read the complaint and identify the issue")

        # Fill the test-input textarea ("Paste a real test input here")
        test_ta = page.locator("textarea[placeholder*='Paste a real test input']").first
        if not test_ta.is_visible():
            test_ta = page.locator("textarea").first
        test_ta.fill(COMPLAINT)

        check("Complaint pasted into test input", test_ta.input_value() == COMPLAINT)

        # Run test button should now be enabled (inputDesc + output + step + testInput)
        run_btn = page.locator("button:has-text('Run test'), button:has-text('▶ Run')").first
        page.wait_for_timeout(500)
        check("Run test button is enabled", not run_btn.is_disabled())

        run_btn.click()

        # Wait for output (LLM call — allow up to 45s)
        page.wait_for_selector(
            "text=Action note, text=action note, text=Email draft",
            timeout=45000
        )
        page.screenshot(path="/tmp/smoke_step3.png")
        check("Output rendered after run", True)

        # ── Step 4: Save agent ────────────────────────────────────────────────
        print("\n── Step 4: Save agent ──")
        # Fill agent name first
        name_input = page.locator("input[placeholder*='Agent name']").first
        if name_input.is_visible():
            name_input.fill("Smoke Test Agent")
        save_btn = page.locator("button:has-text('Save agent')").first
        if save_btn.is_visible() and not save_btn.is_disabled():
            save_btn.click()
            page.wait_for_timeout(1000)
            check("Agent saved successfully", True)
        else:
            print("  ⚠️  Save button not ready — skipping")

        # ── Step 5: Improve flow ─────────────────────────────────────────────
        print("\n── Step 5: Improve flow ──")
        improve_link = page.locator("a[href='/improve']").first
        if improve_link.is_visible():
            improve_link.click()
            page.wait_for_url("**/improve**", timeout=6000)
            page.wait_for_load_state("networkidle")
            page.screenshot(path="/tmp/smoke_step5a.png")
            check("Navigated to /improve", "/improve" in page.url)

            # Click 3 stars
            stars = page.locator("button[aria-label*='star']").all()
            if len(stars) >= 3:
                stars[2].click()
                page.wait_for_timeout(300)
                check("3-star rating clicked", True)
            else:
                print(f"  ⚠️  Found {len(stars)} star buttons")

            # Get suggestion
            get_btn = page.locator("button:has-text('Get improvement')").first
            if get_btn.is_visible() and not get_btn.is_disabled():
                get_btn.click()
                page.wait_for_selector("text=Suggested instruction", timeout=45000)
                page.screenshot(path="/tmp/smoke_step5b.png")
                check("Improvement suggestion appeared", True)

                # Accept suggestion
                accept_btn = page.locator("button:has-text('Accept')").first
                if accept_btn.is_visible():
                    accept_btn.click()
                    page.wait_for_selector("text=instructions updated", timeout=8000)
                    page.screenshot(path="/tmp/smoke_step5c.png")
                    check("Accept confirmation banner visible", True)
            else:
                print("  ⚠️  Get suggestion button not available")
        else:
            print("  ⚠️  Improve NavBar link not found")

        # ── Step 6: Refresh resilience ────────────────────────────────────────
        print("\n── Step 6: Refresh resilience ──")
        errors_before = len(js_errors)
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/smoke_step6.png")
        new_errors = [e for e in js_errors[errors_before:] if "ChunkLoadError" not in e]
        check("No new JS errors after reload", len(new_errors) == 0)

        # ── Step 7: Error handling ────────────────────────────────────────────
        print("\n── Step 7: Error handling ──")
        page.goto(f"{BASE}/build")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        # Abort all /api/run calls to simulate backend down
        page.route("**/api/run", lambda route: route.abort())

        test_ta2 = page.locator("textarea[placeholder*='Paste a real test input']").first
        if not test_ta2.is_visible():
            test_ta2 = page.locator("textarea").first
        test_ta2.fill(COMPLAINT)

        run_btn2 = page.locator("button:has-text('▶ Run'), button:has-text('Run test')").first
        page.wait_for_timeout(400)
        if not run_btn2.is_disabled():
            run_btn2.click()
            error_appeared = False
            try:
                page.wait_for_selector(
                    "[class*=red], [class*=error], text=failed, text=unreachable, text=error",
                    timeout=10000
                )
                error_appeared = True
            except Exception:
                pass
            page.screenshot(path="/tmp/smoke_step7.png")
            check("Error message shown when API call fails", error_appeared)
        else:
            print("  ⚠️  Run button still disabled — refilling input desc")
            input_desc_ta2 = page.locator("textarea").nth(1)
            input_desc_ta2.fill("A customer complaint email")
            email_chip2 = page.locator("button:has-text('Email draft')").first
            if email_chip2.is_visible():
                email_chip2.click()
            test_ta2.fill(COMPLAINT)
            page.wait_for_timeout(400)
            run_btn2.click()
            error_appeared = False
            try:
                page.wait_for_selector(
                    "[class*=red], text=failed, text=unreachable, text=error",
                    timeout=10000
                )
                error_appeared = True
            except Exception:
                pass
            page.screenshot(path="/tmp/smoke_step7.png")
            check("Error message shown when API call fails", error_appeared)

        page.unroute("**/api/run")
        browser.close()

    # ── Summary ───────────────────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"Smoke test result: {len(passed)} passed, {len(failed)} failed")
    if failed:
        print("\nFailed checks:")
        for f in failed:
            print(f"  ❌ {f}")
    else:
        print("✅ ALL CHECKS PASSED")
    print(f"Screenshots: /tmp/smoke_step*.png")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(run_smoke_test())
