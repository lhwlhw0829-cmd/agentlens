"""Lightweight tracer for instrumenting LLM/agent calls.

Usage:

    from agentlens import Tracer

    tracer = Tracer(agent_name="support-ticket-router", endpoint="http://localhost:3000/api/traces")

    with tracer.trace() as trace:
        with trace.step("classify_intent", type="llm_call") as step:
            result = call_my_llm(...)
            step.tokens = result.usage.total_tokens
            step.cost_usd = result.usage.total_tokens * 0.00001

        with trace.step("send_reply", type="tool_call"):
            send_reply(...)

Traces are buffered in memory and flushed (POSTed as JSON) to the AgentLens
API when the `with tracer.trace()` block exits. If no endpoint is configured,
traces are written to a local JSONL file instead so you can inspect them
without running the dashboard.
"""

from __future__ import annotations

import json
import time
import uuid
import contextlib
import dataclasses
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

try:
    import requests  # type: ignore
except ImportError:  # pragma: no cover - requests is an optional dependency
    requests = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclasses.dataclass
class Step:
    id: str
    name: str
    type: str
    started_at: str
    duration_ms: int = 0
    tokens: int = 0
    cost_usd: float = 0.0
    input: Optional[str] = None
    output: Optional[str] = None
    error: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "startedAt": self.started_at,
            "durationMs": self.duration_ms,
            "tokens": self.tokens,
            "costUsd": self.cost_usd,
            "input": self.input,
            "output": self.output,
            "error": self.error,
        }


class StepContext:
    def __init__(self, step: Step):
        self._step = step
        self._start_perf = time.perf_counter()

    @property
    def tokens(self) -> int:
        return self._step.tokens

    @tokens.setter
    def tokens(self, value: int) -> None:
        self._step.tokens = value

    @property
    def cost_usd(self) -> float:
        return self._step.cost_usd

    @cost_usd.setter
    def cost_usd(self, value: float) -> None:
        self._step.cost_usd = value

    @property
    def output(self) -> Optional[str]:
        return self._step.output

    @output.setter
    def output(self, value: str) -> None:
        self._step.output = value

    def _finish(self, error: Optional[str] = None) -> Step:
        self._step.duration_ms = int((time.perf_counter() - self._start_perf) * 1000)
        if error:
            self._step.error = error
        return self._step


class Trace:
    def __init__(self, agent_name: str, trace_id: Optional[str] = None):
        self.id = trace_id or f"trace_{uuid.uuid4().hex[:10]}"
        self.agent_name = agent_name
        self.started_at = _now_iso()
        self.ended_at: Optional[str] = None
        self.status = "running"
        self.steps: list[Step] = []

    @contextlib.contextmanager
    def step(self, name: str, type: str = "tool_call", input: Optional[str] = None):
        step = Step(
            id=f"step_{uuid.uuid4().hex[:8]}",
            name=name,
            type=type,
            started_at=_now_iso(),
            input=input,
        )
        ctx = StepContext(step)
        try:
            yield ctx
            ctx._finish()
        except Exception as exc:  # noqa: BLE001 - deliberately broad, re-raised below
            ctx._finish(error=str(exc))
            self.steps.append(step)
            raise
        else:
            self.steps.append(step)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "agentName": self.agent_name,
            "startedAt": self.started_at,
            "endedAt": self.ended_at,
            "status": self.status,
            "steps": [s.to_dict() for s in self.steps],
        }


class Tracer:
    def __init__(
        self,
        agent_name: str,
        endpoint: Optional[str] = None,
        local_log_path: str = "agentlens_traces.jsonl",
        timeout_s: float = 3.0,
    ):
        self.agent_name = agent_name
        self.endpoint = endpoint
        self.local_log_path = Path(local_log_path)
        self.timeout_s = timeout_s

    @contextlib.contextmanager
    def trace(self, trace_id: Optional[str] = None):
        trace = Trace(agent_name=self.agent_name, trace_id=trace_id)
        try:
            yield trace
            trace.status = "success"
        except Exception:
            trace.status = "error"
            raise
        finally:
            trace.ended_at = _now_iso()
            self._flush(trace)

    def _flush(self, trace: Trace) -> None:
        payload = trace.to_dict()

        if self.endpoint and requests is not None:
            try:
                requests.post(self.endpoint, json=payload, timeout=self.timeout_s)
                return
            except Exception:  # noqa: BLE001 - fall back to local log on network errors
                pass

        with self.local_log_path.open("a") as f:
            f.write(json.dumps(payload) + "\n")
