"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { CostChart } from "@/components/CostChart";
import { CostProjection } from "@/components/CostProjection";
import { TraceDetailPanel } from "@/components/TraceDetailPanel";
import { IconAlert, IconBolt, IconGauge, IconLayers, IconSearch } from "@/components/icons";
import { Trace, TraceSummary } from "@/lib/types";
import { fmtCost, timeAgo } from "@/lib/format";

const STATUS_DOT: Record<string, string> = {
  success: "bg-ok",
  error: "bg-danger",
  running: "bg-warn",
};

const STATUS_TEXT: Record<string, string> = {
  success: "text-ok",
  error: "text-danger",
  running: "text-warn",
};

type StatusFilter = "all" | "success" | "error" | "running";

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<TraceSummary[]>([]);
  const [selected, setSelected] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetch("/api/traces")
      .then((r) => r.json())
      .then((data) => {
        setSummaries(data.traces ?? []);
        setLoading(false);
      });
  }, []);

  async function openTrace(id: string) {
    const res = await fetch(`/api/traces/${id}`);
    const data = await res.json();
    setSelected(data.trace);
  }

  const agentNames = useMemo(
    () => Array.from(new Set(summaries.map((s) => s.agentName))),
    [summaries],
  );

  const filtered = summaries.filter((t) => {
    if (agentFilter !== "all" && t.agentName !== agentFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (query && !`${t.agentName} ${t.id}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  const totalCost = summaries.reduce((s, t) => s + t.totalCostUsd, 0);
  const totalTraces = summaries.length;
  const anomalies = summaries.flatMap((t) =>
    t.anomalies.map((a) => ({ ...a, agentName: t.agentName, traceId: t.id, startedAt: t.startedAt })),
  );
  const avgDuration =
    summaries.length > 0
      ? summaries.reduce((s, t) => s + t.durationMs, 0) / summaries.length
      : 0;

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">
      <Link
        href="/compare"
        className="glass mb-6 flex items-center justify-between rounded-2xl border border-accent/20 px-5 py-3 text-sm transition hover:border-accent/40"
      >
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-gradient-to-r from-accent to-accent2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            New
          </span>
          <span className="text-white">Regression Diff</span>
          <span className="text-muted">
            — compare two traces to catch agent behavior drift before it ships
          </span>
        </span>
        <span className="text-accent2">Try it →</span>
      </Link>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted">
            Real-time traces, cost, and anomaly detection across every agent you ship.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search traces…"
              className="w-56 rounded-lg border border-border bg-panel py-2 pl-8 pr-3 text-sm outline-none placeholder:text-muted focus:border-accent/50"
            />
          </div>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Traces (24h)"
          value={String(totalTraces)}
          icon={IconLayers}
          tone="sky"
        />
        <StatCard
          label="Total cost"
          value={fmtCost(totalCost)}
          hint="across all traced agents"
          icon={IconBolt}
          tone="accent"
        />
        <StatCard
          label="Avg. duration"
          value={`${(avgDuration / 1000).toFixed(1)}s`}
          icon={IconGauge}
          tone="sky"
        />
        <StatCard
          label="Anomalies flagged"
          value={String(anomalies.length)}
          hint="loops, cost spikes, errors"
          icon={IconAlert}
          tone="danger"
        />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl border border-white/5 p-5 shadow-card lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Cost trend</h2>
            <span className="text-xs text-muted">per trace, chronological</span>
          </div>
          <CostChart summaries={summaries} />
        </div>

        <div className="glass rounded-2xl border border-white/5 p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Alert feed</h2>
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] text-danger">
              {anomalies.length} active
            </span>
          </div>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 200 }}>
            {anomalies.length === 0 && (
              <div className="text-xs text-muted">No anomalies detected.</div>
            )}
            {anomalies.map((a, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/5 bg-black/30 p-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.agentName}</span>
                  <span className="text-muted">{timeAgo(a.startedAt)}</span>
                </div>
                <div
                  className={`mt-1 ${a.severity === "danger" ? "text-danger" : "text-warn"}`}
                >
                  {a.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <CostProjection summaries={summaries} />
      </section>

      <section id="traces" className="glass rounded-2xl border border-white/5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <h2 className="text-sm font-medium">Traces</h2>
          <div className="flex items-center gap-2 text-xs">
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="rounded-md border border-border bg-black/30 px-2 py-1.5 text-xs outline-none"
            >
              <option value="all">All agents</option>
              {agentNames.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {(["all", "success", "error", "running"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md border px-2.5 py-1.5 capitalize transition ${
                  statusFilter === s
                    ? "border-accent/50 bg-accent/10 text-accent2"
                    : "border-border text-muted hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {loading && (
            <div className="px-5 py-6 text-sm text-muted">Loading traces…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-5 py-6 text-sm text-muted">No traces match these filters.</div>
          )}
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => openTrace(t.id)}
              className="grid w-full grid-cols-[1.2fr_0.6fr_0.5fr_0.5fr_0.5fr_1fr_0.6fr] items-center gap-3 px-5 py-3 text-left text-sm transition hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-2 font-medium">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[t.status]}`} />
                {t.agentName}
              </div>
              <div className={`text-xs ${STATUS_TEXT[t.status]}`}>{t.status}</div>
              <div className="text-xs text-muted">{t.stepCount} steps</div>
              <div className="text-xs text-muted">{(t.durationMs / 1000).toFixed(1)}s</div>
              <div className="text-xs text-muted">{fmtCost(t.totalCostUsd)}</div>
              <div className="flex flex-wrap gap-1">
                {t.anomalies.map((a, i) => (
                  <span
                    key={i}
                    className={`rounded px-1.5 py-0.5 text-[10px] ${
                      a.severity === "danger"
                        ? "bg-danger/20 text-danger"
                        : "bg-warn/20 text-warn"
                    }`}
                  >
                    {a.type}
                  </span>
                ))}
              </div>
              <div className="text-right text-xs text-muted">{timeAgo(t.startedAt)}</div>
            </button>
          ))}
        </div>
      </section>

      <footer className="mt-8 text-xs text-muted">
        Demo data ships with the repo so the dashboard is meaningful on first
        load. Instrument your own agent with the Python SDK (
        <code>sdk/agentlens</code>) and POST traces to{" "}
        <code>/api/traces</code> to see live data.
      </footer>

      <TraceDetailPanel trace={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
