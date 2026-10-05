#!/usr/bin/env python3
"""Render the motion-graphics beats in reel.json (Claude Design–style scenes, headless Chrome).

  mg_render.py PROJECT/reel.json                 render every beat, every language
  mg_render.py PROJECT/reel.json --stills        one PNG per beat + storyboard sheet (fast; for the storyboard review)
  mg_render.py PROJECT/reel.json --only b03,b07  re-render some beats
  mg_render.py PROJECT/reel.json --cover PROJECT/cover.json   render a cover/thumbnail still

Beat fields (reel.json "beats"):
  id, scene, layout ("overlay"|"panel"|"full"), position (overlay: "top"|"center"|"bottom"),
  start (seconds on the OUTPUT timeline, or {"word": "...", "nth": 1, "offset": -0.1}),
  dur (seconds) or end (same forms as start), enter/exit (bool, default true),
  cues ({"stamp": {"word": "evidencia"}, "flip": 32.35, "saved": {"rel": 4.3}} — named moments the
  scene choreographs; word anchors and absolute seconds become seconds into the beat),
  props (scene props; any string may be {"es": "...", "en": "..."}), still_at (seconds into the beat).

Outputs (PROJECT/mg/): out/<lang>/<id>.mov (ProRes 4444 + alpha), out/<lang>/manifest.json,
stills/<lang>/<id>.png, storyboard_<lang>.jpg. The scene project lives in PROJECT/mg/ (React,
Stage/Sprite/useTime runtime in src/animations.tsx); bespoke scenes go in mg/src/custom/.
Beat scene "html" plays any Stage-based HTML animation (e.g. a Claude Design export that exposes
window.__seek): props {"src": "path/to/index.html"}.
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reel_common import (SKILL_DIR, contact_sheet, die, ffmpeg, load_json, load_plan,  # noqa: E402
                         norm_word, project_dir, resolve_time, save_json, t_value)

TEMPLATE = SKILL_DIR / "templates" / "motion"


def prepare(proj: Path) -> Path:
    mg = proj / "mg"
    (mg / "src").mkdir(parents=True, exist_ok=True)
    for name in ["package.json", "tsconfig.json", "index.html", "build.mjs", "render.mjs"]:
        shutil.copy2(TEMPLATE / name, mg / name)
    for item in (TEMPLATE / "src").iterdir():
        dst = mg / "src" / item.name
        if item.name == "custom":
            if not dst.exists():
                shutil.copytree(item, dst)
            continue
        if item.is_dir():
            shutil.rmtree(dst, ignore_errors=True)
            shutil.copytree(item, dst)
        else:
            shutil.copy2(item, dst)
    fonts = Path(os.environ.get("REEL_FONTS", ""))
    if not fonts.is_dir():
        die("REEL_FONTS not set — run setup.sh and `source $REEL_CACHE/env.sh`")
    (mg / "public" / "fonts").mkdir(parents=True, exist_ok=True)
    for f in fonts.glob("*.ttf"):
        if not (mg / "public" / "fonts" / f.name).exists():
            shutil.copy2(f, mg / "public" / "fonts" / f.name)
    nm_src = Path(os.environ.get("REEL_MOTION", "")) / "node_modules"
    if not nm_src.is_dir():
        die("REEL_MOTION/node_modules missing — run setup.sh (without --skip-motion)")
    nm = mg / "node_modules"
    if nm.is_symlink() or not nm.exists():
        if nm.is_symlink():
            nm.unlink()
        nm.symlink_to(nm_src)
    return mg


def code_hash(mg: Path) -> str:
    """Hash of the scene sources (template + custom scenes): a change re-renders every beat."""
    h = hashlib.sha1()
    for f in sorted((mg / "src").rglob("*")):
        if f.is_file():
            h.update(f.name.encode())
            h.update(f.read_bytes())
    return h.hexdigest()[:12]


def job_hash(job: dict, code: str) -> str:
    extra = ""
    if job.get("url"):
        extra = str(Path(job["url"]).stat().st_mtime)
    return hashlib.sha1((code + json.dumps(job.get("props") or job.get("url"), sort_keys=True) + str(job.get("frame")) + extra).encode()).hexdigest()[:16]


def up_to_date(job: dict, code: str) -> bool:
    out = Path(job["out"])
    side = out.with_suffix(out.suffix + ".hash")
    return out.exists() and side.exists() and side.read_text().strip() == job_hash(job, code)


def mark_done(jobs: list[dict], code: str):
    for job in jobs:
        out = Path(job["out"])
        if out.exists():
            out.with_suffix(out.suffix + ".hash").write_text(job_hash(job, code))


def localize(v, lang):
    v = t_value(v, lang)
    if isinstance(v, dict):
        return {k: localize(x, lang) for k, x in v.items()}
    if isinstance(v, list):
        return [localize(x, lang) for x in v]
    return v


def is_localized(v) -> bool:
    if isinstance(v, dict):
        if v and all(isinstance(k, str) and len(k) == 2 and k.isalpha() for k in v):
            return True
        return any(is_localized(x) for x in v.values())
    if isinstance(v, list):
        return any(is_localized(x) for x in v)
    return False


def tokenize(text: str):
    out, on = [], False
    for raw in (text or "").split():
        if raw.startswith("*"):
            on = True
        t = raw.replace("*", "")
        if t:
            out.append({"t": t, "emph": on})
        if raw.rstrip(",.:;!?…").endswith("*"):
            on = False
    return out


def align_tokens(tokens, words, start, dur):
    """Give each display token the time its word is spoken (relative to the beat)."""
    win = [w for w in words if w["start"] >= start - 0.3 and w["start"] <= start + dur]
    a = [norm_word(t["t"]) for t in tokens]
    b = [norm_word(w["w"]) for w in win]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    at = [None] * len(tokens)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            at[blk.a + k] = max(0.0, win[blk.b + k]["start"] - start)
    last = 0.1
    for i in range(len(at)):  # fill gaps: just after the previous token
        if at[i] is None:
            at[i] = last + 0.12
        last = at[i]
    for t, x in zip(tokens, at):
        t["at"] = round(x, 3)
    return tokens


def build_beats(plan, words, total, lang, spoken):
    beats = []
    for b in plan.get("beats", []):
        if b.get("scene") in (None, "none"):
            continue
        start = resolve_time(b["start"], words)
        if "dur" in b:
            dur = float(b["dur"])
        elif "end" in b:
            dur = resolve_time(b["end"], words) - start
        else:
            die(f"beat {b.get('id')}: needs dur or end")
        dur = max(0.2, min(dur, total - start))
        props = localize(b.get("props", {}), lang)
        beat = {
            "composition": "Beat", "id": b["id"], "scene": b["scene"], "layout": b.get("layout", "overlay"),
            "position": b.get("position", "bottom"), "duration": round(dur, 3),
            "fps": plan["fps"], "width": plan["size"][0], "height": plan["size"][1],
            "lang": lang, "brand": plan.get("brand", "neutral"),
            "enter": b.get("enter", True), "exit": b.get("exit", True), "props": props,
        }
        if b.get("cues"):
            beat["cues"] = {}
            for name, spec in b["cues"].items():
                at = start + float(spec["rel"]) if isinstance(spec, dict) and "rel" in spec else resolve_time(spec, words)
                beat["cues"][name] = round(at - start, 3)
        if b["scene"] == "kinetic":
            toks = tokenize(props.get("text", ""))
            if lang == spoken and words:
                toks = align_tokens(toks, words, start, dur)
            else:
                step = min(0.18, 0.6 * dur / max(1, len(toks)))
                for i, t in enumerate(toks):
                    t["at"] = round(0.15 + i * step, 3)
            beat["tokens"] = toks
        beats.append((b, start, beat))
    return beats


def storyboard(proj: Path, mg: Path, lang: str, beats):
    """Each beat's still composited over the A-roll frame at the same moment."""
    prev = proj / "edit" / "aroll_preview.mp4"
    tdir = mg / "stills" / lang / "_tiles"
    tdir.mkdir(parents=True, exist_ok=True)
    tiles = []
    for raw, start, beat in beats:
        still = mg / "stills" / lang / f"{beat['id']}.png"
        if not still.exists():
            continue
        t = start + float(raw.get("still_at", min(beat["duration"] * 0.6, beat["duration"] - 0.2)))
        out = tdir / f"{beat['id']}.png"
        base = ["-ss", f"{t:.2f}", "-i", str(prev)] if prev.exists() else ["-f", "lavfi", "-i", "color=c=0x333333:s=540x960"]
        ffmpeg(base + ["-i", str(still), "-filter_complex", "[0:v]scale=540:960,setsar=1[b];[1:v]scale=540:960[o];[b][o]overlay=0:0",
                       "-frames:v", "1", str(out)])
        tiles.append((out, f"{beat['id']} {start:.1f}s {beat['scene']}/{beat['layout']}"))
    return contact_sheet(tiles, mg / f"storyboard_{lang}.jpg", cols=4, tw=360, th=640)


def job_for(beat: dict, proj: Path, kind: str, out: Path, frame: int | None = None) -> dict:
    """Our scenes render from props; scene "html" plays an external Stage-based HTML file."""
    if beat["scene"] == "html":
        src = Path(beat["props"].get("src", ""))
        src = src if src.is_absolute() else proj / src
        if not src.exists():
            die(f"beat {beat['id']}: html src not found: {src}")
        job = {"url": str(src), "duration": beat["duration"], "kind": kind, "out": str(out)}
    else:
        job = {"props": beat, "kind": kind, "out": str(out)}
    if frame is not None:
        job["frame"] = frame
    return job


def run_jobs(mg: Path, jobs, concurrency):
    jf = mg / "jobs.json"
    save_json(jf, jobs)
    env = dict(os.environ)
    if concurrency:
        env["REEL_CONCURRENCY"] = str(concurrency)
    b = subprocess.run(["node", "build.mjs"], cwd=mg, env=env)
    if b.returncode != 0:
        die("scene bundle failed (see esbuild errors above) — check mg/src")
    p = subprocess.run(["node", "render.mjs", str(jf)], cwd=mg, env=env)
    if p.returncode != 0:
        die("some renders failed (see FAIL lines above)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--lang", help="only this language")
    ap.add_argument("--only", help="comma-separated beat ids")
    ap.add_argument("--stills", action="store_true", help="stills + storyboard sheet only")
    ap.add_argument("--cover", help="cover.json with Cover props (+ 'out')")
    ap.add_argument("--concurrency", type=int, default=0)
    a = ap.parse_args()

    plan = load_plan(a.plan)
    proj = project_dir(a.plan)
    mg = prepare(proj)
    tl_path = proj / "edit" / "timeline.json"
    total = load_json(tl_path)["duration"] if tl_path.exists() else 1e9
    wpath = proj / "edit" / "words_out.json"
    words = load_json(wpath) if wpath.exists() else None
    spoken = plan["languages"][0]
    langs = [a.lang] if a.lang else plan["languages"]

    if a.cover:
        cov = load_json(a.cover)
        (mg / "public" / "cover").mkdir(parents=True, exist_ok=True)
        imgs = []
        for src in cov.get("images", []):
            sp = Path(src) if Path(src).is_absolute() else (Path(a.cover).parent / src)
            shutil.copy2(sp, mg / "public" / "cover" / sp.name)
            imgs.append(f"cover/{sp.name}")
        out = Path(cov.get("out", "out/cover.jpg"))
        out = out if out.is_absolute() else proj / out
        props = {"width": cov.get("width", 1080), "height": cov.get("height", 1920), "brand": plan.get("brand", "neutral"),
                 "kicker": cov.get("kicker"), "title": cov["title"], "chips": cov.get("chips", []),
                 "images": imgs, "layout": cov.get("layout")}
        props["composition"] = "Cover"
        run_jobs(mg, [{"props": props, "out": str(out), "kind": "still"}], a.concurrency)
        print(f"cover → {out}")
        return

    only = set(a.only.split(",")) if a.only else None
    spoken_beats = {bt["id"]: bt for _, _, bt in build_beats(plan, words, total, spoken, spoken)}
    for lang in langs:
        beats = build_beats(plan, words, total, lang, spoken)
        jobs, manifest = [], []
        for raw, start, beat in beats:
            shared = lang != spoken and not is_localized(raw.get("props", {})) and raw["scene"] != "kinetic"
            src_lang = spoken if shared else lang
            vid = mg / "out" / src_lang / f"{beat['id']}.mov"
            manifest.append({"id": beat["id"], "start": round(start, 3), "duration": beat["duration"],
                             "layout": beat["layout"], "scene": beat["scene"], "file": str(vid)})
            if only and beat["id"] not in only:
                continue
            if a.stills:
                fr = float(raw.get("still_at", min(beat["duration"] * 0.6, beat["duration"] - 0.2)))
                jobs.append(job_for(beat, proj, "still", mg / "stills" / lang / f"{beat['id']}.png", max(0, int(fr * plan["fps"]))))
            elif not shared:
                jobs.append(job_for(beat, proj, "video", vid))
            else:  # shared with the spoken language: make sure that render exists
                jobs.append(job_for(spoken_beats[beat["id"]], proj, "video", vid))
        code = code_hash(mg)
        todo = [j for j in jobs if only or not up_to_date(j, code)]
        if len(todo) < len(jobs):
            print(f"[{lang}] {len(jobs) - len(todo)} up to date, skipped", file=sys.stderr)
        if todo:
            print(f"[{lang}] rendering {len(todo)} {'stills' if a.stills else 'beats'} …", file=sys.stderr)
            run_jobs(mg, todo, a.concurrency)
            mark_done(todo, code)
        if a.stills:
            sheet = storyboard(proj, mg, lang, beats)
            if sheet:
                print(f"[{lang}] storyboard → {sheet}")
        else:
            save_json(mg / "out" / lang / "manifest.json", manifest)
            print(f"[{lang}] {len(manifest)} beats → {mg / 'out' / lang / 'manifest.json'}")


if __name__ == "__main__":
    main()
