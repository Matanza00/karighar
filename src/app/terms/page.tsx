import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of Service — KARIGHAR" };

export default function TermsPage() {
  return (
    <AppShell width="narrow">
      <article className="prose-sm space-y-4 text-slate-700">
        <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
        <p className="text-sm text-slate-400">Last updated: 17 August 2026 · Placeholder — review with a lawyer before launch.</p>

        <Section title="1. About KARIGHAR">
          {BRAND.legalName} (&ldquo;KARIGHAR&rdquo;, &ldquo;we&rdquo;) operates an online marketplace that connects
          customers in {BRAND.city} with independent service professionals (&ldquo;Pros&rdquo;) for home services.
          We are a platform; the service itself is provided by the Pro.
        </Section>
        <Section title="2. Accounts">
          You must provide accurate information and keep your account secure. You are responsible
          for activity under your account. Pros must pass identity (CNIC) verification before taking jobs.
        </Section>
        <Section title="3. Bookings & pricing">
          Fixed-price services are charged at the listed price; final amounts may vary after on-site
          inspection and will be confirmed before work proceeds. Custom jobs are priced by the Pro&apos;s
          accepted quote. Payment is currently <strong>cash on completion</strong>.
        </Section>
        <Section title="4. Commission">
          KARIGHAR charges Pros a commission on completed jobs. Commission is deducted from the Pro&apos;s
          earnings and reflected in their ledger.
        </Section>
        <Section title="5. Cancellations">
          Customers may cancel before a Pro starts work. Repeated no-shows or abusive behaviour by
          either party may result in suspension.
        </Section>
        <Section title="6. Conduct & safety">
          Users must behave lawfully and respectfully. Report any safety concern immediately via support.
          We may remove users who violate these terms.
        </Section>
        <Section title="7. Liability">
          KARIGHAR is not liable for the acts or omissions of independent Pros beyond our platform
          obligations and applicable law. Services are provided &ldquo;as is&rdquo; during this MVP period.
        </Section>
        <Section title="8. Contact">
          Questions? Email {BRAND.supportEmail}.
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
