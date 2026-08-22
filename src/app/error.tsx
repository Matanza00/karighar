"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <div className="text-4xl">⚠️</div>
      <h1 className="mt-3 text-xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        An unexpected error occurred. Please try again — if it keeps happening, contact support.
      </p>
      <div className="mt-5 flex gap-3">
        <button onClick={reset} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Try again
        </button>
        <Link href="/" className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">
          Go home
        </Link>
      </div>
    </div>
  );
}
