"use client";

import { useState } from "react";
import { useAgent } from "../context/AgentContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Connector {
  id: string;
  name: string;
  type: "email" | "crm" | "http" | "database";
  url: string;
  apiKey: string;
  enabled: boolean;
}

interface McpServer {
  id: string;
  name: string;
  transport: "stdio" | "http";
  command: string;
  url: string;
  enabled: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

const SETTINGS_KEY = "agent-studio:settings";

/** API keys are never persisted, including ones saved by earlier versions. */
function loadSettings(): { connectors: Connector[]; mcpServers: McpServer[] } {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return {
      connectors: ((stored.connectors ?? []) as Connector[]).map((c) => ({ ...c, apiKey: "" })),
      mcpServers: (stored.mcpServers ?? []) as McpServer[],
    };
  } catch {
    return { connectors: [], mcpServers: [] };
  }
}

const CONNECTOR_TYPES: { value: Connector["type"]; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "crm", label: "CRM" },
  { value: "http", label: "HTTP / REST" },
  { value: "database", label: "Database" },
];

const TRANSPORT_TYPES: { value: McpServer["transport"]; label: string }[] = [
  { value: "stdio", label: "stdio" },
  { value: "http", label: "HTTP" },
];

// ─── Section layout helpers ────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong py-8 text-center text-sm text-text-tertiary">
      {label}
    </div>
  );
}

// ─── Connector row ────────────────────────────────────────────────────────────

function ConnectorRow({
  connector,
  onChange,
  onRemove,
}: {
  connector: Connector;
  onChange: (patch: Partial<Connector>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4 space-y-3">
      {/* Row header */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={connector.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Connector name"
          className="flex-1 rounded-md border border-border-subtle bg-canvas px-3 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-structural"
        />
        <label className="flex items-center gap-2 text-sm text-text-secondary select-none cursor-pointer">
          <input
            type="checkbox"
            checked={connector.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="accent-structural"
          />
          Enabled
        </label>
        <button
          onClick={onRemove}
          aria-label="Remove connector"
          className="rounded p-1 text-text-tertiary hover:text-text-primary transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Type + URL */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-xs font-medium text-text-secondary">Type</label>
          <select
            value={connector.type}
            onChange={(e) => onChange({ type: e.target.value as Connector["type"] })}
            className="w-full rounded-md border border-border-subtle bg-canvas px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-structural"
          >
            {CONNECTOR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-xs font-medium text-text-secondary">URL / Host</label>
          <input
            type="text"
            value={connector.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://api.example.com"
            className="w-full rounded-md border border-border-subtle bg-canvas px-3 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-structural"
          />
        </div>
      </div>

      {/* API key */}
      <div>
        <label className="block mb-1 text-xs font-medium text-text-secondary">API key / secret</label>
        <input
          type="password"
          value={connector.apiKey}
          onChange={(e) => onChange({ apiKey: e.target.value })}
          placeholder="Not saved — enter it again after a reload"
          className="w-full rounded-md border border-border-subtle bg-canvas px-3 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-structural"
        />
      </div>
    </div>
  );
}

// ─── MCP server row ───────────────────────────────────────────────────────────

function McpRow({
  server,
  onChange,
  onRemove,
}: {
  server: McpServer;
  onChange: (patch: Partial<McpServer>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface p-4 space-y-3">
      {/* Row header */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={server.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="MCP server name"
          className="flex-1 rounded-md border border-border-subtle bg-canvas px-3 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-structural"
        />
        <label className="flex items-center gap-2 text-sm text-text-secondary select-none cursor-pointer">
          <input
            type="checkbox"
            checked={server.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="accent-structural"
          />
          Enabled
        </label>
        <button
          onClick={onRemove}
          aria-label="Remove MCP server"
          className="rounded p-1 text-text-tertiary hover:text-text-primary transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Transport + command/url */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block mb-1 text-xs font-medium text-text-secondary">Transport</label>
          <select
            value={server.transport}
            onChange={(e) => onChange({ transport: e.target.value as McpServer["transport"] })}
            className="w-full rounded-md border border-border-subtle bg-canvas px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-structural"
          >
            {TRANSPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          {server.transport === "stdio" ? (
            <>
              <label className="block mb-1 text-xs font-medium text-text-secondary">Command</label>
              <input
                type="text"
                value={server.command}
                onChange={(e) => onChange({ command: e.target.value })}
                placeholder="uvx my-mcp-server"
                className="w-full rounded-md border border-border-subtle bg-canvas px-3 py-1.5 text-sm font-mono text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-structural"
              />
            </>
          ) : (
            <>
              <label className="block mb-1 text-xs font-medium text-text-secondary">URL</label>
              <input
                type="text"
                value={server.url}
                onChange={(e) => onChange({ url: e.target.value })}
                placeholder="https://mcp.example.com"
                className="w-full rounded-md border border-border-subtle bg-canvas px-3 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-structural"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { mounted } = useAgent();
  // localStorage is only readable after mount
  return mounted ? <SettingsForm /> : null;
}

function SettingsForm() {
  const [connectors, setConnectors] = useState<Connector[]>(() => loadSettings().connectors);
  const [mcpServers, setMcpServers] = useState<McpServer[]>(() => loadSettings().mcpServers);
  const [saved, setSaved] = useState(false);

  // ── Connector helpers ───────────────────────────────────────────────────────

  function addConnector() {
    setConnectors((prev) => [
      ...prev,
      { id: makeId(), name: "", type: "http", url: "", apiKey: "", enabled: true },
    ]);
  }

  function updateConnector(id: string, patch: Partial<Connector>) {
    setConnectors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  function removeConnector(id: string) {
    setConnectors((prev) => prev.filter((c) => c.id !== id));
  }

  // ── MCP helpers ─────────────────────────────────────────────────────────────

  function addMcpServer() {
    setMcpServers((prev) => [
      ...prev,
      { id: makeId(), name: "", transport: "stdio", command: "", url: "", enabled: true },
    ]);
  }

  function updateMcpServer(id: string, patch: Partial<McpServer>) {
    setMcpServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function removeMcpServer(id: string) {
    setMcpServers((prev) => prev.filter((s) => s.id !== id));
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ connectors: connectors.map((c) => ({ ...c, apiKey: "" })), mcpServers })
      );
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Page heading */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Configure the connectors and MCP servers available to your agents.
        </p>
      </div>

      <div className="space-y-12">
        {/* ── Connectors ─────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Connectors"
            description="External services your agents can read from or write to (email, CRM, REST APIs)."
          />
          <div className="space-y-3">
            {connectors.length === 0 ? (
              <EmptyState label="No connectors yet — add one below." />
            ) : (
              connectors.map((c) => (
                <ConnectorRow
                  key={c.id}
                  connector={c}
                  onChange={(patch) => updateConnector(c.id, patch)}
                  onRemove={() => removeConnector(c.id)}
                />
              ))
            )}
          </div>
          <button
            onClick={addConnector}
            className="mt-4 flex items-center gap-1.5 rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
          >
            + Add connector
          </button>
        </section>

        {/* ── MCP Servers ────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="MCP Servers"
            description="Model Context Protocol servers that extend what your agents can do."
          />
          <div className="space-y-3">
            {mcpServers.length === 0 ? (
              <EmptyState label="No MCP servers yet — add one below." />
            ) : (
              mcpServers.map((s) => (
                <McpRow
                  key={s.id}
                  server={s}
                  onChange={(patch) => updateMcpServer(s.id, patch)}
                  onRemove={() => removeMcpServer(s.id)}
                />
              ))
            )}
          </div>
          <button
            onClick={addMcpServer}
            className="mt-4 flex items-center gap-1.5 rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
          >
            + Add MCP server
          </button>
        </section>

        {/* ── Save ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-2 border-t border-border-subtle">
          <button
            onClick={handleSave}
            className="rounded-md bg-text-primary px-6 py-2.5 text-sm font-semibold text-surface transition-opacity hover:opacity-80"
          >
            Save settings
          </button>
          {saved && (
            <span className="text-sm text-text-secondary">Settings saved.</span>
          )}
        </div>
      </div>
    </div>
  );
}
