import { Trace, TraceSummary } from "./types";
import { detectAnomalies } from "./anomaly";

// In-memory store for the demo. Serverless functions may reset this between
// cold starts, which is fine for a hackathon demo since seedTraces() always
// repopulates baseline data. For a real deployment, swap this module's
// functions for calls to Postgres/Supabase — the API route contracts
// (GET/POST /api/traces) stay the same.
const traces: Map<string, Trace> = new Map();

function seedTraces() {
  if (traces.size > 0) return;

  const now = Date.now();

  const normal: Trace = {
    id: "trace_normal_01",
    agentName: "support-ticket-router",
    startedAt: new Date(now - 1000 * 60 * 12).toISOString(),
    endedAt: new Date(now - 1000 * 60 * 12 + 3200).toISOString(),
    status: "success",
    steps: [
      { id: "s1", name: "classify_intent", type: "llm_call", startedAt: new Date(now - 1000 * 60 * 12).toISOString(), durationMs: 620, tokens: 340, costUsd: 0.004 },
      { id: "s2", name: "lookup_customer", type: "tool_call", startedAt: new Date(now - 1000 * 60 * 12 + 620).toISOString(), durationMs: 210, tokens: 0, costUsd: 0 },
      { id: "s3", name: "draft_reply", type: "llm_call", startedAt: new Date(now - 1000 * 60 * 12 + 830).toISOString(), durationMs: 1400, tokens: 890, costUsd: 0.011 },
      { id: "s4", name: "send_reply", type: "tool_call", startedAt: new Date(now - 1000 * 60 * 12 + 2230).toISOString(), durationMs: 970, tokens: 0, costUsd: 0 },
    ],
  };

  const loop: Trace = {
    id: "trace_loop_02",
    agentName: "code-review-agent",
    startedAt: new Date(now - 1000 * 60 * 40).toISOString(),
    endedAt: new Date(now - 1000 * 60 * 40 + 9800).toISOString(),
    status: "error",
    steps: [
      { id: "s1", name: "fetch_diff", type: "tool_call", startedAt: new Date(now - 1000 * 60 * 40).toISOString(), durationMs: 300, tokens: 0, costUsd: 0 },
      { id: "s2", name: "search_codebase", type: "tool_call", startedAt: new Date(now - 1000 * 60 * 40 + 300).toISOString(), durationMs: 450, tokens: 0, costUsd: 0.001 },
      { id: "s3", name: "search_codebase", type: "tool_call", startedAt: new Date(now - 1000 * 60 * 40 + 750).toISOString(), durationMs: 460, tokens: 0, costUsd: 0.001 },
      { id: "s4", name: "search_codebase", type: "tool_call", startedAt: new Date(now - 1000 * 60 * 40 + 1210).toISOString(), durationMs: 455, tokens: 0, costUsd: 0.001 },
      { id: "s5", name: "search_codebase", type: "tool_call", startedAt: new Date(now - 1000 * 60 * 40 + 1665).toISOString(), durationMs: 470, tokens: 0, costUsd: 0.001, error: "tool call repeated without new arguments" },
    ],
  };

  const costSpike: Trace = {
    id: "trace_cost_03",
    agentName: "doc-rag-assistant",
    startedAt: new Date(now - 1000 * 60 * 5).toISOString(),
    endedAt: new Date(now - 1000 * 60 * 5 + 6100).toISOString(),
    status: "success",
    steps: [
      { id: "s1", name: "embed_query", type: "llm_call", startedAt: new Date(now - 1000 * 60 * 5).toISOString(), durationMs: 180, tokens: 60, costUsd: 0.001 },
      { id: "s2", name: "vector_search", type: "tool_call", startedAt: new Date(now - 1000 * 60 * 5 + 180).toISOString(), durationMs: 90, tokens: 0, costUsd: 0 },
      { id: "s3", name: "summarize_context", type: "llm_call", startedAt: new Date(now - 1000 * 60 * 5 + 270).toISOString(), durationMs: 5200, tokens: 42000, costUsd: 0.63 },
      { id: "s4", name: "final_answer", type: "llm_call", startedAt: new Date(now - 1000 * 60 * 5 + 5470).toISOString(), durationMs: 630, tokens: 1100, costUsd: 0.014 },
    ],
  };

  const running: Trace = {
    id: "trace_running_04",
    agentName: "issue-triage-agent",
    startedAt: new Date(now - 1000 * 15).toISOString(),
    status: "running",
    steps: [
      { id: "s1", name: "fetch_issue", type: "tool_call", startedAt: new Date(now - 1000 * 15).toISOString(), durationMs: 240, tokens: 0, costUsd: 0 },
      { id: "s2", name: "classify_priority", type: "llm_call", startedAt: new Date(now - 1000 * 15 + 240).toISOString(), durationMs: 810, tokens: 410, costUsd: 0.005 },
    ],
  };

  for (const t of [normal, loop, costSpike, running]) {
    traces.set(t.id, t);
  }
}

export function listTraceSummaries(): TraceSummary[] {
  seedTraces();
  return Array.from(traces.values())
    .map(toSummary)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function getTrace(id: string): Trace | undefined {
  seedTraces();
  return traces.get(id);
}

export function ingestTrace(trace: Trace): void {
  seedTraces();
  traces.set(trace.id, trace);
}

function toSummary(trace: Trace): TraceSummary {
  const totalTokens = trace.steps.reduce((sum, s) => sum + s.tokens, 0);
  const totalCostUsd = trace.steps.reduce((sum, s) => sum + s.costUsd, 0);
  const durationMs = trace.endedAt
    ? new Date(trace.endedAt).getTime() - new Date(trace.startedAt).getTime()
    : Date.now() - new Date(trace.startedAt).getTime();

  return {
    id: trace.id,
    agentName: trace.agentName,
    startedAt: trace.startedAt,
    status: trace.status,
    durationMs,
    totalTokens,
    totalCostUsd,
    stepCount: trace.steps.length,
    anomalies: detectAnomalies(trace),
  };
}
