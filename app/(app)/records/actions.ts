"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, STORAGE_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { RecordType } from "@/lib/types/database";

export interface RecordActionState {
  error?: string;
  notice?: string;
}

const RECORD_TYPES: RecordType[] = [
  "lab_report",
  "prescription",
  "scan",
  "discharge_summary",
  "other",
];

/**
 * Records the metadata for a file the browser has already streamed into the
 * private bucket. Storage policies gate the upload itself; this re-checks the
 * same rules before the row is written.
 */
export async function createRecord(
  _prev: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  const { userId } = await requireSession();

  const patientId = String(formData.get("patient_id") ?? "");
  const filePath = String(formData.get("file_path") ?? "");
  const fileName = String(formData.get("file_name") ?? "");
  const fileSize = Number(formData.get("file_size") ?? 0);
  const mimeType = String(formData.get("mime_type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const recordType = String(formData.get("record_type") ?? "other") as RecordType;

  if (!patientId || !filePath || !fileName || !mimeType) {
    return { error: "The upload did not complete. Try again." };
  }

  if (!title) return { error: "Give the document a short title." };

  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_UPLOAD_BYTES) {
    return { error: "That file is empty or larger than the 10 MB limit." };
  }

  if (!RECORD_TYPES.includes(recordType)) {
    return { error: "Choose a valid document type." };
  }

  // The object key always starts with the owning patient's id.
  if (!filePath.startsWith(`${patientId}/`)) {
    return { error: "That file does not belong to this patient record." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("medical_records").insert({
    patient_id: patientId,
    uploaded_by: userId,
    appointment_id: appointmentId || null,
    title,
    record_type: recordType,
    notes: notes || null,
    file_path: filePath,
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
  });

  if (error) {
    // Leave no orphan object behind when the metadata row is rejected.
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    return { error: "You are not allowed to add documents to this record." };
  }

  revalidatePath("/records");
  revalidatePath("/dashboard");
  if (appointmentId) revalidatePath(`/appointments/${appointmentId}`);
  if (patientId !== userId) revalidatePath(`/patients/${patientId}`);

  return { notice: "Document uploaded." };
}

export async function deleteRecord(
  _prev: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  await requireSession();

  const id = String(formData.get("record_id") ?? "");
  if (!id) return { error: "Document not found." };

  const supabase = await createClient();

  const { data: record } = await supabase
    .from("medical_records")
    .select("id, file_path, patient_id, appointment_id")
    .eq("id", id)
    .maybeSingle();

  if (!record) return { error: "Document not found." };

  const { error } = await supabase.from("medical_records").delete().eq("id", id);
  if (error) return { error: "You cannot remove this document." };

  await supabase.storage.from(STORAGE_BUCKET).remove([record.file_path]);

  revalidatePath("/records");
  revalidatePath("/dashboard");
  if (record.appointment_id) revalidatePath(`/appointments/${record.appointment_id}`);
  revalidatePath(`/patients/${record.patient_id}`);

  return { notice: "Document removed." };
}

/** Short-lived signed URL so a private object can be opened in a new tab. */
export async function getRecordUrl(recordId: string): Promise<{
  url?: string;
  error?: string;
}> {
  await requireSession();

  const supabase = await createClient();

  const { data: record } = await supabase
    .from("medical_records")
    .select("file_path")
    .eq("id", recordId)
    .maybeSingle();

  if (!record) return { error: "Document not found." };

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(record.file_path, 60);

  if (error || !data) return { error: "The document link could not be created." };

  return { url: data.signedUrl };
}
