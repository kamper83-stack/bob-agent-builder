"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAgent } from "../context/AgentContext";
import { apiErrorMessage } from "../lib/apiError";

const STARS = [1, 2, 3, 4, 5];

export default function ImprovePage() {
  const router = useRouter();
  const { agentDef, setAgentDef, runResult, setMaxStep, processSteps, examples, currentAgentId, saveAgent } = useAgent();

  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const hasRun = runResult !== null;
  const canSubmit = rating > 0 && !loading && !accepted;

  async function handleGetSuggestion() {
    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const res = await fetch(
        "/api/improve",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_instructions: agentDef.agentInstructions,
            rating,
            comment: comment.trim() || "No comment provided.",
          }),
        }
      );

      if (!res.ok) throw new Error(await apiErrorMessage(res));

      const data = await res.json();
      setSuggestion(data.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!suggestion) return;
    const addition = "\n\n" + suggestion;
    const nextDef = {
      ...agentDef,
      agentInstructions: agentDef.agentInstructions + addition,
      refinements: (agentDef.refinements ?? "") + addition,
    };
    // Capture a stable snapshot of processSteps and examples at the moment of
    // accept — avoids a stale-closure issue if context re-renders between here
    // and the saveAgent call.
    const stepsSnapshot = processSteps.slice();
    const examplesSnapshot = examples.slice();
    setAgentDef(nextDef);
    if (currentAgentId) saveAgent({ agentDef: nextDef, processSteps: stepsSnapshot, examples: examplesSnapshot });
    setMaxStep(3);
    setAccepted(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Page heading */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Improve your agent
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Rate the last output and let the agent improve its own instructions.
        </p>
      </div>

      {/* No run yet warning */}
      {!hasRun && (
        <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
          No run to rate yet.{" "}
          <button
            onClick={() => router.push("/build")}
            className="underline font-medium"
          >
            Go to Test
          </button>{" "}
          to run your agent first.
        </div>
      )}

      {/* Last run summary */}
      {hasRun && (
        <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Last run output
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-3 whitespace-pre-wrap break-words">
            {runResult!.email_draft}
          </p>
        </div>
      )}

      {/* Star rating */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          How good was this output?
        </p>
        <div className="flex gap-2">
          {STARS.map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              disabled={accepted}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              className={`text-3xl transition-transform hover:scale-110 disabled:cursor-default ${
                star <= (hovered || rating) ? "text-yellow-400" : "text-gray-200 dark:text-gray-600"
              }`}
            >
              ★
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 self-center text-sm text-gray-500">
              {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Optional comment */}
      <div className="mb-6">
        <label
          htmlFor="comment"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
        >
          What should be different? <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={accepted}
          placeholder="e.g. Too formal — use the customer's first name and be more empathetic"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
        />
      </div>

      {/* Get suggestion button */}
      {!suggestion && !accepted && (
        <button
          onClick={handleGetSuggestion}
          disabled={!canSubmit || !hasRun}
          className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Getting suggestion…" : "Get improvement suggestion →"}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Suggestion */}
      {suggestion && !accepted && (
        <div className="mt-8 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Suggested instruction change
            </h2>
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20 px-4 py-4 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
              {suggestion}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Accept &amp; update agent →
            </button>
            <button
              onClick={() => setSuggestion(null)}
              className="rounded-full border border-gray-300 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Accepted state */}
      {accepted && (
        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20 px-4 py-4 text-sm text-green-800 dark:text-green-300">
            ✓ Agent instructions updated. Run another test to see the improvement.
          </div>
          <button
            onClick={() => router.push("/build")}
            className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Run agent again →
          </button>
        </div>
      )}
    </div>
  );
}
