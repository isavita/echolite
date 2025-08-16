import { loadModelConfig } from "@/lib/model-config";
import { safeText } from "@/lib/streaming";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { transcript, instruction } = await req.json();

  if (!transcript || !instruction) {
    return new Response(JSON.stringify({ error: "Missing transcript or instruction" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const cfg = await loadModelConfig();
  const ask = cfg.askText;
  const baseURL = (ask.baseURL || "http://localhost:11434").replace(/\/+$/, "");
  const model = ask.model || "qwen3:8b";
  const temperature = Number.isFinite(ask.temperature) ? ask.temperature : 0.2;
  const systemPrompt = ask.systemPrompt || "You analyze meeting transcripts precisely and answer user instructions.";

  // Compose messages (system + user) — no external calls besides local Ollama
  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content:
        `Follow the INSTRUCTION using ONLY the TRANSCRIPT. ` +
        `Be concise and cite exact quotes when helpful.\n\n` +
        `INSTRUCTION:\n${instruction}\n\nTRANSCRIPT:\n${transcript}`
    }
  ];

  // Call Ollama native chat API with streaming NDJSON
  const r = await fetch(`${baseURL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // No Authorization header needed for local Ollama
    body: JSON.stringify({
      model,
      stream: true,
      options: { temperature },
      messages
    })
  });

  if (!r.ok || !r.body) {
    const detail = await safeText(r);
    return new Response(JSON.stringify({ error: "LLM call failed", detail }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Convert Ollama's NDJSON stream into plain text tokens
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // NDJSON lines
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep last partial line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const json = JSON.parse(trimmed);
              // For /api/chat, chunks arrive as {message:{content:"..."}, done: false}
              const chunk =
                json?.message?.content ??
                json?.response ?? // (/api/generate style)
                "";
              if (chunk) controller.enqueue(enc.encode(chunk));
              // Stop if Ollama signals done
              if (json?.done) {
                controller.close();
                return;
              }
            } catch {
              // ignore parse errors from partial lines
            }
          }
        }
        // Flush any remaining buffered line
        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer.trim());
            const chunk = json?.message?.content ?? json?.response ?? "";
            if (chunk) controller.enqueue(new TextEncoder().encode(chunk));
          } catch {}
        }
      } catch (e) {
        controller.error(e);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
