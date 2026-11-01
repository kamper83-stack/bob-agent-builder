"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiErrorMessage } from "../../lib/apiError";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

type LogsResult = { entries: LogEntry[] } | { error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVELS = ["all", "info", "warning", "error"];

const LEVEL_STYLES: Record<string, string> = {
  info: "bg-border-subtle text-text-secondary",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

async function fetchLogs(): Promise<LogsResult> {
  try {
    const res = await fetch("/api/logs");
    if (!res.ok) return { error: await apiErrorMessage(res) };
    const { entries } = await res.json();
    return { entries };
  } catch {
    return { error: "Could not load the logs. Please try again." };
  }
}

function formatTime(iso: string) {
  // Use "en" explicitly to avoid SSR/client locale mismatch (Next.js server uses system locale).
  return new Date(iso).toLocaleString("en", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);
  const [level, setLevel] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    fetchLogs().then((result) => {
      if (!active) return;
      if ("error" in result) {
        setError(result.error);
      } else {
        setEntries(result.entries);
        setError(null);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [reloadCount]);

  function handleRefresh() {
    setLoading(true);
    setReloadCount((n) => n + 1);
  }

  const query = search.trim().toLowerCase();
  const visible = entries.filter((e) =>
    (level === "all" || e.level === level) && e.message.toLowerCase().includes(query)
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link href="/settings" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Settings
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-text-primary">Logs</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Recent backend activity, newest first. Logs are cleared when the backend restarts.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs…"
          aria-label="Search logs"
          className="min-w-48 flex-1 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-structural"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          aria-label="Filter by level"
          className="rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-structural"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l === "all" ? "All levels" : l[0].toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-md border border-border-strong px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Entries */}
      {visible.length > 0 ? (
        <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface">
          {visible.map((entry, i) => (
            <li key={`${entry.timestamp}-${i}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
              <time dateTime={entry.timestamp} className="shrink-0 text-xs text-text-tertiary">
                {formatTime(entry.timestamp)}
              </time>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_STYLES[entry.level] ?? LEVEL_STYLES.info}`}>
                {entry.level}
              </span>
              <span className="min-w-0 flex-1 break-words font-mono text-xs text-text-primary">
                {entry.message}
              </span>
            </li>
          ))}
        </ul>
      ) : !loading && !error && (
        <div className="rounded-lg border border-dashed border-border-strong py-8 text-center text-sm text-text-tertiary">
          {entries.length === 0 ? "No logs yet — run an agent to see activity here." : "No logs match this filter."}
        </div>
      )}
    </div>
  );
}
