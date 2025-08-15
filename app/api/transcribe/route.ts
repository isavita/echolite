import { NextResponse } from "next/server";
import { SAMPLE_TRANSCRIPT } from "@/lib/sample";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  await new Promise(r => setTimeout(r, 400)); // simulate work
  return NextResponse.json({ transcript: SAMPLE_TRANSCRIPT, mock: true });
}

// Optional: prove the route exists — GET should be 405 in browser, but we can return a message instead.
export async function GET() {
  return NextResponse.json({ ok: true, hint: "Use POST with multipart/form-data" });
}
