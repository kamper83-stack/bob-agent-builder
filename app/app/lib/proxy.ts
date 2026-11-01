import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

/** Forwards a POST to the backend. Errors always come back as JSON with `detail`. */
export async function proxyToBackend(req: NextRequest, path: string) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${BACKEND}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { detail: "The backend is not reachable. Check that it is running." },
      { status: 502 }
    );
  }

  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ detail: text || "Backend error" }, { status: res.status });
  }
}
