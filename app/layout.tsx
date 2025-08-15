import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EchoLite",
  description: "Upload audio, instruct, get answers — no DB, no RAG."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
