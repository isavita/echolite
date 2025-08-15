"use client";
import { useEffect, useRef, useState } from "react";

type Loading = "idle" | "llm";

export default function AskAudioPage() {
  const [audio, setAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>();
  const [instruction, setInstruction] = useState("");
  const [defaultSystem, setDefaultSystem] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState<Loading>("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!audio) { setAudioUrl(undefined); return; }
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/config/models", { cache: "no-store" });
      const cfg = await r.json();
      setDefaultSystem(cfg?.askAudio?.systemPrompt || "");
    })();
  }, []);

  const run = async () => {
    if (!audio || !instruction) return;
    setAnswer("");
    setLoading("llm");

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const fd = new FormData();
    fd.append("audio", audio);
    fd.append("instruction", instruction);

    const r = await fetch("/api/ask-audio", { method: "POST", body: fd, signal: ctrl.signal });
    if (!r.ok || !r.body) { setLoading("idle"); alert("Audio QA failed"); return; }

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
    <section>
      <div className="mb-2 text-xs text-neutral-500">
        Using system instruction from <b>Settings → Ask (audio)</b>.
      </div>

      <div className="mb-6 space-y-3">
        <label className="block text-sm text-neutral-600">Audio file</label>
        <input type="file" accept="audio/*" onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
               className="block w-full cursor-pointer rounded border p-2" />
        {audio && (
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span className="truncate">Selected: {audio.name}</span>
            <button onClick={() => setAudio(null)} className="rounded border px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-900">
              Clear
            </button>
          </div>
        )}
        <audio controls className="w-full" src={audioUrl} />
      </div>

      <div className="mb-6 space-y-2">
        <label className="block text-sm text-neutral-600">Instruction</label>
        <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)}
                  placeholder={`e.g., "Summarize in 4 points." or "Is the sprint planning time mentioned?"`}
                  className="h-28 w-full rounded border px-3 py-2" />
        {defaultSystem && (
          <p className="text-xs text-neutral-500">Default system instruction: <em>{defaultSystem.slice(0, 140)}{defaultSystem.length>140 ? "…" : ""}</em></p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <button onClick={run} disabled={!audio || !instruction || loading !== "idle"}
                  className="rounded border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50">
            {loading === "llm" ? "Thinking…" : "Run"}
          </button>
          {loading === "llm" && (
            <button onClick={() => abortRef.current?.abort()}
                    className="rounded border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900">
              Abort
            </button>
          )}
          <button onClick={() => downloadTxt("answer.txt", answer)} disabled={!answer}
                  className="ml-auto rounded border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50">
            Download answer
          </button>
        </div>
        <pre className="mt-3 min-h-40 whitespace-pre-wrap rounded border px-3 py-2 text-sm">{answer}</pre>
      </div>
    </section>
  );
}
