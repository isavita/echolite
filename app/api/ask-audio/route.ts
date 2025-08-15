import { mockCompletion } from "@/lib/mock-llm";
import { SAMPLE_TRANSCRIPT } from "@/lib/sample";
import { loadModelConfig } from "@/lib/model-config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio") as File | null;
  const instruction = String(form.get("instruction") ?? "");

  if (!file) {
    return new Response(JSON.stringify({ error: "No audio uploaded" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }
  if (!instruction) {
    return new Response(JSON.stringify({ error: "Missing instruction" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const cfg = await loadModelConfig();
  const composedInstruction =
    (cfg.askAudio.systemPrompt ? cfg.askAudio.systemPrompt + "\n\n" : "") + instruction;

  await new Promise(r => setTimeout(r, 250)); // simulate work

  const fullText = mockCompletion(composedInstruction, SAMPLE_TRANSCRIPT);
  const chunks = chunkText(fullText, 28);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      for (const c of chunks) {
        controller.enqueue(enc.encode(c));
        await new Promise(r => setTimeout(r, 25));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export async function GET() {
  return Response.json({ ok: true, hint: "Use POST with multipart/form-data (audio + instruction)" });
}

function chunkText(s: string, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out;
}
