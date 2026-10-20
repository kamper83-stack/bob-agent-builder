"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAgent } from "../context/AgentContext";

export default function TestPage() {
  const router = useRouter();
  const { agentDef, setRunResult } = useAgent();

  const [complaintText, setComplaintText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email_draft: string; action_note: string } | null>(null);

  const isReady = agentDef.agentInstructions.trim().length > 0;
  const canRun = complaintText.trim().length > 0 && !loading;

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            complaint_text: complaintText,
            policy_doc_id: agentDef.policyDocId,
            agent_instructions: agentDef.agentInstructions,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      setResult(data);
      setRunResult({ ...data, complaint_text: complaintText });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Page heading */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Test your agent
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Paste a customer complaint and run the agent to see its output.
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

      {/* Complaint input */}
      <div className="mb-6">
        <label
          htmlFor="complaint"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
        >
          Customer complaint
        </label>
        <textarea
          id="complaint"
          rows={5}
          value={complaintText}
          onChange={(e) => setComplaintText(e.target.value)}
          placeholder="e.g. I've been waiting 3 weeks for my refund and nobody is responding to my emails…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={!canRun || !isReady}
        className="w-full rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Running agent…" : "Run agent →"}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Output */}
      {result && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Response email draft
            </h2>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
              {result.email_draft}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Internal action note
            </h2>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
              {result.action_note}
            </div>
          </div>

          <button
            onClick={() => router.push("/improve")}
            className="w-full rounded-full border border-blue-600 px-6 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Rate this output →
          </button>
        </div>
      )}
    </div>
  );
}
