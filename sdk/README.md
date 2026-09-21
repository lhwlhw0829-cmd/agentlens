# agentlens (Python SDK)

Minimal instrumentation SDK for the [AgentLens](../README.md) dashboard. Wrap
your existing agent/LLM calls with a couple of context managers and get
traces, per-step cost/latency, and automatic anomaly detection (loops, cost
spikes, slow steps, errors) for free.

## Install

```bash
pip install -e ./sdk
```

## Usage

```python
from agentlens import Tracer

tracer = Tracer(
    agent_name="support-ticket-router",
    endpoint="http://localhost:3000/api/traces",  # AgentLens dashboard ingest URL
)

with tracer.trace() as trace:
    with trace.step("classify_intent", type="llm_call") as step:
        result = call_my_llm(prompt)
        step.tokens = result.usage.total_tokens
        step.cost_usd = result.usage.total_tokens * 0.00001

    with trace.step("send_reply", type="tool_call"):
        send_reply(result.text)
```

If `endpoint` is omitted (or unreachable), traces are appended as JSON lines
to `agentlens_traces.jsonl` instead, so you can inspect them without running
the dashboard.
