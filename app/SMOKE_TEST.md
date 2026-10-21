# Agent Studio — End-to-End Smoke Test Checklist

Run this checklist before merging to `main`. All items must pass.

## Prerequisites

```bash
# 1. Start the backend (from repo root)
pip install -r src/requirements.txt
cp src/.env.example src/.env       # then fill in WATSONX_APIKEY and WATSONX_PROJECT_ID
uvicorn src.api:app --reload

# 2. Start the frontend (in a second terminal)
cd app
cp .env.local.example .env.local   # BACKEND_URL=http://localhost:8000
npm install
npm run dev
```

Open http://localhost:3000

---

## Step 1 — Home screen

- [ ] Page loads without errors
- [ ] "Welcome to Agent Studio" heading visible
- [ ] "Get started →" button navigates to `/define`
- [ ] NavBar shows all 3 steps; only "Define" is clickable (Test and Improve are disabled)

---

## Step 2 — Define screen (`/define`)

- [ ] "Save and continue" button is disabled when either text field is empty
- [ ] Fill in:
  - **What will you give the agent?** → `A customer complaint email`
  - **What should the agent produce?** → `A response email draft and an internal action note`
  - **Policy document** → `Service Policy`
- [ ] Click "Save and continue →"
- [ ] Redirects to `/test`
- [ ] NavBar: Define shows ✓, Test is active, Improve is still disabled

---

## Step 3 — Test screen (`/test`)

- [ ] No warning banner (agent was configured in Step 2)
- [ ] Paste this sample complaint into the textarea:
  > I placed an order two weeks ago and it still hasn't arrived. I've sent three emails and called twice but no one has responded. This is completely unacceptable.
- [ ] Click "Run agent →"
- [ ] Loading state appears ("Running agent…")
- [ ] Output renders:
  - [ ] "Response email draft" section is non-empty
  - [ ] "Internal action note" section is non-empty
- [ ] "Rate this output →" button appears after a successful run
- [ ] Click "Rate this output →" → navigates to `/improve`
- [ ] NavBar: Define ✓, Test ✓, Improve is now active

---

## Step 4 — Improve screen (`/improve`)

- [ ] "Last run output" preview shows the email draft from Step 3
- [ ] Star rating: click 3 stars → label reads "Good"
- [ ] Optional comment: type `Too formal — be more empathetic`
- [ ] Click "Get improvement suggestion →"
- [ ] Loading state appears
- [ ] Suggestion card appears with a concrete instruction change
- [ ] Click "Accept & update agent →"
- [ ] Green confirmation banner: "✓ Agent instructions updated."
- [ ] "Run agent again →" button appears → navigates to `/test`
- [ ] NavBar: all 3 steps show ✓

---

## Step 5 — Second run (improvement loop)

- [ ] Back on `/test`, the textarea is empty (ready for a new complaint)
- [ ] Run the same complaint again
- [ ] Verify the output is different from the first run (more empathetic tone)

---

## Step 6 — Refresh resilience

- [ ] Refresh the page on `/test`
- [ ] Agent instructions are still set (localStorage persisted)
- [ ] NavBar still shows correct step state

---

## Step 7 — Error handling

- [ ] Stop the backend server
- [ ] Try to run the agent → red error banner appears with a meaningful message
- [ ] Restart the backend → run succeeds again

---

## Pass criteria

All checkboxes above are ticked with no console errors (warnings are OK).
