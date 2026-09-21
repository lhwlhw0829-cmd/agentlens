"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGauge, IconShield, IconLayers, IconBolt } from "./icons";

const NAV = [
  { href: "/", label: "Overview", icon: IconGauge },
  { href: "/#traces", label: "Traces", icon: IconLayers },
  { href: "/guardrails", label: "Guardrails", icon: IconShield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-border bg-panel/60 backdrop-blur">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-sky-400 text-bg">
          <IconBolt className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-none">AgentLens</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">
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
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border px-4 py-4 text-xs text-muted">
        <div className="rounded-lg border border-border bg-black/20 p-3">
          <div className="font-medium text-white">Instrument an agent</div>
          <code className="mt-1 block text-[11px] text-accent">
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
