import { Trace } from "@/lib/types";

const TYPE_COLOR: Record<string, string> = {
  llm_call: "bg-accent",
  tool_call: "bg-sky-400",
};

export function TraceTimeline({ trace }: { trace: Trace }) {
  const traceStart = new Date(trace.startedAt).getTime();
  const totalDuration = Math.max(
    trace.steps.reduce((max, s) => {
      const offset = new Date(s.startedAt).getTime() - traceStart;
      return Math.max(max, offset + s.durationMs);
    }, 1),
    1,
  );

  return (
    <div className="space-y-2">
      {trace.steps.map((step, i) => {
        const offset = new Date(step.startedAt).getTime() - traceStart;
        const leftPct = (offset / totalDuration) * 100;
        const widthPct = Math.max((step.durationMs / totalDuration) * 100, 1.5);

        return (
          <div key={step.id} className="flex items-center gap-3 text-sm">
            <div className="w-40 shrink-0 truncate text-muted" title={step.name}>
              {i + 1}. {step.name}
            </div>
            <div className="relative h-5 flex-1 rounded bg-black/30">
              <div
                className={`absolute top-0 h-5 rounded ${
                  step.error ? "bg-danger" : TYPE_COLOR[step.type] ?? "bg-accent"
                }`}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                title={`${step.durationMs}ms`}
              />
            </div>
            <div className="w-20 shrink-0 text-right text-xs text-muted">
              {step.durationMs}ms
            </div>
            <div className="w-24 shrink-0 text-right text-xs text-muted">
              {step.tokens > 0 ? `${step.tokens} tok` : "—"}
            </div>
            <div className="w-16 shrink-0 text-right text-xs text-muted">
              ${step.costUsd.toFixed(3)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
