"use client";

/**
 * AgentContext.tsx
 * Manages both the "agent under construction" state and the list of saved agents.
 *
 * maxStep: 0 = home, 1 = build done, 2 = run done, 3 = improve done
 */

import React, { createContext, useContext, useEffect, useState } from "react";

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
  /** Writing style chosen on the Build screen */
  tone?: string;
  /** Accepted improvements and clarifications; survive instruction rebuilds */
  refinements?: string;
}

/** The parts of an agent that the Build screen commits together */
export interface AgentSnapshot {
  agentDef: AgentDef;
  processSteps: string[];
  examples: AgentExample[];
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
  saveAgent: (snapshot: AgentSnapshot) => string;    // creates or updates, returns the agent id
  loadAgent: (id: string) => void;
  deleteAgent: (id: string) => void;
  resetBuilder: () => void;
  /** Id of the saved agent being edited, null for a new agent */
  currentAgentId: string | null;
  /** Changes when a different agent is opened, so the Build form remounts */
  builderKey: number;

  /** true once localStorage has been read — use to suppress flash of wrong content */
  mounted: boolean;
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
const DRAFT_KEY   = "agent-studio:draft";

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
  resetBuilder: () => {},
  currentAgentId: null,
  builderKey: 0,
  mounted: false,
});

export function AgentProvider({ children }: { children: React.ReactNode }) {
  // Always start with defaults (matches SSR) — hydrate from localStorage after mount
  const [agentDef, setAgentDefState] = useState<AgentDef>(DEFAULT_DEF);
  const [agentName, setAgentName] = useState("");
  const [examples, setExamples] = useState<AgentExample[]>([]);
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDoc | null>(null);
  const [processSteps, setProcessSteps] = useState<string[]>([]);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [maxStep, setMaxStepState] = useState<number>(0);
  const [savedAgents, setSavedAgents] = useState<SavedAgent[]>([]);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [builderKey, setBuilderKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Load persisted state after first client render (avoids SSR/client mismatch)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage can only be read after hydration */
    try {
      const storedDef = localStorage.getItem(STORAGE_KEY);
      if (storedDef) setAgentDefState({ ...DEFAULT_DEF, ...(JSON.parse(storedDef) as AgentDef) });
    } catch {}
    try {
      const storedStep = localStorage.getItem(MAX_STEP_KEY);
      if (storedStep) setMaxStepState(parseInt(storedStep, 10));
    } catch {}
    try {
      const storedAgents = localStorage.getItem(AGENTS_KEY);
      if (storedAgents) setSavedAgents(JSON.parse(storedAgents) as SavedAgent[]);
    } catch {}
    try {
      const storedDraft = localStorage.getItem(DRAFT_KEY);
      if (storedDraft) {
        const draft = JSON.parse(storedDraft);
        setAgentName(draft.agentName ?? "");
        setExamples(draft.examples ?? []);
        setProcessSteps(draft.processSteps ?? []);
        setCurrentAgentId(draft.currentAgentId ?? null);
      }
    } catch {}
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Keep the agent under construction across reloads
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ agentName, examples, processSteps, currentAgentId }));
    } catch {}
  }, [mounted, agentName, examples, processSteps, currentAgentId]);

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

  function saveAgent(snapshot: AgentSnapshot): string {
    const id = currentAgentId ?? Date.now().toString(36);
    const agent: SavedAgent = {
      id,
      name: agentName.trim() || `Agent ${savedAgents.length + 1}`,
      ...snapshot,
      uploadedDoc,
      savedAt: new Date().toISOString(),
    };
    setSavedAgents((prev) => {
      const next = [agent, ...prev.filter((a) => a.id !== id)];
      try { localStorage.setItem(AGENTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    setCurrentAgentId(id);
    return id;
  }

  function loadAgent(id: string) {
    const agent = savedAgents.find((a) => a.id === id);
    if (!agent) return;
    // Use setAgentDefState (full replace + defaults) instead of setAgentDef (patch)
    // so that old saved agents missing optional fields (tone, refinements) get defaults.
    const loadedDef = { ...DEFAULT_DEF, ...agent.agentDef };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedDef)); } catch {}
    setAgentDefState(loadedDef);
    setAgentName(agent.name);
    setExamples(agent.examples);
    setUploadedDoc(agent.uploadedDoc);
    setProcessSteps(agent.processSteps);
    setRunResult(null);
    setCurrentAgentId(id);
    setBuilderKey((k) => k + 1);
  }

  function resetBuilder() {
    // Full replace, not a patch — ensures all optional fields are cleared.
    const clearedDef = { ...DEFAULT_DEF };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clearedDef)); } catch {}
    setAgentDefState(clearedDef);
    setAgentName("");
    setExamples([]);
    setUploadedDoc(null);
    setProcessSteps([]);
    setRunResult(null);
    setCurrentAgentId(null);
    setBuilderKey((k) => k + 1);
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
      savedAgents, saveAgent, loadAgent, deleteAgent, resetBuilder,
      currentAgentId, builderKey,
      mounted,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  return useContext(AgentContext);
}
