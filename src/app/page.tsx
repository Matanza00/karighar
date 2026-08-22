import Link from "next/link";
import { CATALOG, formatPKR } from "@/lib/catalog";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export default function Home() {
  return (
    <main className="flex-1">
      <AppHeader />

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:py-24">
          <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            Now in Karachi
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Verified home-service pros,
            <span className="text-brand-600"> booked in minutes.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Plumbers, electricians and AC technicians — CNIC-verified, fixed
            prices, live tracking, and a satisfaction guarantee.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/book"
              className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Book a service
            </Link>
            <Link
              href="/pro"
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700"
            >
              Work with us
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-500">
            <span>✓ CNIC-verified pros</span>
            <span>✓ Upfront pricing</span>
            <span>✓ Cash on completion</span>
            <span>✓ Satisfaction guarantee</span>
          </div>
        </div>
      </section>

      {/* Services + prices */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold text-slate-900">Services & prices</h2>
        <p className="mt-1 text-slate-600">
          Transparent Karachi rates. No surprises — you see the price before you book.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {CATALOG.map((cat) => (
            <div
              key={cat.key}
              className="rounded-2xl border border-slate-200 p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{cat.icon}</span>
                <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
              </div>
              <ul className="mt-4 space-y-3">
                {cat.services.map((s) => (
                  <li key={s.name} className="flex items-start justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="font-medium text-slate-800">{s.name}</p>
                      <p className="text-sm text-slate-500">{s.description}</p>
                    </div>
                    <div className="whitespace-nowrap text-right">
                      <p className="font-semibold text-brand-700">{formatPKR(s.basePrice)}</p>
                      <p className="text-xs text-slate-400">/ {s.unit}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/book"
                className="mt-5 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Book {cat.name} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["1", "Pick a service", "Choose from fixed-price services or post a custom job for quotes."],
              ["2", "Get matched", "A verified pro near you accepts — or bids on your custom job."],
              ["3", "Track live", "Follow your pro on the map from on-the-way to arrived."],
              ["4", "Pay & rate", "Pay cash on completion, then rate your pro."],
            ].map(([n, title, desc]) => (
              <div key={n} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {n}
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row">
          <span className="font-extrabold text-brand-700">
            KARI<span className="text-accent-500">GHAR</span>
          </span>
          <nav className="flex gap-4">
            <Link href="/support" className="hover:text-brand-700">Support</Link>
            <Link href="/terms" className="hover:text-brand-700">Terms</Link>
            <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
            <Link href="/pro" className="hover:text-brand-700">Become a Pro</Link>
          </nav>
          <span>© {new Date().getFullYear()} KARIGHAR · Karachi, Pakistan</span>
        </div>
      </footer>
      <div className="h-16 md:hidden" />
      <BottomNav />
    </main>
  );
}
