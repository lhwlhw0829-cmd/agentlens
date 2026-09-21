import { ComponentType } from "react";

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
    accent: "text-accent bg-accent/10",
    warn: "text-warn bg-warn/10",
    danger: "text-danger bg-danger/10",
    sky: "text-sky-400 bg-sky-400/10",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-panel p-4 transition hover:border-white/20">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
        {Icon && (
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${toneClass}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
      <div
        className={`absolute inset-x-0 bottom-0 h-0.5 opacity-0 transition group-hover:opacity-100 ${
          tone === "accent"
            ? "bg-accent"
            : tone === "warn"
              ? "bg-warn"
              : tone === "danger"
                ? "bg-danger"
                : "bg-sky-400"
        }`}
      />
    </div>
  );
}
