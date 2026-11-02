"use client";

import Link from "next/link";
import { useAgent } from "../context/AgentContext";
import type { AgentRun, AgentVersion } from "../context/AgentContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-yellow-400">
      {"★".repeat(Math.round(rating))}
      <span className="text-gray-200 dark:text-gray-600">{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

function averageRating(runs: AgentRun[]) {
  const rated = runs.flatMap((r) => (r.rating ? [r.rating] : []));
  return rated.length > 0 ? rated.reduce((sum, r) => sum + r, 0) / rated.length : null;
}

// ─── Version card ─────────────────────────────────────────────────────────────

function VersionCard({
  version,
  runs,
  isCurrent,
  onRestore,
}: {
  version: AgentVersion;
  runs: AgentRun[];
  isCurrent: boolean;
  onRestore: () => void;
}) {
  const average = averageRating(runs);
  return (
    <li className="rounded-lg border border-border-subtle bg-surface p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold text-text-primary">Version {version.number}</h3>
        {isCurrent && (
          <span className="rounded-full bg-structural/20 px-2 py-0.5 text-xs font-medium text-structural">Current</span>
        )}
        <span className="text-xs text-text-tertiary">{formatTime(version.createdAt)}</span>
        {!isCurrent && (
          <button
            onClick={onRestore}
            className="ml-auto rounded-md border border-border-strong px-3 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
          >
            Restore this version
          </button>
        )}
      </div>

      {version.rating > 0 && (
        <p className="text-sm text-text-secondary break-words">
          <Stars rating={version.rating} /> {version.comment || "No comment"}
        </p>
      )}

      <p className="text-sm text-text-primary whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
        {version.change}
      </p>

      <p className="text-xs text-text-tertiary">
        {runs.length} run{runs.length !== 1 ? "s" : ""}
        {average !== null && ` · average rating ${average.toFixed(1)} of 5`}
      </p>
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { history, agentName, mounted, restoreVersion } = useAgent();
  const versions = history.versions.slice().reverse();
  const currentNumber = history.versions.at(-1)?.number;

  if (!mounted) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="mb-10">
        <Link href="/build" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Back to Build
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-text-primary break-words">
          {agentName ? `${agentName} history` : "Agent history"}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          See how the agent changed after each rating, go back to an earlier version, and review past runs.
        </p>
      </div>

      <div className="space-y-12">
        {/* ── Versions ───────────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Versions</h2>
          {versions.length > 0 ? (
            <ol className="space-y-3">
              {versions.map((v) => (
                <VersionCard
                  key={v.number}
                  version={v}
                  runs={history.runs.filter((r) => r.version === v.number)}
                  isCurrent={v.number === currentNumber}
                  onRestore={() => restoreVersion(v.number)}
                />
              ))}
            </ol>
          ) : (
            <div className="rounded-lg border border-dashed border-border-strong py-8 text-center text-sm text-text-tertiary">
              No versions yet — accept an improvement to create the first one.
            </div>
          )}
        </section>

        {/* ── Runs ───────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Runs</h2>
          {history.runs.length > 0 ? (
            <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface">
              {history.runs.map((run) => (
                <li key={run.id} className="px-4 py-3">
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                      <span className="text-xs text-text-tertiary">{formatTime(run.createdAt)}</span>
                      <span className="rounded-full bg-border-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
                        Version {run.version}
                      </span>
                      {run.rating ? <Stars rating={run.rating} /> : null}
                      <span className="min-w-0 flex-1 truncate text-text-primary">{run.input}</span>
                    </summary>
                    <div className="mt-3 space-y-3 text-sm">
                      {[
                        { label: "Input", text: run.input },
                        { label: "Response", text: run.email_draft },
                        { label: "Action note", text: run.action_note },
                      ].map(({ label, text }) => (
                        <div key={label}>
                          <p className="mb-1 text-xs font-semibold text-text-secondary">{label}</p>
                          <p className="text-text-primary whitespace-pre-wrap break-words max-h-48 overflow-y-auto">{text}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-border-strong py-8 text-center text-sm text-text-tertiary">
              No runs yet — run the agent to see them here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
