"use client";
import { useEffect, useRef, useState } from "react";
import { useTranscript } from "../transcript-context";

type Loading = "idle" | "llm";

export default function AskPage() {
  const [instruction, setInstruction] = useState("");
  const [defaultSystem, setDefaultSystem] = useState("");
  const { transcript: sharedTranscript, setTranscript: setSharedTranscript } = useTranscript();
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState<Loading>("idle");
  const abortRef = useRef<AbortController | null>(null);
  
  // Text-to-speech states
  const [isReadingTranscript, setIsReadingTranscript] = useState(false);
  const [isReadingAnswer, setIsReadingAnswer] = useState(false);
  const transcriptUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const answerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/config/models", { cache: "no-store" });
      const cfg = await r.json();
      setDefaultSystem(cfg?.askText?.systemPrompt || "");
    })();

    if (sharedTranscript) {
      setTranscript(sharedTranscript);
      // Clear it so it's not stale on next visit
      setSharedTranscript("");
    }
    
    // Cleanup speech synthesis on unmount
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sharedTranscript, setSharedTranscript]);

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
    let result = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
      setAnswer(result);
    }
    // Flush the final chunk
    result += decoder.decode();
    setAnswer(result);
    setLoading("idle");
  };

  const downloadTxt = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // Text-to-speech functions
  const readTranscript = () => {
    if (!transcript || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (isReadingTranscript) {
      // Stop reading
      window.speechSynthesis.cancel();
      setIsReadingTranscript(false);
      return;
    }

    // Start reading
    const utterance = new SpeechSynthesisUtterance(transcript);
    transcriptUtteranceRef.current = utterance;
    
    utterance.onend = () => {
      setIsReadingTranscript(false);
    };
    
    utterance.onerror = () => {
      setIsReadingTranscript(false);
    };
    
    setIsReadingTranscript(true);
    window.speechSynthesis.speak(utterance);
  };

  const readAnswer = () => {
    if (!answer || typeof window === 'undefined' || !window.speechSynthesis) return;
    
    if (isReadingAnswer) {
      // Stop reading
      window.speechSynthesis.cancel();
      setIsReadingAnswer(false);
      return;
    }

    // Start reading
    const utterance = new SpeechSynthesisUtterance(answer);
    answerUtteranceRef.current = utterance;
    
    utterance.onend = () => {
      setIsReadingAnswer(false);
    };
    
    utterance.onerror = () => {
      setIsReadingAnswer(false);
    };
    
    setIsReadingAnswer(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop any speech when component unmounts or text changes
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop reading if transcript changes while reading
  useEffect(() => {
    if (isReadingTranscript && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsReadingTranscript(false);
    }
  }, [transcript]);

  // Stop reading if answer changes while reading
  useEffect(() => {
    if (isReadingAnswer && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsReadingAnswer(false);
    }
  }, [answer]);

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
            <button 
              onClick={() => readTranscript()} 
              disabled={!transcript}
              className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
            >
              {isReadingTranscript ? (
                <>
                  <span className="inline-block">⏸</span> Stop
                </>
              ) : (
                <>
                  <span className="inline-block">🔊</span> Read
                </>
              )}
            </button>
            <button 
              onClick={() => downloadTxt("transcript.txt", transcript)} 
              disabled={!transcript}
              className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
            >
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
            onClick={() => readAnswer()}
            disabled={!answer}
            className="ml-auto rounded border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
          >
            {isReadingAnswer ? (
              <>
                <span className="inline-block">⏸</span> Stop Reading
              </>
            ) : (
              <>
                <span className="inline-block">🔊</span> Read Answer
              </>
            )}
          </button>
          <button
            onClick={() => downloadTxt("answer.txt", answer)}
            disabled={!answer}
            className="rounded border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-50"
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