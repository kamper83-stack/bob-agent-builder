"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useAgent, type AgentDef, type AgentExample } from "../context/AgentContext";
import { apiErrorMessage } from "../lib/apiError";

// ── Constants ─────────────────────────────────────────────────────────────────

const POLICY_OPTIONS = [
  { id: "service_policy", label: "Service Policy" },
  { id: "escalation_guide", label: "Escalation Guide" },
];

const OUTPUT_CHIPS = [
  { id: "email", label: "📧 Email draft" },
  { id: "calendar", label: "📅 Calendar event" },
  { id: "document", label: "📄 Document" },
  { id: "summary", label: "📋 Summary" },
  { id: "action_note", label: "📝 Action note" },
  { id: "table", label: "🗂 Table / Excel" },
];

const TONE_OPTIONS = [
  { id: "formal", label: "Formal" },
  { id: "friendly", label: "Friendly" },
  { id: "mine", label: "My style" },
];

const GCAL_EMAIL = process.env.NEXT_PUBLIC_GCAL_EMAIL || "calendar@company.co.il";
const CONNECTORS = [
  { id: "google_calendar", label: "Google Calendar", detail: `${GCAL_EMAIL} · connected` },
  { id: "email_connector", label: "Email", detail: "smtp.company.co.il · connected" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildInstructions(
  inputDesc: string,
  outputChips: string[],
  tone: string,
  examples: AgentExample[],
  steps: string[],
): string {
  const outputs = outputChips.join(", ") || "a helpful response";
  const toneStr = tone === "formal" ? "formal and professional"
    : tone === "friendly" ? "friendly and warm" : "natural";

  const stepsBlock = steps.length > 0
    ? "\n\nFollow these steps in order:\n" + steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
    : "";

  const filledExamples = examples.filter((e) => e.input.trim() && e.output.trim());
  const examplesBlock = filledExamples.length > 0
    ? "\n\n" + filledExamples
        .map((e, i) =>
          `--- EXAMPLE ${i + 1} ---\nInput: ${e.input.trim()}\nIdeal output: ${e.output.trim()}\n--- END EXAMPLE ${i + 1} ---`
        )
        .join("\n\n") +
      "\n\nMatch the style, tone, and structure of the examples above."
    : "";

  return (
    `You are a helpful AI assistant. ` +
    `You will receive: ${inputDesc || "user input"}. ` +
    `Produce: ${outputs}. Tone: ${toneStr}. ` +
    `Follow the provided company policy document.` +
    stepsBlock +
    examplesBlock
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BuildPage() {
  const { mounted, builderKey } = useAgent();

  // The form seeds its state from the context, which only has the persisted
  // agent after mount. The key remounts it when a different agent is opened.
  if (!mounted) {
    return <div className="flex-1 m-6 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }
  return <BuildForm key={builderKey} />;
}

function BuildForm() {
  const router = useRouter();
  const {
    agentDef, setAgentDef,
    agentName, setAgentName,
    examples, setExamples,
    uploadedDoc, setUploadedDoc,
    processSteps, setProcessSteps,
    setRunResult, setMaxStep,
    saveAgent,
  } = useAgent();

  // ── Column 1 state ────────────────────────────────────────────────────────
  const [inputDesc, setInputDesc]   = useState(agentDef.inputType);
  const [policyDocId, setPolicyDocId] = useState(agentDef.policyDocId);
  const [tone, setTone]             = useState(agentDef.tone ?? "formal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localExamples, setLocalExamples] = useState<AgentExample[]>(
    examples.length > 0 ? examples : [{ input: "", output: "" }]
  );

  // ── Column 2 state ────────────────────────────────────────────────────────
  const [steps, setSteps] = useState<string[]>(
    processSteps.length > 0 ? processSteps : [""]
  );
  const [generatingSteps, setGeneratingSteps] = useState(false);
  const [stepsError, setStepsError]           = useState<string | null>(null);

  // ── Column 3 state ────────────────────────────────────────────────────────
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(
    agentDef.outputType ? agentDef.outputType.split(", ").filter(Boolean) : []
  );
  // Test result shown in col 3
  const [testInput, setTestInput]   = useState("");
  const [testRunning, setTestRunning] = useState(false);
  const [testError, setTestError]   = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ email_draft: string; action_note: string } | null>(null);

  // ── Conflict / clarification state ───────────────────────────────────────
  const [conflicts, setConflicts] = useState<
    (null | "checking" | { conflict: boolean; reason: string })[]
  >(() => localExamples.map(() => null));
  const [approved, setApproved]   = useState<boolean[]>(() => localExamples.map(() => false));
  const [clarification, setClarification]       = useState<string | null>(null);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [checkingConfidence, setCheckingConfidence]   = useState(false);

  // ── Connector toggle state ────────────────────────────────────────────────
  const [enabledConnectors, setEnabledConnectors] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CONNECTORS.map((c) => [c.id, true]))
  );
  function toggleConnector(id: string) {
    setEnabledConnectors((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // ── Save state ────────────────────────────────────────────────────────────
  const [saved, setSaved] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filledSteps = steps.filter((s) => s.trim().length > 0);
  const canTest = inputDesc.trim().length > 0 && selectedOutputs.length > 0 && filledSteps.length > 0 && testInput.trim().length > 0;
  const hasBlockingConflict = conflicts.some(
    (c, i) => c !== null && c !== "checking" && (c as { conflict: boolean }).conflict && !approved[i]
  );

  // ── Upload helpers ────────────────────────────────────────────────────────

  function handlePolicyFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedDoc({ name: file.name, text: (ev.target?.result as string) ?? "" });
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Example helpers ───────────────────────────────────────────────────────

  function updateExample(i: number, field: "input" | "output", val: string) {
    setLocalExamples((prev) => prev.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex));
  }
  function addExample() {
    setLocalExamples((prev) => [...prev, { input: "", output: "" }]);
    setConflicts((prev) => [...prev, null]);
    setApproved((prev) => [...prev, false]);
  }
  function removeExample(i: number) {
    setLocalExamples((prev) => prev.filter((_, idx) => idx !== i));
    setConflicts((prev) => prev.filter((_, idx) => idx !== i));
    setApproved((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function checkOutputConflict(i: number) {
    const ex = localExamples[i];
    if (!ex.output.trim() || !ex.input.trim()) return;
    setConflicts((prev) => prev.map((c, idx) => idx === i ? "checking" : c));
    setApproved((prev) => prev.map((a, idx) => idx === i ? false : a));
    try {
      const res = await fetch("/api/check-example", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          example_input: ex.input,
          example_output: ex.output,
          policy_doc_id: uploadedDoc ? "service_policy" : policyDocId,
          ...(uploadedDoc ? { policy_text_override: uploadedDoc.text } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConflicts((prev) => prev.map((c, idx) => idx === i ? data : c));
    } catch {
      setConflicts((prev) => prev.map((c, idx) => idx === i ? null : c));
    }
  }

  // ── Step helpers ──────────────────────────────────────────────────────────

  function updateStep(i: number, val: string) {
    setSteps((prev) => prev.map((s, idx) => idx === i ? val : s));
  }
  function addStep()        { setSteps((prev) => [...prev, ""]); }
  function removeStep(i: number) { setSteps((prev) => prev.filter((_, idx) => idx !== i)); }

  async function generateSteps() {
    if (!inputDesc.trim() || selectedOutputs.length === 0) return;
    setGeneratingSteps(true);
    setStepsError(null);
    const firstExample = localExamples.find((e) => e.input.trim() && e.output.trim());
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_type: inputDesc,
          output_type: selectedOutputs.join(", "),
          policy_doc_id: uploadedDoc ? "service_policy" : policyDocId,
          example_input: firstExample?.input ?? null,
          example_output: firstExample?.output ?? null,
          ...(uploadedDoc ? { policy_text_override: uploadedDoc.text } : {}),
        }),
      });
      if (!res.ok) throw new Error(await apiErrorMessage(res));
      const data = await res.json();
      setSteps(data.steps);
    } catch (err) {
      setStepsError(err instanceof Error ? err.message : "Failed to generate steps");
    } finally {
      setGeneratingSteps(false);
    }
  }

  // ── Output chip toggle ────────────────────────────────────────────────────

  function toggleOutput(id: string) {
    setSelectedOutputs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // ── Commit current state to context ──────────────────────────────────────

  function commitState(extraInstruction = "") {
    const refinements = (agentDef.refinements ?? "") + extraInstruction;
    const nextDef: AgentDef = {
      inputType: inputDesc,
      outputType: selectedOutputs.join(", "),
      policyDocId: uploadedDoc ? "__uploaded__" : policyDocId,
      tone,
      refinements,
      agentInstructions: buildInstructions(inputDesc, selectedOutputs, tone, localExamples, filledSteps) + refinements,
    };
    setExamples(localExamples);
    setAgentDef(nextDef);
    setProcessSteps(filledSteps);
    return { agentDef: nextDef, processSteps: filledSteps, examples: localExamples };
  }

  // ── Test run ──────────────────────────────────────────────────────────────

  async function handleTest() {
    // Path C: no example outputs → check confidence
    const hasAnyOutput = localExamples.some((e) => e.output.trim());
    if (!hasAnyOutput && !clarification) {
      setCheckingConfidence(true);
      try {
        const res = await fetch("/api/estimate-confidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input_type: inputDesc,
            output_type: selectedOutputs.join(", "),
            policy_doc_id: uploadedDoc ? "service_policy" : policyDocId,
            ...(uploadedDoc ? { policy_text_override: uploadedDoc.text } : {}),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.confidence < 0.9 && data.clarification_question) {
            setClarification(data.clarification_question);
            setCheckingConfidence(false);
            return;
          }
        }
      } catch {}
      setCheckingConfidence(false);
    }
    doTest();
  }

  async function doTest(extraInstruction = "") {
    const { agentDef: committedDef } = commitState(extraInstruction);
    setTestRunning(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_text: testInput,
          policy_doc_id: uploadedDoc ? "service_policy" : policyDocId,
          agent_instructions: committedDef.agentInstructions,
          ...(uploadedDoc ? { policy_text_override: uploadedDoc.text } : {}),
        }),
      });
      if (!res.ok) throw new Error(await apiErrorMessage(res));
      const data = await res.json();
      setTestResult(data);
      setRunResult({ ...data, complaint_text: testInput });
      setMaxStep(1);
      setSaved(false); // mark unsaved after a new test run
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTestRunning(false);
      setClarification(null);
      setClarificationAnswer("");
    }
  }

  // ── Save agent ────────────────────────────────────────────────────────────

  function handleSave() {
    saveAgent(commitState());
    setSaved(true);
  }

  // ── Rate & Improve ────────────────────────────────────────────────────────

  function handleImprove() {
    commitState();
    router.push("/improve");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex flex-col h-full">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <input
          type="text"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="Agent name…"
          className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={!agentDef.agentInstructions && filledSteps.length === 0}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            saved
              ? "bg-green-600 text-white cursor-default"
              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          }`}
        >
          {saved ? "✓ Saved" : "Save agent"}
        </button>
        <button
          onClick={handleTest}
          disabled={!canTest || hasBlockingConflict || checkingConfidence || testRunning}
          className="rounded-full bg-gray-900 dark:bg-gray-100 px-5 py-1.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {testRunning ? "Running…" : checkingConfidence ? "Checking…" : "▶ Run test"}
        </button>
      </div>

      {/* Clarification modal */}
      {clarification && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-w-md w-full mx-6 p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              One quick question before I run
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{clarification}</p>
            <textarea
              rows={3}
              value={clarificationAnswer}
              onChange={(e) => setClarificationAnswer(e.target.value)}
              placeholder="Type your answer…"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => doTest(clarificationAnswer.trim() ? `\n\nUser clarification: ${clarificationAnswer.trim()}` : "")}
                className="flex-1 rounded-full bg-gray-900 dark:bg-gray-100 px-4 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 transition-colors"
              >
                Continue →
              </button>
              <button
                onClick={() => { setClarification(null); setClarificationAnswer(""); }}
                className="rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-column grid */}
      <div className="flex flex-1 divide-x divide-gray-200 dark:divide-gray-700 overflow-auto">

        {/* ── Column 1: Input ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-6 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">1 · Input</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Test input</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Paste a real example to test the agent during building.
            </p>
          </div>

          <textarea
            rows={4}
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder={inputDesc ? `e.g. ${inputDesc}` : "Paste a real test input here…"}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {/* Input description */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">What does the agent receive?</p>
            <textarea
              rows={2}
              value={inputDesc}
              onChange={(e) => setInputDesc(e.target.value)}
              placeholder="e.g. A customer complaint email with name and issue"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Examples — input only */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Few-shot examples{" "}
              <span className="font-normal text-gray-400">— sample inputs the agent should handle</span>
            </p>
            <div className="space-y-3">
              {localExamples.map((ex, i) => (
                <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                    <span className="text-xs font-semibold text-gray-500">Example {i + 1}</span>
                    {localExamples.length > 1 && (
                      <button onClick={() => removeExample(i)} className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none" aria-label="Remove example">×</button>
                    )}
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-400 mb-1">Sample input</p>
                    <textarea rows={2} value={ex.input} onChange={(e) => updateExample(i, "input", e.target.value)}
                      placeholder="Paste a real user message, email, ticket, or file excerpt…"
                      className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none" />
                  </div>
                </div>
              ))}
              <button onClick={addExample} className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors text-center">+ Add example</button>
            </div>
          </div>

          {/* Connectors */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Connectors</p>
            <div className="space-y-2">
              {CONNECTORS.map((c) => {
                const on = enabledConnectors[c.id];
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{c.label}</p>
                      <p className="text-xs text-gray-400">
                        {on ? c.detail : "disconnected"}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      onClick={() => toggleConnector(c.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${on ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-1"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Column 2: Process ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">2 · Process</p>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Policy & steps</h2>
              <p className="text-xs text-gray-400 mt-0.5">Business logic and processing order.</p>
            </div>
            <button
              onClick={generateSteps}
              disabled={generatingSteps || !inputDesc.trim() || selectedOutputs.length === 0}
              className="shrink-0 rounded-full border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generatingSteps ? "Generating…" : "✦ Generate"}
            </button>
          </div>

          {/* Policy doc */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Company document</p>
            <div className="space-y-2">
              {POLICY_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input type="radio" name="policy" value={opt.id} checked={policyDocId === opt.id} onChange={() => setPolicyDocId(opt.id)} className="accent-blue-600" />
                  <span className="text-sm text-gray-800 dark:text-gray-100">{opt.label}</span>
                  <span className="ml-auto text-xs text-gray-400">PDF</span>
                </label>
              ))}
              <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handlePolicyFileChange} />
              {uploadedDoc ? (
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">📄</span>
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate">{uploadedDoc.name}</span>
                    <span className="text-xs text-blue-500 shrink-0">{Math.round(uploadedDoc.text.length / 1000)}k chars</span>
                  </div>
                  <button onClick={() => setUploadedDoc(null)} className="ml-3 text-blue-400 hover:text-red-400 transition-colors text-base leading-none shrink-0" aria-label="Remove">×</button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors text-center">
                  + Upload document
                </button>
              )}
            </div>
          </div>

          {/* Steps */}
          {stepsError && <p className="text-xs text-red-500">{stepsError}</p>}
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-xs font-bold text-white dark:text-gray-900">{i + 1}</span>
                <input type="text" value={step} onChange={(e) => updateStep(i, e.target.value)} placeholder={`Step ${i + 1}`}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {steps.length > 1 && <button onClick={() => removeStep(i)} className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none" aria-label="Remove step">×</button>}
              </li>
            ))}
          </ol>
          <button onClick={addStep} className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors">
            + Add step
          </button>

          {/* Tone */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Writing style</p>
            <div className="flex gap-2">
              {TONE_OPTIONS.map((t) => (
                <button key={t.id} onClick={() => setTone(t.id)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${tone === t.id ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900" : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-500"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spacer + Rate & Improve */}
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            {testResult ? (
              <button onClick={handleImprove}
                className="w-full rounded-full border border-blue-600 px-6 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                ⭐ Rate &amp; Improve →
              </button>
            ) : (
              <p className="text-xs text-gray-400 text-center">Run a test to rate and improve the agent.</p>
            )}
          </div>
        </div>

        {/* ── Column 3: Output ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">3 · Output</p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ideal output & test result</h2>
            <p className="text-xs text-gray-400 mt-0.5">Define what the agent should produce, then see the test result here.</p>
          </div>

          {/* Output type chips */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Output type</p>
            <div className="flex flex-wrap gap-2">
              {OUTPUT_CHIPS.map((chip) => (
                <button key={chip.id} onClick={() => toggleOutput(chip.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selectedOutputs.includes(chip.id) ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600"}`}>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ideal outputs per example */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Ideal outputs{" "}
              <span className="font-normal text-gray-400">— one per example, leave blank to follow company policy</span>
            </p>
            <div className="space-y-3">
              {localExamples.map((ex, i) => (
                <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                    <span className="text-xs font-semibold text-gray-500">Example {i + 1}</span>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-400 mb-1">Ideal output <span className="font-normal">(optional)</span></p>
                    <textarea rows={2} value={ex.output} onChange={(e) => updateExample(i, "output", e.target.value)} onBlur={() => checkOutputConflict(i)}
                      placeholder="Leave blank to follow company policy"
                      className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none resize-none" />
                    {conflicts[i] === "checking" && <p className="text-xs text-gray-400 mt-1">Checking against policy…</p>}
                    {conflicts[i] && conflicts[i] !== "checking" && (conflicts[i] as { conflict: boolean }).conflict && (
                      <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${approved[i] ? "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20 text-green-700" : "border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 text-amber-800"}`}>
                        {approved[i] ? <span>⚠ Using despite policy conflict.</span> : (
                          <>
                            <p className="font-semibold mb-1">⚠ Possible policy conflict</p>
                            <p className="mb-2">{(conflicts[i] as { reason: string }).reason}</p>
                            <div className="flex gap-2">
                              <button onClick={() => setApproved((p) => p.map((a, idx) => idx === i ? true : a))} className="rounded-full bg-amber-700 text-white px-3 py-1 text-xs font-semibold hover:bg-amber-800 transition-colors">Use it anyway</button>
                              <button onClick={() => { updateExample(i, "output", ""); setConflicts((p) => p.map((c, idx) => idx === i ? null : c)); }} className="rounded-full border border-amber-400 px-3 py-1 text-xs font-semibold hover:bg-amber-100 transition-colors">Follow policy</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload example output */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Reference output file <span className="font-normal text-gray-400">— upload a real doc as style reference</span>
            </p>
            <input type="file" accept=".txt" className="hidden" id="output-file-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const text = (ev.target?.result as string) ?? "";
                  setLocalExamples((prev) => { const next = [...prev]; next[0] = { ...next[0], output: text.slice(0, 2000) }; return next; });
                  setConflicts((prev) => prev.map((c, i) => i === 0 ? null : c));
                  setApproved((prev) => prev.map((a, i) => i === 0 ? false : a));
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
            <label htmlFor="output-file-upload"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors">
              + Upload output file
            </label>
            {localExamples[0]?.output && (
              <p className="mt-1.5 text-xs text-gray-400 truncate">✓ Loaded into Example 1 ({localExamples[0].output.length} chars)</p>
            )}
          </div>

          {/* Test result */}
          {testRunning && !testResult && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => <div key={n} className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
            </div>
          )}
          {testError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">{testError}</div>
          )}
          {!testRunning && !testResult && !testError && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-10 text-center text-sm text-gray-400">
              Test result will appear here after running <strong className="text-gray-600 dark:text-gray-300">▶ Run test</strong>.
            </div>
          )}
          {testResult && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">{selectedOutputs.includes("email") ? "Email draft" : "Response"}</p>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{testResult.email_draft}</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Action note</p>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{testResult.action_note}</div>
              </div>
            </div>
          )}

          {/* Spacer + Rate & Improve */}
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            {testResult ? (
              <button onClick={handleImprove}
                className="w-full rounded-full border border-blue-600 px-6 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                ⭐ Rate &amp; Improve →
              </button>
            ) : (
              <p className="text-xs text-gray-400 text-center">Run a test to rate and improve the agent.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
