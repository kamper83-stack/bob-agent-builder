"use client";

/**
 * AgentContext.tsx
 * ----------------
 * Shared state for the agent definition and last run result across
 * the Define → Test → Improve flow.
 *
 * Persisted to localStorage so a page refresh doesn't wipe the session.
 */

import React, { createContext, useContext, useEffect, useState } from "react";

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
}

const DEFAULT_DEF: AgentDef = {
  inputType: "",
  outputType: "",
  policyDocId: "service_policy",
  agentInstructions: "",
};

const STORAGE_KEY = "agent-studio:agentDef";

const AgentContext = createContext<AgentContextValue>({
  agentDef: DEFAULT_DEF,
  setAgentDef: () => { console.warn("useAgent called outside AgentProvider"); },
  runResult: null,
  setRunResult: () => {},
});

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agentDef, setAgentDefState] = useState<AgentDef>(DEFAULT_DEF);

  // Hydrate from localStorage after mount to avoid SSR/hydration mismatch (C2)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setAgentDefState(JSON.parse(stored) as AgentDef);
    } catch {}
  }, []);

  const [runResult, setRunResult] = useState<RunResult | null>(null);

  function setAgentDef(patch: Partial<AgentDef>) {
    setAgentDefState((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) { console.warn("AgentContext: localStorage write failed", e); }
      return next;
    });
  }

  return (
    <AgentContext.Provider value={{ agentDef, setAgentDef, runResult, setRunResult }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  return useContext(AgentContext);
}
