export type GuardrailRule = {
  id: string;
  name: string;
  description: string;
  category: "pii" | "injection" | "tool" | "budget";
  enabled: boolean;
  action: "flag" | "block";
};

export const DEFAULT_RULES: GuardrailRule[] = [
  {
    id: "pii-email-ssn",
    name: "PII leak detection",
    description:
      "Scans tool inputs/outputs for emails, SSNs, credit card numbers, and phone numbers before they leave the agent.",
    category: "pii",
    enabled: true,
    action: "block",
  },
  {
    id: "prompt-injection",
    name: "Prompt injection guard",
    description:
      'Flags tool/document content containing instruction-like text ("ignore previous instructions", role overrides, etc.) before it reaches the model.',
    category: "injection",
    enabled: true,
    action: "flag",
  },
  {
    id: "denied-tools",
    name: "Denylisted tool calls",
    description:
      "Blocks calls to tools outside an explicit allowlist per agent (e.g. prevent a support bot from calling delete_database).",
    category: "tool",
    enabled: true,
    action: "block",
  },
  {
    id: "budget-cap",
    name: "Per-trace budget cap",
    description:
      "Kills a trace once its cumulative cost crosses a hard budget ceiling, instead of only flagging it after the fact.",
    category: "budget",
    enabled: false,
    action: "block",
  },
  {
    id: "loop-cutoff",
    name: "Loop auto-cutoff",
    description:
      "Terminates a run automatically once the same tool call repeats past the loop-detection threshold, instead of waiting for a human to notice.",
    category: "tool",
    enabled: false,
    action: "block",
  },
];
