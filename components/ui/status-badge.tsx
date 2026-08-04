import { STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
import type { AppointmentStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  return (
    <span className={cn("badge", STATUS_STYLES[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}
