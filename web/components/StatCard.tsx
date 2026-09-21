import { ComponentType } from "react";
import { TiltCard } from "./TiltCard";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: "accent" | "warn" | "danger" | "sky";
}) {
  const toneClass = {
    accent: "text-accent2 bg-accent/10",
    warn: "text-warn bg-warn/10",
    danger: "text-danger bg-danger/10",
    sky: "text-sky-400 bg-sky-400/10",
  }[tone];

  return (
    <TiltCard className="rounded-2xl">
      <div className="glass relative overflow-hidden rounded-2xl border border-white/5 p-4 shadow-card transition-colors hover:border-white/10">
        <div className="flex items-start justify-between">
          <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
          {Icon && (
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClass}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <div className="mt-3 bg-gradient-to-br from-white to-white/70 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
      </div>
    </TiltCard>
  );
}
