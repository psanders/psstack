#!/usr/bin/env bash
# /ps:reel environment setup. Idempotent: the first run installs and downloads,
# every later run only verifies (a few seconds) and rewrites $REEL_CACHE/env.sh.
#
# Everything heavy lives in ONE cache folder so it survives between sessions:
#   Hermes in Docker (nousresearch/hermes-agent) -> /opt/data/cache/ps-reel (the data volume)
#   Hermes Docker terminal backend -> /workspace/.cache/ps-reel (bind-mounted to the host)
#   anywhere else         -> ${XDG_CACHE_HOME:-~/.cache}/ps-reel
# Override with REEL_CACHE=/some/path.
#
# Usage: setup.sh [--check] [--skip-model] [--skip-motion] [--model NAME]
#   --check          report only, install nothing, exit 1 if something is missing
#   --skip-model     don't download the Whisper model
#   --skip-motion    don't install the motion-graphics renderer
#   --model NAME     faster-whisper model (default: large-v3-turbo, or $REEL_WHISPER_MODEL)
set -uo pipefail

CHECK=0; SKIP_MODEL=0; SKIP_MOTION=0
MODEL="${REEL_WHISPER_MODEL:-large-v3-turbo}"
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK=1 ;;
    --skip-model) SKIP_MODEL=1 ;;
    --skip-motion) SKIP_MOTION=1 ;;
    --model) [ $# -ge 2 ] || { echo "--model needs a value" >&2; exit 2; }; MODEL="$2"; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$HERE")"
TEMPLATE="$SKILL_DIR/templates/motion"

if [ -z "${REEL_CACHE:-}" ]; then
  if [ -d /opt/data ] && [ -w /opt/data ]; then   # official Hermes image: /opt/data is the persisted volume
    REEL_CACHE=/opt/data/cache/ps-reel
  elif [ -d /workspace ] && [ -w /workspace ]; then
    REEL_CACHE=/workspace/.cache/ps-reel
  else
    REEL_CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/ps-reel"
  fi
fi
mkdir -p "$REEL_CACHE"/{bin,fonts,models,logs}
LOG="$REEL_CACHE/logs/setup.log"
: >"$LOG"

ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$*"; MISSING=1; }
MISSING=0

OS="$(uname -s)"; ARCH="$(uname -m)"
echo "ps-reel setup  cache=$REEL_CACHE  os=$OS/$ARCH"

# ---------------------------------------------------------------- ffmpeg
# The pipeline needs: zscale+tonemap (HDR->SDR), ass+alphamerge (captions with
# alpha), colorchannelmixer (graphics into HLG), loudnorm, libx264, libx265,
# prores_ks and an HEVC decoder (iPhone footage).
ffmpeg_ok() {
  local b="$1"
  [ -x "$b" ] || return 1
  local f e d
  f="$("$b" -hide_banner -filters 2>/dev/null)" || return 1
  e="$("$b" -hide_banner -encoders 2>/dev/null)"
  d="$("$b" -hide_banner -decoders 2>/dev/null)"
  for x in zscale tonemap ass alphamerge colorchannelmixer loudnorm overlay; do
    grep -qE "^ [^ ]+ +$x " <<<"$f" || return 1
  done
  for x in libx264 libx265 prores_ks aac; do
    grep -qE "^ [^ ]+ +$x " <<<"$e" || return 1
  done
  grep -qE "^ [^ ]+ +hevc " <<<"$d" || return 1
  return 0
}

echo "ffmpeg"
FFMPEG=""
if ffmpeg_ok "$REEL_CACHE/ffmpeg/bin/ffmpeg"; then
  FFMPEG="$REEL_CACHE/ffmpeg/bin/ffmpeg"
elif command -v ffmpeg >/dev/null 2>&1 && ffmpeg_ok "$(command -v ffmpeg)"; then
  FFMPEG="$(command -v ffmpeg)"
elif [ $CHECK -eq 0 ] && [ "$OS" = Linux ]; then
  case "$ARCH" in
    x86_64|amd64) FA=linux64 ;;
    aarch64|arm64) FA=linuxarm64 ;;
    *) FA="" ;;
  esac
  if [ -n "$FA" ]; then
    # a release build first (stable), the rolling master build as fallback
    REL="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest"
    for URL in "$REL/ffmpeg-n8.1-latest-${FA}-gpl-8.1.tar.xz" "$REL/ffmpeg-master-latest-${FA}-gpl.tar.xz"; do
      echo "  downloading static ffmpeg ($(basename "$URL"), ~160 MB) ..."
      TMP="$(mktemp -d)"
      if curl -fsSL --retry 3 -o "$TMP/ff.tar.xz" "$URL" >>"$LOG" 2>&1 && tar -xf "$TMP/ff.tar.xz" -C "$TMP" >>"$LOG" 2>&1; then
        rm -rf "$REEL_CACHE/ffmpeg"; mkdir -p "$REEL_CACHE/ffmpeg/bin"
        cp "$TMP"/ffmpeg-*/bin/ffmpeg "$TMP"/ffmpeg-*/bin/ffprobe "$REEL_CACHE/ffmpeg/bin/"
        ffmpeg_ok "$REEL_CACHE/ffmpeg/bin/ffmpeg" && FFMPEG="$REEL_CACHE/ffmpeg/bin/ffmpeg"
      fi
      rm -rf "$TMP"
      [ -n "$FFMPEG" ] && break
    done
  fi
fi
if [ -n "$FFMPEG" ]; then
  ok "$("$FFMPEG" -hide_banner -version | head -1 | cut -c1-60)  ($FFMPEG)"
  FFDIR="$(dirname "$FFMPEG")"
else
  bad "no ffmpeg with zscale/libass/libx265/prores (Linux: rerun without --check; macOS: install a full static build into $REEL_CACHE/ffmpeg/bin)"
  FFDIR=""
fi

# ---------------------------------------------------------------- python + faster-whisper
echo "whisper"
VENV="$REEL_CACHE/venv"
PY="$VENV/bin/python"
if [ ! -x "$PY" ] && [ $CHECK -eq 0 ]; then
  python3 -m venv "$VENV" >>"$LOG" 2>&1 || bad "python3 -m venv failed (install python3-venv) — see $LOG"
fi
if [ -x "$PY" ]; then
  if ! "$PY" -c "import faster_whisper, cv2, numpy" >/dev/null 2>&1; then
    if [ $CHECK -eq 0 ]; then
      "$PY" -m pip --version >/dev/null 2>&1 || "$PY" -m ensurepip --upgrade >>"$LOG" 2>&1
      echo "  installing faster-whisper + opencv into $VENV ..."
      "$PY" -m pip install -q --upgrade pip >>"$LOG" 2>&1
      "$PY" -m pip install -q "faster-whisper>=1.1,<2" "opencv-python-headless>=4.8" numpy >>"$LOG" 2>&1 \
        || bad "pip install failed — see $LOG"
    fi
  fi
  if "$PY" -c "import faster_whisper" >/dev/null 2>&1; then
    ok "faster-whisper $("$PY" -c 'import faster_whisper as f; print(f.__version__)')"
  else
    bad "faster-whisper not installed"
  fi
  if "$PY" -c "import cv2" >/dev/null 2>&1; then ok "opencv $("$PY" -c 'import cv2; print(cv2.__version__)') (QA face checks)"
  else bad "opencv not installed (QA face checks)"; fi
else
  bad "python venv missing ($VENV)"
fi

# Model: downloaded ONCE into $REEL_CACHE/models/<name>/ (a plain CTranslate2
# folder with model.bin). transcribe.py loads that folder directly, so later runs
# never touch the network. A --model that is already a local folder is used as is.
MODEL_DIR="$REEL_CACHE/models/$(echo "$MODEL" | tr '/' '_')"
[ -d "$MODEL" ] && MODEL_DIR="$MODEL"
MODEL_READY=0
if [ -s "$MODEL_DIR/model.bin" ]; then
  MODEL_READY=1
elif [ $CHECK -eq 0 ] && [ $SKIP_MODEL -eq 0 ] && [ -x "$PY" ] && "$PY" -c "import faster_whisper" >/dev/null 2>&1; then
  echo "  downloading whisper model '$MODEL' (once; ~1.6 GB for large-v3-turbo) ..."
  if "$PY" - "$MODEL" "$MODEL_DIR.part" >>"$LOG" 2>&1 <<'PYEOF'
import sys
from faster_whisper.utils import download_model
print(download_model(sys.argv[1], output_dir=sys.argv[2]))
PYEOF
  then
    rm -rf "$MODEL_DIR"; mv "$MODEL_DIR.part" "$MODEL_DIR"; rm -rf "$MODEL_DIR/.cache"
    [ -s "$MODEL_DIR/model.bin" ] && MODEL_READY=1
  fi
fi
if [ $MODEL_READY -eq 1 ]; then ok "model $MODEL → $MODEL_DIR"
elif [ $SKIP_MODEL -eq 1 ]; then warn "model $MODEL not cached (skipped)"
else bad "model $MODEL not cached (Hugging Face unreachable? set HF_ENDPOINT to a mirror, or pass --model with a local CTranslate2 folder) — see $LOG"; fi

# Face detector for the QA stage (YuNet, ~230 KB, from OpenCV's model zoo).
YUNET="$REEL_CACHE/models/face_detection_yunet_2023mar.onnx"
if [ -s "$YUNET" ] && head -c 200 "$YUNET" | grep -q 'git-lfs' && [ $CHECK -eq 0 ]; then
  rm -f "$YUNET"  # an LFS pointer, not the model
fi
if [ ! -s "$YUNET" ] && [ $CHECK -eq 0 ]; then
  curl -fsSL --retry 3 -o "$YUNET.part" \
    "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx" \
    >>"$LOG" 2>&1 && mv "$YUNET.part" "$YUNET"
fi
if [ -s "$YUNET" ] && [ "$(head -c 200 "$YUNET" | grep -c 'git-lfs')" = 0 ]; then ok "YuNet face detector"
else bad "YuNet face model missing ($YUNET)"; fi

# ---------------------------------------------------------------- fonts
# Captions (libass) and motion graphics (headless Chrome) read the same TTFs, so the
# look is identical everywhere and nothing depends on system fonts.
echo "fonts"
GF="https://raw.githubusercontent.com/google/fonts/main/ofl"
fetch_font() { # name url
  local dst="$REEL_CACHE/fonts/$1"
  [ -s "$dst" ] && return 0
  [ $CHECK -eq 1 ] && return 1
  curl -fsSL --retry 3 -o "$dst.part" "$2" >>"$LOG" 2>&1 && mv "$dst.part" "$dst"
}
FONTS_OK=1
fetch_font "Inter.ttf" "$GF/inter/Inter%5Bopsz,wght%5D.ttf" || FONTS_OK=0
for w in SemiBold Bold ExtraBold; do
  fetch_font "Poppins-$w.ttf" "$GF/poppins/Poppins-$w.ttf" || FONTS_OK=0
done
fetch_font "JetBrainsMono.ttf" "$GF/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" || FONTS_OK=0
if [ $FONTS_OK -eq 1 ]; then ok "Inter, Poppins, JetBrains Mono in $REEL_CACHE/fonts"; else bad "fonts missing in $REEL_CACHE/fonts"; fi

# ---------------------------------------------------------------- motion graphics
# Claude Design–style scenes (React + Stage/Sprite/useTime) bundled with esbuild and
# rendered frame by frame by puppeteer-core in headless Chrome. One shared node_modules
# in the cache; each reel project symlinks to it.
MOTION_DIR="$REEL_CACHE/motion"
BROWSER_EXE="${REEL_BROWSER:-}"
# Caches from before the motion engine change (v0.25) kept a separate renderer here.
if [ -d "$REEL_CACHE/remotion" ] && [ $CHECK -eq 0 ]; then
  rm -rf "$REEL_CACHE/remotion" && echo "  removed the old renderer cache ($REEL_CACHE/remotion)"
fi
if [ $SKIP_MOTION -eq 0 ]; then
  echo "motion graphics"
  if ! command -v node >/dev/null 2>&1; then
    bad "node not found (needs Node 18+)"
  else
    mkdir -p "$MOTION_DIR"
    WANT="$( (sha1sum "$TEMPLATE/package.json" 2>/dev/null || shasum "$TEMPLATE/package.json") | cut -c1-12)"
    HAVE="$(cat "$MOTION_DIR/.pkg-hash" 2>/dev/null || true)"
    if [ "$WANT" != "$HAVE" ] || [ ! -d "$MOTION_DIR/node_modules/puppeteer-core" ]; then
      if [ $CHECK -eq 0 ]; then
        echo "  npm install (once; ~1 min) ..."
        cp "$TEMPLATE/package.json" "$MOTION_DIR/package.json"
        if (cd "$MOTION_DIR" && npm install --no-audit --no-fund --loglevel=error >>"$LOG" 2>&1); then
          echo "$WANT" >"$MOTION_DIR/.pkg-hash"
        else
          bad "npm install failed — see $LOG"
        fi
      fi
    fi
    if [ -d "$MOTION_DIR/node_modules/puppeteer-core" ] && [ -d "$MOTION_DIR/node_modules/esbuild" ]; then
      ok "react + esbuild + puppeteer-core"
    else
      bad "motion packages not installed"
    fi
    # Headless browser: REEL_BROWSER, a previously downloaded one, Chrome Headless Shell
    # (downloaded once into the cache), then a system Chromium.
    if [ -z "$BROWSER_EXE" ]; then
      BROWSER_EXE="$(find "$REEL_CACHE/browser" -type f -name chrome-headless-shell 2>/dev/null | head -1)"
    fi
    if [ -z "$BROWSER_EXE" ] && [ $CHECK -eq 0 ] && [ -d "$MOTION_DIR/node_modules/@puppeteer/browsers" ]; then
      echo "  downloading Chrome Headless Shell (once; ~90 MB) ..."
      (cd "$MOTION_DIR" && npx --no-install @puppeteer/browsers install chrome-headless-shell@stable --path "$REEL_CACHE/browser" >>"$LOG" 2>&1)
      BROWSER_EXE="$(find "$REEL_CACHE/browser" -type f -name chrome-headless-shell 2>/dev/null | head -1)"
    fi
    if [ -z "$BROWSER_EXE" ]; then
      for c in chromium chromium-browser google-chrome google-chrome-stable; do
        if command -v "$c" >/dev/null 2>&1; then BROWSER_EXE="$(command -v "$c")"; break; fi
      done
    fi
    if [ -n "$BROWSER_EXE" ] && [ -x "$BROWSER_EXE" ]; then ok "browser $BROWSER_EXE"
    else bad "no headless Chrome for the motion graphics — see $LOG (or set REEL_BROWSER)"; BROWSER_EXE=""; fi
  fi
fi

# ---------------------------------------------------------------- env.sh
[ $MODEL_READY -eq 1 ] && MODEL_ENV="$MODEL_DIR" || MODEL_ENV="$MODEL"
if [ $CHECK -eq 1 ]; then
  [ $MISSING -eq 0 ] && echo "ready" || echo "incomplete → rerun without --check (log: $LOG)"
  exit $MISSING
fi
{
  echo "# generated by ps-reel setup.sh — source me"
  echo "export REEL_CACHE='$REEL_CACHE'"
  echo "export REEL_FONTS='$REEL_CACHE/fonts'"
  echo "export REEL_MOTION='$MOTION_DIR'"
  echo "export REEL_PY='$PY'"
  echo "export REEL_WHISPER_MODEL='$MODEL_ENV'"
  [ -n "$FFDIR" ] && echo "export PATH='$FFDIR':\"\$PATH\""
  [ -n "$BROWSER_EXE" ] && echo "export REEL_BROWSER='$BROWSER_EXE'"
} >"$REEL_CACHE/env.sh"

echo
if [ $MISSING -eq 0 ]; then
  echo "ready → source $REEL_CACHE/env.sh"
else
  echo "incomplete → fix the ✗ items above (log: $LOG)"
fi
exit $MISSING
