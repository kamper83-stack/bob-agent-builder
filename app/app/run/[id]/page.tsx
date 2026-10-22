"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, Suspense } from "react";
import { useAgent } from "../../context/AgentContext";

function RunPageInner() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { savedAgents, agentDef, processSteps, uploadedDoc, setRunResult, setMaxStep } = useAgent();

  // Find the saved agent to display its name
  const savedAgent = savedAgents.find((a) => a.id === id);
  const displayName = savedAgent?.name ?? "Agent";

  // Use the loaded agent's state (already loaded by home page via loadAgent)
  const agent = savedAgent ?? null;
  const activeAgentDef = agent?.agentDef ?? agentDef;
  const activeSteps = agent?.processSteps ?? processSteps;
  const activeDoc = agent?.uploadedDoc ?? uploadedDoc;

  // ── State ──────────────────────────────────────────────────────────────────
  const [inputText, setInputText]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<{ email_draft: string; action_note: string } | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedInput, setUploadedInput] = useState<{ name: string; text: string } | null>(null);

  const canRun = (inputText.trim().length > 0 || uploadedInput !== null) && !loading;

  // ── File upload for runtime input ─────────────────────────────────────────
  function handleInputFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? "";
      setUploadedInput({ name: file.name, text });
      setInputText(text.slice(0, 3000));
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Run ────────────────────────────────────────────────────────────────────
  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStep(-1);

    const steps = activeSteps.length > 0 ? activeSteps : [];
    let stepIndex = 0;
    const stepInterval = steps.length > 0
      ? setInterval(() => {
          if (stepIndex < steps.length) { setActiveStep(stepIndex); stepIndex++; }
        }, Math.max(600, 3000 / steps.length))
      : null;

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_text: inputText,
          policy_doc_id: activeAgentDef.policyDocId === "__uploaded__" ? "service_policy" : activeAgentDef.policyDocId,
          agent_instructions: activeAgentDef.agentInstructions,
          ...(activeDoc ? { policy_text_override: activeDoc.text } : {}),
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setResult(data);
      setRunResult({ ...data, complaint_text: inputText });
      setActiveStep(steps.length);
      setMaxStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setActiveStep(-1);
    } finally {
      if (stepInterval) clearInterval(stepInterval);
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-text-tertiary hover:text-text-primary transition-colors shrink-0"
          >
            Agents
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="text-base font-semibold text-text-primary truncate">{displayName}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {result && (
            <button
              onClick={() => router.push("/improve")}
              className="rounded-md border border-accent px-4 py-1.5 text-sm font-semibold text-accent hover:opacity-80 transition-opacity"
            >
              Rate &amp; Improve
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="rounded-md bg-text-primary px-5 py-1.5 text-sm font-semibold text-surface hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "Running…" : "Run"}
          </button>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="flex flex-1 divide-x divide-border-subtle overflow-auto">

        {/* ── Column 1: Input ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-4 overflow-y-auto">
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">Input</p>
            <h2 className="text-lg font-bold text-text-primary">Your input</h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              Type or paste the case for this run. Or upload a file.
            </p>
          </div>

          <textarea
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={activeAgentDef.inputType
              ? `e.g. ${activeAgentDef.inputType}`
              : "Paste or type your input here…"}
            className="w-full rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-structural resize-none"
          />

          {/* File upload */}
          <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={handleInputFileChange} />
          {uploadedInput ? (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">📄</span>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate">{uploadedInput.name}</span>
              </div>
              <button onClick={() => { setUploadedInput(null); setInputText(""); }} className="ml-3 text-text-tertiary hover:text-red-600 transition-colors text-sm leading-none shrink-0" aria-label="Remove">×</button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-md border border-dashed border-border-strong px-4 py-2.5 text-sm text-text-tertiary hover:text-text-secondary hover:border-border-strong transition-colors text-center"
            >
              Upload input file
            </button>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div>
          )}
        </div>

        {/* ── Column 2: Process ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-4 overflow-y-auto">
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">Process</p>
            <h2 className="text-lg font-bold text-text-primary">Workflow</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Policy and steps defined during build. Watch live progress.</p>
          </div>

          {/* Policy badge */}
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-canvas px-3 py-2">
            <span className="text-sm">📋</span>
            <span className="text-xs text-text-secondary font-medium truncate">
              {activeDoc ? activeDoc.name : activeAgentDef.policyDocId === "escalation_guide" ? "Escalation Guide" : "Service Policy"}
            </span>
            <span className="ml-auto text-xs text-text-tertiary shrink-0">grounding</span>
          </div>

          {/* Live steps */}
          {activeSteps.length > 0 ? (
            <ol className="space-y-2">
              {activeSteps.map((step, i) => {
                const isDone   = activeStep > i;
                const isActive = activeStep === i;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isDone   ? "bg-green-500 text-white" :
                      isActive ? "bg-accent text-white animate-pulse" :
                                 "bg-border-strong text-text-tertiary"
                    }`}>
                      {isDone ? "✓" : i + 1}
                    </span>
                    <span className={`text-sm pt-0.5 transition-colors ${
                      isDone   ? "text-text-tertiary line-through" :
                      isActive ? "text-text-primary font-medium" :
                                 "text-text-secondary"
                    }`}>
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-lg border border-dashed border-border-subtle px-4 py-6 text-center text-xs text-text-tertiary">
              No steps defined.{" "}
              <button onClick={() => router.push("/build")} className="underline">Edit agent</button>{" "}
              to add them.
            </div>
          )}

          {/* Instructions summary */}
          {activeAgentDef.agentInstructions && (
            <div className="rounded-lg border border-border-subtle bg-canvas px-3 py-2">
              <p className="text-xs font-semibold text-text-tertiary mb-1">Instructions</p>
              <p className="text-xs text-text-secondary line-clamp-4">{activeAgentDef.agentInstructions}</p>
            </div>
          )}
        </div>

        {/* ── Column 3: Output ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-4 overflow-y-auto">
          <div>
            <p className="text-sm font-semibold text-text-primary mb-1">Output</p>
            <h2 className="text-lg font-bold text-text-primary">Agent output</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Generated from your input against company policy.</p>
          </div>

          {loading && !result && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => <div key={n} className="h-16 rounded-lg bg-canvas animate-pulse" />)}
            </div>
          )}

          {!loading && !result && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-16 text-center text-sm text-text-tertiary">
              Output will appear here after you click <strong className="text-text-secondary">▶ Run</strong>.
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-1.5">
                  {activeAgentDef.outputType.includes("email") ? "Email draft" : "Response"}
                </p>
                <div className="rounded-lg border border-border-subtle bg-white dark:bg-gray-800 px-4 py-4 text-sm text-text-primary whitespace-pre-wrap">
                  {result.email_draft}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-1.5">Action note</p>
                <div className="rounded-lg border border-border-subtle bg-white dark:bg-gray-800 px-4 py-4 text-sm text-text-primary whitespace-pre-wrap">
                  {result.action_note}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function RunPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-text-tertiary">Loading…</div>}>
      <RunPageInner />
    </Suspense>
  );
}
