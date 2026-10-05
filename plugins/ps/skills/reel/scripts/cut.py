#!/usr/bin/env python3
"""Cut the A-roll from reel.json: keep segments, speed, 9:16 framing, push-ins.

Usage: cut.py PROJECT/reel.json [--jobs N] [--no-preview]

Reads reel.json (source, speed, fps, size, framing, segments) and the transcript, writes:
  edit/pieces/*.mov    one frame-exact ProRes piece per segment (cached by spec hash)
  edit/aroll.mov       the concatenated A-roll — 10-bit ProRes, HDR kept as HLG, PCM audio
  edit/timeline.json   each segment's position on the OUTPUT timeline
  edit/words_out.json  every kept word re-timed to the output timeline (captions, beat anchors)
  edit/aroll_preview.mp4  small SDR preview to review the cut

Segment fields: in, out (source seconds), layout ("full" | "split"), optional
zoom [z0, z1] (push-in from z0 to z1 across the segment), optional speed override.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reel_common import (HLG_TO_SDR, SETP, TAGS, die, ffmpeg, load_json, load_plan,  # noqa: E402
                         probe, project_dir, resolve_source, save_json)


PIECE_FORMAT = 2  # bump when the piece encoding changes so cached pieces are rebuilt


def even(x: float) -> int:
    return max(2, int(round(x / 2.0)) * 2)


def crop_box(src_w: int, src_h: int, aspect: float, f: dict) -> tuple[int, int, int, int]:
    """Crop window of the given aspect (w/h), height = f.h * source height, centered at (cx, cy)."""
    ch = src_h * float(f.get("h", 1.0))
    cw = ch * aspect
    if cw > src_w:
        cw = src_w
        ch = cw / aspect
    cw, ch = even(cw), even(ch)
    x = min(max(src_w * float(f.get("cx", 0.5)) - cw / 2, 0), src_w - cw)
    y = min(max(src_h * float(f.get("cy", 0.5)) - ch / 2, 0), src_h - ch)
    return cw, ch, even(x) if x > 1 else 0, even(y) if y > 1 else 0


def video_filter(seg: dict, plan: dict, info: dict, speed: float) -> str:
    W, H = plan["size"]
    layout = seg.get("layout", "full")
    framing = plan.get("framing", {})
    if layout == "split":
        f = {"cx": 0.5, "cy": 0.5, "h": 0.72, **framing.get("split", {}), **seg.get("framing", {})}
        bw, bh = W, H // 2
    else:
        f = {"cx": 0.5, "cy": 0.5, "h": 1.0, **framing.get("full", {}), **seg.get("framing", {})}
        bw, bh = W, H
    cw, ch, cx, cy = crop_box(info["width"], info["height"], bw / bh, f)
    chain = [f"setpts=(PTS-STARTPTS)/{speed}", f"fps={plan['fps']}", f"crop={cw}:{ch}:{cx}:{cy}"]

    z = seg.get("zoom")
    if z:
        z0, z1 = float(z[0]), float(z[1])
        dur = max((seg["out"] - seg["in"]) / speed, 0.04)
        ax, ay = seg.get("zoom_anchor", plan.get("zoom_anchor", [0.5, 0.35]))
        Z = f"({z0}+({z1}-{z0})*min(t/{dur:.4f},1))"
        # Per-frame scale + fixed crop keeps 10-bit (zoompan would force 8-bit).
        chain += [
            f"scale=w='2*trunc({bw / 2}*{Z})':h='2*trunc({bh / 2}*{Z})':eval=frame:flags=lanczos",
            f"crop={bw}:{bh}:x='(iw-{bw})*{ax}':y='(ih-{bh})*{ay}'",
        ]
    else:
        chain.append(f"scale={bw}:{bh}:flags=lanczos")

    if layout == "split":
        pos = plan.get("framing", {}).get("split", {}).get("position", "bottom")
        chain.append(f"pad={W}:{H}:0:{H // 2 if pos == 'bottom' else 0}:black")

    if info["hdr"] == "pq":  # experimental: bring PQ (HDR10) into the HLG pipeline
        chain += ["zscale=tin=smpte2084:min=bt2020nc:pin=bt2020:rin=tv:t=arib-std-b67:npl=1000"]
    chain += ["setsar=1", "format=yuv422p10le"]
    return ",".join(chain)


def build_piece(i: int, seg: dict, plan: dict, info: dict, src: Path, pieces: Path) -> tuple[Path, int]:
    fps = plan["fps"]
    speed = float(seg.get("speed", plan["speed"]))
    span = seg["out"] - seg["in"]
    if span <= 0:
        die(f"segment {i}: out must be > in")
    n = max(1, round(span / speed * fps))
    dur = n / fps
    vf = video_filter(seg, plan, info, speed)
    kind = "sdr" if info["hdr"] == "sdr" else "hlg"
    af = (f"asetpts=PTS-STARTPTS,atempo={speed},aresample=48000,apad,atrim=0:{dur:.5f},"
          f"afade=t=in:d=0.012,afade=t=out:st={max(dur - 0.015, 0):.5f}:d=0.015,asetpts=PTS-STARTPTS")
    spec = json.dumps([PIECE_FORMAT, str(src), seg, plan["size"], plan["fps"], speed, plan.get("framing"),
                       vf, af, SETP[kind]], sort_keys=True)
    h = hashlib.sha1(spec.encode()).hexdigest()[:10]
    out = pieces / f"p{i:02d}_{h}.mov"
    if out.exists() and out.stat().st_size > 0:
        return out, n
    tmp = out.with_suffix(".part.mov")
    args = ["-ss", f"{seg['in']:.3f}", "-t", f"{span + 0.25:.3f}", "-i", str(src)]
    if not info["audio"]:
        args += ["-f", "lavfi", "-t", f"{dur:.5f}", "-i", "anullsrc=r=48000:cl=stereo"]
    args += ["-filter_complex", f"[0:v]{vf},{SETP[kind]},tpad=stop_mode=clone:stop_duration=0.5[v]",
             "-map", "[v]", "-frames:v", str(n),
             "-c:v", "prores_ks", "-profile:v", "3", "-vendor", "apl0", *TAGS[kind]]
    if info["audio"]:
        args += ["-map", "0:a:0", "-af", af]
    else:
        args += ["-map", "1:a"]
    args += ["-c:a", "pcm_s16le", "-ac", "2"]
    ffmpeg(args + [str(tmp)])
    tmp.rename(out)
    return out, n


def remap_words(transcript: dict, timeline: list[dict]) -> list[dict]:
    out = []
    for s in transcript.get("segments", []):
        for w in s.get("words", []):
            ws, we = float(w["start"]), float(w["end"])
            for t in timeline:
                a, b = t["in"], t["out"]
                ov = min(we, b) - max(ws, a)
                if ov > 0 and ov >= 0.5 * max(we - ws, 0.01):
                    sp = t["speed"]
                    st = t["start"] + (max(ws, a) - a) / sp
                    en = t["start"] + (min(we, b) - a) / sp
                    out.append({"w": w["w"], "start": round(st, 3), "end": round(min(en, t["end"]), 3),
                                "seg": s.get("id"), "p": w.get("p")})
                    break
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--jobs", type=int, default=max(1, min(4, (os.cpu_count() or 2) // 2)))
    ap.add_argument("--no-preview", action="store_true")
    a = ap.parse_args()

    plan = load_plan(a.plan)
    proj = project_dir(a.plan)
    src = resolve_source(a.plan, plan)
    info = probe(src)
    if not plan.get("segments"):
        die("reel.json has no segments")
    edit = proj / "edit"
    pieces = edit / "pieces"
    pieces.mkdir(parents=True, exist_ok=True)

    segs = plan["segments"]
    print(f"source {info['width']}x{info['height']} {info['hdr'].upper()} {info['fps']}fps → "
          f"{len(segs)} pieces @ {plan['speed']}x, jobs={a.jobs}", file=sys.stderr)
    with ThreadPoolExecutor(max_workers=a.jobs) as ex:
        results = list(ex.map(lambda p: build_piece(p[0], p[1], plan, info, src, pieces), enumerate(segs)))

    timeline, t = [], 0.0
    fps = plan["fps"]
    for i, (seg, (path, n)) in enumerate(zip(segs, results)):
        sp = float(seg.get("speed", plan["speed"]))
        timeline.append({"i": i, "in": seg["in"], "out": seg["out"], "speed": sp,
                         "layout": seg.get("layout", "full"), "start": round(t, 4),
                         "end": round(t + n / fps, 4), "frames": n, "piece": path.name})
        t += n / fps

    lst = pieces / "list.txt"
    lst.write_text("".join(f"file '{path.name}'\n" for path, _ in results))
    aroll = edit / "aroll.mov"
    ffmpeg(["-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(aroll)])
    save_json(edit / "timeline.json", {"source": str(src), "hdr": "sdr" if info["hdr"] == "sdr" else "hlg",
                                       "fps": fps, "size": plan["size"], "duration": round(t, 4),
                                       "frames": sum(n for _, n in results), "segments": timeline})

    tr = proj / "transcript" / "transcript.json"
    if tr.exists():
        words = remap_words(load_json(tr), timeline)
        save_json(edit / "words_out.json", words, indent=None)
        print(f"{len(words)} words re-timed → edit/words_out.json", file=sys.stderr)
    else:
        print("warning: transcript/transcript.json missing — no words_out.json", file=sys.stderr)

    if not a.no_preview:
        tm = (HLG_TO_SDR + ",") if info["hdr"] != "sdr" else ""
        ffmpeg(["-i", str(aroll), "-vf", f"{tm}scale=540:960:flags=bicubic,format=yuv420p,{SETP['sdr']}",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", *TAGS["sdr"],
                "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(edit / "aroll_preview.mp4")])
    print(f"A-roll {t:.2f}s ({sum(n for _, n in results)} frames) → {aroll}")


if __name__ == "__main__":
    main()
