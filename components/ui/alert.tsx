import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

const VARIANTS = {
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-800",
  },
  success: {
    icon: CheckCircle2,
    className: "border-brand-200 bg-brand-50 text-brand-800",
  },
  info: {
    icon: Info,
    className: "border-ink-200 bg-ink-50 text-ink-700",
  },
} as const;

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: keyof typeof VARIANTS;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: variantClass } = VARIANTS[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        variantClass,
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
