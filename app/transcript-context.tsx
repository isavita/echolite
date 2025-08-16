"use client";

import { createContext, useState, useContext } from "react";

type TranscriptContextType = {
  transcript: string;
  setTranscript: (transcript: string) => void;
};

const TranscriptContext = createContext<TranscriptContextType | undefined>(undefined);

export function TranscriptProvider({ children }: { children: React.ReactNode }) {
  const [transcript, setTranscript] = useState("");

  return (
    <TranscriptContext.Provider value={{ transcript, setTranscript }}>
      {children}
    </TranscriptContext.Provider>
  );
}

export function useTranscript() {
  const context = useContext(TranscriptContext);
  if (context === undefined) {
    throw new Error("useTranscript must be used within a TranscriptProvider");
  }
  return context;
}
