"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAgent } from "../context/AgentContext";

// Policy docs available in the mock store — matches challenge/data/policies/
const POLICY_OPTIONS = [
  { id: "service_policy", label: "Service Policy" },
  { id: "escalation_guide", label: "Escalation Guide" },
];

function buildInstructions(inputType: string, outputType: string): string {
  return (
    `You are a helpful AI assistant. ` +
    `You will receive: ${inputType || "user input"}. ` +
    `Produce: ${outputType || "a helpful response"}. ` +
    `Follow the provided company policy document.`
  );
}

export default function DefinePage() {
  const router = useRouter();
  const { agentDef, setAgentDef, setMaxStep } = useAgent();

  const [inputType, setInputType] = useState(agentDef.inputType);
  const [outputType, setOutputType] = useState(agentDef.outputType);
  const [policyDocId, setPolicyDocId] = useState(agentDef.policyDocId);

  function handleSave() {
    setAgentDef({
      inputType,
      outputType,
      policyDocId,
      agentInstructions: buildInstructions(inputType, outputType),
    });
    setMaxStep(1);
    router.push("/test");
  }

  const isValid = inputType.trim().length > 0 && outputType.trim().length > 0;

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      {/* Page heading */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Define your agent
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Describe what your agent does in plain language — no code needed.
        </p>
      </div>

      <div className="space-y-8">
        {/* Field 1 — Input type */}
        <div>
          <label
            htmlFor="input-type"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            What will you give the agent?
          </label>
          <input
            id="input-type"
            type="text"
            value={inputType}
            onChange={(e) => setInputType(e.target.value)}
            placeholder="e.g. A customer complaint email"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Field 2 — Output type */}
        <div>
          <label
            htmlFor="output-type"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            What should the agent produce?
          </label>
          <input
            id="output-type"
            type="text"
            value={outputType}
            onChange={(e) => setOutputType(e.target.value)}
            placeholder="e.g. A response email draft and an internal action note"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Field 3 — Policy document */}
        <div>
          <label
            htmlFor="policy-doc"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Which company document should it follow?
          </label>
          <select
            id="policy-doc"
            value={policyDocId}
            onChange={(e) => setPolicyDocId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {POLICY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            The agent will ground its answers in this document.
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="w-full rounded-md bg-text-primary px-6 py-3 text-sm font-semibold text-surface transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save and continue
        </button>
      </div>
    </div>
  );
}
