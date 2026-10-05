# Setup and environment

`scripts/setup.sh` is idempotent. The first run installs and downloads (~3 GB, 5–10 min);
every later run only verifies (a few seconds) and rewrites `$REEL_CACHE/env.sh`.
The other scripts find the cache and load `env.sh` themselves — no `source` needed.

## What it sets up

| Piece | Where | Why |
| :--- | :--- | :--- |
| ffmpeg + ffprobe | system ffmpeg if it has every feature, else a static build (BtbN release, master as fallback) in `$REEL_CACHE/ffmpeg/bin` | needs `zscale`+`tonemap` (HDR→SDR), `ass`+`alphamerge` (captions), `colorchannelmixer`, `loudnorm`, libx264, libx265, prores_ks, HEVC decode |
| Python venv | `$REEL_CACHE/venv` (`$REEL_PY`) | faster-whisper, OpenCV, numpy — installed with pip, **no Homebrew** |
| Whisper model | `$REEL_CACHE/models/large-v3-turbo/` | downloaded **once**; `transcribe.py` loads the folder from disk afterwards (no network) |
| YuNet face model | `$REEL_CACHE/models/face_detection_yunet_2023mar.onnx` | QA face checks |
| Fonts | `$REEL_CACHE/fonts` (Inter, Poppins, JetBrains Mono) | captions and motion graphics use the same files, no system fonts |
| Remotion | `$REEL_CACHE/remotion/node_modules` | shared by every reel project (symlinked into `reels/<slug>/mg/`) |
| Headless browser | Remotion's Chrome Headless Shell, else a system Chromium | renders the motion graphics |

The static ffmpeg comes from BtbN's GitHub builds (`linux64` / `linuxarm64`, GPL).
Apple Silicon Macs run Docker containers as `linux/arm64` — that's handled.

## Hermes Agent with the Docker backend

- Hermes runs **one long-lived container** for all sessions (`container_persistent: true`,
  the default). Packages and files survive between chats, but recreating the container
  (image update, `container_persistent: false`) wipes anything outside the bind mounts.
- The cache therefore lives in **`/workspace/.cache/ps-reel`** — `/workspace` is
  bind-mounted to the host at `~/.hermes/sandboxes/docker/default/workspace/`, so the
  model and node_modules survive even a fresh container.
- Put source videos in that same host folder; reels are written to
  `/workspace/reels/<slug>/` and appear on the host right away.
- `terminal.docker_volumes` is currently ignored by Hermes (open upstream bug) — don't
  rely on extra mounts; use `/workspace`.
- Give the container real CPU: `terminal.container_cpu: 4` and `container_memory: 8192`
  in `~/.hermes/config.yaml`. With 1 CPU, transcription and renders are several times slower.
- Long commands: if the terminal tool times out, run in the background
  (`nohup … > reels/<slug>/logs/x.log 2>&1 &`) and poll the log.

Outside Docker (plain Linux, Cowork, CI) the cache defaults to `~/.cache/ps-reel`.
Override anything with `REEL_CACHE=/path`.

## Options and environment

```
setup.sh --check          report only; exit 1 if something is missing
setup.sh --skip-model     skip the Whisper download
setup.sh --skip-remotion  no motion graphics
setup.sh --model small    a smaller/faster Whisper (or a path to a local CTranslate2 folder)
REEL_WHISPER_MODEL=…      same as --model
REMOTION_BROWSER_EXECUTABLE=/path/to/chrome   use a specific browser
REMOTION_LICENSE_KEY=…    passed to Remotion renders (company license, if any)
```

## Troubleshooting

- **Model download fails** (Hugging Face blocked): set `HF_ENDPOINT` to a mirror and rerun,
  or copy a CTranslate2 Whisper folder into `$REEL_CACHE/models/<name>/` (needs `model.bin`).
- **`python3 -m venv` fails**: the base image lacks venv; install `python3-venv` or use an
  image with full Python (Hermes' default `nikolaik/python-nodejs` has it).
- **`remotion browser ensure` fails**: install Chromium in the container and rerun; setup
  falls back to it automatically (`chrome-for-testing` mode).
- **Fonts look wrong in captions**: `ls $REEL_CACHE/fonts` — Inter, three Poppins weights
  and JetBrains Mono must be there (scripts stop with an error if Poppins is missing).
- **Licensing**: Remotion is free for individuals and organizations up to 3 people; larger
  companies need a Remotion company license.
