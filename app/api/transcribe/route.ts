import { NextResponse } from "next/server";
import { SAMPLE_TRANSCRIPT } from "@/lib/sample";
import { loadModelConfig } from "@/lib/model-config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const cfg = await loadModelConfig(); // not used in mock result, but proves config is accessible
  await new Promise(r => setTimeout(r, 400)); // simulate work

  return NextResponse.json({
    transcript: SAMPLE_TRANSCRIPT,
    mock: true,
    usedModel: cfg.transcribe.model
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "Use POST with multipart/form-data" });
}
