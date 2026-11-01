# Demo Script — Self-Improving Agent Studio

**Event:** IBM Bob Challenge Demo Day  
**Format:** 3-minute live demo  
**Presenter:** Customer service manager persona (non-technical)  
**Claim:** A customer service manager can build an AI agent, see it produce a too-formal reply, and watch it improve itself — in under 3 minutes.

---

## One-sentence pitch (say this first)

> "Instead of asking IT to configure AI tools, a service manager opens the studio, describes their process in plain words, pastes a complaint, and gets a draft reply — then rates it and the agent rewrites its own instructions."

---

## The "aha moment"

The moment the agent's *second* reply is visibly more human than the first — after the manager gave it a bad rating and one sentence of feedback. That's the self-improvement loop closing in real time.

---

## Run of show

### Before the demo (reset checklist — do this 5 minutes before)

- [ ] Open `http://localhost:3000` — confirm it loads the "My Agents" home screen
- [ ] Confirm the FastAPI backend is running (`uvicorn src.api:app --reload` in a terminal)
- [ ] Confirm `src/.env` has `GEMINI_API_KEY` set
- [ ] Delete any leftover test agents from earlier runs (click × on each card)
- [ ] Prepare the demo complaint in a text file or clipboard — use **CMP-0001**:
  > *"I ordered a laptop 3 weeks ago and it still hasn't arrived. The tracking link just says 'in transit'. I've emailed twice and nobody has replied. I need this laptop for work. This is completely unacceptable."*
- [ ] Pre-fill the agent name field: **"Customer Complaint Handler"**
- [ ] Keep the browser at full-screen on the home page — empty state visible

---

### Step 1 — Empty state to first agent definition (0:00 – 0:45)

**Say:** "I'm Sarah, a customer service manager. I want to build an agent that handles incoming complaint emails. I open the studio — no agents yet."

**Do:**
1. Click **Build your first agent →**
2. Type agent name: **Customer Complaint Handler**
3. Column 1 — *What does the agent receive?*: `A customer complaint email with name and order details`
4. Column 1 — *Sample input*: paste the CMP-0001 complaint text
5. Column 2 — select **Service Policy** as the company document
6. Column 2 — click **✦ Generate** to auto-generate steps (wait ~3 s)
7. Column 3 — select output chips: **Email draft** + **Action note**

**Say:** "I described what it receives, picked our service policy as the grounding document, and clicked Generate — it wrote the processing steps for me."

**Clock check:** should be at ~0:45

---

### Step 2 — Run the test and see the first output (0:45 – 1:30)

**Do:**
1. Click **▶ Run test** in the top bar
2. Watch the loading skeleton (3–5 s)
3. Point at column 3 — email draft appears

**Say:** "The agent drafted a reply and flagged an action for the team. But look at the tone — it's very formal, almost robotic. That's not how we talk to customers."

**Point at:** the opening line of the email draft (typically starts with *"Dear Customer, I am writing to acknowledge..."* — formal boilerplate)

**Clock check:** should be at ~1:30

---

### Step 3 — Rate and improve (1:30 – 2:30)

**Do:**
1. Click **⭐ Rate & Improve →** (bottom of column 2 or 3)
2. Click **2 stars** (Fair)
3. In the comment box type: `Too formal — use their first name and be more empathetic`
4. Click **Get improvement suggestion →** (wait ~3 s)
5. Read the suggestion aloud (one sentence): *"Add a step: address the customer by first name and open with a direct acknowledgment of the frustration."*
6. Click **Accept & update agent →**
7. Click **Run agent again →**

**Say:** "I gave it two stars and one sentence of feedback. It proposed a change to its own instructions. I accepted it — now let's see the second run."

**Clock check:** should be at ~2:20

---

### Step 4 — The aha moment — second run output (2:20 – 2:50)

**Do:**
1. Wait for the auto-run to complete (back on the Build page, result auto-fills)
2. Point at the new email draft — it should open with the customer's name and a warmer sentence

**Say:** "Same complaint. Same policy. But this time the reply opens with the customer's name and leads with empathy. The agent rewrote its own instructions based on my rating — no code, no ticket to IT."

**Clock check:** should be at ~2:45

---

### Step 5 — Save and close (2:45 – 3:00)

**Do:**
1. Click **Save agent**
2. Navigate back to **My Agents** (home page) — the card appears

**Say:** "The agent is saved. Sarah can reuse it, share it with her team, or refine it again next time. That's the studio."

---

## Time budget

| Step | Time | Cumulative |
|---|---|---|
| Pitch + empty state | 0:45 | 0:45 |
| First run + result | 0:45 | 1:30 |
| Rate, improve, accept | 1:00 | 2:30 |
| Second run — aha moment | 0:20 | 2:50 |
| Save + close | 0:10 | 3:00 |

---

## Backup plan (if the live demo fails)

### Scenario A — backend is down or API key expired

Have a screen recording ready: `challenge/renders/demo-recording.mp4` (record this before demo day).

**Say:** "Let me show you a recording of the flow we just walked through — same steps, same data."  
Play the recording. Continue narrating.

### Scenario B — UI takes too long / network is slow

Skip the ✦ Generate step — manually type two steps:
1. *"Check if the order delay exceeds the SLA in the service policy"*
2. *"Draft a reply that addresses the customer by name"*

Then proceed straight to **▶ Run test**.

### Scenario C — output looks identical on the second run

Point at the rating badge and say: "The improvement loop is live — the instructions are already updated. The model's stochastic nature means every run varies slightly. The key change is in the agent's instructions, which you can see in the Process column."

---

## Demo data reset script

Run this before the demo to clear all localStorage state and start fresh:

```javascript
// Paste in browser DevTools console
localStorage.removeItem("agent-studio:agents");
localStorage.removeItem("agent-studio:settings");
location.reload();
```

Or use the × button on each agent card on the home page.

---

## Prepared answers for likely questions

**"Is this using watsonx?"**  
"The backend uses the Gemini API for the PoC — same IBM watsonx.ai integration path in production. The architecture is provider-agnostic."

**"How is this different from just ChatGPT?"**  
"The agent is grounded in your company's policy document, not general knowledge. It can't give advice that contradicts your service SLA. And the improvement loop means the manager — not a prompt engineer — controls quality."

**"Can it connect to our CRM?"**  
"Yes — the Settings page lets you add connectors (HTTP, email, CRM). For the PoC they're mocked; the interfaces are already defined so you can wire them up."

**"What happens to the customer data?"**  
"In this PoC, nothing leaves your browser except the API call to the model. The agent definition and history stay in localStorage. In production you'd add auth and a proper data layer."

---

## Five-minute usability test script (for a real user, run this before demo day)

1. *"You've just opened the app. What do you think you can do here?"* — look for confusion on the empty state.
2. *"Build an agent that handles a delivery complaint. Here's a sample complaint."* — time to first run.
3. *"The output was okay but too stiff. What would you do?"* — find the Improve button without prompting.
4. *"The second run looks better. Now save it."* — confirm Save agent is visible.

**Pass criterion:** first-time user reaches the aha moment within 90 seconds of starting Step 2.
