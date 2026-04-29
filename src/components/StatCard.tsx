import type { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  change?: { label: string; positive: boolean };
  children?: ReactNode;
}

export function StatCard({ icon: Icon, label, value, sub, change, children }: StatCardProps) {
  return (
    <div className="bg-bg-1 rounded-6 shadow-2 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className="text-fg-2" />
          <span className="text-fg-2 text-xs font-medium">{label}</span>
        </div>
        {change && (
          <span
            className={`text-xs font-medium ${change.positive ? "text-green-4" : "text-red-4"}`}
          >
            {change.label}
          </span>
        )}
      </div>
      <div>
        <p className="text-fg-4 text-3xl font-semibold tracking-tighter leading-none">{value}</p>
        {sub && <p className="text-fg-2 text-xs mt-1.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
