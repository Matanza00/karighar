"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePkPhone } from "@/lib/validate";
import { Button, Field, inputClass } from "@/components/ui";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";
  const asProvider = search.get("role") === "provider";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function google() {
    setError(null);
    const supabase = createClient();
    const dest = asProvider ? "/pro/onboarding" : next;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(dest)}` },
    });
    if (error) setError(error.message);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();

    if (mode === "signup") {
      const normPhone = normalizePkPhone(phone);
      if (!normPhone) {
        setError("Enter a valid Pakistani mobile number, e.g. 0300 1234567");
        setBusy(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone: normPhone } },
      });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      if (!data.session) {
        setNotice(
          "Account created. Please check your email to confirm, then sign in. (Tip: you can disable email confirmation in Supabase → Authentication → Sign In / Providers for faster testing.)"
        );
        setBusy(false);
        return;
      }
      // Signed in immediately — persist name/phone + role.
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: normPhone,
          role: asProvider ? "provider" : "customer",
        })
        .eq("id", data.session.user.id);
      router.push(asProvider ? "/pro/onboarding" : next);
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        {mode === "signup"
          ? asProvider
            ? "Join KARIGHAR as a Pro"
            : "Create your account"
          : "Welcome back"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {mode === "signup"
          ? "It takes less than a minute."
          : "Sign in to book and track services."}
      </p>

      <button
        type="button"
        onClick={google}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 16 3 9.1 7.6 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9 40.3 15.9 45 24 45z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4 5.5l6.3 5.3C41 36.3 44 30.8 44 24c0-1.2-.1-2.3-.4-3.5z"/>
        </svg>
        Continue with Google
      </button>

      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or {mode === "signup" ? "sign up" : "sign in"} with email
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <>
            <Field label="Full name">
              <input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Ahmed Khan"
              />
            </Field>
            <Field label="Phone number" hint="We use this to coordinate your service.">
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="03XX-XXXXXXX"
                inputMode="tel"
              />
            </Field>
          </>
        )}
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@email.com"
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
        </Field>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {notice && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">{notice}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href={`/signin?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to KARIGHAR?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
