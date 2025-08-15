"use client";
import { useEffect, useRef, useState } from "react";

type Loading = "idle" | "llm";

export default function AskPage() {
  const [instruction, setInstruction] = useState("");
  const [defaultSystem, setDefaultSystem] = useState("");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState<Loading>("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/config/models", { cache: "no-store" });
      const cfg = await r.json();
      setDefaultSystem(cfg?.askText?.systemPrompt || "");
    })();
  }, []);

  const onTranscriptFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setTranscript(text);
  };

  const runLLM = async () => {
    if (!transcript || !instruction) return;
    setAnswer("");
    setLoading("llm");

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const r = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, instruction }),
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
    <section>
      <div className="mb-2 text-xs text-neutral-500">
        Using system instruction from <b>Settings → Ask (transcript)</b>.
      </div>

      <div className="mb-6 space-y-2">
        <label className="block text-sm text-neutral-600">Instruction</label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={`e.g., "Summarize in 4 points." or "Is the sprint planning time mentioned?"`}
          className="h-28 w-full rounded border px-3 py-2"
        />
        {defaultSystem && (
          <p className="text-xs text-neutral-500">Default system instruction: <em>{defaultSystem.slice(0, 140)}{defaultSystem.length>140 ? "…" : ""}</em></p>
        )}
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm text-neutral-600">Transcript (upload a text file)</label>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".txt,.md,.srt,.vtt,.json,text/plain"
              onChange={(e) => onTranscriptFile(e.target.files?.[0] ?? null)}
              className="rounded border px-3 py-1.5 text-sm"
            />
            <button onClick={() => downloadTxt("transcript.txt", transcript)} disabled={!transcript}
              className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50">
              Download
            </button>
          </div>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="h-56 w-full rounded border px-3 py-2"
        />
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={runLLM}
            disabled={!transcript || !instruction || loading !== "idle"}
            className="rounded border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
          >
            {loading === "llm" ? "Thinking…" : "Run"}
          </button>
          {loading === "llm" && (
            <button
              onClick={() => abortRef.current?.abort()}
              className="rounded border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              Abort
            </button>
          )}
          <button
            onClick={() => downloadTxt("answer.txt", answer)}
            disabled={!answer}
            className="ml-auto rounded border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
          >
            Download answer
          </button>
        </div>
        <pre className="mt-3 min-h-40 whitespace-pre-wrap rounded border px-3 py-2 text-sm">
          {answer}
        </pre>
      </div>
    </section>
  );
}
