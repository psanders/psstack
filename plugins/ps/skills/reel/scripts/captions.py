#!/usr/bin/env python3
"""Burned-in captions: build editable caption lines, then render them to ASS.

  captions.py build PROJECT/reel.json            spoken language → captions/<lang>.json
  captions.py ass   PROJECT/reel.json --lang es  captions/<lang>.json → captions/<lang>.ass + <lang>_mask.ass

captions/<lang>.json = {"lang": "es", "lines": [{"start", "end", "text", "words"?}]}
  * one line per sentence/phrase, times on the OUTPUT timeline (after cut.py)
  * wrap words in *asterisks* to highlight them in the accent color
  * for a translation, copy the spoken file to captions/en.json, translate each "text",
    keep start/end, delete "words" — ass splits long lines proportionally

Display chunks: ≤ max_chars (22) and ≤ 4 words, never ending on a function word.
Two ASS files are rendered because libass can't write alpha: the color pass is drawn
on black and the mask pass (same events, all white) becomes its alpha in assemble.py.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reel_common import die, load_json, load_plan, project_dir, save_json  # noqa: E402

FUNC = {
    "es": set("el la los las de del un una unos unas y o a en con por para se si no que su sus al lo le les mi tu ni".split()),
    "en": set("the a an of to and or in on at for with by from as is are be that this it its your our my".split()),
}
BRANDS = {"qcobro": "#34d399", "fonoster": "#20c997", "micobro": "#14b8a6", "neutral": "#60a5fa"}


def ass_color(hex_color: str, alpha: int = 0) -> str:
    h = hex_color.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alpha:02X}{b}{g}{r}".upper().replace("&H", "&H")


def ts(x: float) -> str:
    x = max(0.0, x)
    h, m, s = int(x // 3600), int(x % 3600 // 60), x % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def build(plan_path: str, plan: dict):
    proj = project_dir(plan_path)
    wfile = proj / "edit" / "words_out.json"
    if not wfile.exists():
        die("edit/words_out.json missing — run cut.py first")
    words = load_json(wfile)
    lang = plan["languages"][0]
    emph = [e.lower() for e in plan.get("captions", {}).get("emphasis", {}).get(lang, [])]
    lines, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["start"] - w["end"]) if nxt else 9
        if re.search(r"[.!?…]$", w["w"]) or gap > 0.45 or (nxt and nxt.get("seg") != w.get("seg") and gap > 0.2):
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)
    out = []
    for ws in lines:
        text = " ".join(x["w"] for x in ws)
        for e in emph:  # wrap configured emphasis phrases in *...*
            text = re.sub(rf"(?<![\w*])({re.escape(e)})(?![\w*])", r"*\1*", text, flags=re.I | re.U)
        out.append({"start": ws[0]["start"], "end": ws[-1]["end"], "text": text,
                    "words": [{"w": x["w"], "start": x["start"], "end": x["end"]} for x in ws]})
    dst = proj / "captions" / f"{lang}.json"
    save_json(dst, {"lang": lang, "lines": out})
    print(f"{len(out)} lines → {dst}  (review spelling, add *emphasis*, then run `ass`)")


def tokens_with_flags(text: str) -> list[tuple[str, bool]]:
    toks, on = [], False
    for t in text.split():
        start = t.startswith("*")
        if start:
            on = True
        clean = t.replace("*", "")
        toks.append((clean, on))
        if re.search(r"\*[,.:;!?…]*$", t):
            on = False
    return [(w, f) for w, f in toks if w]


def chunk(tokens: list[tuple[str, bool]], lang: str, max_chars: int, max_words: int) -> list[list[int]]:
    func = FUNC.get(lang[:2], set())

    def plen(idx):
        return len(" ".join(tokens[i][0] for i in idx))

    res, cur = [], []
    for i in range(len(tokens)):
        if cur and (plen(cur + [i]) > max_chars or len(cur) >= max_words):
            carry = []
            while len(cur) > 1 and tokens[cur[-1]][0].lower().strip(",.") in func:
                carry.insert(0, cur.pop())
            res.append(cur)
            cur = carry + [i]
        else:
            cur.append(i)
        if re.search(r"[,.:;!?…]$", tokens[i][0]) and plen(cur) >= 8:
            res.append(cur)
            cur = []
    if cur:
        if res and plen(cur) <= 7 and plen(res[-1] + cur) <= max_chars + 6:
            res[-1] += cur
        else:
            res.append(cur)
    return res


def ass(plan_path: str, plan: dict, lang: str):
    proj = project_dir(plan_path)
    src = proj / "captions" / f"{lang}.json"
    if not src.exists():
        die(f"{src} missing")
    data = load_json(src)
    cfg = plan.get("captions", {})
    W, H = plan["size"]
    y = int(cfg.get("y", H // 2 + 5))
    size = int(cfg.get("size", 76))
    font = cfg.get("font", "Poppins ExtraBold")
    max_chars = int(cfg.get("max_chars", 22))
    max_words = int(cfg.get("max_words", 4))
    brand = plan.get("brand", "qcobro")
    accent = cfg.get("accent") or (brand.get("accent") if isinstance(brand, dict) else BRANDS.get(brand, "#34d399"))

    events = []
    for ln in data["lines"]:
        toks = tokens_with_flags(ln["text"])
        if not toks:
            continue
        s, e = float(ln["start"]), float(ln["end"])
        words = ln.get("words") or []
        timed = len(words) == len(toks)
        for c in chunk(toks, lang, max_chars, max_words):
            if timed:
                cs, ce = words[c[0]]["start"], words[c[-1]]["end"]
            else:  # proportional to characters (translations)
                total = sum(len(t[0]) + 1 for t in toks)
                before = sum(len(toks[i][0]) + 1 for i in range(c[0]))
                span = sum(len(toks[i][0]) + 1 for i in c)
                cs = s + (e - s) * before / total
                ce = cs + (e - s) * span / total
            events.append([cs, ce, [toks[i] for i in c]])
    events.sort(key=lambda ev: ev[0])
    for i in range(len(events) - 1):  # hold each chunk until the next one if the gap is short
        gap = events[i + 1][0] - events[i][1]
        if 0 < gap < 0.35:
            events[i][1] = events[i + 1][0]
        if events[i][1] > events[i + 1][0]:
            events[i][1] = events[i + 1][0]

    def doc(mask: bool) -> str:
        white = "&H00FFFFFF"
        prim = white
        outl = white if mask else "&H00000000"
        back = "&H96FFFFFF" if mask else "&H96000000"
        acc = white if mask else ass_color(accent)
        head = (
            "[Script Info]\nScriptType: v4.00+\n"
            f"PlayResX: {W}\nPlayResY: {H}\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n"
            "[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
            "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
            "MarginR, MarginV, Encoding\n"
            f"Style: Cap,{font},{size},{prim},{prim},{outl},{back},0,0,0,0,100,100,0,0,1,6,3,5,60,60,0,1\n\n"
            "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        )
        rows = []
        for s, e, toks in events:
            body = " ".join((f"{{\\c{acc}&}}{w}{{\\c{white}&}}" if f else w) for w, f in toks)
            anim = f"{{\\an5\\pos({W // 2},{y})\\fad(40,0)\\t(0,90,\\fscx108\\fscy108)\\t(90,160,\\fscx100\\fscy100)}}"
            rows.append(f"Dialogue: 0,{ts(s)},{ts(e)},Cap,,0,0,0,,{anim}{body}")
        return head + "\n".join(rows) + "\n"

    out = proj / "captions"
    (out / f"{lang}.ass").write_text(doc(False), encoding="utf-8")
    (out / f"{lang}_mask.ass").write_text(doc(True), encoding="utf-8")
    print(f"{len(events)} caption chunks → captions/{lang}.ass (+ _mask)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["build", "ass"])
    ap.add_argument("plan")
    ap.add_argument("--lang")
    a = ap.parse_args()
    plan = load_plan(a.plan)
    if a.cmd == "build":
        build(a.plan, plan)
    else:
        for lang in ([a.lang] if a.lang else plan["languages"]):
            ass(a.plan, plan, lang)


if __name__ == "__main__":
    main()
