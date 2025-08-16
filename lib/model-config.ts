import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";

export type ModelsConfig = {
  askAudio: {
    model: string;
    baseURL: string;
    apiKeyEnv: string;
    temperature: number;
    systemPrompt: string;
  };
  transcribe: {
    engine: "whisper_cpp" | "openai_compatible";
    // Local engine fields (whisper.cpp)
    binaryPath?: string; // e.g., /opt/homebrew/bin/whisper-cpp
    modelPath?: string; // e.g., ~/models/whisper/ggml-medium.en.bin
    language?: string; // e.g., en
    threads?: number; // e.g., 4
    // Remote (optional, future)
    model?: string;
    baseURL?: string;
    apiKeyEnv?: string;
    responseFormat: "text" | "verbose_json";
    systemPrompt?: string;
  };
  askText: {
    model: string;
    baseURL: string;
    apiKeyEnv: string;
    temperature: number;
    systemPrompt: string;
  };
};

export const CONFIG_PATH = path.join(process.cwd(), "configs", "echolite.models.json");

export const DEFAULT_CONFIG: ModelsConfig = {
  askAudio: {
    model: "mock-llm",
    baseURL: "http://localhost:4000/v1",
    apiKeyEnv: "LLM_API_KEY",
    temperature: 0.2,
    systemPrompt: "You are an assistant that answers questions directly from audio content."
  },
  transcribe: {
    engine: "whisper_cpp",
    binaryPath: "/opt/homebrew/bin/whisper-cpp",
    modelPath: path.join(os.homedir(), "models/whisper/ggml-medium.en.bin"),
    language: "en",
    threads: 4,
    responseFormat: "text",
    systemPrompt: "Transcribe clearly with speaker cues when possible."
  },
  askText: {
    model: "qwen3:8b",
    baseURL: "http://localhost:11434",
    apiKeyEnv: "LLM_API_KEY",
    temperature: 0.2,
    systemPrompt: "You analyse meeting transcripts precisely and answer user instructions."
  }
};

export async function ensureConfig(): Promise<ModelsConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ModelsConfig>;
    return mergeWithDefaults(parsed);
  } catch {
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
    return DEFAULT_CONFIG;
  }
}

export async function loadModelConfig(): Promise<ModelsConfig> {
  return ensureConfig();
}

export async function saveModelConfig(cfg: ModelsConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
}

// Deep-merge with sensible defaults; preserves existing files without engine field.
export function mergeWithDefaults(input: Partial<ModelsConfig>): ModelsConfig {
  const d = DEFAULT_CONFIG;
  const out: ModelsConfig = {
    askAudio: { ...d.askAudio, ...(input.askAudio || {}) },
    transcribe: { ...d.transcribe, ...(input.transcribe || {}) },
    askText: { ...d.askText, ...(input.askText || {}) }
  };
  // Backfill engine defaults if missing
  if (!out.transcribe.engine) out.transcribe.engine = "whisper_cpp";
  if (!out.transcribe.language) out.transcribe.language = "en";
  if (!out.transcribe.responseFormat) out.transcribe.responseFormat = "text";
  return out;
}

// Utility for tilde expansion in model paths
export function expandHome(p?: string): string | undefined {
  if (!p) return p;
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  if (p === "~") return os.homedir();
  return p;
}
