"use client";

import { TraceSummary } from "@/lib/types";

export function CostChart({ summaries }: { summaries: TraceSummary[] }) {
  const points = [...summaries].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );

  if (points.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted">
        Not enough traces yet to chart a cost trend.
      </div>
    );
  }

  const width = 640;
  const height = 160;
  const padX = 8;
  const padY = 16;
  const maxCost = Math.max(...points.map((p) => p.totalCostUsd), 0.01);

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (width - padX * 2);
    const y = height - padY - (p.totalCostUsd / maxCost) * (height - padY * 2);
    return { x, y, p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={0}
          x2={width}
          y1={height - padY - frac * (height - padY * 2)}
          y2={height - padY - frac * (height - padY * 2)}
          stroke="#212530"
          strokeWidth={1}
        />
      ))}

      <path d={areaPath} fill="url(#costFill)" />
      <path d={linePath} fill="none" stroke="#6ee7b7" strokeWidth={2} strokeLinejoin="round" />

      {coords.map((c, i) => (
        <g key={i}>
          <circle
            cx={c.x}
            cy={c.y}
            r={c.p.anomalies.length > 0 ? 4 : 3}
            fill={c.p.anomalies.length > 0 ? "#f87171" : "#6ee7b7"}
            stroke="#0b0d12"
            strokeWidth={1.5}
          />
        </g>
      ))}
    </svg>
  );
}
