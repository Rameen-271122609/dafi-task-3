import { cn, initials } from "@/lib/utils";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
} as const;

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (src) {
    return (
      // Avatars are small, already resized on upload and served straight from
      // Supabase Storage, so the image optimiser would only add a hop.
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={name}
        loading="lazy"
        decoding="async"
        className={cn("rounded-full object-cover", SIZES[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700",
        SIZES[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
