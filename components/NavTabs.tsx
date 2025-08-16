"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

function tab(active: boolean) {
  return [
    "rounded-md px-3 py-1.5 border text-sm",
    active ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
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
