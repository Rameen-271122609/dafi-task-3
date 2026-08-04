"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, UploadCloud, X } from "lucide-react";

import { createRecord } from "@/app/(app)/records/actions";
import { Alert } from "@/components/ui/alert";
import {
  ACCEPTED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  RECORD_TYPE_LABELS,
  STORAGE_BUCKET,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { RecordType } from "@/lib/types/database";
import { cn, formatBytes, slugifyFileName } from "@/lib/utils";

export function RecordUploader({
  patientId,
  appointmentId,
  label = "Upload a document",
}: {
  patientId: string;
  appointmentId?: string;
  label?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("lab_report");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  const busy = uploading || pending;

  function acceptFile(candidate: File | undefined) {
    setError(null);
    setNotice(null);
    if (!candidate) return;

    if (!ACCEPTED_MIME_TYPES.includes(candidate.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
      setError("Only PDF, PNG, JPEG, WebP and plain text files are accepted.");
      return;
    }
    if (candidate.size > MAX_UPLOAD_BYTES) {
      setError(`That file is ${formatBytes(candidate.size)}; the limit is 10 MB.`);
      return;
    }

    setFile(candidate);
    if (!title) {
      setTitle(candidate.name.replace(/\.[^.]+$/, "").slice(0, 80));
    }
  }

  function reset() {
    setFile(null);
    setTitle("");
    setNotes("");
    setRecordType("lab_report");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Give the document a short title.");
      return;
    }

    setUploading(true);

    const supabase = createClient();
    const objectKey = `${patientId}/${crypto.randomUUID()}-${slugifyFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(objectKey, file, { contentType: file.type, upsert: false });

    setUploading(false);

    if (uploadError) {
      setError("The file could not be uploaded. Check your connection and try again.");
      return;
    }

    const payload = new FormData();
    payload.set("patient_id", patientId);
    payload.set("file_path", objectKey);
    payload.set("file_name", file.name);
    payload.set("file_size", String(file.size));
    payload.set("mime_type", file.type);
    payload.set("title", title.trim());
    payload.set("record_type", recordType);
    payload.set("notes", notes.trim());
    if (appointmentId) payload.set("appointment_id", appointmentId);

    startTransition(async () => {
      const result = await createRecord({}, payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(result.notice ?? "Document uploaded.");
      reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div>
        <h3 className="font-semibold text-ink-900">{label}</h3>
        <p className="mt-1 text-sm text-ink-500">
          PDF, image or text file, up to 10 MB. Stored in a private bucket.
        </p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors",
          dragging ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-ink-50"
        )}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <Paperclip className="h-4 w-4 text-ink-400" aria-hidden="true" />
            <span className="truncate text-sm font-medium text-ink-800">
              {file.name}
            </span>
            <span className="text-xs text-ink-400">{formatBytes(file.size)}</span>
            <button
              type="button"
              onClick={reset}
              className="text-ink-400 hover:text-ink-700"
              aria-label="Remove selected file"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto h-7 w-7 text-ink-400" aria-hidden="true" />
            <p className="mt-2 text-sm text-ink-600">
              Drag a file here, or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-semibold text-brand-700 hover:underline"
              >
                browse your device
              </button>
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={ACCEPTED_MIME_TYPES.join(",")}
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="record-title">
            Title
          </label>
          <input
            id="record-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="field"
            placeholder="Complete blood count — July"
            maxLength={120}
          />
        </div>

        <div>
          <label className="label" htmlFor="record-type">
            Document type
          </label>
          <select
            id="record-type"
            value={recordType}
            onChange={(event) => setRecordType(event.target.value as RecordType)}
            className="field"
          >
            {Object.entries(RECORD_TYPE_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="record-notes">
          Notes <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <textarea
          id="record-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          className="field resize-y"
          placeholder="Taken at City Diagnostics, fasting sample."
        />
      </div>

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {uploading ? "Uploading…" : "Saving…"}
          </>
        ) : (
          "Add to record"
        )}
      </button>
    </form>
  );
}
