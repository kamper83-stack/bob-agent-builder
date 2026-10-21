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
    <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        {/* App name */}
        <Link href="/" className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Agent Studio
        </Link>

        {/* 3-step progress indicator */}
        <nav className="flex items-center gap-2" aria-label="Progress">
          {steps.map((s, i) => {
            const isActive = s.step === activeStep;
            const isDone = maxStep >= s.step && !isActive;
            // A step is accessible if it has been reached before (maxStep) or is currently active
            const isAccessible = s.step <= maxStep + 1;

            const stepContent = (
              <>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-white text-blue-600"
                      : isDone
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400"
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
                      maxStep >= s.step ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                )}
                {isAccessible ? (
                  <Link
                    href={s.href}
                    className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    }`}
                  >
                    {stepContent}
                  </Link>
                ) : (
                  <span
                    className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-gray-400 cursor-not-allowed"
                    aria-disabled="true"
                  >
                    {stepContent}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
