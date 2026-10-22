"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAgent } from "../context/AgentContext";

export default function ProcessPage() {
  const router = useRouter();
  const { agentDef, processSteps, setProcessSteps, setMaxStep } = useAgent();

  const [steps, setSteps] = useState<string[]>(processSteps);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = agentDef.inputType.trim().length > 0;

  // If we already have steps (e.g. back navigation), show them immediately.
  // Otherwise fetch from the backend.
  useEffect(() => {
    if (steps.length > 0 || !isReady) return;
    fetchSteps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSteps() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_type: agentDef.inputType,
          output_type: agentDef.outputType,
          policy_doc_id: agentDef.policyDocId,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API error ${res.status}: ${body}`);
      }
      const data = await res.json();
      setSteps(data.steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleStepChange(index: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function handleApprove() {
    setProcessSteps(steps);
    setMaxStep(2);
    router.push("/test");
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      {/* Heading */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Here's what the agent will do
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Review the steps. Edit any step in plain language, then approve.
        </p>
      </div>

      {/* Not configured warning */}
      {!isReady && (
        <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
          Your agent isn&apos;t configured yet.{" "}
          <button
            onClick={() => router.push("/define")}
            className="underline font-medium"
          >
            Go to Define
          </button>{" "}
          to set it up first.
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
          <p className="text-xs text-gray-400 text-center pt-1">
            Figuring out the steps…
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300 mb-6">
          {error}
          <button
            onClick={fetchSteps}
            className="ml-3 underline font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Step list */}
      {!loading && steps.length > 0 && (
        <ol className="space-y-3 mb-10">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <input
                type="text"
                value={step}
                onChange={(e) => handleStepChange(i, e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </li>
          ))}
        </ol>
      )}

      {/* Approve button */}
      {!loading && steps.length > 0 && (
        <button
          onClick={handleApprove}
          className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Looks good — run it →
        </button>
      )}
    </div>
  );
}
