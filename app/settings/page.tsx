"use client";
import { useEffect, useState } from "react";

type Cfg = {
  askAudio: { model: string; baseURL: string; apiKeyEnv: string; temperature: number; systemPrompt: string };
  transcribe: {
    engine: "whisper_cpp" | "openai_compatible";
    binaryPath?: string;
    modelPath?: string;
    language?: string;
    threads?: number;
    model?: string;
    baseURL?: string;
    apiKeyEnv?: string;
    responseFormat: "text" | "verbose_json";
    systemPrompt?: string;
  };
  askText: { model: string; baseURL: string; apiKeyEnv: string; temperature: number; systemPrompt: string };
  _meta?: { path?: string };
};

export default function SettingsPage() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Local string states to avoid number-input typing issues
  const [tempAskAudio, setTempAskAudio] = useState("0.2");
  const [tempAskText, setTempAskText] = useState("0.2");
  const [threads, setThreads] = useState("4");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/config/models", { cache: "no-store" });
      const data: Cfg = await r.json();
      setCfg(data);
      setTempAskAudio(String(data?.askAudio?.temperature ?? "0.2"));
      setTempAskText(String(data?.askText?.temperature ?? "0.2"));
      setThreads(String(data?.transcribe?.threads ?? "4"));
    })();
  }, []);

  if (!cfg) return <p>Loading…</p>;

  const save = async () => {
    setSaving(true); setSaved(false);

    const next = structuredClone(cfg);
    const toNum = (s: string, fallback: number) => {
      const n = parseFloat(s);
      return Number.isFinite(n) ? Math.max(0, Math.min(2, n)) : fallback;
    };
    const toInt = (s: string, fallback: number) => {
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : fallback;
    };
    next.askAudio.temperature = toNum(tempAskAudio, next.askAudio.temperature);
    next.askText.temperature = toNum(tempAskText, next.askText.temperature);
    next.transcribe.threads = toInt(threads, next.transcribe.threads ?? 4);

    const r = await fetch("/api/config/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    });
    setSaving(false);
    if (r.ok) setSaved(true);
  };

  return (
    <section className="space-y-8">
      <p className="text-sm text-neutral-600">
        Editing <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-900">{cfg._meta?.path || "configs/echolite.models.json"}</code>.
        You can also modify this file manually.
      </p>

      {/* Ask (audio) */}
      <Card title="Ask (audio)">
        <Grid>
          <Text label="Model" value={cfg.askAudio.model} onChange={v => setCfg({ ...cfg, askAudio: { ...cfg.askAudio, model: v } })} />
          <Text label="Base URL" value={cfg.askAudio.baseURL} onChange={v => setCfg({ ...cfg, askAudio: { ...cfg.askAudio, baseURL: v } })} />
          <Text label="API Key Env" value={cfg.askAudio.apiKeyEnv} onChange={v => setCfg({ ...cfg, askAudio: { ...cfg.askAudio, apiKeyEnv: v } })} />
          <Text label="Temperature" value={tempAskAudio} onChange={v => setTempAskAudio(v)} inputMode="decimal" />
        </Grid>
        <Area label="System instruction" value={cfg.askAudio.systemPrompt} onChange={v => setCfg({ ...cfg, askAudio: { ...cfg.askAudio, systemPrompt: v } })} />
      </Card>

      {/* Transcribe */}
      <Card title="Transcribe (audio → text)">
        <Grid>
          <Select label="Engine" value={cfg.transcribe.engine}
                  onChange={(v) => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, engine: v as "whisper_cpp" | "openai_compatible" } })}
                  options={["whisper_cpp","openai_compatible"]} />
          <Select label="Response format" value={cfg.transcribe.responseFormat}
                  onChange={(v) => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, responseFormat: v as "text" | "verbose_json" } })}
                  options={["text","verbose_json"]} />
        </Grid>

        {cfg.transcribe.engine === "whisper_cpp" ? (
          <>
            <Grid>
              <Text label="Binary path (whisper-cpp)" value={cfg.transcribe.binaryPath ?? ""} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, binaryPath: v } })} />
              <Text label="Model path (.bin)" value={cfg.transcribe.modelPath ?? ""} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, modelPath: v } })} />
              <Text label="Language (e.g., en)" value={cfg.transcribe.language ?? "en"} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, language: v } })} />
              <Text label="Threads" value={threads} onChange={v => setThreads(v)} inputMode="decimal" />
            </Grid>
            <Area label="Instruction (optional)" value={cfg.transcribe.systemPrompt || ""} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, systemPrompt: v } })} />
          </>
        ) : (
          <>
            <Grid>
              <Text label="Model" value={cfg.transcribe.model ?? ""} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, model: v } })} />
              <Text label="Base URL" value={cfg.transcribe.baseURL ?? ""} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, baseURL: v } })} />
              <Text label="API Key Env" value={cfg.transcribe.apiKeyEnv ?? ""} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, apiKeyEnv: v } })} />
            </Grid>
            <Area label="Instruction (optional)" value={cfg.transcribe.systemPrompt || ""} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, systemPrompt: v } })} />
          </>
        )}
      </Card>

      {/* Ask (transcript) */}
      <Card title="Ask (transcript)">
        <Grid>
          <Text label="Model" value={cfg.askText.model} onChange={v => setCfg({ ...cfg, askText: { ...cfg.askText, model: v } })} />
          <Text label="Base URL" value={cfg.askText.baseURL} onChange={v => setCfg({ ...cfg, askText: { ...cfg.askText, baseURL: v } })} />
          <Text label="API Key Env" value={cfg.askText.apiKeyEnv} onChange={v => setCfg({ ...cfg, askText: { ...cfg.askText, apiKeyEnv: v } })} />
          <Text label="Temperature" value={tempAskText} onChange={v => setTempAskText(v)} inputMode="decimal" />
        </Grid>
        <Area label="System instruction" value={cfg.askText.systemPrompt} onChange={v => setCfg({ ...cfg, askText: { ...cfg.askText, systemPrompt: v } })} />
      </Card>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
                className="rounded border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="font-medium">{title}</h2>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}
function Text(props: { label: string; value: string; onChange: (v: string) => void; inputMode?: "text"|"decimal" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-neutral-600">{props.label}</span>
      <input className="w-full rounded border px-3 py-2"
             inputMode={props.inputMode ?? "text"}
             value={props.value}
             onChange={e => props.onChange(e.target.value)} />
    </label>
  );
}
function Area(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-neutral-600">{props.label}</span>
      <textarea className="h-28 w-full rounded border px-3 py-2" value={props.value} onChange={e => props.onChange(e.target.value)} />
    </label>
  );
}
function Select(props: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-neutral-600">{props.label}</span>
      <select className="w-full rounded border px-3 py-2" value={props.value} onChange={e => props.onChange(e.target.value)}>
        {props.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
