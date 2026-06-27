/**
 * Seeds sample users (one per role) using the Supabase admin API, then applies
 * the reference data in supabase/seed.sql.
 *
 * Usage:
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
 * The service role bypasses RLS. Dev passwords are intentionally simple — do
 * NOT run this against production.
 */
import { createClient } from "@supabase/supabase-js";

import type { UserRole } from "../src/lib/roles";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SAMPLE_USERS: { email: string; password: string; fullName: string; role: UserRole }[] = [
  { email: "employee@bytelab.dev", password: "Passw0rd!", fullName: "Evan Employee", role: "employee" },
  { email: "manager@bytelab.dev",  password: "Passw0rd!", fullName: "Maya Manager",  role: "manager" },
  { email: "finance@bytelab.dev",  password: "Passw0rd!", fullName: "Fred Finance",  role: "finance" },
  { email: "admin@bytelab.dev",    password: "Passw0rd!", fullName: "Ada Admin",     role: "admin" },
];

async function findUserByEmail(email: string) {
  // listUsers is paginated; the dev project is tiny so one page is enough.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

async function seedUsers() {
  for (const u of SAMPLE_USERS) {
    let user = await findUserByEmail(u.email);

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.fullName },
      });
      if (error) throw error;
      user = data.user;
      console.log(`created ${u.email}`);
    } else {
      console.log(`exists  ${u.email}`);
    }

    // The handle_new_user trigger created the profile row; set name + role.
    const { error: pErr } = await admin
      .from("profiles")
      .update({ full_name: u.fullName, role: u.role, active: true })
      .eq("id", user.id);
    if (pErr) throw pErr;
  }
}

async function main() {
  await seedUsers();
  console.log("\nUser seed complete. Sample logins use password: Passw0rd!");
  console.log(
    "Reference data (departments/projects/inventory/rates) is applied from\n" +
      "supabase/seed.sql by `supabase db reset`, or run it manually with:\n" +
      "  supabase db execute --file supabase/seed.sql\n",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
