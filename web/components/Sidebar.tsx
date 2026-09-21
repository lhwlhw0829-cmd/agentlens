"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGauge, IconShield, IconLayers, IconBolt } from "./icons";

const NAV = [
  { href: "/", label: "Overview", icon: IconGauge },
  { href: "/#traces", label: "Traces", icon: IconLayers },
  { href: "/compare", label: "Regression Diff", icon: IconLayers, badge: "new" },
  { href: "/guardrails", label: "Guardrails", icon: IconShield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-white/5">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent2 text-white shadow-glow">
          <IconBolt className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="text-[15px] font-semibold leading-none tracking-tight">
            AgentLens
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">
            Agent Observability
          </div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                active
                  ? "bg-gradient-to-r from-accent/15 to-accent2/5 text-white shadow-[inset_0_0_0_1px_rgba(255,45,120,0.25)]"
                  : "text-muted hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon
                className={`h-4 w-4 transition-colors ${active ? "text-accent" : "text-muted group-hover:text-white"}`}
              />
              {item.label}
              {item.badge && (
                <span className="ml-auto rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-accent2">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/5 px-4 py-4 text-xs text-muted">
        <div className="rounded-xl border border-white/5 bg-black/40 p-3">
          <div className="font-medium text-white">Instrument an agent</div>
          <code className="mt-1 block text-[11px] text-accent2">
            pip install -e ./sdk
          </code>
        </div>
        <a
          href="https://github.com/lhwlhw0829-cmd/agentlens"
          className="block hover:text-white"
        >
          View on GitHub →
        </a>
      </div>
    </aside>
  );
}
