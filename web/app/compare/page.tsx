"use client";

import { useEffect, useMemo, useState } from "react";
import { Trace, TraceSummary } from "@/lib/types";
import { computeDrift } from "@/lib/diff";
import { fmtCost } from "@/lib/format";
import { IconAlert, IconLayers } from "@/components/icons";

const VERDICT_STYLE: Record<string, string> = {
  stable: "text-ok bg-ok/10 border-ok/30",
  moderate: "text-warn bg-warn/10 border-warn/30",
  high: "text-danger bg-danger/10 border-danger/30",
};

const VERDICT_LABEL: Record<string, string> = {
  stable: "Stable — safe to ship",
  moderate: "Moderate drift — review before shipping",
  high: "High drift — likely regression",
};

export default function ComparePage() {
  const [summaries, setSummaries] = useState<TraceSummary[]>([]);
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [before, setBefore] = useState<Trace | null>(null);
  const [after, setAfter] = useState<Trace | null>(null);

  useEffect(() => {
    fetch("/api/traces")
      .then((r) => r.json())
      .then((data) => {
        const list: TraceSummary[] = data.traces ?? [];
        setSummaries(list);
        if (list.length >= 2) {
          setBeforeId(list[list.length - 1].id);
          setAfterId(list[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (beforeId) fetch(`/api/traces/${beforeId}`).then((r) => r.json()).then((d) => setBefore(d.trace));
  }, [beforeId]);

  useEffect(() => {
    if (afterId) fetch(`/api/traces/${afterId}`).then((r) => r.json()).then((d) => setAfter(d.trace));
  }, [afterId]);

  const report = useMemo(() => {
    if (!before || !after) return null;
    return computeDrift(before, after);
  }, [before, after]);

  return (
    <main className="mx-auto max-w-5xl px-8 py-8">
      <header className="mb-8">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-medium text-accent2">
          <IconLayers className="h-3 w-3" />
          Regression Diff
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Did my prompt/model change break this agent?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Most observability tools show you one trace at a time. AgentLens
          diffs two traces from the <strong>same agent</strong> — before and
          after a prompt, model, or tool change — and flags structural,
          cost, and latency drift automatically. Think of it as CI for agent
          behavior, not just a dashboard.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TraceSelect
          label="Before"
          value={beforeId}
          onChange={setBeforeId}
          summaries={summaries}
        />
        <TraceSelect
          label="After"
          value={afterId}
          onChange={setAfterId}
          summaries={summaries}
        />
      </section>

      {report && before && after && (
        <>
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div
              className={`glass col-span-2 rounded-2xl border p-5 shadow-card sm:col-span-1 ${VERDICT_STYLE[report.verdict]}`}
            >
              <div className="text-[11px] uppercase tracking-wide opacity-80">
                Drift score
              </div>
              <div className="mt-1 text-3xl font-semibold">{report.driftScore}</div>
              <div className="mt-1 text-xs">{VERDICT_LABEL[report.verdict]}</div>
            </div>
            <MetricCard
              label="Steps added / removed"
              value={`+${report.addedCount} / -${report.removedCount}`}
              accent={report.addedCount + report.removedCount > 0}
            />
            <MetricCard
              label="Cost delta"
              value={`${report.costDeltaUsd >= 0 ? "+" : ""}${fmtCost(report.costDeltaUsd)} (${report.costDeltaPct.toFixed(0)}%)`}
              accent={Math.abs(report.costDeltaPct) > 20}
            />
            <MetricCard
              label="Duration delta"
              value={`${report.durationDeltaMs >= 0 ? "+" : ""}${(report.durationDeltaMs / 1000).toFixed(1)}s (${report.durationDeltaPct.toFixed(0)}%)`}
              accent={Math.abs(report.durationDeltaPct) > 20}
            />
          </section>

          <section className="glass rounded-2xl border border-white/5 shadow-card">
            <div className="border-b border-white/5 px-5 py-4">
              <h2 className="text-sm font-medium">Step-by-step diff</h2>
            </div>
            <div className="divide-y divide-white/5">
              {report.rows.map((row, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm ${
                    row.type === "added"
                      ? "bg-ok/[0.06]"
                      : row.type === "removed"
                        ? "bg-danger/[0.06]"
                        : ""
                  }`}
                >
                  <span
                    className={`w-4 shrink-0 font-mono text-xs ${
                      row.type === "added"
                        ? "text-ok"
                        : row.type === "removed"
                          ? "text-danger"
                          : "text-muted"
                    }`}
                  >
                    {row.type === "added" ? "+" : row.type === "removed" ? "−" : "·"}
                  </span>
                  <span className="flex-1 truncate">
                    {row.after?.name ?? row.before?.name}
                  </span>
                  {row.type === "same" && row.before && row.after && (
                    <span
                      className={`text-xs ${
                        row.after.durationMs > row.before.durationMs * 1.3
                          ? "text-warn"
                          : "text-muted"
                      }`}
                    >
                      {row.before.durationMs}ms → {row.after.durationMs}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {(!before || !after) && summaries.length > 0 && (
        <div className="glass flex items-center gap-2 rounded-2xl border border-white/5 p-6 text-sm text-muted">
          <IconAlert className="h-4 w-4" />
          Pick two traces above to diff them.
        </div>
      )}
    </main>
  );
}

function TraceSelect({
  label,
  value,
  onChange,
  summaries,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  summaries: TraceSummary[];
}) {
  return (
    <div className="glass rounded-2xl border border-white/5 p-4">
      <div className="mb-2 text-xs uppercase tracking-wide text-muted">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm outline-none focus:border-accent/50"
      >
        <option value="">Select a trace…</option>
        {summaries.map((s) => (
          <option key={s.id} value={s.id}>
            {s.agentName} · {s.id}
          </option>
        ))}
      </select>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-2xl border border-white/5 p-5 shadow-card">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${accent ? "text-accent2" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
