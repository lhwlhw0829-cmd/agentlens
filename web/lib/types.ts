export type StepType = "llm_call" | "tool_call";

export type Step = {
  id: string;
  name: string;
  type: StepType;
  startedAt: string;
  durationMs: number;
  tokens: number;
  costUsd: number;
  input?: string;
  output?: string;
  error?: string;
};

export type TraceStatus = "success" | "error" | "running";

export type Trace = {
  id: string;
  agentName: string;
  startedAt: string;
  endedAt?: string;
  status: TraceStatus;
  steps: Step[];
};

export type Anomaly = {
  type: "loop" | "cost_spike" | "latency" | "error";
  message: string;
  severity: "warn" | "danger";
};

export type TraceSummary = {
  id: string;
  agentName: string;
  startedAt: string;
  status: TraceStatus;
  durationMs: number;
  totalTokens: number;
  totalCostUsd: number;
  stepCount: number;
  anomalies: Anomaly[];
};
