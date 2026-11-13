import { cn } from "@/lib/utils";
import { TONE_BG, type Tone } from "@/lib/domains";

export function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function UserAvatar({
  name,
  tone = 0,
  size = "md",
  className,
}: {
  name: string;
  tone?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const t = ((tone % 6) + 1) as Tone;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-primary-foreground ring-2 ring-background",
        TONE_BG[t],
        size === "sm" && "h-7 w-7 text-[11px]",
        size === "md" && "h-9 w-9 text-xs",
        size === "lg" && "h-14 w-14 text-lg",
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
