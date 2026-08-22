# KARIGHAR

On-demand home-services marketplace for Pakistan (Karachi). Web-first PWA.
Next.js 16 + Supabase. See [`../BUILD_SPEC.md`](../BUILD_SPEC.md) for the full product spec.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — the landing page runs without any backend yet.

## Connect Supabase (needed for auth, booking, providers)

1. Create a free project at https://supabase.com.
2. In the project's **SQL Editor**, run these files in order:
   - [`supabase/schema.sql`](supabase/schema.sql) — tables, security policies, seeded Karachi catalog.
   - [`supabase/patch_v2.sql`](supabase/patch_v2.sql) — provider job access, rating trigger, verification storage bucket.
   - [`supabase/patch_v3_realtime.sql`](supabase/patch_v3_realtime.sql) — **required** for live chat, live location tracking, and live status updates.
     *(A fresh `schema.sql` already includes v2/v3; the patches are safe to run either way and are for databases created from the first version.)*
3. Copy `.env.local.example` → `.env.local` and fill in your project's **URL** and key
   (Project Settings → API). The **publishable key** goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — either name works).
4. **For fast testing:** in Supabase → **Authentication → Sign In / Providers → Email**,
   turn **off** "Confirm email" so signups log in instantly. (Turn it back on for production.)
5. Restart `npm run dev`.

### Make yourself an admin

After signing up once, find your user id in Supabase → Authentication → Users, then run in SQL Editor:

```sql
update profiles set role = 'admin' where id = 'YOUR-USER-ID';
```

Now `/admin` unlocks (verify providers, manage catalog, monitor jobs).

### Google Maps

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` must have **Maps JavaScript API** and **Geocoding API**
enabled (Google Cloud Console → APIs). If you set HTTP-referrer restrictions, allow
`http://localhost:3000/*` and your production domain.

### Google sign-in (optional)

The "Continue with Google" button needs the Google provider enabled in Supabase:
Supabase → **Authentication → Providers → Google**, paste your `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
and `GOOGLE_CLIENT_SECRET`, and add `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
as an authorized redirect URI in Google Cloud Console.

## Try the full flow

1. Sign up as a **customer** → `/book` → book an AC service.
2. In another browser/incognito, sign up as a **provider** → `/pro/onboarding` → submit.
3. As **admin**, go to `/admin/providers` → approve the provider.
4. As the **provider** → `/pro/dashboard` → accept the job → advance status.
5. Back as the **customer** → `/bookings/[id]` → watch it update live, chat, then rate.

## Structure

```
src/
  app/            # routes (App Router)
    page.tsx      # public landing (services + prices)
  lib/
    catalog.ts    # seed catalog (mirrors DB) for the landing view
    supabase/
      client.ts   # browser Supabase client
      server.ts   # server Supabase client
supabase/
  schema.sql      # full DB schema + RLS + Karachi seed catalog
```

## Roadmap (v1)

- [x] Project + DB schema + branded landing
- [x] Auth (email + password; captures name + phone) + customer / provider / admin roles
- [x] Customer booking flow (fixed price + custom job + bids)
- [x] Provider onboarding + CNIC verification (admin-approved)
- [x] Live job status (realtime) + in-app chat
- [x] Ratings & reviews · COD (commission tracked on job)
- [x] Admin panel (verification, catalog, jobs monitor)
- [x] Google Maps — location pin on booking + live provider tracking + provider jobs map
- [x] Role-aware navigation (customer vs provider) with bottom tab bar
- [x] Profile + Settings pages · provider My Services / History / Map
- [x] Customer service search
- [x] Google OAuth sign-in
- [x] Installable PWA (manifest + generated icons)
- [ ] Phone OTP auth (needs an SMS provider) — replaces email/password
- [ ] Provider wallet/payouts, escrow, online payments — later phase
- [ ] Push notifications · route directions (Directions API)
