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
   - [`supabase/patch_v4_business_logic.sql`](supabase/patch_v4_business_logic.sql) — **required**: server-enforced pricing/status/reviews, COD payment + commission ledger, and notifications.
   - [`supabase/patch_v5_settlements_disputes.sql`](supabase/patch_v5_settlements_disputes.sql) — **required**: commission-settlement RPC + disputes admin access.
   - [`supabase/patch_v6_price_lock.sql`](supabase/patch_v6_price_lock.sql) — **required**: locks a job's price once set (anti-tamper), lets Pros price quote jobs, and rate-limits bookings.
   - [`supabase/patch_v7_provider_profiles.sql`](supabase/patch_v7_provider_profiles.sql) — **required**: public provider-profile view (for `/providers/[id]`) + cancellation-reason column.
   - [`supabase/patch_v8_role_escalation.sql`](supabase/patch_v8_role_escalation.sql) — **required (security)**: blocks users from making themselves admin.
   - [`supabase/patch_v9_fix_jobs_rls.sql`](supabase/patch_v9_fix_jobs_rls.sql) — **required (critical)**: fixes job visibility so approved providers can see/accept the open job pool.
   - [`supabase/patch_v10_fix_notify_cast.sql`](supabase/patch_v10_fix_notify_cast.sql) — **required (critical)**: fixes an enum-cast crash that blocked all status updates past "assigned".
     *(Patches are idempotent and safe to re-run.)*

See [`../LAUNCH_READINESS.md`](../LAUNCH_READINESS.md) for the full architect audit and
[`DEPLOYMENT.md`](DEPLOYMENT.md) for the production (Vercel) checklist.
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
- [x] Server-enforced business logic (pricing, status state-machine, review integrity)
- [x] COD payment + commission ledger automation
- [x] In-app notifications (bell + realtime + /notifications)
- [x] Error/404/loading boundaries · toasts · legal & support pages · health check · robots/sitemap
- [x] Provider wallet (ledger-based earnings + commission owed) · admin settlements
- [x] Disputes: "report a problem" on jobs + admin resolution UI
- [x] Automated tests (Vitest) for money/accounting + status state-machine
- [ ] Phone OTP auth (needs an SMS provider) — replaces email/password
- [ ] Email notifications + Sentry monitoring + rate limiting (P1)
- [ ] Escrow + online payments (JazzCash/Easypaisa) · Directions/ETA (P2)

## Testing

```bash
npm test        # Vitest unit tests (money/accounting, status machine, validation)
npm run build   # type-check + production build
```

## Demo videos (customer / provider / admin walkthroughs)

Records MP4 walkthroughs of each role using Playwright + ffmpeg.

```bash
# 1. Put the real service-role (secret) key in .env.local: SUPABASE_SERVICE_ROLE_KEY=...
# 2. Seed demo accounts (creates confirmed customer/provider/admin):
node --env-file=.env.local scripts/seed.mjs
# 3. Make sure the dev server is running (npm run dev), then:
node scripts/record.mjs                 # all three
node scripts/record.mjs customer        # or one role
```

Output MP4s land in `videos/`. Demo logins use password `Karighar#2026`.

## Email notifications (deploy Monday)

Scaffold in `supabase/functions/send-notification-email/`. Deploy with a Resend key
and a Database Webhook on `notifications` INSERT — see the file header for steps.
