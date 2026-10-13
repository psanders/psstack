#!/usr/bin/env python3
"""Transcribe a video with faster-whisper: word-level timestamps, offline after setup.

Re-launches itself under the venv setup.sh created, so plain python3 works:
    python3 transcribe.py VIDEO --out PROJECT/transcript --lang es --hotwords "QCobro"

Writes into --out:
  audio16k.wav      16 kHz mono audio (reused by later steps)
  transcript.json   {language, duration, model, segments:[{id,start,end,text,words:[{w,start,end,p}]}]}
  transcript.txt    one numbered line per segment with times — what you read to plan the cut
  hints.md          cleanup candidates: long pauses, filler words, low-confidence words, likely retakes

Next: gate.py transcript PROJECT/reel.json — Pedro validates the transcript before the cut.
"""
from __future__ import annotations

import argparse
import difflib
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reel_common import die, ensure_venv, ffmpeg, norm_word, save_json  # noqa: E402

ensure_venv(["faster_whisper"])

FILLERS = {
    "es": ["eh", "em", "emm", "mmm", "este", "ehh", "o sea", "pues", "bueno", "digamos", "verdad"],
    "en": ["um", "uh", "erm", "hmm", "like", "you know", "i mean", "basically", "actually", "kind of", "sort of"],
}


def fmt(t: float) -> str:
    m, s = divmod(max(t, 0.0), 60)
    return f"{int(m):02d}:{s:05.2f}"


def resolve_model(name: str) -> tuple[str, dict]:
    """Prefer a local CTranslate2 folder: the arg itself, or $REEL_CACHE/models/<name>."""
    if Path(name).is_dir():
        return name, {}
    if name.startswith(("/", ".", "~")):
        name = Path(name).name  # a model folder that was never downloaded → use its model name
    cache = os.environ.get("REEL_CACHE")
    if cache:
        local = Path(cache) / "models" / name.replace("/", "_")
        if (local / "model.bin").exists():
            return str(local), {}
        print(f"warning: {local} missing — downloading now (run setup.sh so this happens once)", file=sys.stderr)
        return name, {"download_root": str(Path(cache) / "models" / "hf")}
    return name, {}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--out", required=True)
    ap.add_argument("--lang", default="auto", help="es, en, ... or auto")
    ap.add_argument("--model", default=os.environ.get("REEL_WHISPER_MODEL", "large-v3-turbo"))
    ap.add_argument("--hotwords", default="", help="comma-separated names/terms to bias toward (brand, product)")
    ap.add_argument("--prompt", default=None, help="initial prompt (style/vocabulary hint)")
    ap.add_argument("--threads", type=int, default=os.cpu_count() or 4)
    ap.add_argument("--beam", type=int, default=5)
    ap.add_argument("--no-vad", action="store_true",
                    help="don't drop audio the voice detector thinks is silence (use when the review shows missing speech)")
    a = ap.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        die("faster_whisper not importable — run with \"$REEL_PY\" (the venv from setup.sh)")

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    wav = out / "audio16k.wav"
    ffmpeg(["-i", a.video, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(wav)])

    model_path, kw = resolve_model(a.model)
    t0 = time.time()
    model = WhisperModel(model_path, device="cpu", compute_type="int8", cpu_threads=a.threads, **kw)
    hot = ", ".join(h.strip() for h in a.hotwords.split(",") if h.strip()) or None
    segments, info = model.transcribe(
        str(wav),
        language=None if a.lang == "auto" else a.lang,
        beam_size=a.beam,
        word_timestamps=True,
        vad_filter=not a.no_vad,
        vad_parameters={"min_silence_duration_ms": 350, "speech_pad_ms": 150},
        condition_on_previous_text=False,
        initial_prompt=a.prompt,
        hotwords=hot,
    )

    segs = []
    for i, s in enumerate(segments, 1):
        words = [
            {"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3), "p": round(w.probability, 3)}
            for w in (s.words or []) if w.word.strip()
        ]
        segs.append({"id": f"S{i:02d}", "start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip(), "words": words})
        print(f"[{fmt(s.start)}–{fmt(s.end)}] S{i:02d} {s.text.strip()}", flush=True)

    approvals = out.parent / "approvals.json"
    if approvals.exists():  # a new transcript needs a new validation
        import json as _json
        rec = _json.loads(approvals.read_text(encoding="utf-8"))
        if rec.pop("transcript", None) is not None:
            save_json(approvals, rec)
            print("previous transcript approval cleared — validate the new one", file=sys.stderr)

    data = {
        "language": info.language,
        "language_probability": round(info.language_probability, 3),
        "duration": round(info.duration, 3),
        "model": a.model,
        "segments": segs,
    }
    save_json(out / "transcript.json", data)
    with open(out / "transcript.txt", "w", encoding="utf-8") as f:
        for s in segs:
            f.write(f"{s['id']} [{fmt(s['start'])}–{fmt(s['end'])}] {s['text']}\n")
    write_hints(out / "hints.md", segs, info.language)
    print(f"\n{len(segs)} segments, language={info.language} ({info.language_probability:.2f}), "
          f"{time.time() - t0:.0f}s → {out}", file=sys.stderr)


def write_hints(path: Path, segs: list[dict], lang: str):
    words = [dict(w, seg=s["id"]) for s in segs for w in s["words"]]
    lines = ["# Cleanup hints", "",
             "Candidates only — judge each one by listening/reading in context.", ""]

    lines += ["## Pauses ≥ 0.6 s (tighten to ~0.15–0.25 s)", ""]
    for a, b in zip(words, words[1:]):
        gap = b["start"] - a["end"]
        if gap >= 0.6:
            lines.append(f"- {fmt(a['end'])} → {fmt(b['start'])} ({gap:.2f}s) after “{a['w']}” ({a['seg']})")

    lines += ["", "## Filler words", ""]
    fill = FILLERS.get((lang or "")[:2], []) + FILLERS["en"]
    toks = [norm_word(w["w"]) for w in words]
    for f in sorted(set(fill), key=len, reverse=True):
        ft = [norm_word(x) for x in f.split()]
        for i in range(len(toks) - len(ft) + 1):
            if toks[i:i + len(ft)] == ft:
                ctx = " ".join(w["w"] for w in words[max(0, i - 3): i + len(ft) + 3])
                lines.append(f"- “{f}” at {fmt(words[i]['start'])} ({words[i]['seg']}): …{ctx}…")

    lines += ["", "## Low-confidence words (check spelling, names, numbers)", ""]
    for w in words:
        if w["p"] < 0.45:
            lines.append(f"- “{w['w']}” at {fmt(w['start'])} ({w['seg']}) p={w['p']}")

    lines += ["", "## Possible retakes (similar wording close together — usually keep the LAST take)", ""]
    for i, s in enumerate(segs):
        for t in segs[i + 1:i + 4]:
            if t["start"] - s["end"] > 20:
                break
            r = difflib.SequenceMatcher(None, norm_word(s["text"][:60]), norm_word(t["text"][:60])).ratio()
            if r >= 0.55:
                lines.append(f"- {s['id']} ≈ {t['id']} ({r:.2f}): “{s['text'][:70]}” / “{t['text'][:70]}”")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
