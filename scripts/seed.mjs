// Seeds demo accounts for video recording / testing.
// Run: node --env-file=.env.local scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "node:url";

export const ACCOUNTS = {
  customer: { email: "demo.customer@karighar.pk", password: "Karighar#2026", name: "Ayesha Khan", phone: "+923001234567" },
  provider: { email: "demo.provider@karighar.pk", password: "Karighar#2026", name: "Bilal Ahmed", phone: "+923009876543" },
  admin: { email: "demo.admin@karighar.pk", password: "Karighar#2026", name: "KARIGHAR Admin", phone: "+923005556677" },
};

async function ensureUser(admin, { email, password, name }) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = list.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error) throw error;
    user = data.user;
    console.log("created", email);
  } else {
    await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    console.log("updated", email);
  }
  return user;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  // Customer
  const c = await ensureUser(admin, ACCOUNTS.customer);
  await admin.from("profiles").update({ full_name: ACCOUNTS.customer.name, phone: ACCOUNTS.customer.phone, role: "customer" }).eq("id", c.id);
  await admin.from("customers").upsert({ profile_id: c.id, default_address: "Gulshan-e-Iqbal, Karachi" }, { onConflict: "profile_id" });

  // Provider (approved, with services + areas)
  const p = await ensureUser(admin, ACCOUNTS.provider);
  await admin.from("profiles").update({ full_name: ACCOUNTS.provider.name, phone: ACCOUNTS.provider.phone, role: "provider" }).eq("id", p.id);
  await admin.from("providers").upsert(
    {
      profile_id: p.id,
      cnic_no: "42101-1234567-1",
      bio: "8+ years experience in AC service, electrical and plumbing across Karachi.",
      status: "approved",
      service_areas: ["Gulshan-e-Iqbal", "DHA", "Clifton"],
      rating_avg: 4.8,
      jobs_completed: 27,
      verified_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" }
  );
  const { data: svcs } = await admin.from("services").select("id");
  if (svcs?.length) {
    await admin.from("provider_services").upsert(
      svcs.map((s) => ({ provider_id: p.id, service_id: s.id })),
      { onConflict: "provider_id,service_id" }
    );
  }

  // A second pending provider so the admin video has someone to approve.
  const pend = await ensureUser(admin, { email: "demo.pending@karighar.pk", password: "Karighar#2026", name: "Kamran Pending" });
  await admin.from("profiles").update({ full_name: "Kamran Pending", phone: "+923002223344", role: "provider" }).eq("id", pend.id);
  await admin.from("providers").upsert(
    { profile_id: pend.id, cnic_no: "42101-7654321-9", bio: "New applicant — plumbing & electrical.", status: "pending", service_areas: ["Nazimabad"] },
    { onConflict: "profile_id" }
  );

  // Admin
  const a = await ensureUser(admin, ACCOUNTS.admin);
  await admin.from("profiles").update({ full_name: ACCOUNTS.admin.name, phone: ACCOUNTS.admin.phone, role: "admin" }).eq("id", a.id);

  console.log("\nSeed complete. Demo logins (password: Karighar#2026):");
  console.log(" customer:", ACCOUNTS.customer.email);
  console.log(" provider:", ACCOUNTS.provider.email);
  console.log(" admin:   ", ACCOUNTS.admin.email);
}

// Only run when executed directly (so record.mjs can import ACCOUNTS safely).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
