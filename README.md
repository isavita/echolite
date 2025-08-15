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
