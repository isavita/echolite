export async function GET() {
  return Response.json({ ok: true, api: ["transcribe (POST)", "complete (POST)"] });
}
