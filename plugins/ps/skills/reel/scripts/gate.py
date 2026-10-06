#!/usr/bin/env python3
"""Pedro's two review gates: the transcript (after stage 2) and the storyboard (after stage 4).

Every reel stops at both. Later stages refuse to run until the gate is approved:
cut.py needs the transcript, mg_render.py (full render) needs the storyboard.

    gate.py transcript PROJECT/reel.json           write transcript/review.md: coverage check,
                                                   words to double-check, the full transcript
    gate.py fix PROJECT/reel.json "One Max => Onemax" ["old => new" ...]
                                                   apply Pedro's corrections (keeps word timings)
    gate.py storyboard PROJECT/reel.json           write mg/review.md: beat list + storyboard sheets
    gate.py approve PROJECT/reel.json transcript|storyboard [--note "..."]
                                                   record Pedro's OK (only after he said so)
    gate.py status PROJECT/reel.json

Approvals live in PROJECT/approvals.json with a fingerprint of what Pedro saw. Changing the
transcript afterwards blocks the cut again; changing beats after the storyboard approval
(QA fixes) only prints a note.
"""
from __future__ import annotations

import argparse
import difflib
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reel_common import (GATES, die, ffmpeg, gate_fingerprint, load_json, load_plan,  # noqa: E402
                         norm_word, project_dir, save_json, t_value)


def fmt(t: float) -> str:
    return f"{int(t // 60)}:{t % 60:05.2f}"


# ---------------------------------------------------------------- transcript
def speech_islands(wav: Path, total: float, noise_db: int = -32, min_sil: float = 0.35) -> list[tuple[float, float]]:
    """Non-silent stretches of the audio according to ffmpeg's silencedetect."""
    r = ffmpeg(["-v", "info", "-i", str(wav), "-af", f"silencedetect=noise={noise_db}dB:d={min_sil}", "-f", "null", "-"],
               check=False)
    log = (r.stderr or "") + (r.stdout or "")
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    islands, cur = [], 0.0
    for i, st in enumerate(starts):
        if st - cur > 0.05:
            islands.append((cur, st))
        if i >= len(ends):
            return islands  # silent until the end
        cur = ends[i]
    if total - cur > 0.05:
        islands.append((cur, total))
    return islands


def uncovered(islands, words, pad: float = 0.3, min_len: float = 0.7):
    spans = sorted((w["start"] - pad, w["end"] + pad) for w in words)
    out = []
    for a, b in islands:
        cur = a
        for s, e in spans:
            if e <= cur or s >= b:
                continue
            if s > cur and s - cur >= min_len:
                out.append((cur, s))
            cur = max(cur, e)
        if b - cur >= min_len:
            out.append((cur, b))
    return out


def name_suspects(words: list[dict], hot: list[str]) -> list[dict]:
    """Words (or 2–3 word runs) that sound like a brand/product name but aren't spelled like it."""
    toks = [norm_word(w["w"]) for w in words]
    out, used = [], set()
    for h in hot:
        hn, k = norm_word(h), len(h.split())
        for n in (k, k + 1):
            for i in range(len(toks) - n + 1):
                if used & set(range(i, i + n)) or len(toks[i]) < 2:
                    continue
                cand = "".join(toks[i:i + n])
                if len(cand) < 3 or cand == hn or cand in hn or hn in cand or abs(len(cand) - len(hn)) > 3:
                    continue
                if difflib.SequenceMatcher(None, cand, hn).ratio() >= 0.66:
                    used.update(range(i, i + n))
                    heard = " ".join(w["w"] for w in words[i:i + n])
                    out.append(dict(words[i], w=heard, why=f"maybe “{h}”?"))
    return out


def cmd_transcript(a):
    proj = project_dir(a.plan)
    plan = load_plan(a.plan)
    tdir = proj / "transcript"
    tr = load_json(tdir / "transcript.json")
    segs = tr["segments"]
    words = [dict(w, seg=s["id"]) for s in segs for w in s["words"]]
    dur = tr.get("duration") or (words[-1]["end"] if words else 0)

    gaps = uncovered(speech_islands(tdir / "audio16k.wav", dur), words) if (tdir / "audio16k.wav").exists() else []
    head = words[0]["start"] if words else dur
    tail = dur - words[-1]["end"] if words else dur
    hot = [h.strip() for h in str(plan.get("hotwords", "")).split(",") if h.strip()]
    doubt = name_suspects(words, hot)
    seen = {d["start"] for d in doubt}
    doubt += [dict(w, why=f"low confidence {w['p']}") for w in words if w["p"] < 0.5 and w["start"] not in seen]
    doubt.sort(key=lambda d: d["start"])
    pauses = [(x["end"], y["start"]) for x, y in zip(words, words[1:]) if y["start"] - x["end"] >= 3]

    L = [f"# Transcript review — {proj.name}", "",
         f"Language **{tr.get('language')}** · audio {fmt(dur)} · {len(segs)} segments · {len(words)} words · model {tr.get('model')}",
         "", "## Completeness", ""]
    L.append(f"- First word at {fmt(head)}, last word ends {fmt(dur - tail)} (audio ends {fmt(dur)}).")
    if gaps:
        L.append(f"- ⚠️ **{len(gaps)} stretch(es) with sound but no words** — possible missing speech:")
        for g0, g1 in gaps:
            before = max((w for w in words if w["end"] <= g0 + 0.3), key=lambda w: w["end"], default=None)
            L.append(f"  - {fmt(g0)}–{fmt(g1)} ({g1 - g0:.1f}s)" + (f", after “{before['w']}” ({before['seg']})" if before else ""))
    else:
        L.append("- ✅ Every stretch of sound has words (no obvious missing speech).")
    for p0, p1 in pauses:
        L.append(f"- Long silence {fmt(p0)}–{fmt(p1)} ({p1 - p0:.1f}s) — a pause or retake, or something you said that didn't record?")
    L += ["", "## Words to double-check (names, low confidence)", ""]
    L += [f"- “{w['w']}” at {fmt(w['start'])} ({w['seg']}): {w['why']}" for w in doubt[:40]] or ["- none flagged (still read it: the model can be confidently wrong)"]
    L += ["", "## Full transcript", ""]
    L += [f"**{s['id']}** `{fmt(s['start'])}` {s['text']}" for s in segs]
    L += ["", "---", "Reply **OK** to approve, or send corrections like `One Max → Onemax`, and say if anything you said is missing."]
    (tdir / "review.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print("\n".join(L))
    print(f"\n→ {tdir / 'review.md'}  (send this to Pedro and WAIT for his reply)", file=sys.stderr)


def cmd_fix(a):
    proj = project_dir(a.plan)
    path = proj / "transcript" / "transcript.json"
    tr = load_json(path)
    log_path = proj / "transcript" / "corrections.json"
    log = load_json(log_path) if log_path.exists() else []
    for rule in a.rules:
        if "=>" in rule:
            old, new = (x.strip() for x in rule.split("=>", 1))
        elif "→" in rule:
            old, new = (x.strip() for x in rule.split("→", 1))
        else:
            die(f"rule needs 'old => new': {rule}")
        ot = [norm_word(x) for x in old.split() if norm_word(x)]
        if not ot:
            die(f"nothing to match in: {rule}")
        n = 0
        for s in tr["segments"]:
            ws, i, out = s["words"], 0, []
            while i < len(ws):
                if [norm_word(w["w"]) for w in ws[i:i + len(ot)]] == ot:
                    first, last = ws[i], ws[i + len(ot) - 1]
                    lead = re.match(r"^[^\w]*", first["w"]).group(0)
                    trail = re.search(r"[^\w]*$", last["w"]).group(0)
                    parts = new.split() or [new]
                    parts[0] = lead + parts[0]
                    if not re.search(r"[^\w]$", parts[-1]):
                        parts[-1] += trail
                    t0, t1 = first["start"], last["end"]
                    step = (t1 - t0) / len(parts)
                    for j, part in enumerate(parts):  # spread the timing over the new words
                        out.append({"w": part, "start": round(t0 + j * step, 3), "end": round(t0 + (j + 1) * step, 3),
                                    "p": 1.0, "fixed": True})
                    i += len(ot)
                    n += 1
                else:
                    out.append(ws[i])
                    i += 1
            if out != ws:
                s["words"] = out
                s["text"] = " ".join(w["w"] for w in out)
        print(f"{rule}: {n} replacement(s)")
        if n == 0:
            print("  (not found — check spelling, or the words may be missing from the transcript)", file=sys.stderr)
        log.append({"rule": f"{old} => {new}", "count": n, "at": time.strftime("%Y-%m-%d %H:%M")})
    save_json(path, tr)
    with open(path.parent / "transcript.txt", "w", encoding="utf-8") as f:
        for s in tr["segments"]:
            f.write(f"{s['id']} [{fmt(s['start'])}–{fmt(s['end'])}] {s['text']}\n")
    save_json(log_path, log)


# ---------------------------------------------------------------- storyboard
def summary(props: dict, lang: str) -> str:
    for k in ("title", "text", "value", "name"):
        if props.get(k):
            v = t_value(props[k], lang)
            return str(v).replace("*", "")
    return ""


def cmd_storyboard(a):
    proj = project_dir(a.plan)
    plan = load_plan(a.plan)
    sheets = [proj / "mg" / f"storyboard_{l}.jpg" for l in plan["languages"]]
    sheets = [s for s in sheets if s.exists()]
    if not sheets:
        die("no storyboard sheet yet — run mg_render.py --stills first")
    lang = plan["languages"][0]
    L = [f"# Storyboard review — {proj.name}", "", f"{len(plan.get('beats', []))} beats · brand {plan.get('brand', 'neutral')}", "",
         "| Beat | Starts on | Scene | Layout | Says |", "| :- | :- | :- | :- | :- |"]
    for b in plan.get("beats", []):
        st = b.get("start")
        when = f"“{st['word']}”" if isinstance(st, dict) and "word" in st else (f"{float(st):.1f}s" if isinstance(st, (int, float)) else "")
        L.append(f"| {b['id']} | {when} | {b['scene']} | {b.get('layout', 'panel')} | {summary(b.get('props', {}), lang)[:60]} |")
    L += ["", "Sheets: " + ", ".join(str(s) for s in sheets), "",
          "Reply **OK** to render, or say which beat to change and how."]
    (proj / "mg" / "review.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print("\n".join(L))
    print(f"\n→ send the sheet(s) above with this list to Pedro and WAIT for his reply", file=sys.stderr)


# ---------------------------------------------------------------- approvals
def cmd_approve(a):
    proj = project_dir(a.plan)
    fp = gate_fingerprint(proj, a.gate)
    if not fp:
        die(f"nothing to approve for {a.gate} yet")
    ap = proj / "approvals.json"
    rec = load_json(ap) if ap.exists() else {}
    rec[a.gate] = {"fingerprint": fp, "at": time.strftime("%Y-%m-%d %H:%M"), "note": a.note or ""}
    save_json(ap, rec)
    print(f"{a.gate} approved ({fp})")


def cmd_status(a):
    proj = project_dir(a.plan)
    ap = proj / "approvals.json"
    rec = load_json(ap) if ap.exists() else {}
    for g in GATES:
        r = rec.get(g)
        if not r:
            print(f"{g}: waiting for Pedro")
        elif r["fingerprint"] != gate_fingerprint(proj, g):
            print(f"{g}: approved {r['at']} — CHANGED since")
        else:
            print(f"{g}: approved {r['at']}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("transcript", "storyboard", "status"):
        sub.add_parser(name).add_argument("plan")
    p = sub.add_parser("fix")
    p.add_argument("plan")
    p.add_argument("rules", nargs="+", help='"old words => new words"')
    p = sub.add_parser("approve")
    p.add_argument("plan")
    p.add_argument("gate", choices=GATES)
    p.add_argument("--note")
    a = ap.parse_args()
    {"transcript": cmd_transcript, "fix": cmd_fix, "storyboard": cmd_storyboard,
     "approve": cmd_approve, "status": cmd_status}[a.cmd](a)


if __name__ == "__main__":
    main()
