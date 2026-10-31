"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAgent } from "./context/AgentContext";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch { return ""; }
}

export default function Home() {
  const router = useRouter();
  const { savedAgents, loadAgent, deleteAgent, setAgentDef, setAgentName, setExamples, setUploadedDoc, setProcessSteps, mounted } = useAgent();

  function handleNew() {
    // Reset the builder state
    setAgentDef({ inputType: "", outputType: "", policyDocId: "service_policy", agentInstructions: "" });
    setAgentName("");
    setExamples([]);
    setUploadedDoc(null);
    setProcessSteps([]);
    router.push("/build");
  }

  function handleOpen(id: string) {
    loadAgent(id);
    router.push(`/run/${id}`);
  }

  function handleEdit(id: string) {
    loadAgent(id);
    router.push("/build");
  }

  // Suppress content that depends on localStorage until after mount — prevents flash
  if (!mounted) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <div className="h-8 w-40 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse mb-2" />
          <div className="h-4 w-64 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Agents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Build, tune, and run AI agents grounded in company knowledge.
        </p>
      </div>

      {/* Empty state */}
      {savedAgents.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 px-8 py-16 text-center">
          <p className="text-sm font-medium text-gray-500 mb-4">No agents yet</p>
          <p className="text-xs text-gray-400 mb-6 max-w-sm mx-auto">
            Create your first agent — describe what it receives, define its steps, and show it example outputs.
          </p>
          <button
            onClick={handleNew}
            className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Build your first agent →
          </button>
        </div>
      )}

      {/* Agent cards */}
      {savedAgents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {savedAgents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 flex flex-col gap-3 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {agent.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Saved {formatDate(agent.savedAt)}
                  </p>
                </div>
                <button
                  onClick={() => deleteAgent(agent.id)}
                  className="shrink-0 text-gray-300 hover:text-red-400 transition-colors text-lg leading-none mt-0.5"
                  aria-label="Delete agent"
                >
                  ×
                </button>
              </div>

              {/* Meta */}
              <div className="space-y-1">
                {agent.agentDef.inputType && (
                  <p className="text-xs text-gray-500 truncate">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Receives:</span>{" "}
                    {agent.agentDef.inputType}
                  </p>
                )}
                {agent.agentDef.outputType && (
                  <p className="text-xs text-gray-500 truncate">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Produces:</span>{" "}
                    {agent.agentDef.outputType}
                  </p>
                )}
                {agent.processSteps.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {agent.processSteps.length} step{agent.processSteps.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => handleOpen(agent.id)}
                  className="flex-1 rounded-full bg-gray-900 dark:bg-gray-100 px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                >
                  ▶ Run
                </button>
                <button
                  onClick={() => handleEdit(agent.id)}
                  className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
