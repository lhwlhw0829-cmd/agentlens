import { Step, Trace } from "./types";

export type DiffRow = {
  type: "same" | "added" | "removed" | "changed";
  before?: Step;
  after?: Step;
};

// Classic LCS-based sequence diff over step names, adapted for small traces
// (agent traces are typically 2-15 steps, so an O(n*m) table is fine).
export function diffSteps(before: Step[], after: Step[]): DiffRow[] {
  const n = before.length;
  const m = after.length;
  const table: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] =
        before[i].name === after[j].name
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (before[i].name === after[j].name) {
      rows.push({ type: "same", before: before[i], after: after[j] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({ type: "removed", before: before[i] });
      i++;
    } else {
      rows.push({ type: "added", after: after[j] });
      j++;
    }
  }
  while (i < n) rows.push({ type: "removed", before: before[i++] });
  while (j < m) rows.push({ type: "added", after: after[j++] });

  return rows;
}

export type DriftReport = {
  rows: DiffRow[];
  addedCount: number;
  removedCount: number;
  sameCount: number;
  costDeltaUsd: number;
  costDeltaPct: number;
  durationDeltaMs: number;
  durationDeltaPct: number;
  driftScore: number; // 0-100
  verdict: "stable" | "moderate" | "high";
};

function traceCost(t: Trace) {
  return t.steps.reduce((s, st) => s + st.costUsd, 0);
}

function traceDuration(t: Trace) {
  if (!t.endedAt) return 0;
  return new Date(t.endedAt).getTime() - new Date(t.startedAt).getTime();
}

export function computeDrift(before: Trace, after: Trace): DriftReport {
  const rows = diffSteps(before.steps, after.steps);
  const addedCount = rows.filter((r) => r.type === "added").length;
  const removedCount = rows.filter((r) => r.type === "removed").length;
  const sameCount = rows.filter((r) => r.type === "same").length;

  const costBefore = traceCost(before);
  const costAfter = traceCost(after);
  const costDeltaUsd = costAfter - costBefore;
  const costDeltaPct = costBefore > 0 ? (costDeltaUsd / costBefore) * 100 : 0;

  const durBefore = traceDuration(before);
  const durAfter = traceDuration(after);
  const durationDeltaMs = durAfter - durBefore;
  const durationDeltaPct = durBefore > 0 ? (durationDeltaMs / durBefore) * 100 : 0;

  const maxSteps = Math.max(before.steps.length, after.steps.length, 1);
  const structuralDrift = ((addedCount + removedCount) / (maxSteps * 2)) * 100;
  const costDrift = Math.min(Math.abs(costDeltaPct), 100);
  const latencyDrift = Math.min(Math.abs(durationDeltaPct), 100);

  const driftScore = Math.round(
    structuralDrift * 0.55 + costDrift * 0.25 + latencyDrift * 0.2,
  );

  const verdict: DriftReport["verdict"] =
    driftScore >= 40 ? "high" : driftScore >= 15 ? "moderate" : "stable";

  return {
    rows,
    addedCount,
    removedCount,
    sameCount,
    costDeltaUsd,
    costDeltaPct,
    durationDeltaMs,
    durationDeltaPct,
    driftScore: Math.min(driftScore, 100),
    verdict,
  };
}
