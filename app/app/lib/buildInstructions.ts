import { AgentDef } from "../context/AgentContext";

/**
 * Builds the plain-language instruction string that the backend receives.
 * Kept here so the Define page and any future callers share one format.
 */
export function buildInstructions(def: Pick<AgentDef, "inputType" | "outputType">): string {
  return (
    `You are a helpful AI assistant. ` +
    `You will receive: ${def.inputType || "user input"}. ` +
    `Produce: ${def.outputType || "a helpful response"}. ` +
    `Follow the provided company policy document.`
  );
}
