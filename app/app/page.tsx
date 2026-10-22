"use client";

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
  const { savedAgents, loadAgent, deleteAgent, setAgentDef, setAgentName, setExamples, setUploadedDoc, setProcessSteps } = useAgent();

  function handleNew() {
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

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl font-semibold text-text-primary">My Agents</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Build, tune, and run AI agents grounded in company knowledge.
          </p>
        </div>
        <button
          onClick={handleNew}
          className="rounded-md bg-text-primary px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-80 transition-opacity"
        >
          New agent
        </button>
      </div>

      {/* Empty state */}
      {savedAgents.length === 0 && (
        <div className="rounded-md border border-dashed border-border-strong px-8 py-16 text-center">
          <p className="text-sm font-medium text-text-secondary mb-3">No agents yet</p>
          <p className="text-sm text-text-tertiary mb-8 max-w-sm mx-auto leading-relaxed">
            Create your first agent — describe what it receives, define its steps, and show it example outputs.
          </p>
          <button
            onClick={handleNew}
            className="rounded-md bg-text-primary px-6 py-2.5 text-sm font-semibold text-surface hover:opacity-80 transition-opacity"
          >
            Build your first agent
          </button>
        </div>
      )}

      {/* Agent cards */}
      {savedAgents.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {savedAgents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-md border border-border-subtle bg-surface p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-text-primary truncate">
                    {agent.name}
                  </h2>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Saved {formatDate(agent.savedAt)}
                  </p>
                </div>
                <button
                  onClick={() => deleteAgent(agent.id)}
                  className="shrink-0 text-text-tertiary hover:text-red-600 transition-colors text-sm leading-none mt-0.5"
                  aria-label="Delete agent"
                >
                  ×
                </button>
              </div>

              {/* Meta */}
              <div className="space-y-1">
                {agent.agentDef.inputType && (
                  <p className="text-xs text-text-secondary truncate">
                    <span className="font-medium text-text-primary">Receives:</span>{" "}
                    {agent.agentDef.inputType}
                  </p>
                )}
                {agent.agentDef.outputType && (
                  <p className="text-xs text-text-secondary truncate">
                    <span className="font-medium text-text-primary">Produces:</span>{" "}
                    {agent.agentDef.outputType}
                  </p>
                )}
                {agent.processSteps.length > 0 && (
                  <p className="text-xs text-text-tertiary">
                    {agent.processSteps.length} step{agent.processSteps.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => handleOpen(agent.id)}
                  className="flex-1 rounded-md bg-text-primary px-4 py-2 text-xs font-semibold text-surface hover:opacity-80 transition-opacity"
                >
                  Run
                </button>
                <button
                  onClick={() => handleEdit(agent.id)}
                  className="flex-1 rounded-md border border-border-strong px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-canvas transition-colors"
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
