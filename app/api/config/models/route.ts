import { loadModelConfig, saveModelConfig, mergeWithDefaults, CONFIG_PATH } from "@/lib/model-config";

export const runtime = "nodejs";

export async function GET() {
  const cfg = await loadModelConfig();
  return Response.json({ ...cfg, _meta: { path: CONFIG_PATH } });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const merged = mergeWithDefaults(body || {});
  // very light validation
  const clamp = (n: number) => Math.max(0, Math.min(2, Number.isFinite(n) ? n : 0.2));
  merged.askAudio.temperature = clamp(merged.askAudio.temperature);
  merged.askText.temperature = clamp(merged.askText.temperature);
  await saveModelConfig(merged);
  return Response.json({ ok: true });
}
