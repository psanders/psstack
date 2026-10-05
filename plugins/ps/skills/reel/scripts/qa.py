#!/usr/bin/env python3
"""Automated review of an assembled reel — the checks that usually go wrong in an edit.

Re-launches itself under the setup venv (numpy + opencv), so plain python3 works:
    python3 qa.py PROJECT/reel.json --lang es

Machine checks (every sampled frame, default 5 fps):
  layout    graphics touching the frame/panel edge (cut off), graphics outside the
            platform safe zone, captions overlapping graphics, two graphics overlapping
  faces     speaker's head cropped by framing/zoom, face covered by a caption or graphic,
            segments where no face is found (framing drifted off the speaker)
  edit      cuts landing inside a word, split-screen spans with no panel on top
  picture   black frames, frozen picture
  audio     integrated loudness vs target, true peak, long silences
  captions  chunks too short to read, reading speed too high
Visual review material for the agent's own eyes (references/qa.md has the checklist):
  qa/<lang>/timeline_NN.jpg   a frame every second, time-stamped
  qa/<lang>/events_NN.jpg     every beat's in/middle/out and both sides of every cut
Writes qa/<lang>/report.md + report.json (regenerated every run) and creates
qa/<lang>/ai_review.md once — the agent's visual findings live there across rounds.
Exit 1 when any ERROR remains.
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reel_common import (contact_sheet, die, ensure_venv, ffmpeg, grab_frame,  # noqa: E402
                         load_json, load_plan, project_dir, require_fonts, run, save_json, tool)

ensure_venv(["numpy", "cv2"])
import numpy as np  # noqa: E402

SAFE = {"top": 220, "bottom": 400, "rail": 130, "side": 40}  # px at 1080x1920
S = 4  # analysis downscale (270x480)


class Issues:
    def __init__(self):
        self.items: dict[tuple, dict] = {}

    def add(self, sev: str, check: str, subject: str, t: float | None, detail: str, fix: str):
        key = (sev, check, subject)
        it = self.items.setdefault(key, {"severity": sev, "check": check, "subject": subject,
                                         "times": [], "detail": detail, "fix": fix})
        if t is not None:
            it["times"].append(round(t, 2))

    def ranges(self, times: list[float], gap: float = 0.45) -> list[tuple[float, float]]:
        out = []
        for t in sorted(times):
            if out and t - out[-1][1] <= gap:
                out[-1][1] = t
            else:
                out.append([t, t])
        return [(a, b) for a, b in out]

    def rows(self):
        order = {"ERROR": 0, "WARN": 1, "INFO": 2}
        for it in sorted(self.items.values(), key=lambda x: (order[x["severity"]], (x["times"] or [0])[0])):
            rs = self.ranges(it["times"]) if it["times"] else []
            yield it, rs


def fmt(t: float) -> str:
    m, s = divmod(max(0.0, t), 60)
    return f"{int(m)}:{s:04.1f}"


def bbox(mask) -> tuple[int, int, int, int] | None:
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        return None
    return int(xs.min()) * S, int(ys.min()) * S, int(xs.max() + 1) * S, int(ys.max() + 1) * S


def inter(a, b) -> float:
    if a is None or b is None:
        return 0.0
    w = min(a[2], b[2]) - max(a[0], b[0])
    h = min(a[3], b[3]) - max(a[1], b[1])
    return max(0, w) * max(0, h)


def area(b) -> float:
    return 0.0 if b is None else (b[2] - b[0]) * (b[3] - b[1])


def frames(args: list[str], w: int, h: int, ch: int):
    """Stream raw frames from ffmpeg as numpy arrays."""
    cmd = [tool("ffmpeg"), "-hide_banner", "-nostdin", "-v", "error", *args, "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = w * h * ch
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, ch) if ch > 1 else np.frombuffer(buf, np.uint8).reshape(h, w)
    p.wait()


def parse_ass_events(path: Path) -> list[tuple[float, float, str]]:
    ev = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("Dialogue:"):
            continue
        parts = line.split(",", 9)
        def sec(x):
            h, m, s = x.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
        text = re.sub(r"\{[^}]*\}", "", parts[9])
        ev.append((sec(parts[1]), sec(parts[2]), text))
    return ev


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--lang", required=True)
    ap.add_argument("--fps", type=float, default=5.0, help="analysis sample rate")
    ap.add_argument("--no-sheets", action="store_true")
    a = ap.parse_args()

    plan = load_plan(a.plan)
    proj = project_dir(a.plan)
    W, H = plan["size"]
    tl = load_json(proj / "edit" / "timeline.json")
    dur = tl["duration"]
    master = proj / "out" / f"master_{a.lang}_sdr.mov"
    preview = proj / "out" / f"preview_{a.lang}.mp4"
    if not master.exists() or not preview.exists():
        die("out/master_<lang>_sdr.mov / preview missing — run assemble.py first")
    qa_dir = proj / "qa" / a.lang
    qa_dir.mkdir(parents=True, exist_ok=True)
    iss = Issues()
    fps = a.fps
    n = int(dur * fps)
    grid = [k / fps for k in range(n)]
    man_path = proj / "mg" / "out" / a.lang / "manifest.json"
    beats = load_json(man_path) if man_path.exists() else []
    raw_beats = {b["id"]: b for b in plan.get("beats", [])}

    # ------------------------------------------------------------ captions per frame
    cap_box = [None] * n
    events = []
    mask_ass = proj / "captions" / f"{a.lang}_mask.ass"
    if mask_ass.exists():
        events = parse_ass_events(proj / "captions" / f"{a.lang}.ass")
        fonts = require_fonts().replace(":", r"\:")
        os.chdir(proj)
        src = [f"-f", "lavfi", "-i", f"color=c=black:s={W}x{H}:r={fps}:d={dur}"]
        vf = f"ass=captions/{a.lang}_mask.ass:fontsdir='{fonts}',scale={W // S}:{H // S},format=gray"
        for k, fr in enumerate(frames(src + ["-vf", vf, "-pix_fmt", "gray"], W // S, H // S, 1)):
            if k < n:
                cap_box[k] = bbox(fr > 40)
        for s, e, text in events:
            d = e - s
            chars = len(text.strip())
            if d < 0.35:
                iss.add("WARN", "captions", "short chunk", s, f"“{text.strip()}” shows for {d:.2f}s", "merge with a neighbor or slow the cut")
            elif chars >= 15 and chars / max(d, 0.01) > 25:
                iss.add("WARN", "captions", "fast reading", s, f"“{text.strip()}” = {chars / d:.0f} chars/s", "shorten the line or split differently")

    # ------------------------------------------------------------ graphics per frame
    gfx = [[] for _ in range(n)]  # (beat_id, layout, alpha_bbox, content_bbox)
    for b in beats:
        f = Path(b["file"])
        if not f.exists():
            iss.add("ERROR", "graphics", b["id"], None, f"render missing: {f}", "run mg_render.py")
            continue
        vf = f"fps={fps},scale={W // S}:{H // S},format=rgba"
        for j, fr in enumerate(frames(["-i", str(f), "-vf", vf], W // S, H // S, 4)):
            t = b["start"] + j / fps
            k = int(round(t * fps))
            if k >= n:
                break
            al = fr[:, :, 3]
            luma = (0.2126 * fr[:, :, 0] + 0.7152 * fr[:, :, 1] + 0.0722 * fr[:, :, 2])
            content = (al > 128) & (luma > 100)
            seam = H // 2 // S
            if b["layout"] == "panel":
                content[max(0, seam - 3):seam + 3, :] = False
                content[seam + 3:, :] = False
            ab = bbox(al > 128)  # solid parts only — soft drop shadows don't count
            cb = bbox(content) if b["layout"] != "overlay" else ab
            gfx[k].append((b["id"], b["layout"], ab, cb))
            settled = 0.45 <= j / fps <= b["duration"] - 0.45
            if not settled or cb is None:
                continue
            x0, y0, x1, y1 = cb
            m = 2 * S
            if b["layout"] == "overlay":
                if x0 <= m or y0 <= m or x1 >= W - m or y1 >= H - m:
                    iss.add("ERROR", "cut-off", b["id"], t, "graphic touches the frame edge", "shrink it or move it inward")
                if y0 < SAFE["top"] or y1 > H - SAFE["bottom"] or x1 > W - SAFE["rail"]:
                    iss.add("WARN", "safe-zone", b["id"], t, f"graphic box {cb} outside the 9:16 safe zone (platform UI covers it)", "position it inside the safe zone")
            elif b["layout"] == "panel":
                if x0 <= m or y0 <= m or x1 >= W - m or y1 >= H // 2 - m:
                    iss.add("ERROR", "cut-off", b["id"], t, f"panel content touches the panel edge {cb}", "less content, smaller type, or a full layout")
            else:  # full
                if x0 <= m or y0 <= m or x1 >= W - m or y1 >= H - m:
                    iss.add("ERROR", "cut-off", b["id"], t, "content touches the frame edge", "smaller type or less content")
                if y0 < SAFE["top"] or y1 > H - SAFE["bottom"] + 120:
                    iss.add("WARN", "safe-zone", b["id"], t, f"content {cb} outside the safe zone", "keep text between y=220 and y=1520")

    # ------------------------------------------------------------ faces per frame (A-roll)
    face_box = [None] * n
    model = Path(os.environ.get("REEL_CACHE", "")) / "models" / "face_detection_yunet_2023mar.onnx"
    try:
        import cv2
        det = cv2.FaceDetectorYN.create(str(model), "", (W // 2, H // 2), 0.7, 0.3, 5000) if model.exists() else None
    except Exception:  # noqa: BLE001
        det = None
    if det is None:
        iss.add("INFO", "faces", "detector", None, "face checks skipped (opencv or YuNet model missing)", "rerun setup.sh")
    else:
        aprev = proj / "edit" / "aroll_preview.mp4"
        for k, fr in enumerate(frames(["-i", str(aprev), "-vf", f"fps={fps},format=bgr24"], W // 2, H // 2, 3)):
            if k >= n:
                break
            _, faces = det.detect(fr)
            if faces is not None and len(faces):
                f = max(faces, key=lambda r: r[2] * r[3])
                x, y, w, h = (float(v) * 2 for v in f[:4])
                face_box[k] = (int(x), int(y), int(x + w), int(y + h))
        for seg in tl["segments"]:
            ks = [k for k in range(n) if seg["start"] + 0.2 <= grid[k] < seg["end"] - 0.2]
            if ks:
                found = sum(1 for k in ks if face_box[k]) / len(ks)
                if found < 0.5:
                    iss.add("WARN", "faces", f"segment {seg['i']}", seg["start"], f"face found in only {found:.0%} of frames", "check framing (cx/cy/h) for this segment")
            top_limit = H // 2 if seg["layout"] == "split" else 0
            crop_t, side_t = [], []
            for k in ks:
                fb = face_box[k]
                if not fb:
                    continue
                x0, y0, x1, y1 = fb
                if y0 - 0.35 * (y1 - y0) < top_limit:  # hair / cap above the detected face box
                    crop_t.append(grid[k])
                if x0 < 0 or x1 > W:
                    side_t.append(grid[k])
            # only persistent problems: a head that dips out for one sampled frame is noise
            if ks and len(crop_t) >= 0.4 * len(ks):
                for tt in crop_t:
                    iss.add("WARN", "framing", f"segment {seg['i']}", tt, f"top of the head cropped in {len(crop_t) / len(ks):.0%} of the segment", "lower the zoom, move cy up or lower zoom_anchor y")
            if ks and len(side_t) >= 0.4 * len(ks):
                for tt in side_t:
                    iss.add("WARN", "framing", f"segment {seg['i']}", tt, "face touches the side of the frame", "adjust cx")

    # ------------------------------------------------------------ collisions
    for k in range(n):
        t = grid[k]
        cb = cap_box[k]
        fb = face_box[k]
        for bid, layout, ab, content in gfx[k]:
            if cb and layout in ("overlay", "full") and inter(cb, ab if layout == "overlay" else content) > 0:
                if layout == "full" and raw_beats.get(bid, {}).get("captions") is not True:
                    pass  # captions are hidden during full-screen beats by assemble.py
                else:
                    iss.add("ERROR", "collision", f"captions × {bid}", t, "caption overlaps a graphic", "move the graphic (position) or the caption y")
            if cb and layout == "panel" and content and inter(cb, content) > 0:
                iss.add("ERROR", "collision", f"captions × {bid}", t, "caption overlaps panel content", "more bottom padding in the panel or lower caption y")
            if fb and layout == "overlay" and inter(fb, ab) > 0.12 * area(fb):
                iss.add("ERROR", "face", f"{bid} covers face", t, "graphic covers the speaker's face", "position it top/bottom away from the face")
            if fb and layout == "panel" and fb[1] < H // 2:
                iss.add("ERROR", "face", f"{bid} hides face", t, "panel is over the speaker's face (face in the top half)", "use split layout for this segment")
        if cb and fb and inter(cb, fb) > 0.12 * area(fb):
            iss.add("ERROR", "face", "captions cover face", t, "caption sits on the speaker's face", "change captions.y or reframe")
        overlays = [g for g in gfx[k] if g[1] == "overlay"]
        for i in range(len(overlays)):
            for j in range(i + 1, len(overlays)):
                if inter(overlays[i][2], overlays[j][2]) > 0:
                    iss.add("ERROR", "collision", f"{overlays[i][0]} × {overlays[j][0]}", t, "two graphics overlap", "shift one in time or position")

    # ------------------------------------------------------------ edit structure
    tr = proj / "transcript" / "transcript.json"
    words = [w for s in load_json(tr)["segments"] for w in s["words"]] if tr.exists() else []
    for seg in tl["segments"]:
        for edge, name in ((seg["in"], "in"), (seg["out"], "out")):
            for w in words:
                if w["start"] + 0.04 < edge < w["end"] - 0.04:
                    t_out = seg["start"] if name == "in" else seg["end"]
                    iss.add("WARN", "edit", f"segment {seg['i']} {name}", t_out, f"cut lands inside “{w['w']}” ({w['start']:.2f}–{w['end']:.2f}s source)", f"move {name} to {w['start'] if name == 'in' else w['end']:.2f}")
        if seg["layout"] == "split":
            covered = [(b["start"], b["start"] + b["duration"]) for b in beats if b["layout"] in ("panel", "full")]
            t = seg["start"] + 0.04
            while t < seg["end"] - 0.04:
                if not any(s - 0.04 <= t <= e + 0.04 for s, e in covered):
                    iss.add("ERROR", "split", f"segment {seg['i']}", t, "split layout with nothing in the top half (black)", "extend a panel beat or make the segment full")
                t += 0.2

    # ------------------------------------------------------------ picture + audio
    p = run([tool("ffmpeg"), "-hide_banner", "-nostdin", "-i", str(preview), "-vf",
             "blackdetect=d=0.12:pix_th=0.03,freezedetect=n=-55dB:d=1.2", "-an", "-f", "null", "-"], check=False)
    for m in re.finditer(r"black_start:([\d.]+) black_end:([\d.]+)", p.stderr):
        iss.add("ERROR", "picture", "black frames", float(m.group(1)), f"black {float(m.group(1)):.2f}–{float(m.group(2)):.2f}s", "check overlays/pieces at that time")
    for m in re.finditer(r"freeze_start: ([\d.]+)", p.stderr):
        iss.add("WARN", "picture", "frozen picture", float(m.group(1)), "picture frozen ≥1.2s", "check the piece/overlay at that time")
    p = run([tool("ffmpeg"), "-hide_banner", "-nostdin", "-i", str(master), "-map", "0:a", "-af",
             "ebur128=peak=true,silencedetect=n=-42dB:d=0.8", "-f", "null", "-"], check=False)
    target = float(plan.get("audio", {}).get("loudness", -14))
    mi = re.findall(r"I:\s+(-?[\d.]+) LUFS", p.stderr)
    mp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", p.stderr)
    if mi:
        I = float(mi[-1])
        if abs(I - target) > 1.5:
            iss.add("WARN", "audio", "loudness", None, f"integrated {I:.1f} LUFS (target {target})", "check loudnorm / music level")
        else:
            iss.add("INFO", "audio", "loudness", None, f"integrated {I:.1f} LUFS ✓", "")
    if mp and float(mp[-1]) > -1.0:
        iss.add("ERROR", "audio", "true peak", None, f"true peak {float(mp[-1]):.1f} dBTP > -1", "lower sfx/music or add limiting")
    for m in re.finditer(r"silence_start: ([\d.]+)", p.stderr):
        s0 = float(m.group(1))
        if 0.3 < s0 < dur - 1.0:
            iss.add("WARN", "audio", "silence", s0, "≥0.8s of silence", "tighten the cut")

    # ------------------------------------------------------------ sheets for the visual review
    sheets = []
    if not a.no_sheets:
        fdir = qa_dir / "frames"
        tiles = []
        for i in range(int(dur)):
            t = i + 0.5
            tiles.append((grab_frame(preview, t, fdir / f"t{i:03d}.jpg"), fmt(t)))
        for c in range(0, len(tiles), 24):
            sheets.append(contact_sheet(tiles[c:c + 24], qa_dir / f"timeline_{c // 24 + 1:02d}.jpg", cols=6, tw=180, th=320))
        ev = []
        for b in beats:
            for tag, t in (("in", b["start"] + 0.15), ("mid", b["start"] + b["duration"] / 2), ("out", b["start"] + b["duration"] - 0.15)):
                ev.append((grab_frame(preview, t, fdir / f"{b['id']}_{tag}.jpg"), f"{b['id']} {tag} {fmt(t)}"))
        for seg in tl["segments"][1:]:
            for tag, t in (("before", seg["start"] - 1 / plan["fps"]), ("after", seg["start"] + 0.5 / plan["fps"])):
                ev.append((grab_frame(preview, t, fdir / f"cut{seg['i']:02d}_{tag}.jpg"), f"cut {seg['i']} {tag} {fmt(t)}"))
        for c in range(0, len(ev), 24):
            sheets.append(contact_sheet(ev[c:c + 24], qa_dir / f"events_{c // 24 + 1:02d}.jpg", cols=6, tw=180, th=320))

    # ------------------------------------------------------------ report
    rows, js = [], []
    errors = warns = 0
    for it, rs in iss.rows():
        when = ", ".join(fmt(x) if abs(x - y) < 0.01 else f"{fmt(x)}–{fmt(y)}" for x, y in rs[:6]) + (" …" if len(rs) > 6 else "")
        rows.append(f"| {it['severity']} | {it['check']} | {it['subject']} | {when or '—'} | {it['detail']} | {it['fix']} |")
        js.append({**{k: v for k, v in it.items() if k != 'times'}, "ranges": rs})
        errors += it["severity"] == "ERROR"
        warns += it["severity"] == "WARN"
    md = [f"# QA — {plan.get('title', proj.name)} [{a.lang}]", "",
          f"**{errors} errors · {warns} warnings** · {dur:.1f}s · sampled at {fps:g} fps", "",
          "| Sev | Check | Subject | When | Detail | Suggested fix |", "| :- | :- | :- | :- | :- | :- |", *rows, "",
          "## Visual review sheets", "", *[f"- {s.relative_to(proj)}" for s in sheets if s],
          "", "Visual findings: qa/" + a.lang + "/ai_review.md (read every sheet against references/qa.md)."]
    (qa_dir / "report.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    ai = qa_dir / "ai_review.md"
    if not ai.exists():
        ai.write_text(f"# AI visual review — [{a.lang}]\n\nOne item per finding, newest round first.\n\n"
                      "## Round 1\n\n- AI-1 · <time> · <problem> · <fix> · open|fixed|accepted\n", encoding="utf-8")
    save_json(qa_dir / "report.json", {"errors": errors, "warnings": warns, "issues": js,
                                       "sheets": [str(s) for s in sheets if s]})
    print("\n".join(md[:2 + 4 + len(rows)]))
    print(f"\nreport → {qa_dir / 'report.md'}")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
