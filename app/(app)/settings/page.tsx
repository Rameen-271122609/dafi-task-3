import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { requireSession } from "@/lib/auth";

import { AvatarUpload } from "./avatar-upload";
import { DoctorForm } from "./doctor-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { userId, profile, doctor } = await requireSession();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Keep your details current so appointments and records stay accurate."
      />

      <div className="space-y-6">
        <AvatarUpload
          userId={userId}
          name={profile.full_name}
          avatarUrl={profile.avatar_url}
        />

        <ProfileForm profile={profile} />

        {doctor ? <DoctorForm doctor={doctor} /> : null}
      </div>
    </div>
  );
}
