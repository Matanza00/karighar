// KARIGHAR — email notifications Edge Function (SCAFFOLD, deploy Monday)
// Sends an email when a row is inserted into `notifications`.
//
// Wire-up (once you have a Resend account):
//   1. supabase secrets set RESEND_API_KEY=re_xxx
//   2. supabase functions deploy send-notification-email --no-verify-jwt
//   3. Supabase Dashboard → Database → Webhooks → create webhook:
//        table: notifications, events: INSERT, type: HTTP Request,
//        URL: https://<project>.functions.supabase.co/send-notification-email
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const n = payload.record; // the inserted notification row
    if (!n?.user_id) return new Response("no user", { status: 200 });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) return new Response("email disabled (no key)", { status: 200 });

    // Resolve the recipient's email via the admin API.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: userRes } = await admin.auth.admin.getUserById(n.user_id);
    const email = userRes?.user?.email;
    if (!email) return new Response("no email", { status: 200 });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "KARIGHAR <noreply@thekarighar.com>",
        to: email,
        subject: n.title ?? "KARIGHAR update",
        html: `<p>${n.title ?? ""}</p><p>${n.body ?? ""}</p>
               <p><a href="https://thekarighar.com/bookings">Open KARIGHAR</a></p>`,
      }),
    });
    return new Response(res.ok ? "sent" : "resend error", { status: 200 });
  } catch (e) {
    return new Response("error: " + (e as Error).message, { status: 200 });
  }
});
