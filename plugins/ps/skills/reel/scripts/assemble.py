#!/usr/bin/env python3
"""Assemble one language master: A-roll + motion graphics + captions + audio mix.

Usage: assemble.py PROJECT/reel.json --lang es [--target auto|hdr|sdr|both] [--no-captions] [--no-sfx]

Inputs:  edit/aroll.mov, edit/timeline.json, mg/out/<lang>/manifest.json,
         captions/<lang>.ass + <lang>_mask.ass, reel.json "audio".
Outputs: out/master_<lang>_sdr.mov   10-bit ProRes 422 HQ, BT.709 — always (previews, QA, SDR exports)
         out/master_<lang>_hdr.mov   10-bit ProRes 422 HQ, HLG — when the source is HDR and an
                                     export of this language keeps HDR (Instagram)
         out/preview_<lang>.mp4      small SDR H.264 for review and QA
Both masters come from ONE ffmpeg pass (inputs decoded once).

Graphics are sRGB. In the HDR master they go through HLG_GRAPHICS_CCM so their white
sits at HLG graphics white instead of glowing at peak brightness. In the SDR master the
FOOTAGE is tone-mapped first and the graphics go on top untouched — tone-mapping a
finished HDR master would dim the graphics to ~60 % gray.

reel.json "audio": {"loudness": -14, "highpass": 70, "sfx": "auto"|false, "sfx_db": -20,
                    "music": "path.mp3", "music_db": -24}
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from reel_common import (HLG_GRAPHICS_CCM, HLG_TO_SDR, SETP, TAGS, die, ffmpeg,  # noqa: E402
                         load_json, load_plan, project_dir, require_fonts, run, tool)

SFX = {
    # procedural, license-free one-shots
    "whoosh": "anoisesrc=color=pink:d=0.5:a=0.5:seed=7,highpass=f=300,lowpass=f=5000,"
              "afade=t=in:d=0.22:curve=exp,afade=t=out:st=0.22:d=0.28:curve=exp",
    "pop": "sine=f=660:d=0.12,afade=t=in:d=0.004,afade=t=out:st=0.01:d=0.11:curve=exp",
    "tick": "sine=f=1800:d=0.05,afade=t=in:d=0.002,afade=t=out:st=0.005:d=0.045:curve=exp",
}


def esc(path: str) -> str:
    """Escape a path for use inside an ffmpeg filter argument."""
    return path.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'").replace(",", "\\,")


def sfx_files(cache: Path) -> dict[str, Path]:
    cache.mkdir(parents=True, exist_ok=True)
    out = {}
    for name, graph in SFX.items():
        f = cache / f"{name}.wav"
        if not f.exists():
            ffmpeg(["-f", "lavfi", "-i", graph, "-ar", "48000", "-ac", "2", str(f)])
        out[name] = f
    return out


def loudnorm_2pass(src: Path, audio: dict) -> str:
    """Measure first, then normalize linearly: lands on the target (single-pass loudnorm
    tends to undershoot by 1-2 LU on short clips)."""
    base = f"loudnorm=I={audio['loudness']}:TP=-1.5:LRA=11"
    p = run([tool("ffmpeg"), "-hide_banner", "-nostdin", "-i", str(src), "-vn", "-af",
             f"highpass=f={audio['highpass']},{base}:print_format=json", "-f", "null", "-"], check=False)
    try:
        m = json.loads(p.stderr[p.stderr.rindex("{"):p.stderr.rindex("}") + 1])
        return (f"{base}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
                f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    except (ValueError, KeyError):
        return base


def wanted_targets(plan: dict, lang: str, source_hdr: bool, choice: str) -> list[str]:
    """SDR master always (previews, QA and SDR exports); HDR master when an export keeps HDR."""
    if not source_hdr or choice == "sdr":
        return ["sdr"]
    if choice == "both":
        return ["hdr", "sdr"]
    spoken = plan["languages"][0]
    out = ["sdr"]
    for e in plan.get("exports", ["ig", "x", "linkedin"]):
        e = {"name": e} if isinstance(e, str) else e
        elang = e.get("lang") or ("en" if e["name"] == "linkedin" and "en" in plan["languages"] else spoken)
        if e["name"] == "ig" and elang == lang:
            out.insert(0, "hdr")
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plan")
    ap.add_argument("--lang", required=True)
    ap.add_argument("--target", choices=["auto", "sdr", "both"], default="auto",
                    help="auto = SDR always + HDR when an export of this language keeps HDR")
    ap.add_argument("--no-captions", action="store_true")
    ap.add_argument("--no-sfx", action="store_true")
    a = ap.parse_args()

    plan = load_plan(a.plan)
    proj = project_dir(a.plan)
    tl = load_json(proj / "edit" / "timeline.json")
    source_hdr = tl["hdr"] == "hlg"
    targets = wanted_targets(plan, a.lang, source_hdr, a.target)
    W, H = plan["size"]
    dur = tl["duration"]
    audio = {"loudness": -14, "highpass": 70, "sfx": "auto", "sfx_db": -20, "music_db": -24, **plan.get("audio", {})}
    nT = len(targets)

    def split(label: str, outs: list[str]) -> str:
        return f"[{label}]split={len(outs)}" + "".join(f"[{o}]" for o in outs) if len(outs) > 1 else f"[{label}]null[{outs[0]}]"

    inputs = ["-i", "edit/aroll.mov"]
    fc = ["[0:v]format=yuv422p10le[base]", split("base", [f"b_{t}" for t in targets])]
    last = {}
    for t in targets:
        if t == "sdr" and source_hdr:  # tone-map the footage FIRST, graphics go on top untouched
            fc.append(f"[b_sdr]{HLG_TO_SDR},format=yuv422p10le[v_sdr_0]")
        else:
            fc.append(f"[b_{t}]null[v_{t}_0]")
        last[t] = f"v_{t}_0"

    def to_yuva(t: str) -> str:
        if t == "hdr":
            return f"colorchannelmixer={HLG_GRAPHICS_CCM},scale=out_color_matrix=bt2020:out_range=tv"
        return "scale=out_color_matrix=bt709:out_range=tv"

    man_path = proj / "mg" / "out" / a.lang / "manifest.json"
    beats = load_json(man_path) if man_path.exists() else []
    if not beats and plan.get("beats"):
        print(f"warning: {man_path} missing — no motion graphics in this master", file=sys.stderr)
    for k, b in enumerate(beats, start=1):
        if not Path(b["file"]).exists():
            die(f"missing render {b['file']} — run mg_render.py")
        inputs += ["-i", b["file"]]
        fc.append(f"[{k}:v]setpts=PTS-STARTPTS+{b['start']}/TB,format=rgba64le[g{k}]")
        fc.append(split(f"g{k}", [f"g{k}_{t}" for t in targets]))
        for t in targets:
            fc.append(f"[g{k}_{t}]{to_yuva(t)},format=yuva422p10le[o{k}_{t}]")
            fc.append(f"[{last[t]}][o{k}_{t}]overlay=0:0:eof_action=pass:format=yuv422p10[v_{t}_{k}]")
            last[t] = f"v_{t}_{k}"

    cap = proj / "captions" / f"{a.lang}.ass"
    if not a.no_captions:
        if not cap.exists() or not cap.with_name(f"{a.lang}_mask.ass").exists():
            die(f"{cap} / {a.lang}_mask.ass missing — run captions.py ass (or pass --no-captions)")
        fonts = esc(require_fonts())
        fc.append(f"color=c=black:s={W}x{H}:r={plan['fps']}:d={dur + 0.1},format=rgb24,"
                  f"ass=captions/{a.lang}.ass:fontsdir='{fonts}',format=gbrp[cc]")
        fc.append(f"color=c=black:s={W}x{H}:r={plan['fps']}:d={dur + 0.1},format=rgb24,"
                  f"ass=captions/{a.lang}_mask.ass:fontsdir='{fonts}',format=gray[cm]")
        fc.append(split("cc", [f"cc_{t}" for t in targets]))
        fc.append(split("cm", [f"cm_{t}" for t in targets]))
        # captions step aside during full-screen cutaways (they carry their own text)
        hide = [b for b in beats if b["layout"] == "full" and
                next((x for x in plan.get("beats", []) if x["id"] == b["id"]), {}).get("captions") is not True]
        enable = ""
        if hide:
            # commas are safe inside the single-quoted option value
            spans = "+".join(f"between(t,{b['start']:.3f},{b['start'] + b['duration']:.3f})" for b in hide)
            enable = f":enable='not({spans})'"
        for t in targets:
            ccm = f"colorchannelmixer={HLG_GRAPHICS_CCM}," if t == "hdr" else ""
            mtx = "bt2020" if t == "hdr" else "bt709"
            fc.append(f"[cc_{t}]{ccm}null[ccx_{t}];[ccx_{t}][cm_{t}]alphamerge,scale=out_color_matrix={mtx}:out_range=tv,format=yuva422p10le[capt_{t}]")
            fc.append(f"[{last[t]}][capt_{t}]overlay=0:0:format=yuv422p10:eof_action=pass{enable}[vc_{t}]")
            last[t] = f"vc_{t}"
    kind = {t: ("hlg" if t == "hdr" else "sdr") for t in targets}
    for t in targets:
        fc.append(f"[{last[t]}]setsar=1,{SETP[kind[t]]}[vout_{t}]")

    # ---- audio: voice chain, optional sfx and music, final limiter (true peak ≤ −1 dBTP)
    n_in = 1 + len(beats)
    fc.append(f"[0:a]highpass=f={audio['highpass']},{loudnorm_2pass(proj / 'edit' / 'aroll.mov', audio)},aresample=48000[vo]")
    mix = ["[voice]"]
    if audio.get("sfx") and not a.no_sfx and beats:
        files = sfx_files(Path(os.environ.get("REEL_CACHE", proj / ".cache")) / "sfx")
        cues = []
        for b in beats:
            raw = next((x for x in plan.get("beats", []) if x["id"] == b["id"]), {})
            name = raw.get("sfx", "auto")
            if name == "auto":
                name = "whoosh" if b["layout"] in ("panel", "full") and raw.get("enter", True) else ("pop" if b["layout"] == "overlay" else None)
            if name and name in files:
                cues.append((b["start"], files[name]))
        for j, (t0, f) in enumerate(cues):
            inputs += ["-i", str(f)]
            ms = int(max(0, t0 - 0.12) * 1000)
            fc.append(f"[{n_in + j}:a]volume={audio['sfx_db']}dB,adelay={ms}|{ms}[s{j}]")
            mix.append(f"[s{j}]")
        n_in += len(cues)
    if audio.get("music"):
        mp = Path(audio["music"])
        mp = mp if mp.is_absolute() else proj / mp
        inputs += ["-stream_loop", "-1", "-i", str(mp)]
        fc.append(f"[{n_in}:a]aresample=48000,volume={audio['music_db']}dB,afade=t=in:d=0.8,"
                  f"afade=t=out:st={max(0, dur - 1.5):.2f}:d=1.5[mus]")
        fc.append("[vo]asplit=2[voice][vkey]")
        fc.append("[mus][vkey]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck]")
        mix.append("[duck]")
    else:
        fc.append("[vo]anull[voice]")
    pre = f"{''.join(mix)}amix=inputs={len(mix)}:normalize=0:duration=first," if len(mix) > 1 else "[voice]"
    fc.append(f"{pre}alimiter=limit=0.79:level=false" + (f",asplit={nT}" if nT > 1 else "") + "".join(f"[aout_{t}]" for t in targets))

    out = proj / "out"
    out.mkdir(exist_ok=True)
    os.chdir(proj)
    args = inputs + ["-filter_complex", ";".join(fc)]
    masters = {}
    for t in targets:
        m = out / f"master_{a.lang}_{t}.mov"
        masters[t] = m
        args += ["-map", f"[vout_{t}]", "-map", f"[aout_{t}]", "-t", f"{dur:.4f}",
                 "-c:v", "prores_ks", "-profile:v", "3", "-vendor", "apl0",
                 *TAGS[kind[t]],
                 "-c:a", "pcm_s16le", "-ar", "48000", str(m)]
    ffmpeg(args)
    stale = out / f"master_{a.lang}_hdr.mov"
    if "hdr" not in masters and stale.exists():
        stale.unlink()  # never let export pick an HDR master from an older edit
    prev = out / f"preview_{a.lang}.mp4"
    ffmpeg(["-i", str(masters["sdr"]), "-vf", f"scale=540:960:flags=bicubic,format=yuv420p,{SETP['sdr']}",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", *TAGS["sdr"], "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart", str(prev)])
    for t, m in masters.items():
        print(f"master ({t}) → {m}")
    print(f"preview → {prev}")


if __name__ == "__main__":
    main()
