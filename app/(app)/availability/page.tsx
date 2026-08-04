import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { requireDoctor } from "@/lib/auth";
import { listAvailability } from "@/lib/queries";

import { AvailabilityManager } from "./availability-manager";

export const metadata: Metadata = { title: "Consulting hours" };

export default async function AvailabilityPage() {
  const { userId, doctor } = await requireDoctor();
  const slots = await listAvailability(userId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Consulting hours"
        description="Publish the windows you see patients in. MediTrack turns each window into bookable slots and hides the ones already taken."
      />

      <AvailabilityManager slots={slots} isAccepting={doctor.is_accepting} />
    </div>
  );
}
