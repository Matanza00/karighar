"use client";

import { useUser } from "@/lib/useUser";
import { AppShell } from "@/components/AppShell";
import { Card, LinkButton } from "@/components/ui";

export default function BecomeAProPage() {
  const { user, profile } = useUser();
  const isProvider = profile?.role === "provider";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
          For professionals
        </span>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
          Grow your business with <span className="text-brand-600">KARIGHAR</span>
        </h1>
        <p className="mt-3 text-slate-600">
          Get steady jobs from customers across Karachi. You keep most of every job —
          we only take a small commission when you get paid.
        </p>

        <div className="mt-8">
          {isProvider ? (
            <LinkButton href="/pro/dashboard">Go to your dashboard</LinkButton>
          ) : user ? (
            <LinkButton href="/pro/onboarding">Complete your pro profile</LinkButton>
          ) : (
            <LinkButton href="/signup?role=provider&next=/pro/onboarding">Apply to become a pro</LinkButton>
          )}
        </div>

        <div className="mt-12 grid gap-4 text-left sm:grid-cols-3">
          {[
            ["📋", "Get matched", "Receive nearby jobs that fit your skills and area."],
            ["💰", "Keep more", "Low commission (15–20%). Cash paid directly to you."],
            ["⭐", "Build a reputation", "Ratings help you win more, higher-value jobs."],
          ].map(([icon, title, desc]) => (
            <Card key={title}>
              <div className="text-2xl">{icon}</div>
              <h3 className="mt-2 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-sm text-slate-400">
          You&apos;ll need your CNIC and a selfie to get verified. Approval usually takes 1–2 days.
        </p>
      </div>
    </AppShell>
  );
}
