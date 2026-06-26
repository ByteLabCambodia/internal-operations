import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/profile/components/profile-form";

export default async function ProfilePage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and account settings.</p>
      </div>
      <ProfileForm
        fullName={profile.full_name}
        department={profile.department}
        email={email}
        telegramLinked={Boolean(profile.telegram_id)}
        botUsername={botUsername}
      />
    </div>
  );
}
