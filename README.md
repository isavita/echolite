# EchoLite Setup Guide

## Local-only Transcription (macOS, Apple Silicon)

> Private by design: audio stays on your Mac. Requires Homebrew.

### Install dependencies

```bash
# whisper.cpp + ffmpeg
brew install whisper-cpp ffmpeg
```

### Download a model

For a good speed/quality balance on M2 16 GB:

* **Recommended**: `ggml-medium.en.bin` (English-only, solid accuracy)
* Faster alternative: `ggml-small.en.bin` (smaller, less accurate)
* Heavier: `ggml-large-v3.bin` (best accuracy, slower; may be overkill for meetings)

```bash
mkdir -p ~/models/whisper && cd ~/models/whisper
curl -L -o ggml-medium.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin
```

> Tip (Apple Silicon / Metal): if the Homebrew build needs Metal resources, set:
>
> ```bash
> export GGML_METAL_PATH_RESOURCES="$(brew --prefix whisper-cpp)/share/whisper-cpp"
> ```
>
> You can add that to your shell profile so it’s always set.

### Configure EchoLite to use whisper.cpp

1. Open **Settings → Transcribe**.
2. Set:

   * **Engine**: `whisper_cpp`
   * **Binary path**: `/opt/homebrew/bin/whisper-cpp` (default for Homebrew on Apple Silicon)
   * **Model path**: `~/models/whisper/ggml-medium.en.bin` (or your chosen model)
   * **Language**: `en`
3. Click **Save**.

You can also edit `configs/echolite.models.json` manually:

```json
"transcribe": {
  "engine": "whisper_cpp",
  "binaryPath": "/opt/homebrew/bin/whisper-cpp",
  "modelPath": "~/models/whisper/ggml-medium.en.bin",
  "language": "en",
  "responseFormat": "text",
  "systemPrompt": "Transcribe clearly with speaker cues when possible."
}
```

### Use it

* Go to the **Transcribe** tab → upload audio → **Transcribe**.
* The app converts audio to 16kHz mono WAV (via `ffmpeg`) and runs `whisper-cpp`.
* The transcript appears and can be downloaded as `.txt`.

### Troubleshooting

* **Command not found**:

  * `ffmpeg`: `brew install ffmpeg`
  * `whisper-cpp`: `brew install whisper-cpp`
* **Metal resources error**: export `GGML_METAL_PATH_RESOURCES` as shown above.
* **Permission denied**: make sure the binary path is executable (`chmod +x` not usually needed for Homebrew).
* **Performance**:

  * Use `ggml-small.en.bin` for faster runs.
  * Close heavy apps; the route uses `-t N` threads (auto-chosen up to 8).
* **Long files**: This runs fully locally. For 30–45 min meetings on M2, `medium.en` is a good balance; `small.en` is faster if you’re in a rush.

---

### Local LLM for “Ask (transcript)” with Ollama (macOS, Apple Silicon)

```bash
# 1) Install Ollama (Homebrew)
brew install ollama

# 2) Start the Ollama service
#   - macOS GUI app also available; Homebrew service runs in the background.
ollama serve

# 3) Pull the model (Qwen 3, 8B parameters)
#   Notes:
#   - Works on M2 16GB; if you hit memory limits, try qwen3:4b or qwen2.5:7b.
#   - Ollama uses Apple Metal by default for acceleration on Apple Silicon.
ollama pull qwen3:8b

# 4) (Optional) Quick sanity test
ollama run qwen3:8b -p "Say hi in one short sentence."
```

**Configure EchoLite → Settings → “Ask (transcript)”**

* **Model:** `qwen3:8b`
* **Base URL:** `http://localhost:11434`
* **API Key Env:** (leave empty; not needed for local Ollama)
* **Temperature:** 0.2 (or your preference)
* **System instruction:** (your default behaviour, e.g. “You analyze meeting transcripts precisely and answer user instructions.”)

> You can also edit `configs/echolite.models.json` directly:
>
> ```json
> "askText": {
>   "model": "qwen3:8b",
>   "baseURL": "http://localhost:11434",
>   "apiKeyEnv": "LLM_API_KEY",
>   "temperature": 0.2,
>   "systemPrompt": "You analyze meeting transcripts precisely and answer user instructions."
> }
> ```

**Troubleshooting (Ollama)**

* If `ollama serve` says the port is busy, stop other LLM servers on `11434` or set `OLLAMA_HOST=127.0.0.1:11435` (and update Base URL).
* If memory is tight on a 16GB laptop, try `qwen3:4b` or `qwen2.5:7b` for faster/lighter runs.
* First response may be slower due to model load; subsequent prompts are faster.

---
