"use client";

import { useMemo, useState } from "react";
import { TraceSummary } from "@/lib/types";
import { fmtCost } from "@/lib/format";

export function CostProjection({ summaries }: { summaries: TraceSummary[] }) {
  const [dailyVolume, setDailyVolume] = useState(5000);

  const avgCostPerTrace = useMemo(() => {
    if (summaries.length === 0) return 0;
    return summaries.reduce((s, t) => s + t.totalCostUsd, 0) / summaries.length;
  }, [summaries]);

  const projectedMonthly = avgCostPerTrace * dailyVolume * 30;
  const projectedYearly = projectedMonthly * 12;

  return (
    <div className="glass rounded-2xl border border-white/5 p-5 shadow-card">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-medium">Cost projection</h2>
        <span className="text-xs text-muted">what-if, based on avg. cost/trace</span>
      </div>
      <p className="mb-4 text-xs text-muted">
        Answers the question finance always asks after a demo: &ldquo;what does
        this cost at scale?&rdquo;
      </p>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted">Estimated traces / day</span>
          <span className="font-medium text-white">{dailyVolume.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={100}
          max={200000}
          step={100}
          value={dailyVolume}
          onChange={(e) => setDailyVolume(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/5 bg-black/30 p-3">
          <div className="text-[11px] uppercase text-muted">Projected / month</div>
          <div className="mt-1 bg-gradient-to-br from-accent2 to-accent bg-clip-text text-xl font-semibold text-transparent">
            {fmtCost(projectedMonthly)}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/30 p-3">
          <div className="text-[11px] uppercase text-muted">Projected / year</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {fmtCost(projectedYearly)}
          </div>
        </div>
      </div>
    </div>
  );
}
