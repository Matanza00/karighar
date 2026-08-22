import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy — KARIGHAR" };

export default function PrivacyPage() {
  return (
    <AppShell width="narrow">
      <article className="space-y-4 text-slate-700">
        <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="text-sm text-slate-400">Last updated: 17 August 2026 · Placeholder — review with a lawyer before launch.</p>

        <Section title="What we collect">
          Account details (name, phone, email), your service addresses and location (to match and
          route Pros), booking history, ratings, chat messages, and — for Pros — CNIC and a selfie
          for identity verification.
        </Section>
        <Section title="How we use it">
          To provide the service: match you with Pros, enable live tracking and chat, process
          bookings, prevent fraud, and improve KARIGHAR. Pro verification documents are used only to
          confirm identity and are stored privately.
        </Section>
        <Section title="Sharing">
          We share only what&apos;s necessary to complete a job (e.g. a Pro sees the job address and your
          name/phone once assigned). We do not sell your personal data.
        </Section>
        <Section title="Location">
          A Pro&apos;s live location is shared with the customer only while a job is active. Your address is
          shared with the assigned Pro only.
        </Section>
        <Section title="Security & retention">
          Data is stored securely with access controls. Verification images are kept in a private,
          restricted store. You may request deletion of your account and data.
        </Section>
        <Section title="Contact">
          Privacy questions? Email {BRAND.supportEmail}.
        </Section>
      </article>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{children}</p>
    </section>
  );
}
