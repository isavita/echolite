import { NextResponse } from "next/server";
import { loadModelConfig, expandHome } from "@/lib/model-config";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { run } from "@/lib/process";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const cfg = await loadModelConfig();
  const engine = cfg.transcribe.engine || "whisper_cpp";

  if (engine !== "whisper_cpp") {
    // For now only local whisper.cpp is implemented. Add remote later if needed.
    return NextResponse.json({ error: `Transcribe engine '${engine}' not implemented yet.` }, { status: 501 });
  }

  const binaryPath = expandHome(cfg.transcribe.binaryPath) || "whisper-cpp";
  const modelPath  = expandHome(cfg.transcribe.modelPath);
  const language   = cfg.transcribe.language || "en";
  if (!modelPath) {
    return NextResponse.json({ error: "Missing transcribe.modelPath in settings." }, { status: 400 });
  }

  const tmpDir = path.join(os.tmpdir(), "echolite");
  await fs.mkdir(tmpDir, { recursive: true });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath   = path.join(tmpDir, `${id}-in`);
  const wavPath     = path.join(tmpDir, `${id}.wav`);
  const outBasePath = path.join(tmpDir, `${id}-out`);

  try {
    // 1) Save uploaded file
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buf);

    // 2) Convert → 16kHz mono WAV (ffmpeg required)
    await run("ffmpeg", ["-y", "-i", inputPath, "-ac", "1", "-ar", "16000", wavPath]);

    // 3) whisper.cpp
    const threads =
      cfg.transcribe.threads && cfg.transcribe.threads > 0
        ? cfg.transcribe.threads
        : Math.max(2, Math.min(8, os.cpus().length));
    const args = [
      "-m",
      modelPath,
      "-f", wavPath,
      "-otxt",
      "-of", outBasePath,
      "-l", language,
      "-t", String(threads)
    ];

    // If you want SRTs too: args.push("-osrt");
    await run(binaryPath, args, {
      env: process.env // you can set GGML_METAL_PATH_RESOURCES in your shell if needed
    });

    const txtPath = `${outBasePath}.txt`;
    const transcript = await fs.readFile(txtPath, "utf-8");

    return NextResponse.json({
      transcript,
      mock: false,
      engine: "whisper_cpp",
      modelPath,
      language
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      error: "Transcription failed",
      detail
    }, { status: 500 });
  } finally {
    // Best-effort cleanup (comment out if you want to inspect artifacts)
    try { await fs.unlink(inputPath); } catch {}
    try { await fs.unlink(wavPath); } catch {}
    try { await fs.unlink(`${outBasePath}.txt`); } catch {}
    try { await fs.unlink(`${outBasePath}.srt`); } catch {}
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST multipart/form-data with 'audio' file" });
}
