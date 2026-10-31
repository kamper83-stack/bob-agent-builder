"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, Suspense } from "react";
import { useAgent } from "../../context/AgentContext";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function RunPageInner() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { savedAgents, agentDef, processSteps, uploadedDoc } = useAgent();

  // Find the saved agent to display its name
  const savedAgent = savedAgents.find((a) => a.id === id);
  const displayName = savedAgent?.name ?? "Agent";

  // Use the loaded agent's state (already loaded by home page via loadAgent)
  const activeAgentDef = savedAgent?.agentDef ?? agentDef;
  const activeSteps    = savedAgent?.processSteps ?? processSteps;
  const activeDoc      = savedAgent?.uploadedDoc ?? uploadedDoc;

  // ── State ──────────────────────────────────────────────────────────────────
  const [inputText, setInputText]     = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [result, setResult]           = useState<{ email_draft: string; action_note: string } | null>(null);
  const [activeStep, setActiveStep]   = useState(-1);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
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
      setActiveStep(steps.length);
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

      {/* Agent identity bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
            {displayName}
          </span>
          {activeAgentDef.inputType && (
            <span className="hidden sm:inline text-xs text-gray-400 truncate">
              Receives: {activeAgentDef.inputType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => router.push("/build")}
            className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1"
          >
            ✎ Edit agent
          </button>
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="rounded-full bg-gray-900 dark:bg-gray-100 px-5 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Running…" : "▶ Run"}
          </button>
        </div>
      </div>

      {/* 3-column operator grid */}
      <div className="flex flex-1 divide-x divide-gray-200 dark:divide-gray-700 overflow-auto">

        {/* ── Column 1: Input ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-4 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">Input</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {activeAgentDef.inputType || "Your input"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Paste or type the case for this run. Or upload a file.
            </p>
          </div>

          <textarea
            rows={12}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeAgentDef.inputType
                ? `e.g. ${activeAgentDef.inputType}`
                : "Paste or type your input here…"
            }
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {/* File upload */}
          <input ref={fileInputRef} type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={handleInputFileChange} />
          {uploadedInput ? (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">📄</span>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200 truncate">{uploadedInput.name}</span>
              </div>
              <button
                onClick={() => { setUploadedInput(null); setInputText(""); }}
                className="ml-3 text-blue-400 hover:text-red-400 transition-colors text-base leading-none shrink-0"
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors text-center"
            >
              + Upload input file
            </button>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* ── Column 2: Live progress ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-4 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">Processing</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">What the agent does</h2>
            <p className="text-sm text-gray-400 mt-0.5">Steps run against company policy — watch live progress.</p>
          </div>

          {/* Policy badge */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
            <span className="text-sm">📋</span>
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium truncate">
              {activeDoc
                ? activeDoc.name
                : activeAgentDef.policyDocId === "escalation_guide"
                ? "Escalation Guide"
                : "Service Policy"}
            </span>
            <span className="ml-auto text-xs text-gray-400 shrink-0">grounding</span>
          </div>

          {/* Live step indicators */}
          {activeSteps.length > 0 ? (
            <ol className="space-y-3">
              {activeSteps.map((step, i) => {
                const isDone   = activeStep > i;
                const isActive = activeStep === i;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isDone   ? "bg-green-500 text-white" :
                      isActive ? "bg-blue-600 text-white animate-pulse" :
                                 "bg-gray-200 dark:bg-gray-700 text-gray-400"
                    }`}>
                      {isDone ? "✓" : i + 1}
                    </span>
                    <span className={`text-base pt-0.5 transition-colors ${
                      isDone   ? "text-gray-400 line-through" :
                      isActive ? "text-gray-900 dark:text-gray-100 font-medium" :
                                 "text-gray-500 dark:text-gray-400"
                    }`}>
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-4 py-8 text-center text-sm text-gray-400">
              No steps defined.{" "}
              <button onClick={() => router.push("/build")} className="underline hover:text-gray-600 transition-colors">
                Edit agent
              </button>{" "}
              to add them.
            </div>
          )}
        </div>

        {/* ── Column 3: Output ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-4 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">Output</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {activeAgentDef.outputType || "Agent output"}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Generated from your input against company policy.</p>
          </div>

          {/* Loading skeleton */}
          {loading && !result && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !result && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-20 text-center text-sm text-gray-400">
              Output will appear here after you click{" "}
              <strong className="text-gray-600 dark:text-gray-300">▶ Run</strong>.
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {activeAgentDef.outputType.includes("email") ? "Email draft" : "Response"}
                  </p>
                  <CopyButton text={result.email_draft} />
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-base text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                  {result.email_draft}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Action note</p>
                  <CopyButton text={result.action_note} />
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-base text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
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
    <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-gray-400">Loading…</div>}>
      <RunPageInner />
    </Suspense>
  );
}
