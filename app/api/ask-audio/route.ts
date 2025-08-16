import { loadModelConfig } from "@/lib/model-config";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio") as File | null;
  const instruction = String(form.get("instruction") ?? "");

  if (!file) {
    return new Response(JSON.stringify({ error: "No audio uploaded" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!instruction) {
    return new Response(JSON.stringify({ error: "Missing instruction" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const cfg = await loadModelConfig();
  const ask = cfg.askAudio;
  const composedInstruction =
    (ask.systemPrompt ? ask.systemPrompt + "\n\n" : "") + instruction;
  const baseURL = (ask.baseURL || "http://localhost:8080").replace(/\/+$/, "");
  const temperature = Number.isFinite(ask.temperature) ? ask.temperature : 0.2;

  const tmpDir = path.join(os.tmpdir(), "echolite");
  await fs.mkdir(tmpDir, { recursive: true });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputPath = path.join(tmpDir, `${id}-in`);
  const wavPath = path.join(tmpDir, `${id}.wav`);

  try {
    // Save uploaded file
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buf);

    // Convert to 16kHz mono WAV via ffmpeg
    await run("ffmpeg", ["-y", "-i", inputPath, "-ac", "1", "-ar", "16000", wavPath]);

    // Read converted WAV and encode as base64
    const wav = await fs.readFile(wavPath);
    const audioB64 = wav.toString("base64");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (ask.apiKeyEnv && process.env[ask.apiKeyEnv]) {
      headers["Authorization"] = `Bearer ${process.env[ask.apiKeyEnv]}`;
    }

    const r = await fetch(`${baseURL}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: ask.model || "qwen2.5-omni-3b",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: { data: audioB64, format: "wav" }
              },
              { type: "input_text", text: composedInstruction }
            ]
          }
        ],
        temperature
      })
    });

    if (!r.ok) {
      let detail = await safeText(r);
      try {
        const err = JSON.parse(detail);
        detail = err?.message || err?.error?.message || detail;
        if (typeof detail === "string" && detail.includes("audio input is not supported")) {
          detail +=
            " (llama.cpp expects base64 16 kHz mono WAV audio; ensure the server was built with audio support)";
        }
      } catch {
        // ignore JSON parse errors
      }
      return new Response(
        JSON.stringify({ error: "LLM call failed", detail }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const json = await r.json();
    const answer =
      json?.choices?.[0]?.message?.content?.[0]?.text ??
      json?.choices?.[0]?.message?.content ??
      json?.choices?.[0]?.text ??
      "";

    const chunks = chunkText(String(answer), 28);
    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        for (const c of chunks) {
          controller.enqueue(enc.encode(c));
          await new Promise(r => setTimeout(r, 20));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "Processing failed", detail }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    try { await fs.unlink(inputPath); } catch {}
    try { await fs.unlink(wavPath); } catch {}
  }
}

export async function GET() {
  return Response.json({ ok: true, hint: "Use POST with multipart/form-data (audio + instruction)" });
}

function chunkText(s: string, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out;
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "pipe" });
    let stderr = "";
    child.stderr.on("data", d => { stderr += d.toString(); });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}\n${stderr}`));
    });
  });
}

async function safeText(r: Response) {
  try { return await r.text(); } catch { return ""; }
}
