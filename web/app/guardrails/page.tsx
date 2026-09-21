"use client";

import { useEffect, useState } from "react";
import { IconShield } from "@/components/icons";
import { DEFAULT_RULES, GuardrailRule } from "@/lib/guardrails";

const CATEGORY_LABEL: Record<string, string> = {
  pii: "Data leak",
  injection: "Prompt injection",
  tool: "Tool access",
  budget: "Cost control",
};

const STORAGE_KEY = "agentlens_guardrail_rules";

export default function GuardrailsPage() {
  const [rules, setRules] = useState<GuardrailRule[]>(DEFAULT_RULES);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRules(JSON.parse(raw));
    } catch {
      // ignore malformed/inaccessible storage, fall back to defaults
    }
  }, []);

  function persist(next: GuardrailRule[]) {
    setRules(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      // best-effort only — storage may be unavailable (private mode, etc.)
    }
  }

  function toggleRule(id: string) {
    persist(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  function setAction(id: string, action: GuardrailRule["action"]) {
    persist(rules.map((r) => (r.id === id ? { ...r, action } : r)));
  }

  const activeCount = rules.filter((r) => r.enabled).length;
  const blockingCount = rules.filter((r) => r.enabled && r.action === "block").length;

  return (
    <main className="mx-auto max-w-4xl px-8 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted">
          <IconShield className="h-4 w-4" />
          Guardrails
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Runtime guardrail rules
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          These rules run inline, before a tool call or LLM output leaves the
          agent — not after the fact. Toggle a rule on to have the SDK
          evaluate it on every step; set it to <strong>block</strong> to stop
          the step, or <strong>flag</strong> to let it through but surface it
          as an anomaly on the trace.
        </p>
      </header>

      <div className="mb-6 flex gap-4 text-sm">
        <div className="rounded-lg border border-border bg-panel px-4 py-3">
          <div className="text-xs text-muted">Active rules</div>
          <div className="text-xl font-semibold">
            {activeCount}
            <span className="text-sm text-muted">/{rules.length}</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-panel px-4 py-3">
          <div className="text-xs text-muted">Blocking</div>
          <div className="text-xl font-semibold text-danger">{blockingCount}</div>
        </div>
        {savedAt && (
          <div className="flex items-center text-xs text-muted">
            Saved locally at {savedAt}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`rounded-xl border p-4 transition ${
              rule.enabled ? "border-border bg-panel" : "border-border/50 bg-panel/40"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                    {CATEGORY_LABEL[rule.category]}
                  </span>
                  <span className="font-medium">{rule.name}</span>
                </div>
                <p className="mt-1.5 max-w-xl text-xs text-muted">
                  {rule.description}
                </p>
              </div>

              <button
                onClick={() => toggleRule(rule.id)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  rule.enabled ? "bg-accent" : "bg-white/10"
                }`}
                aria-pressed={rule.enabled}
                aria-label={`Toggle ${rule.name}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-bg transition-transform ${
                    rule.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {rule.enabled && (
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs">
                <span className="text-muted">On violation:</span>
                {(["flag", "block"] as const).map((action) => (
                  <button
                    key={action}
                    onClick={() => setAction(rule.id, action)}
                    className={`rounded-md border px-2.5 py-1 capitalize transition ${
                      rule.action === action
                        ? action === "block"
                          ? "border-danger/50 bg-danger/10 text-danger"
                          : "border-warn/50 bg-warn/10 text-warn"
                        : "border-border text-muted hover:text-white"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-border p-4 text-xs text-muted">
        Rules configured here are saved to your browser for this demo. In the
        production build, this maps to a rules table keyed by API key /
        agent, evaluated inside the SDK's <code>trace.step()</code> context
        manager before <code>yield</code> returns control to your code — see{" "}
        <code>sdk/agentlens/tracer.py</code>.
      </div>
    </main>
  );
}
