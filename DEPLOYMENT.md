# KARIGHAR — Deployment Guide (Vercel + Supabase)

Follow top-to-bottom for a production launch. Est. 60–90 min.

## 1. Supabase (production project)

1. Create a **new** Supabase project for production (keep dev separate).
2. In **SQL Editor**, run in order:
   1. `supabase/schema.sql`
   2. `supabase/patch_v2.sql`
   3. `supabase/patch_v3_realtime.sql`
   4. `supabase/patch_v4_business_logic.sql`   ← integrity, accounting, notifications
   5. `supabase/patch_v5_settlements_disputes.sql`   ← settlements + disputes admin
   6. `supabase/patch_v6_price_lock.sql`   ← price immutability + booking rate-limit
3. **Authentication → URL Configuration:** set **Site URL** to your domain
   (e.g. `https://karighar.pk`) and add it to **Redirect URLs** plus
   `https://karighar.pk/auth/callback`.
4. **Authentication → Providers → Email:** keep "Confirm email" **ON** for production.
5. (Optional) **Providers → Google:** paste client ID/secret; add
   `https://YOUR-PROJECT.supabase.co/auth/v1/callback` as an authorized redirect in Google Cloud.
6. **Database → Backups:** ensure daily backups are enabled (paid plan).

## 2. Google Maps

- Google Cloud Console → enable **Maps JavaScript API** + **Geocoding API**.
- **Enable billing** on the project (required even for the free tier).
- Restrict the API key by **HTTP referrer** to your domain(s) + `localhost` for dev.

## 3. Vercel

1. Push this repo to GitHub and **Import** it in Vercel (root = `karighar/`).
2. **Environment Variables** (Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (if using Google login)
   - `NEXT_PUBLIC_SITE_URL` = `https://karighar.pk`
3. Deploy. Add your custom domain in Vercel → Domains.

## 4. First admin

Sign up once on the live site, find your user id in Supabase → Authentication → Users, then:

```sql
update profiles set role = 'admin' where id = 'YOUR-USER-ID';
```

## 5. Pre-launch checklist

- [ ] All 4 SQL files run on prod
- [ ] Maps billing enabled + key restricted
- [ ] Site URL + OAuth redirects set for the real domain
- [ ] Env vars set in Vercel; build green; custom domain live
- [ ] First admin created; test the full flow on prod (book → accept → complete → pay → rate)
- [ ] Recruit + verify 10–20 launch providers (Phase 0 supply)
- [ ] Swap placeholders: support email/WhatsApp (`src/lib/config.ts`), legal entity in Terms/Privacy
- [ ] Health check green: `https://karighar.pk/api/health`
- [ ] (P1) Add Sentry for error monitoring; enable Supabase backups

## 6. Smoke test after every deploy

1. `/api/health` returns `{"status":"ok"}`
2. Sign up → book a fixed service → confirm it appears in `/bookings`
3. As a second account, onboard as a Pro; approve via admin; accept the job; advance to paid
4. Customer sees live status + gets notifications; rating works
