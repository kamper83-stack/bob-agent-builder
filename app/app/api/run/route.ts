import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).complaint_text !== "string" ||
    !(body as Record<string, unknown>).complaint_text
  ) {
    return NextResponse.json(
      { error: "complaint_text is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  const { complaint_text, policy_doc_id, agent_instructions } =
    body as Record<string, unknown>;

  if (policy_doc_id !== undefined && typeof policy_doc_id !== "string") {
    return NextResponse.json(
      { error: "policy_doc_id must be a string" },
      { status: 400 }
    );
  }
  if (
    agent_instructions !== undefined &&
    typeof agent_instructions !== "string"
  ) {
    return NextResponse.json(
      { error: "agent_instructions must be a string" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BACKEND}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaint_text, policy_doc_id, agent_instructions }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backend unavailable" },
      { status: 502 }
    );
  }
}
