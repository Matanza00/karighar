import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: "Support — KARIGHAR" };

const FAQ = [
  ["How do I book a service?", "Tap Book, choose a service, pin your location, pick a time, and confirm. You pay cash after the job is done."],
  ["How are prices decided?", "Common services have fixed, upfront prices. For unusual jobs, post a custom job and Pros send you quotes."],
  ["Are the professionals verified?", "Yes — every Pro submits CNIC and a selfie and is approved by our team before taking jobs."],
  ["How do I pay?", "Currently cash on completion. Online payments are coming soon."],
  ["How do I become a Pro?", "Tap ‘Become a Pro’, complete your profile and verification, and start accepting jobs once approved."],
];

export default function SupportPage() {
  return (
    <AppShell width="narrow">
      <h1 className="text-2xl font-bold text-slate-900">Help & Support</h1>
      <p className="mt-1 text-sm text-slate-500">We&apos;re here to help.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <a href={`mailto:${BRAND.supportEmail}`} className="rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-brand-300">
          <div className="text-2xl">✉️</div>
          <p className="mt-1 text-sm font-semibold text-slate-900">Email us</p>
          <p className="text-xs text-slate-500">{BRAND.supportEmail}</p>
        </a>
        <a href={BRAND.supportWhatsAppLink} target="_blank" rel="noopener" className="rounded-xl border border-slate-200 bg-white p-4 text-center hover:border-brand-300">
          <div className="text-2xl">💬</div>
          <p className="mt-1 text-sm font-semibold text-slate-900">WhatsApp</p>
          <p className="text-xs text-slate-500">{BRAND.supportWhatsApp}</p>
        </a>
      </div>

      <h2 className="mt-8 text-lg font-bold text-slate-900">FAQs</h2>
      <div className="mt-3 space-y-2">
        {FAQ.map(([q, a]) => (
          <Card key={q} className="p-4">
            <p className="font-semibold text-slate-900">{q}</p>
            <p className="mt-1 text-sm text-slate-600">{a}</p>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        <Link href="/terms" className="hover:text-brand-700">Terms</Link> ·{" "}
        <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
      </p>
    </AppShell>
  );
}
