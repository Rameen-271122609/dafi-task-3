import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { RecordList } from "@/components/app/record-list";
import { RecordUploader } from "@/components/app/record-uploader";
import { requireSession } from "@/lib/auth";
import { listRecords } from "@/lib/queries";

export const metadata: Metadata = { title: "Medical records" };

export default async function RecordsPage() {
  const { userId, profile } = await requireSession();

  // Doctors reach a patient's documents through the patient list instead.
  if (profile.role === "doctor") redirect("/patients");

  const records = await listRecords(userId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Medical records"
        description="Lab reports, prescriptions and scans you have uploaded. Only doctors you have booked with can open them."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
        <div className="lg:order-2">
          <RecordUploader patientId={userId} />
        </div>

        <div className="lg:order-1">
          <RecordList
            records={records}
            canDelete
            emptyDescription="Upload your first report and it will travel with you to every doctor you book on MediTrack."
          />
        </div>
      </div>
    </div>
  );
}
