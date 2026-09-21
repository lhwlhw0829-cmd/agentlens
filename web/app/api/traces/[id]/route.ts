import { NextRequest, NextResponse } from "next/server";
import { getTrace } from "@/lib/store";
import { detectAnomalies } from "@/lib/anomaly";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const trace = getTrace(params.id);
  if (!trace) {
    return NextResponse.json({ error: "trace not found" }, { status: 404 });
  }
  return NextResponse.json({ trace, anomalies: detectAnomalies(trace) });
}
