import { Anomaly, Trace } from "./types";

const COST_SPIKE_THRESHOLD_USD = 0.5;
const LATENCY_THRESHOLD_MS = 4000;
const LOOP_REPEAT_THRESHOLD = 3;

export function detectAnomalies(trace: Trace): Anomaly[] {
  const anomalies: Anomaly[] = [];

  let repeatCount = 1;
  for (let i = 1; i < trace.steps.length; i++) {
    if (trace.steps[i].name === trace.steps[i - 1].name) {
      repeatCount++;
      if (repeatCount === LOOP_REPEAT_THRESHOLD) {
        anomalies.push({
          type: "loop",
          message: `"${trace.steps[i].name}" step repeated ${repeatCount}+ times in a row — possible infinite loop`,
          severity: "danger",
        });
      }
    } else {
      repeatCount = 1;
    }
  }

  const totalCost = trace.steps.reduce((sum, s) => sum + s.costUsd, 0);
  if (totalCost > COST_SPIKE_THRESHOLD_USD) {
    anomalies.push({
      type: "cost_spike",
      message: `Trace cost $${totalCost.toFixed(2)} exceeds budget threshold of $${COST_SPIKE_THRESHOLD_USD.toFixed(2)}`,
      severity: "warn",
    });
  }

  const slowStep = trace.steps.find((s) => s.durationMs > LATENCY_THRESHOLD_MS);
  if (slowStep) {
    anomalies.push({
      type: "latency",
      message: `"${slowStep.name}" took ${(slowStep.durationMs / 1000).toFixed(1)}s — above ${LATENCY_THRESHOLD_MS / 1000}s threshold`,
      severity: "warn",
    });
  }

  const erroredStep = trace.steps.find((s) => s.error);
  if (erroredStep) {
    anomalies.push({
      type: "error",
      message: `"${erroredStep.name}" failed: ${erroredStep.error}`,
      severity: "danger",
    });
  }

  return anomalies;
}
