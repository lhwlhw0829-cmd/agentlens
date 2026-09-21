"""Runnable demo: a toy agent instrumented with the AgentLens SDK.

Simulates a "code review agent" that gets stuck repeatedly calling the same
tool (a common real-world agent failure mode) so you can see AgentLens flag
it as a loop anomaly on the dashboard.

Usage:
    python demo/sample_agent.py                # logs locally to agentlens_traces.jsonl
    AGENTLENS_ENDPOINT=http://localhost:3000/api/traces python demo/sample_agent.py
"""

import os
import random
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sdk"))

from agentlens import Tracer  # noqa: E402


def fake_llm_call(prompt: str) -> tuple[str, int]:
    time.sleep(random.uniform(0.05, 0.2))
    tokens = random.randint(200, 900)
    return f"response to: {prompt[:20]}", tokens


def run_normal_trace(tracer: Tracer) -> None:
    with tracer.trace() as trace:
        with trace.step("classify_intent", type="llm_call") as step:
            _, tokens = fake_llm_call("classify this support ticket")
            step.tokens = tokens
            step.cost_usd = tokens * 0.00001

        with trace.step("lookup_customer", type="tool_call"):
            time.sleep(0.1)

        with trace.step("draft_reply", type="llm_call") as step:
            _, tokens = fake_llm_call("draft a reply")
            step.tokens = tokens
            step.cost_usd = tokens * 0.00001

        with trace.step("send_reply", type="tool_call"):
            time.sleep(0.15)

    print(f"[ok] normal trace {trace.id} finished with status={trace.status}")


def run_looping_trace(tracer: Tracer) -> None:
    with tracer.trace() as trace:
        with trace.step("fetch_diff", type="tool_call"):
            time.sleep(0.1)

        # Simulate an agent stuck re-issuing the same tool call because the
        # underlying task never converges — this is exactly the failure mode
        # AgentLens' loop detector is built to catch.
        for _ in range(4):
            with trace.step("search_codebase", type="tool_call"):
                time.sleep(0.1)

    print(f"[ok] looping trace {trace.id} finished with status={trace.status}")


if __name__ == "__main__":
    endpoint = os.environ.get("AGENTLENS_ENDPOINT")
    tracer = Tracer(agent_name="code-review-agent", endpoint=endpoint)

    run_normal_trace(tracer)
    run_looping_trace(tracer)

    if not endpoint:
        print(
            "\nNo AGENTLENS_ENDPOINT set — traces were appended to "
            "agentlens_traces.jsonl. Start the dashboard (cd web && npm run dev) "
            "and re-run with AGENTLENS_ENDPOINT=http://localhost:3000/api/traces "
            "to see them live."
        )
