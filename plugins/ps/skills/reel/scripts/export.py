#!/usr/bin/env python3
"""Encode platform deliverables from the language masters, then verify each file.

Usage: export.py PROJECT/reel.json [--only ig,linkedin] [--preset medium]

reel.json "exports": ["ig", "x", "linkedin", "tiktok"] or objects
  {"name": "linkedin", "lang": "en", "cover": "out/cover_en.jpg"}

  ig        Instagram Reels — keeps HDR (HEVC Main10 HLG) when the source is HDR
  x         X/Twitter — SDR H.264 (validated HLG→SDR tone map), spoken language
  linkedin  LinkedIn — SDR H.264, English by default, cover baked into frame 0
            (LinkedIn's web composer often drops the video when a custom thumbnail is
            added, and the thumbnail can't be changed after posting; the feed shows frame 0)
  tiktok    TikTok — SDR H.264, spoken language

Writes out/<slug>_<platform>_<lang>.mp4 and out/exports.json (probe + checks per file).
"""
from __future__ import annotations

import argparse
import json
import re
import struct
import sys
from fractions import Fraction
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reel_common import (COVER_TO_709, SETP, TAGS, die, ffmpeg, load_plan, probe,  # noqa: E402
                         project_dir, run, save_json, tool)

PRESETS = {
    "ig": {"hdr": "keep", "crf": 18, "maxrate": None, "audio_k": 256, "max_mb": 4000},
    "x": {"hdr": "sdr", "crf": 19, "maxrate": "12M", "audio_k": 192, "max_mb": 512},
    "linkedin": {"hdr": "sdr", "crf": 18, "maxrate": "10M", "audio_k": 160, "max_mb": 5000, "cover_frame": True, "lang": "en"},
    "tiktok": {"hdr": "sdr", "crf": 18, "maxrate": "15M", "audio_k": 192, "max_mb": 4000},
}


def moov_first(path: Path) -> bool:
    with open(path, "rb") as f:
        while True:
            h = f.read(8)
            if len(h) < 8:
                return False
            size, typ = struct.unpack(">I4s", h)
            if size == 0:  # box runs to end of file
                return typ == b"moov"
            if typ == b"moov":
                return True
            if typ == b"mdat":
                return False
            if size == 1:
                size = struct.unpack(">Q", f.read(8))[0]
                f.seek(size - 16, 1)
            else:
                f.seek(size - 8, 1)


def cover_chain(W: int, H: int) -> str:
    """sRGB cover image → the exact frame export puts at n=0 (verify uses the same chain)."""
    return f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},{COVER_TO_709},format=yuv420p,setsar=1"


def encode(master: Path, out: Path, preset: dict, cover: Path | None, x_preset: str, W: int, H: int, fps: int):
    # masters are already in their final color space: *_hdr = HLG, *_sdr = BT.709 (see assemble.py)
    keep_hdr = master.name.endswith("_hdr.mov")
    inputs = ["-i", str(master)]
    vf = f"format=yuv420p10le,{SETP['hlg']}" if keep_hdr else f"format=yuv420p,{SETP['sdr']}"
    if cover:
        inputs += ["-loop", "1", "-framerate", str(fps), "-i", str(cover)]
        fc = (f"[0:v]{vf}[base];[1:v]{cover_chain(W, H)}[c];"
              f"[base][c]overlay=0:0:enable='eq(n,0)':shortest=1,format=yuv420p,{SETP['sdr']}[v]")
        vmap = ["-filter_complex", fc, "-map", "[v]"]
    else:
        vmap = ["-vf", vf, "-map", "0:v"]
    if keep_hdr:
        venc = ["-c:v", "libx265", "-preset", x_preset, "-crf", str(preset["crf"]), "-pix_fmt", "yuv420p10le",
                "-profile:v", "main10", "-tag:v", "hvc1",
                "-x265-params", "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited:repeat-headers=1:log-level=error",
                *TAGS["hlg"]]
    else:
        venc = ["-c:v", "libx264", "-preset", x_preset, "-crf", str(preset["crf"]), "-profile:v", "high", "-level", "4.1",
                "-pix_fmt", "yuv420p", "-g", "60", *TAGS["sdr"]]
        if preset.get("maxrate"):
            mr = preset["maxrate"]
            venc += ["-maxrate", mr, "-bufsize", f"{int(mr[:-1]) * 2}M"]
    ffmpeg(inputs + vmap + ["-map", "0:a", *venc, "-c:a", "aac", "-b:a", f"{preset['audio_k']}k", "-ar", "48000", "-ac", "2",
                            "-map_metadata", "-1", "-movflags", "+faststart", str(out)])
    return keep_hdr


def verify(out: Path, master: Path, preset: dict, keep_hdr: bool, cover: Path | None, W: int, H: int, fps: int) -> dict:
    p = json.loads(run([tool("ffprobe"), "-v", "error", "-show_streams", "-show_format", "-of", "json", str(out)]).stdout)
    v = next(s for s in p["streams"] if s["codec_type"] == "video")
    a = next((s for s in p["streams"] if s["codec_type"] == "audio"), None)
    mdur = probe(master)["duration"]
    size_mb = out.stat().st_size / 1e6
    checks = {
        "codec": (v["codec_name"] == ("hevc" if keep_hdr else "h264"), v["codec_name"]),
        "size": ((int(v["width"]), int(v["height"])) == (W, H), f"{v['width']}x{v['height']}"),
        "fps": (abs(float(Fraction(v.get("avg_frame_rate") or "0/1")) - fps) < 0.1, v.get("avg_frame_rate")),
        "color": ((v.get("color_transfer") == ("arib-std-b67" if keep_hdr else "bt709")), v.get("color_transfer")),
        "pix_fmt": (v.get("pix_fmt") == ("yuv420p10le" if keep_hdr else "yuv420p"), v.get("pix_fmt")),
        "audio": (a is not None and a["codec_name"] == "aac" and a.get("sample_rate") == "48000", a and a["codec_name"]),
        "duration": (abs(float(p["format"]["duration"]) - mdur) < 0.12, f"{float(p['format']['duration']):.2f}s vs {mdur:.2f}s"),
        "file_size": (size_mb <= preset["max_mb"], f"{size_mb:.1f} MB (max {preset['max_mb']})"),
        "faststart": (moov_first(out), "moov before mdat"),
    }
    if keep_hdr:
        checks["hvc1_tag"] = (v.get("codec_tag_string") == "hvc1", v.get("codec_tag_string"))
    if cover:
        r = run([tool("ffmpeg"), "-hide_banner", "-nostdin", "-i", str(out), "-loop", "1", "-i", str(cover), "-filter_complex",
                 f"[0:v]select='eq(n,0)',setpts=N/TB[a];[1:v]{cover_chain(W, H)},setpts=N/TB[b];[a][b]psnr",
                 "-frames:v", "1", "-f", "null", "-"], check=False)
        m = re.search(r"average:([\d.]+|inf)", r.stderr)
        ps = float("inf") if m and m.group(1) == "inf" else float(m.group(1)) if m else 0
        checks["cover_frame0"] = (ps >= 28, f"PSNR {ps:.1f} dB vs cover")
    ok = all(c[0] for c in checks.values())
    return {"file": str(out), "ok": ok, "size_mb": round(size_mb, 1), "checks": {k: {"ok": c[0], "value": c[1]} for k, c in checks.items()}}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--only")
    ap.add_argument("--preset", default="medium", help="x264/x265 preset (use veryfast for drafts)")
    a = ap.parse_args()
    plan = load_plan(a.plan)
    proj = project_dir(a.plan)
    W, H = plan["size"]
    slug = plan.get("slug") or proj.name
    spoken = plan["languages"][0]
    only = set(a.only.split(",")) if a.only else None
    results = []
    for e in plan.get("exports", ["ig", "x", "linkedin"]):
        e = {"name": e} if isinstance(e, str) else dict(e)
        name = e["name"]
        if only and name not in only:
            continue
        if name not in PRESETS:
            die(f"unknown export '{name}' (have: {', '.join(PRESETS)})")
        preset = {**PRESETS[name], **{k: v for k, v in e.items() if k in PRESETS[name]}}
        lang = e.get("lang") or preset.get("lang") or spoken
        if lang not in plan["languages"]:
            lang = spoken
        hdr_m = proj / "out" / f"master_{lang}_hdr.mov"
        sdr_m = proj / "out" / f"master_{lang}_sdr.mov"
        master = hdr_m if preset["hdr"] == "keep" and hdr_m.exists() else sdr_m  # assemble deletes stale HDR masters
        if not master.exists():
            die(f"{master} missing — run assemble.py --lang {lang}")
        cover = None
        if preset.get("cover_frame"):
            c = e.get("cover") or f"out/cover_{lang}.jpg"
            cp = Path(c) if Path(c).is_absolute() else proj / c
            cover = cp if cp.exists() else None
            if cover is None:
                print(f"note: {name}: no cover at {cp} — frame 0 stays the video's own first frame", file=sys.stderr)
        out = proj / "out" / f"{slug}_{name}_{lang}.mp4"
        print(f"→ {out.name} …", file=sys.stderr, flush=True)
        keep_hdr = encode(master, out, preset, cover, a.preset, W, H, plan["fps"])
        res = verify(out, master, preset, keep_hdr, cover, W, H, plan["fps"])
        res.update({"platform": name, "lang": lang, "hdr": keep_hdr})
        results.append(res)
        bad = [f"{k}={c['value']}" for k, c in res["checks"].items() if not c["ok"]]
        print(f"  {'OK ' if res['ok'] else 'FAIL'} {out.name}  {res['size_mb']} MB  {'HDR' if keep_hdr else 'SDR'}"
              + (f"  ✗ {', '.join(bad)}" if bad else ""))
    save_json(proj / "out" / "exports.json", results)
    sys.exit(0 if all(r["ok"] for r in results) else 1)


if __name__ == "__main__":
    main()
