import { mockCompletion } from "@/lib/mock-llm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { transcript, instruction } = await req.json();
  if (!transcript || !instruction) {
    return new Response(JSON.stringify({ error: "Missing transcript or instruction" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const fullText = mockCompletion(instruction, transcript);
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

function chunkText(s: string, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out;
}
