// Tiny heuristic “LLM” to simulate LiteLLM/OpenAI responses for UI polishing.

const timeRegex = /\b(?:(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?[AP]M)?)|(?:\b(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s?(?:AM|PM)\b)/i;
const dayRegex = /\b(Mon|Tue|Tues|Wed|Thu|Thur|Thu.|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i;

export function mockCompletion(instruction: string, transcript: string): string {
  const lower = instruction.toLowerCase();

  // Sprint planning question
  if (lower.includes("sprint") && lower.includes("planning")) {
    const line = transcript.split("\n").find(l => /sprint planning/i.test(l)) ?? "";
    const time = line.match(timeRegex)?.[0] ?? "unspecified time";
    const day = line.match(dayRegex)?.[0] ?? "unspecified day";
    const answer = line ? `Yes — sprint planning is mentioned: **${day} ${time}**.` :
                          "No — sprint planning time isn’t mentioned.";
    return [answer, "", "Source (excerpt):", `> ${line.trim() || "(not found)"}`].join("\n");
  }

  // Summaries
  if (lower.includes("summarize") || lower.includes("summarise") || lower.includes("summary")) {
    const bullets = deriveBullets(transcript);
    return [
      "### Summary",
      ...bullets.map(b => `- ${b}`),
      "",
      "### Decisions",
      "- Release moved to August 26.",
      "",
      "### Action items",
      "- Maya → auth library update by Wed EOD.",
      "- Jordan → chart legends & hover states by Thu noon.",
      "- Priya → stabilize Firefox e2e; report Friday.",
      "- Liam → ETL timing fix & metrics audit by Thu 5 PM."
    ].join("\n");
  }

  // Default: brief answer
  return `Here’s a concise answer based on the transcript.\n\nInstruction: ${instruction}\n\nKey points:\n- Goal: confirm Sprint 24 scope and unblock API migration.\n- Decision: release on August 26.\n- Sprint planning: Wednesday 10:00 AM CET.\n- Risks: flaky Firefox e2e.\n- Owners: Maya, Jordan, Priya, Liam.`;
}

function deriveBullets(transcript: string): string[] {
  const lines = transcript.split("\n").map(l => l.trim()).filter(Boolean);
  const picks: string[] = [];
  for (const l of lines) {
    if (/decision:/i.test(l)) picks.push("Decision: release moved to August 26.");
    if (/sprint planning/i.test(l)) picks.push("Sprint planning Wednesday 10:00 AM CET.");
    if (/risk:/i.test(l)) picks.push("Risk: flaky e2e tests on Firefox; stabilize retries.");
    if (/goal/i.test(l)) picks.push("Goal: confirm Sprint 24 scope & unblock API migration.");
    if (picks.length >= 4) break;
  }
  while (picks.length < 4 && picks.length < lines.length) {
    const next = lines[picks.length];
    if (next) picks.push(next.replace(/^[A-Za-z]+:\s*/, "").slice(0, 120));
  }
  return picks.slice(0, 4);
}
