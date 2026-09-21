# AgentLens

**Live demo:** https://web-three-pi-34.vercel.app

**Production observability and guardrails for LLM agents.** Instrument any
agent with a two-line SDK wrapper and get a live dashboard of every step,
tool call, token spent, and — critically — automatic detection of the
failure modes that plague deployed LLM agents: infinite tool-call loops,
cost spikes, latency blowups, and silent errors.

> Not another chatbot wrapper. Teams don't need help *asking* an LLM a
> question — they need to know what their AI agents are doing *after* they
> ship them into production. That's an infrastructure problem, not a prompt
> problem, and it's the same gap products like LangSmith, Langfuse, and
> Datadog's LLM Observability are being built (and sold) to close.

## The headline feature: Regression Diff

Every observability tool shows you *one* trace at a time. The question that
actually keeps engineers up at night is different: **"I changed the prompt
(or swapped models, or tweaked a tool) — did I just break this agent?"**

AgentLens diffs two traces from the same agent — before/after a change —
and computes:
- a **step-by-step diff** (added/removed/reordered tool calls, LCS-based)
- **cost and latency delta** between the two runs
- a single **drift score (0–100)** with a stable / moderate / high verdict

This reframes the product from "a dashboard" to **CI for agent behavior** —
the same instinct as a diff/regression test suite, applied to something
that's normally opaque. See it at [`/compare`](web/app/compare/page.tsx).

## Why this exists

As of 2026, most engineering teams have at least one LLM agent running in
production (a support bot, a code reviewer, an internal assistant) — and
almost none of them can answer basic questions about it:

- Which runs are looping and burning tokens without making progress?
- Which agent/model combination is quietly blowing the monthly budget?
- What exactly happened, step by step, on the run that a customer complained
  about?

AgentLens answers all three from one lightweight dashboard, with an SDK
designed to be dropped into an existing agent in minutes, not days.

## How it works

```
┌─────────────────┐     POST /api/traces      ┌──────────────────────┐
│  Your AI agent   │ ─────────────────────────▶│   AgentLens web app   │
│ (any framework)  │   {steps, tokens, cost}    │  (Next.js, on Vercel) │
│                  │                            │                      │
│ + agentlens SDK  │                            │  • trace timeline     │
│   (2-line wrap)  │                            │  • cost dashboard     │
└─────────────────┘                            │  • anomaly detector   │
                                                 │  • (roadmap) guardrails│
                                                 └──────────────────────┘
```

- **`sdk/`** — a Python package (`agentlens`) that wraps your existing LLM
  and tool calls with context managers, capturing duration/tokens/cost per
  step and POSTing the finished trace to the dashboard.
- **`web/`** — a Next.js dashboard (deployable to Vercel with one click)
  that ingests traces, renders a per-step timeline, and runs rule-based
  anomaly detection (loop detection, cost thresholds, latency thresholds,
  error surfacing).
- **`demo/`** — a runnable toy agent that produces both a normal trace and a
  deliberately looping trace, so you can see the anomaly detector fire
  end-to-end without wiring up a real LLM.

## Quickstart

### 1. Run the dashboard

```bash
cd web
npm install
npm run dev
# open http://localhost:3000 — ships with seed data so it's meaningful immediately
```

### 2. Install the SDK and run the demo agent

```bash
pip install -e ./sdk
AGENTLENS_ENDPOINT=http://localhost:3000/api/traces python demo/sample_agent.py
```

Refresh the dashboard — you'll see the new traces appear, including the
looping one flagged with a `loop` anomaly badge.

### 3. Instrument your own agent

```python
from agentlens import Tracer

tracer = Tracer(agent_name="my-agent", endpoint="https://your-deployment.vercel.app/api/traces")

with tracer.trace() as trace:
    with trace.step("call_llm", type="llm_call") as step:
        result = my_llm_call(prompt)
        step.tokens = result.usage.total_tokens
        step.cost_usd = result.usage.total_tokens * 0.00001
```

See [`sdk/README.md`](sdk/README.md) for full SDK docs.

## Deploy the dashboard to Vercel

```bash
cd web
npx vercel deploy
```

The API routes (`app/api/traces/route.ts`) use an in-memory store seeded
with demo data, which is enough for a hackathon demo or portfolio deploy out
of the box. For persistent multi-user data, swap `web/lib/store.ts` for a
Postgres-backed implementation (e.g. Vercel Postgres or Supabase) — the
`GET`/`POST /api/traces` contracts don't need to change.

## Anomaly detection (v0.1, rule-based)

| Type | Trigger |
|---|---|
| `loop` | Same step name repeated 3+ times consecutively in one trace |
| `cost_spike` | Trace cost exceeds a configurable budget threshold |
| `latency` | Any single step exceeds a configurable duration threshold |
| `error` | Any step reports an error |

## Feature map

| Page | What it does |
|---|---|
| `/` Overview | Cost trend chart, live alert feed, cost-at-scale projection calculator, filterable trace table, slide-over trace inspector |
| `/compare` | **Regression Diff** — pick two traces, get a step diff + cost/latency delta + drift score |
| `/guardrails` | Working rule engine UI (not just a mock): toggle PII detection, prompt-injection guarding, tool denylists, budget caps, and loop auto-cutoff; each rule can flag or hard-block |

## Roadmap

- Wire the guardrail rules UI to the SDK so toggles actually gate
  `trace.step()` calls at runtime, not just annotate traces after the fact
- Persistent storage adapter (Postgres/Supabase) with multi-tenant API keys
- Slack/webhook alerting on anomaly detection
- Statistical (not just threshold-based) anomaly detection once enough
  historical traces are collected per agent

## License

MIT — see [LICENSE](LICENSE).
