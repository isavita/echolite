import "./globals.css";
import type { Metadata } from "next";
import NavTabs from "@/components/NavTabs";
import { TranscriptProvider } from "./transcript-context";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "EchoLite",
  description: "Upload audio, instruct, get answers — no DB, no RAG."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TranscriptProvider>
            <main className="mx-auto max-w-3xl px-4 py-8">
              <header className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold tracking-tight">EchoLite</h1>
              </header>
              <NavTabs />
              {children}
            </main>
          </TranscriptProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
