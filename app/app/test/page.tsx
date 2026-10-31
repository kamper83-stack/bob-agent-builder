"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAgent } from "../context/AgentContext";
import { apiErrorMessage } from "../lib/apiError";

export default function TestPage() {
  const router = useRouter();
  const { agentDef, processSteps, uploadedDoc, setRunResult, setMaxStep } = useAgent();

  // ── State ──────────────────────────────────────────────────────────────────
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email_draft: string; action_note: string } | null>(null);

  // Which step is currently "active" during processing
  const [activeStep, setActiveStep] = useState<number>(-1);

  const isReady = agentDef.agentInstructions.trim().length > 0;
  const canRun = inputText.trim().length > 0 && !loading;

  // ── Run ────────────────────────────────────────────────────────────────────

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveStep(-1);

    // Animate through process steps while waiting for the real response
    const steps = processSteps.length > 0 ? processSteps : [];
    let stepIndex = 0;
    const stepInterval = steps.length > 0
      ? setInterval(() => {
          if (stepIndex < steps.length) {
            setActiveStep(stepIndex);
            stepIndex++;
          }
        }, Math.max(600, 3000 / steps.length))
      : null;

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_text: inputText,
          policy_doc_id: agentDef.policyDocId === "__uploaded__" ? "service_policy" : agentDef.policyDocId,
          agent_instructions: agentDef.agentInstructions,
          ...(uploadedDoc ? { policy_text_override: uploadedDoc.text } : {}),
        }),
      });

      if (!res.ok) throw new Error(await apiErrorMessage(res));

      const data = await res.json();
      setResult(data);
      setRunResult({ ...data, complaint_text: inputText });
      setActiveStep(steps.length); // all steps done
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
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Run agent
        </h1>
        <div className="flex items-center gap-3">
          {result && (
            <button
              onClick={() => router.push("/improve")}
              className="rounded-full border border-blue-600 px-4 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Rate this output →
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={!canRun || !isReady}
            className="rounded-full bg-gray-900 dark:bg-gray-100 px-5 py-2 text-sm font-semibold text-white dark:text-gray-900 transition-colors hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Running…" : "▶ Run"}
          </button>
        </div>
      </div>

      {/* Not configured warning */}
      {!isReady && (
        <div className="mx-6 mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
          Agent not configured yet.{" "}
          <button onClick={() => router.push("/define")} className="underline font-medium">
            Go to Build
          </button>{" "}
          to set it up first.
        </div>
      )}

      {/* 3-column grid */}
      <div className="flex flex-1 divide-x divide-gray-200 dark:divide-gray-700 overflow-auto">

        {/* ── Column 1: Input ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
              1 · Input
            </p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Your input for this run
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Paste or type the real case you want the agent to handle.
            </p>
          </div>

          <textarea
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={agentDef.inputType
              ? `e.g. ${agentDef.inputType}`
              : "Paste the input for this run…"}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* ── Column 2: Processing ────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
              2 · Processing
            </p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              What the agent is doing
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Steps run against company policy. Watch live as each completes.
            </p>
          </div>

          {/* Policy / doc indicator */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
            <span className="text-sm">📋</span>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium truncate">
              {uploadedDoc ? uploadedDoc.name : agentDef.policyDocId === "escalation_guide" ? "Escalation Guide" : "Service Policy"}
            </span>
            <span className="ml-auto text-xs text-gray-400 shrink-0">grounding</span>
          </div>

          {/* Step list */}
          {processSteps.length > 0 ? (
            <ol className="space-y-2">
              {processSteps.map((step, i) => {
                const isDone = activeStep > i;
                const isActive = activeStep === i;
                const isPending = activeStep < i;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isDone
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                    }`}>
                      {isDone ? "✓" : i + 1}
                    </span>
                    <span className={`text-sm pt-0.5 transition-colors ${
                      isDone
                        ? "text-gray-500 dark:text-gray-400 line-through"
                        : isActive
                        ? "text-gray-900 dark:text-gray-100 font-medium"
                        : isPending
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-gray-600 dark:text-gray-300"
                    }`}>
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-4 py-6 text-center text-xs text-gray-400">
              No steps defined yet.{" "}
              <button onClick={() => router.push("/define")} className="underline">
                Go to Build
              </button>{" "}
              to generate them.
            </div>
          )}

          {/* Tone / instructions summary */}
          {agentDef.agentInstructions && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
              <p className="text-xs font-semibold text-gray-400 mb-1">Agent instructions</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">
                {agentDef.agentInstructions}
              </p>
            </div>
          )}
        </div>

        {/* ── Column 3: Output ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 px-6 py-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
              3 · Output
            </p>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Agent output
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Generated from your input against company policy.
            </p>
          </div>

          {/* Loading skeleton */}
          {loading && !result && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`h-${n === 1 ? "24" : "16"} rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse`} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !result && (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-12 text-center text-sm text-gray-400">
              Output will appear here after you click{" "}
              <strong className="text-gray-600 dark:text-gray-300">▶ Run</strong>.
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">
                  {agentDef.outputType.includes("email") ? "Email draft" : "Response"}
                </p>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                  {result.email_draft}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Action note</p>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
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
