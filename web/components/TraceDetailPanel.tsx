"use client";

import { Trace } from "@/lib/types";
import { TraceTimeline } from "./TraceTimeline";
import { IconClose } from "./icons";
import { fmtCost, timeAgo } from "@/lib/format";

const STATUS_STYLE: Record<string, string> = {
  success: "text-accent bg-accent/10",
  error: "text-danger bg-danger/10",
  running: "text-warn bg-warn/10",
};

export function TraceDetailPanel({
  trace,
  onClose,
}: {
  trace: Trace | null;
  onClose: () => void;
}) {
  const totalCost = trace?.steps.reduce((s, st) => s + st.costUsd, 0) ?? 0;
  const totalTokens = trace?.steps.reduce((s, st) => s + st.tokens, 0) ?? 0;

  return (
    <div
      className={`fixed inset-0 z-30 transition ${trace ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!trace}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity ${
          trace ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border bg-bg transition-transform duration-200 ${
          trace ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {trace && (
          <>
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <div className="text-xs text-muted">{trace.id}</div>
                <div className="mt-1 text-lg font-semibold">{trace.agentName}</div>
                <div className="mt-1 text-xs text-muted">
                  started {timeAgo(trace.startedAt)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[trace.status]}`}
                >
                  {trace.status}
                </span>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-white"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-b border-border px-6 py-4">
              <div>
                <div className="text-[11px] uppercase text-muted">Steps</div>
                <div className="text-sm font-medium">{trace.steps.length}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-muted">Tokens</div>
                <div className="text-sm font-medium">{totalTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-muted">Cost</div>
                <div className="text-sm font-medium">{fmtCost(totalCost)}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                Timeline
              </div>
              <TraceTimeline trace={trace} />

              <div className="mt-8 space-y-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">
                  Step detail
                </div>
                {trace.steps.map((s, i) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-border bg-panel p-3 text-xs"
                  >
                    <div className="flex items-center justify-between text-muted">
                      <span className="text-white">
                        {i + 1}. {s.name}
                      </span>
                      <span>{s.type}</span>
                    </div>
                    {s.error && (
                      <div className="mt-2 rounded bg-danger/10 px-2 py-1 text-danger">
                        {s.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
