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
    typeof (body as Record<string, unknown>).current_instructions !== "string" ||
    !(body as Record<string, unknown>).current_instructions
  ) {
    return NextResponse.json(
      {
        error:
          "current_instructions is required and must be a non-empty string",
      },
      { status: 400 }
    );
  }

  const { current_instructions, rating, comment } =
    body as Record<string, unknown>;

  if (rating !== undefined && typeof rating !== "number") {
    return NextResponse.json(
      { error: "rating must be a number" },
      { status: 400 }
    );
  }
  if (comment !== undefined && typeof comment !== "string") {
    return NextResponse.json(
      { error: "comment must be a string" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BACKEND}/improve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_instructions, rating, comment }),
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
