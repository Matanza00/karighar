import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="text-5xl font-black text-brand-600">404</div>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-1 text-sm text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Back to home
        </Link>
      </div>
    </AppShell>
  );
}
