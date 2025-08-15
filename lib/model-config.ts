import path from "node:path";
import { promises as fs } from "node:fs";

export type ModelsConfig = {
  askAudio: {
    model: string;
    baseURL: string;
    apiKeyEnv: string;
    temperature: number;
    systemPrompt: string;
  };
  transcribe: {
    model: string;
    baseURL: string;
    apiKeyEnv: string;
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
    model: "whisper-large-v3",
    baseURL: "http://localhost:9090/v1",
    apiKeyEnv: "ASR_API_KEY",
    responseFormat: "text",
    systemPrompt: "Transcribe clearly with speaker cues when possible."
  },
  askText: {
    model: "mock-llm",
    baseURL: "http://localhost:4000/v1",
    apiKeyEnv: "LLM_API_KEY",
    temperature: 0.2,
    systemPrompt: "You analyze meeting transcripts precisely and answer user instructions."
  }
};

export async function ensureConfig(): Promise<ModelsConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as ModelsConfig;
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

export function mergeWithDefaults(input: Partial<ModelsConfig>): ModelsConfig {
  const d = DEFAULT_CONFIG;
  return {
    askAudio: { ...d.askAudio, ...(input.askAudio || {}) },
    transcribe: { ...d.transcribe, ...(input.transcribe || {}) },
    askText: { ...d.askText, ...(input.askText || {}) }
  };
}
