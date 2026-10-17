import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Agent Studio
      </h1>
      <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
        Build personal AI agents grounded in company knowledge — no code
        required. Rate each result and let the agent improve itself.
      </p>
      <Link
        href="/define"
        className="inline-block rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Get started →
      </Link>
    </div>
  );
}
