"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { TraceTimeline } from "@/components/TraceTimeline";
import { Trace, TraceSummary } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  success: "text-accent",
  error: "text-danger",
  running: "text-warn",
};

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<TraceSummary[]>([]);
  const [selected, setSelected] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(true);

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

  const totalCost = summaries.reduce((s, t) => s + t.totalCostUsd, 0);
  const totalTraces = summaries.length;
  const anomalyCount = summaries.reduce((s, t) => s + t.anomalies.length, 0);
  const avgDuration =
    summaries.length > 0
      ? summaries.reduce((s, t) => s + t.durationMs, 0) / summaries.length
      : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AgentLens</h1>
          <p className="text-sm text-muted">
            Production observability &amp; guardrails for LLM agents
          </p>
        </div>
        <a
          href="https://github.com/"
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-white"
        >
          View on GitHub
        </a>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Traces (24h)" value={String(totalTraces)} />
        <StatCard
          label="Total cost"
          value={`$${totalCost.toFixed(2)}`}
          hint="across all traced agents"
        />
        <StatCard
          label="Avg. duration"
          value={`${(avgDuration / 1000).toFixed(1)}s`}
        />
        <StatCard
          label="Anomalies flagged"
          value={String(anomalyCount)}
          hint="loops, cost spikes, errors"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-muted">Recent traces</h2>
          <div className="space-y-2">
            {loading && (
              <div className="text-sm text-muted">Loading traces…</div>
            )}
            {summaries.map((t) => (
              <button
                key={t.id}
                onClick={() => openTrace(t.id)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selected?.id === t.id
                    ? "border-accent bg-panel"
                    : "border-border bg-panel hover:border-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.agentName}</span>
                  <span className={`text-xs ${STATUS_STYLE[t.status]}`}>
                    {t.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                  <span>{t.stepCount} steps</span>
                  <span>{(t.durationMs / 1000).toFixed(1)}s</span>
                  <span>${t.totalCostUsd.toFixed(3)}</span>
                </div>
                {t.anomalies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
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
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-medium text-muted">Trace detail</h2>
          {!selected && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
              Select a trace to see its step-by-step timeline, tool calls, and
              flagged anomalies.
            </div>
          )}
          {selected && (
            <div className="rounded-lg border border-border bg-panel p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{selected.agentName}</div>
                  <div className="text-xs text-muted">{selected.id}</div>
                </div>
                <span className={`text-sm ${STATUS_STYLE[selected.status]}`}>
                  {selected.status}
                </span>
              </div>
              <TraceTimeline trace={selected} />
            </div>
          )}
        </div>
      </section>

      <footer className="mt-12 border-t border-border pt-6 text-xs text-muted">
        Demo data shown above ships with the repo so the dashboard is
        meaningful on first load. Instrument your own agent with the Python
        SDK (<code>sdk/agentlens</code>) and POST traces to{" "}
        <code>/api/traces</code> to see live data.
      </footer>
    </main>
  );
}
