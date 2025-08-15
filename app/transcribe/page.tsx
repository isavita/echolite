"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Loading = "idle" | "asr";

export default function TranscribePage() {
  const [audio, setAudio] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState<Loading>("idle");

  useEffect(() => {
    if (!audio) { setAudioUrl(undefined); return; }
    const url = URL.createObjectURL(audio);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  const transcribe = async () => {
    if (!audio) return;
    setLoading("asr");
    setTranscript("");

    const fd = new FormData();
    fd.append("audio", audio);

    const r = await fetch("/api/transcribe", { method: "POST", body: fd });
    if (!r.ok) { setLoading("idle"); alert("Transcribe failed"); return; }
    const data = await r.json();
    const text = data.transcript ?? "";
    setTranscript(text);
    // Save for Ask page
    try { localStorage.setItem("echolite:lastTranscript", text); } catch {}
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
      <div className="mb-6 space-y-3">
        <label className="block text-sm text-neutral-600">Audio file</label>
        <input
          type="file" accept="audio/*"
          onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer rounded border p-2"
        />
        {audio && (
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span className="truncate">Selected: {audio.name}</span>
            <button
              onClick={() => setAudio(null)}
              className="rounded border px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              Clear
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={transcribe}
            disabled={!audio || loading !== "idle"}
            className="rounded border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
          >
            {loading === "asr" ? "Transcribing…" : "Transcribe"}
          </button>
          <audio controls className="ml-auto max-w-full" src={audioUrl} />
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm text-neutral-600">Transcript</label>
          <div className="flex gap-2">
            <button
              onClick={() => transcript && downloadTxt("transcript.txt", transcript)}
              disabled={!transcript}
              className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
            >
              Download
            </button>
            <Link href="/ask" className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900">
              Go to Ask →
            </Link>
          </div>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="h-56 w-full rounded border px-3 py-2"
        />
      </div>
    </section>
  );
}
