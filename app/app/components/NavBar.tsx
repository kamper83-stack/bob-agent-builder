"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgent } from "../context/AgentContext";

const steps = [
  { label: "Define", href: "/define", step: 1 },
  { label: "Test", href: "/test", step: 2 },
  { label: "Improve", href: "/improve", step: 3 },
];

export default function NavBar() {
  const pathname = usePathname();
  const { maxStep } = useAgent();

  const activeStep =
    steps.find((s) => pathname.startsWith(s.href))?.step ?? 0;

  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-3">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-display text-lg font-semibold text-text-primary tracking-tight shrink-0"
        >
          Agent Studio
        </Link>

        {/* 3-step progress indicator */}
        <nav className="flex items-center gap-2" aria-label="Progress">
          {steps.map((s, i) => {
            const isActive = s.step === activeStep;
            const isDone = maxStep >= s.step && !isActive;
            const isAccessible = s.step <= maxStep + 1;

            const stepContent = (
              <>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-structural text-surface"
                      : isDone
                      ? "bg-structural/20 text-structural"
                      : "bg-border-subtle text-text-tertiary"
                  }`}
                >
                  {isDone ? "✓" : s.step}
                </span>
                {s.label}
              </>
            );

            return (
              <div key={s.href} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`h-px w-8 ${
                      maxStep >= s.step ? "bg-structural" : "bg-border-subtle"
                    }`}
                  />
                )}
                {isAccessible ? (
                  <Link
                    href={s.href}
                    className={`flex items-center gap-2 px-3 py-1 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-b-2 border-structural text-text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {stepContent}
                  </Link>
                ) : (
                  <span
                    className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-text-tertiary cursor-not-allowed"
                    aria-disabled="true"
                  >
                    {stepContent}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Settings link */}
        <Link
          href="/settings"
          className={`ml-4 flex items-center gap-1.5 px-3 py-1 text-sm font-medium transition-colors ${
            pathname.startsWith("/settings")
              ? "text-text-primary border-b-2 border-structural"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          ⚙ Settings
        </Link>
      </div>
    </header>
  );
}
