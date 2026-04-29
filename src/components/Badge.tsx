import type { ReactNode } from "react";

type Variant = "green" | "red" | "amber" | "sky" | "purple" | "blue" | "gray";

const variants: Record<Variant, string> = {
  green:  "bg-green-a1 text-green-4",
  red:    "bg-red-a1 text-red-4",
  amber:  "bg-amber-a1 text-amber-4",
  sky:    "bg-sky-a1 text-sky-4",
  purple: "bg-purple-a1 text-purple-4",
  blue:   "bg-blue-a1 text-blue-4",
  gray:   "bg-bg-2 text-fg-2",
};

export function Badge({
  children,
  variant = "gray",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-3 px-2 py-1 text-xs font-medium leading-none ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
