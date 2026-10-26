"use client";

/**
 * AgentContext.tsx
 * Manages both the "agent under construction" state and the list of saved agents.
 *
 * maxStep: 0 = home, 1 = build done, 2 = run done, 3 = improve done
 */

import React, { createContext, useContext, useState } from "react";

export interface AgentExample {
  input: string;
  output: string;
}

export interface UploadedDoc {
  name: string;
  text: string;
}

export interface AgentDef {
  inputType: string;
  outputType: string;
  policyDocId: string;
  agentInstructions: string;
}

export interface RunResult {
  email_draft: string;
  action_note: string;
  complaint_text: string;
}

/** A fully saved agent that appears on the Agents list */
export interface SavedAgent {
  id: string;
  name: string;
  agentDef: AgentDef;
  processSteps: string[];
  examples: AgentExample[];
  uploadedDoc: UploadedDoc | null;
  savedAt: string; // ISO date string
}

interface AgentContextValue {
  // Current agent under construction / being tuned
  agentDef: AgentDef;
  setAgentDef: (patch: Partial<AgentDef>) => void;
  agentName: string;
  setAgentName: (name: string) => void;
  examples: AgentExample[];
  setExamples: (examples: AgentExample[]) => void;
  uploadedDoc: UploadedDoc | null;
  setUploadedDoc: (doc: UploadedDoc | null) => void;
  processSteps: string[];
  setProcessSteps: (steps: string[]) => void;
  runResult: RunResult | null;
  setRunResult: (result: RunResult | null) => void;
  maxStep: number;
  setMaxStep: (step: number) => void;

  // Saved agents list
  savedAgents: SavedAgent[];
  saveAgent: () => string;    // saves current state, returns the agent id
  loadAgent: (id: string) => void;
  deleteAgent: (id: string) => void;
}

const DEFAULT_DEF: AgentDef = {
  inputType: "",
  outputType: "",
  policyDocId: "service_policy",
  agentInstructions: "",
};

const STORAGE_KEY = "agent-studio:agentDef";
const MAX_STEP_KEY = "agent-studio:maxStep";
const AGENTS_KEY  = "agent-studio:savedAgents";

const AgentContext = createContext<AgentContextValue>({
  agentDef: DEFAULT_DEF,
  setAgentDef: () => {},
  agentName: "",
  setAgentName: () => {},
  examples: [],
  setExamples: () => {},
  uploadedDoc: null,
  setUploadedDoc: () => {},
  processSteps: [],
  setProcessSteps: () => {},
  runResult: null,
  setRunResult: () => {},
  maxStep: 0,
  setMaxStep: () => {},
  savedAgents: [],
  saveAgent: () => "",
  loadAgent: () => {},
  deleteAgent: () => {},
});

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agentDef, setAgentDefState] = useState<AgentDef>(() => {
    if (typeof window === "undefined") return DEFAULT_DEF;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AgentDef) : DEFAULT_DEF;
    } catch { return DEFAULT_DEF; }
  });

  const [agentName, setAgentName] = useState("");
  const [examples, setExamples] = useState<AgentExample[]>([]);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDoc | null>(null);
  const [processSteps, setProcessSteps] = useState<string[]>([]);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const [maxStep, setMaxStepState] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try { return parseInt(localStorage.getItem(MAX_STEP_KEY) ?? "0", 10); }
    catch { return 0; }
  });

  const [savedAgents, setSavedAgents] = useState<SavedAgent[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(AGENTS_KEY);
      return stored ? (JSON.parse(stored) as SavedAgent[]) : [];
    } catch { return []; }
  });

  function setAgentDef(patch: Partial<AgentDef>) {
    setAgentDefState((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function setMaxStep(step: number) {
    setMaxStepState((prev) => {
      const next = Math.max(prev, step);
      try { localStorage.setItem(MAX_STEP_KEY, String(next)); } catch {}
      return next;
    });
  }

  function saveAgent(): string {
    const id = Date.now().toString(36);
    const agent: SavedAgent = {
      id,
      name: agentName.trim() || `Agent ${savedAgents.length + 1}`,
      agentDef,
      processSteps,
      examples,
      uploadedDoc,
      savedAt: new Date().toISOString(),
    };
    setSavedAgents((prev) => {
      const next = [agent, ...prev.filter((a) => a.id !== id)];
      try { localStorage.setItem(AGENTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    return id;
  }

  function loadAgent(id: string) {
    const agent = savedAgents.find((a) => a.id === id);
    if (!agent) return;
    setAgentDefState(agent.agentDef);
    setAgentName(agent.name);
    setExamples(agent.examples);
    setUploadedDoc(agent.uploadedDoc);
    setProcessSteps(agent.processSteps);
  }

  function deleteAgent(id: string) {
    setSavedAgents((prev) => {
      const next = prev.filter((a) => a.id !== id);
      try { localStorage.setItem(AGENTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return (
    <AgentContext.Provider value={{
      agentDef, setAgentDef,
      agentName, setAgentName,
      examples, setExamples,
      uploadedDoc, setUploadedDoc,
      processSteps, setProcessSteps,
      runResult, setRunResult,
      maxStep, setMaxStep,
      savedAgents, saveAgent, loadAgent, deleteAgent,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  return useContext(AgentContext);
}
