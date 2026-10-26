"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAgent } from "../context/AgentContext";
import { useTheme } from "../context/ThemeContext";

const steps = [
  { label: "Define", href: "/define", step: 1 },
  { label: "Test", href: "/test", step: 2 },
  { label: "Improve", href: "/improve", step: 3 },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Render a placeholder until client has hydrated — avoids server/client mismatch
  if (resolvedTheme === null) {
    return <div className="ml-4 h-8 w-8 shrink-0" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="ml-4 flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-border-subtle transition-colors shrink-0"
    >
      {isDark ? (
        // Sun icon
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="2.93" y1="2.93" x2="4.34" y2="4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="11.66" y1="11.66" x2="13.07" y2="13.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="2.93" y1="13.07" x2="4.34" y2="11.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="11.66" y1="4.34" x2="13.07" y2="2.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ) : (
        // Moon icon
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

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

        <ThemeToggle />
      </div>
    </header>
  );
}
