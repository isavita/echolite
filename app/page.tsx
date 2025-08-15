"use client";

import { useEffect, useRef, useState } from "react";

type Loading = "idle" | "asr" | "llm";

export default function Page() {
  const [audio, setAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [transcript, setTranscript] = useState("");
  const [instruction, setInstruction] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState<Loading>("idle");
  const [model, setModel] = useState("mock-llm");
  const [temperature, setTemperature] = useState(0.2);
  const [systemPrompt, setSystemPrompt] = useState("You are a precise assistant for analyzing meeting audio.");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!audio) { setAudioUrl(undefined); return; }
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  const onFile = (f: File | null) => {
    setAudio(f);
    setTranscript("");
    setAnswer("");
  };

  const transcribe = async () => {
    if (!audio) return;
    setLoading("asr");
    setTranscript("");
    setAnswer("");

    const fd = new FormData();
    fd.append("audio", audio);
    const r = await fetch("/api/transcribe", { method: "POST", body: fd });
    if (!r.ok) { setLoading("idle"); alert("Transcribe failed"); return; }
    const data = await r.json();
    setTranscript(data.transcript ?? "");
    setLoading("idle");
  };

  const runLLM = async () => {
    if (!transcript || !instruction) return;
    setLoading("llm");
    setAnswer("");

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const r = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, instruction, model, temperature, systemPrompt }),
      signal: ctrl.signal
    });
    if (!r.ok || !r.body) { setLoading("idle"); alert("LLM call failed"); return; }

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      setAnswer(prev => prev + decoder.decode(value));
    }
    setLoading("idle");
  };

  const downloadTxt = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">EchoLite</h1>
        <button
          onClick={() => setShowAdvanced(s => !s)}
          className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
        >
          {showAdvanced ? "Hide settings" : "Show settings"}
        </button>
      </header>

      {showAdvanced && (
        <section className="mb-6 grid grid-cols-1 gap-4 rounded-lg border p-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Model</label>
            <input value={model} onChange={e => setModel(e.target.value)} className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Temperature</label>
            <input type="number" step="0.1" min={0} max={2}
                   value={temperature} onChange={e => setTemperature(Number(e.target.value))}
                   className="w-full rounded border px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">System prompt</label>
            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                      className="h-24 w-full rounded border px-3 py-2" />
          </div>
        </section>
      )}

      <section className="mb-6 space-y-3">
        <label className="block text-sm text-neutral-600">Audio file</label>
        <input type="file" accept="audio/*"
               onChange={(e) => onFile(e.target.files?.[0] ?? null)}
               className="block w-full cursor-pointer rounded border p-2" />
        {audio && (
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span className="truncate">Selected: {audio.name}</span>
            <button onClick={() => onFile(null)}
                    className="rounded border px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-900">
              Clear
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={transcribe} disabled={!audio || loading !== "idle"}
                  className="rounded border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50">
            {loading === "asr" ? "Transcribing…" : "Transcribe"}
          </button>
          <audio controls className="ml-auto max-w-full" src={audioUrl} />
        </div>
      </section>

      <section className="mb-6 space-y-2">
        <label className="block text-sm text-neutral-600">Instruction</label>
        <textarea value={instruction} onChange={e => setInstruction(e.target.value)}
                  placeholder={`e.g., "Summarize in 4 points." or "Is sprint planning time mentioned?"`}
                  className="h-28 w-full rounded border px-3 py-2" />
        <div className="flex items-center gap-2">
          <button onClick={runLLM} disabled={!transcript || !instruction || loading !== "idle"}
                  className="rounded border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50">
            {loading === "llm" ? "Thinking…" : "Run"}
          </button>
          {loading === "llm" && (
            <button onClick={() => abortRef.current?.abort()}
                    className="rounded border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900">
              Abort
            </button>
          )}
        </div>
      </section>

      <section className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm text-neutral-600">Transcript</label>
          <button onClick={() => downloadTxt("transcript.txt", transcript)} disabled={!transcript}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50">
            Download
          </button>
        </div>
        <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
                  className="h-56 w-full rounded border px-3 py-2" />
      </section>

      <section className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm text-neutral-600">Answer</label>
          <button onClick={() => downloadTxt("answer.txt", answer)} disabled={!answer}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50">
            Download
          </button>
        </div>
        <pre className="min-h-40 whitespace-pre-wrap rounded border px-3 py-2 text-sm">{answer}</pre>
      </section>

      <footer className="mt-10 text-center text-xs text-neutral-500">
        Mock backend active (no external APIs). Swap to real LiteLLM/OpenAI later.
      </footer>
    </main>
  );
}
