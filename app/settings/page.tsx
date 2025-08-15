"use client";
import { useEffect, useState } from "react";

type Cfg = {
  askAudio: { model: string; baseURL: string; apiKeyEnv: string; temperature: number; systemPrompt: string };
  transcribe: { model: string; baseURL: string; apiKeyEnv: string; responseFormat: "text"|"verbose_json"; systemPrompt?: string };
  askText: { model: string; baseURL: string; apiKeyEnv: string; temperature: number; systemPrompt: string };
  _meta?: { path?: string };
};

export default function SettingsPage() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/config/models", { cache: "no-store" });
      const data: Cfg = await r.json();
      setCfg(data);
    })();
  }, []);

  if (!cfg) return <p>Loading…</p>;

  const save = async () => {
    setSaving(true); setSaved(false);
    const r = await fetch("/api/config/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        askAudio: cfg.askAudio,
        transcribe: cfg.transcribe,
        askText: cfg.askText
      })
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
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium">Ask (audio)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Text label="Model" value={cfg.askAudio.model} onChange={v => setCfg({ ...cfg, askAudio: { ...cfg.askAudio, model: v } })} />
          <Text label="Base URL" value={cfg.askAudio.baseURL} onChange={v => setCfg({ ...cfg, askAudio: { ...cfg.askAudio, baseURL: v } })} />
          <Text label="API Key Env" value={cfg.askAudio.apiKeyEnv} onChange={v => setCfg({ ...cfg, askAudio: { ...cfg.askAudio, apiKeyEnv: v } })} />
          <Number label="Temperature" value={cfg.askAudio.temperature} onChange={v => setCfg({ ...cfg, askAudio: { ...cfg.askAudio, temperature: v } })} />
        </div>
        <Area label="System instruction" value={cfg.askAudio.systemPrompt} onChange={v => setCfg({ ...cfg, askAudio: { ...cfg.askAudio, systemPrompt: v } })} />
      </div>

      {/* Transcribe */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium">Transcribe</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Text label="Model" value={cfg.transcribe.model} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, model: v } })} />
          <Text label="Base URL" value={cfg.transcribe.baseURL} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, baseURL: v } })} />
          <Text label="API Key Env" value={cfg.transcribe.apiKeyEnv} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, apiKeyEnv: v } })} />
          <Select label="Response format" value={cfg.transcribe.responseFormat}
            onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, responseFormat: v as "text"|"verbose_json" } })} options={["text","verbose_json"]} />
        </div>
        <Area label="Instruction (optional)" value={cfg.transcribe.systemPrompt || ""} onChange={v => setCfg({ ...cfg, transcribe: { ...cfg.transcribe, systemPrompt: v } })} />
      </div>

      {/* Ask (text) */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-medium">Ask (transcript)</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Text label="Model" value={cfg.askText.model} onChange={v => setCfg({ ...cfg, askText: { ...cfg.askText, model: v } })} />
          <Text label="Base URL" value={cfg.askText.baseURL} onChange={v => setCfg({ ...cfg, askText: { ...cfg.askText, baseURL: v } })} />
          <Text label="API Key Env" value={cfg.askText.apiKeyEnv} onChange={v => setCfg({ ...cfg, askText: { ...cfg.askText, apiKeyEnv: v } })} />
          <Number label="Temperature" value={cfg.askText.temperature} onChange={v => setCfg({ ...cfg, askText: { ...cfg.askText, temperature: v } })} />
        </div>
        <Area label="System instruction" value={cfg.askText.systemPrompt} onChange={v => setCfg({ ...cfg, askText: { ...cfg.askText, systemPrompt: v } })} />
      </div>

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

function Text(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-neutral-600">{props.label}</span>
      <input className="w-full rounded border px-3 py-2" value={props.value} onChange={e => props.onChange(e.target.value)} />
    </label>
  );
}
function Number(props: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-neutral-600">{props.label}</span>
      <input type="number" step="0.1" min={0} max={2} className="w-full rounded border px-3 py-2"
             value={props.value} onChange={e => props.onChange(Number(e.target.value))} />
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
