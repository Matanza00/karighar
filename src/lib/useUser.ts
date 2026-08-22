"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

// Client hook: current auth user + their profile row. `loading` guards redirects.
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (active) setProfile(data as Profile | null);
      }
      if (active) setLoading(false);
    }
    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}

// Redirect to /signin if not authenticated (call inside a client page).
export function useRequireAuth(nextPath: string) {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/signin?next=${encodeURIComponent(nextPath)}`);
    }
  }, [loading, user, nextPath, router]);
  return { user, profile, loading };
}
