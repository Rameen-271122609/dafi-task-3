"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";

import { setAvatar } from "@/app/(app)/settings/actions";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export function AvatarUpload({
  userId,
  name,
  avatarUrl,
}: {
  userId: string;
  name: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(null);
    setNotice(null);
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Profile photos must be under 2 MB.");
      return;
    }

    setUploading(true);

    // Imported lazily so the Supabase browser bundle stays off the initial load.
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const extension = file.type.split("/")[1]!.replace("jpeg", "jpg");
    const objectKey = `${userId}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(objectKey, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      setUploading(false);
      setError("The photo could not be uploaded. Try again.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectKey);

    setUploading(false);

    const payload = new FormData();
    // Cache busting keeps the browser from showing the previous photo.
    payload.set("avatar_url", `${publicUrl}?v=${Date.now()}`);

    startTransition(async () => {
      const result = await setAvatar({}, payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(result.notice ?? "Profile photo updated.");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  const busy = uploading || pending;

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-ink-900">Profile photo</h2>
      <p className="mt-1 text-sm text-ink-500">
        Shown on your appointments and, for doctors, in the public directory.
      </p>

      {error ? (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert variant="success" className="mt-4">
          {notice}
        </Alert>
      ) : null}

      <div className="mt-5 flex items-center gap-5">
        <Avatar name={name} src={avatarUrl} size="lg" />
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn-secondary"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              <>
                <Camera className="h-4 w-4" aria-hidden="true" />
                {avatarUrl ? "Change photo" : "Upload photo"}
              </>
            )}
          </button>
          <p className="mt-2 text-xs text-ink-400">PNG, JPEG or WebP, up to 2 MB.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
}
