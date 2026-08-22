"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, formatPKR, LinkButton, inputClass } from "@/components/ui";
import type { Service, ServiceCategory } from "@/lib/types";

type CatalogCat = ServiceCategory & { services: Service[] };

export default function BookPage() {
  const [cats, setCats] = useState<CatalogCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [{ data: categories, error: e1 }, { data: services, error: e2 }] = await Promise.all([
        supabase.from("service_categories").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("services").select("*").eq("is_active", true),
      ]);
      if (e1 || e2) {
        setError(e1?.message || e2?.message || "Failed to load services");
        setLoading(false);
        return;
      }
      const grouped = (categories as ServiceCategory[]).map((c) => ({
        ...c,
        services: (services as Service[]).filter((s) => s.category_id === c.id),
      }));
      setCats(grouped);
      setLoading(false);
    })();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? cats
        .map((c) => ({
          ...c,
          services: c.services.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              (s.description ?? "").toLowerCase().includes(q) ||
              c.name.toLowerCase().includes(q)
          ),
        }))
        .filter((c) => c.services.length > 0)
    : cats;

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Book a service</h1>
          <p className="mt-1 text-slate-600">Pick a service in Karachi — prices are upfront.</p>
        </div>
        <LinkButton href="/book/custom" variant="outline">
          Something else? Post a custom job
        </LinkButton>
      </div>

      <div className="mt-5">
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Search services — e.g. AC, wiring, leak…"
        />
      </div>

      {loading && <p className="mt-10 text-slate-500">Loading services…</p>}
      {error && (
        <Card className="mt-8 border-rose-200">
          <p className="text-rose-600">{error}</p>
          <p className="mt-2 text-sm text-slate-500">
            Make sure you ran <code>supabase/schema.sql</code> and set your keys in{" "}
            <code>.env.local</code>.
          </p>
        </Card>
      )}

      {!loading && filtered.length === 0 && (
        <p className="mt-8 text-slate-500">No services match “{query}”. Try a different word or post a custom job.</p>
      )}

      <div className="mt-8 space-y-10">
        {filtered.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cat.icon === "ac" ? "❄️" : cat.icon === "bolt" ? "⚡" : cat.icon === "wrench" ? "🔧" : "🛠️"}</span>
              <h2 className="text-lg font-bold text-slate-900">{cat.name}</h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cat.services.map((s) => (
                <Link key={s.id} href={`/book/${s.id}`}>
                  <Card className="h-full transition hover:border-brand-300 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-slate-900">{s.name}</h3>
                      <Badge tone={s.base_price === null ? "amber" : "brand"}>
                        {formatPKR(s.base_price)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{s.description}</p>
                    <div className="mt-3 text-xs text-slate-400">
                      per {s.unit}
                      {s.visit_fee > 0 && ` · visit fee ${formatPKR(s.visit_fee)} (waived if booked)`}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
