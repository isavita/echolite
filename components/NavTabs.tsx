"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

function tab(active: boolean) {
  return [
    "rounded-md px-3 py-1.5 border text-sm transition-colors",
    "border-neutral-200 dark:border-neutral-800",
    active
      ? "bg-neutral-200 text-neutral-900 dark:bg-violet-600 dark:text-neutral-50"
      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
  ].join(" ");
}

export default function NavTabs() {
  const p = usePathname();
  return (
    <nav className="mb-6 flex items-center justify-between">
      <div className="flex gap-2">
        <Link href="/ask-audio" className={tab(p === "/ask-audio")}>Ask (audio)</Link>
        <Link href="/transcribe" className={tab(p === "/transcribe")}>Transcribe</Link>
        <Link href="/ask" className={tab(p === "/ask")}>Ask</Link>
        <Link href="/settings" className={tab(p === "/settings")}>Settings</Link>
      </div>
      <ThemeToggle />
    </nav>
  );
}
