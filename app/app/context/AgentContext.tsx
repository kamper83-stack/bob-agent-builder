"use client";

/**
 * AgentContext.tsx — B5 update
 * Adds maxStep tracking so NavBar can unlock steps as the user progresses.
 * maxStep: 0 = home, 1 = define done, 2 = test done, 3 = improve done
 */

import React, { createContext, useContext, useState } from "react";

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

interface AgentContextValue {
  agentDef: AgentDef;
  setAgentDef: (patch: Partial<AgentDef>) => void;
  runResult: RunResult | null;
  setRunResult: (result: RunResult | null) => void;
  maxStep: number;
  setMaxStep: (step: number) => void;
}

const DEFAULT_DEF: AgentDef = {
  inputType: "",
  outputType: "",
  policyDocId: "service_policy",
  agentInstructions: "",
};

const STORAGE_KEY = "agent-studio:agentDef";
const MAX_STEP_KEY = "agent-studio:maxStep";

const AgentContext = createContext<AgentContextValue>({
  agentDef: DEFAULT_DEF,
  setAgentDef: () => { console.warn("useAgent called outside AgentProvider"); },
  runResult: null,
  setRunResult: () => {},
  maxStep: 0,
  setMaxStep: () => {},
});

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agentDef, setAgentDefState] = useState<AgentDef>(() => {
    if (typeof window === "undefined") return DEFAULT_DEF;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AgentDef) : DEFAULT_DEF;
    } catch {
      return DEFAULT_DEF;
    }
  });

  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const [maxStep, setMaxStepState] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      return parseInt(localStorage.getItem(MAX_STEP_KEY) ?? "0", 10);
    } catch {
      return 0;
    }
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

  return (
    <AgentContext.Provider value={{ agentDef, setAgentDef, runResult, setRunResult, maxStep, setMaxStep }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  return useContext(AgentContext);
}
