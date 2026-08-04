"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ExternalLink,
  FileImage,
  FileText,
  FolderClosed,
  Loader2,
  Trash2,
} from "lucide-react";

import { deleteRecord, getRecordUrl } from "@/app/(app)/records/actions";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { RECORD_TYPE_LABELS } from "@/lib/constants";
import type { MedicalRecord } from "@/lib/types/database";
import { formatBytes } from "@/lib/utils";

export function RecordList({
  records,
  canDelete,
  emptyDescription,
}: {
  records: MedicalRecord[];
  canDelete: boolean;
  emptyDescription: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function open(record: MedicalRecord) {
    setError(null);
    setOpeningId(record.id);
    const result = await getRecordUrl(record.id);
    setOpeningId(null);

    if (result.error || !result.url) {
      setError(result.error ?? "The document link could not be created.");
      return;
    }
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  function remove(record: MedicalRecord) {
    setError(null);
    setRemovingId(record.id);

    const payload = new FormData();
    payload.set("record_id", record.id);

    startTransition(async () => {
      const result = await deleteRecord({}, payload);
      setRemovingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon={FolderClosed}
        title="No documents yet"
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-3">
      {error ? <Alert variant="error">{error}</Alert> : null}

      <ul className="card divide-y divide-ink-100">
        {records.map((record) => {
          const Icon = record.mime_type.startsWith("image/") ? FileImage : FileText;
          return (
            <li key={record.id} className="flex items-start gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-500">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{record.title}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {RECORD_TYPE_LABELS[record.record_type]} ·{" "}
                  {formatBytes(record.file_size)} ·{" "}
                  {format(new Date(record.created_at), "d MMM yyyy")}
                </p>
                {record.notes ? (
                  <p className="mt-2 text-sm text-ink-600">{record.notes}</p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => open(record)}
                  disabled={openingId === record.id}
                  className="btn-ghost px-2.5"
                  aria-label={`Open ${record.title}`}
                >
                  {openingId === record.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>

                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => remove(record)}
                    disabled={removingId === record.id}
                    className="btn-ghost px-2.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${record.title}`}
                  >
                    {removingId === record.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
