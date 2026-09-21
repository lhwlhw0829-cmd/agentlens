import { NextRequest, NextResponse } from "next/server";
import { ingestTrace, listTraceSummaries } from "@/lib/store";
import { Trace } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ traces: listTraceSummaries() });
}

export async function POST(req: NextRequest) {
  let body: Trace;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!body?.id || !body?.agentName || !Array.isArray(body?.steps)) {
    return NextResponse.json(
      { error: "trace must include id, agentName, and steps[]" },
      { status: 422 },
    );
  }

  ingestTrace(body);
  return NextResponse.json({ ok: true, id: body.id }, { status: 201 });
}
