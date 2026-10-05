"""Shared helpers for the /ps:reel scripts (stdlib only)."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent

# BT.709 -> BT.2020 primaries matrix, scaled by 0.75 so graphics white lands at
# ~75% HLG signal (the HLG "reference white" / graphics white). Applied in the
# gamma domain; matched by eye against macOS's HDR rendering of iPhone footage.
HLG_GRAPHICS_CCM = (
    "rr=0.4706:rg=0.2470:rb=0.0325:"
    "gr=0.0518:gg=0.6896:gb=0.0086:"
    "br=0.0123:bg=0.0660:bb=0.6717"
)

# HLG -> SDR tone map that kept skin tones looking like the phone's own HDR
# rendering. Naive conversions (scale/colormatrix only) turned skin yellow and
# washed out — never use them for HDR sources.
HLG_TO_SDR = (
    "zscale=tin=arib-std-b67:min=bt2020nc:pin=bt2020:rin=tv:t=linear:npl=1000,"
    "format=gbrpf32le,zscale=p=bt709,"
    "tonemap=tonemap=reinhard:param=0.5:desat=0:peak=4.9,"
    "zscale=t=iec61966-2-1:m=bt709:r=tv,format=yuv444p10le"  # zscale does the RGB→YUV step with BT.709
)

# Container/codec color tags (-color_* options) ...
TAGS = {
    "hlg": ["-color_primaries", "bt2020", "-color_trc", "arib-std-b67", "-colorspace", "bt2020nc", "-color_range", "tv"],
    "sdr": ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv"],
}
# ... and the same on the frames. Newer ffmpeg (8.x) takes color tags from the frames and
# ignores -color_*; every final video chain ends with SETP so both old and new builds tag right.
SETP = {
    "hlg": "setparams=color_primaries=bt2020:color_trc=arib-std-b67:colorspace=bt2020nc:range=tv",
    "sdr": "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv",
}

# sRGB still (JPEG/PNG cover) -> BT.709 limited-range video frame
COVER_TO_709 = "scale=in_color_matrix=bt601:out_color_matrix=bt709:in_range=full:out_range=tv"


def die(msg: str, code: int = 1):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def _bootstrap_env():
    """Make every script work without `source env.sh` (shells don't persist between
    agent tool calls): find the cache like setup.sh does and load env.sh into os.environ."""
    cache = os.environ.get("REEL_CACHE")
    if not cache:
        cache = "/workspace/.cache/ps-reel" if os.access("/workspace", os.W_OK) else \
            str(Path(os.environ.get("XDG_CACHE_HOME", Path.home() / ".cache")) / "ps-reel")
        os.environ["REEL_CACHE"] = cache
    env = Path(cache) / "env.sh"
    if env.exists():
        for line in env.read_text().splitlines():
            line = line.strip()
            if not line.startswith("export ") or "=" not in line:
                continue
            k, v = line[7:].split("=", 1)
            v = v.strip()
            if k == "PATH":  # export PATH='/x/bin':"$PATH"
                first = v.split(":")[0].strip("'\"")
                if first and first not in os.environ.get("PATH", "").split(os.pathsep):
                    os.environ["PATH"] = first + os.pathsep + os.environ.get("PATH", "")
            else:
                os.environ.setdefault(k, v.strip("'\""))


_bootstrap_env()


def ensure_venv(modules: list[str]):
    """Re-exec under the setup venv if a needed module isn't importable here."""
    import importlib.util
    if all(importlib.util.find_spec(m) for m in modules):
        return
    py = os.environ.get("REEL_PY") or str(Path(os.environ["REEL_CACHE"]) / "venv" / "bin" / "python")
    if Path(py).exists() and Path(sys.executable).resolve() != Path(py).resolve():
        os.execv(py, [py, *sys.argv])
    die(f"missing python modules {modules} — run scripts/setup.sh")


def require_fonts() -> str:
    fonts = os.environ.get("REEL_FONTS") or str(Path(os.environ["REEL_CACHE"]) / "fonts")
    if not (Path(fonts) / "Poppins-ExtraBold.ttf").exists():
        die(f"fonts missing in {fonts} — run scripts/setup.sh")
    os.environ["REEL_FONTS"] = fonts
    return fonts


def tool(name: str) -> str:
    """Resolve ffmpeg/ffprobe: $REEL_CACHE/ffmpeg/bin first, then PATH."""
    cache = os.environ.get("REEL_CACHE")
    if cache:
        p = Path(cache) / "ffmpeg" / "bin" / name
        if p.exists():
            return str(p)
    found = shutil.which(name)
    if not found:
        die(f"{name} not found — run scripts/setup.sh")
    return found


def run(cmd: list[str], quiet: bool = True, check: bool = True) -> subprocess.CompletedProcess:
    if not quiet:
        print("+", " ".join(cmd), file=sys.stderr)
    p = subprocess.run(cmd, capture_output=True, text=True)
    if check and p.returncode != 0:
        tail = "\n".join(p.stderr.strip().splitlines()[-25:])
        die(f"command failed ({p.returncode}): {' '.join(cmd[:6])} ...\n{tail}")
    return p


def ffmpeg(args: list[str], **kw) -> subprocess.CompletedProcess:
    return run([tool("ffmpeg"), "-hide_banner", "-nostdin", "-y", "-v", "error", *args], **kw)


def probe(path: str | Path) -> dict:
    """Summarize a media file: display size, fps, duration, HDR kind, audio."""
    p = run([tool("ffprobe"), "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)])
    data = json.loads(p.stdout)
    v = next((s for s in data["streams"] if s.get("codec_type") == "video"), None)
    a = next((s for s in data["streams"] if s.get("codec_type") == "audio"), None)
    if v is None:
        die(f"no video stream in {path}")
    w, h = int(v["width"]), int(v["height"])
    rot = 0
    for sd in v.get("side_data_list", []) or []:
        if "rotation" in sd:
            rot = int(round(float(sd["rotation"])))
    if "rotate" in (v.get("tags") or {}):
        rot = int(v["tags"]["rotate"])
    if abs(rot) % 180 == 90:
        w, h = h, w
    rate = v.get("avg_frame_rate") or "0/0"
    if rate == "0/0":
        rate = v.get("r_frame_rate") or "0/0"
    fps = float(Fraction(rate)) if rate != "0/0" else 30.0
    trc = (v.get("color_transfer") or "").lower()
    hdr = "hlg" if trc == "arib-std-b67" else "pq" if trc == "smpte2084" else "sdr"
    dur = float(data["format"].get("duration") or v.get("duration") or 0)
    return {
        "path": str(path),
        "width": w,
        "height": h,
        "rotation": rot,
        "fps": round(fps, 3),
        "duration": round(dur, 3),
        "codec": v.get("codec_name"),
        "pix_fmt": v.get("pix_fmt"),
        "bit_depth": int(v.get("bits_per_raw_sample") or (10 if "10" in (v.get("pix_fmt") or "") else 8)),
        "color_transfer": trc or None,
        "color_primaries": v.get("color_primaries"),
        "hdr": hdr,
        "audio": None if a is None else {
            "codec": a.get("codec_name"),
            "sample_rate": int(a.get("sample_rate") or 0),
            "channels": a.get("channels"),
        },
    }


def load_json(path: str | Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str | Path, data, indent: int = 2):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=indent)
        f.write("\n")


def project_dir(plan_path: str | Path) -> Path:
    return Path(plan_path).resolve().parent


def load_plan(plan_path: str | Path) -> dict:
    plan = load_json(plan_path)
    plan.setdefault("fps", 30)
    plan.setdefault("speed", 1.0)
    plan.setdefault("size", [1080, 1920])
    plan.setdefault("languages", [plan.get("lang", "es")])
    return plan


def resolve_source(plan_path: str | Path, plan: dict) -> Path:
    src = Path(plan["source"])
    if not src.is_absolute():
        src = project_dir(plan_path) / src
    if not src.exists():
        die(f"source video not found: {src}")
    return src


def norm_word(s: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return "".join(c for c in s if c.isalnum())


def resolve_time(spec, words: list[dict] | None) -> float:
    """A beat time is seconds on the OUTPUT timeline, or an anchor to a spoken word:
    {"word": "transcripción", "nth": 1, "offset": -0.15, "edge": "start"}."""
    if isinstance(spec, (int, float)):
        return float(spec)
    if isinstance(spec, dict) and "word" in spec:
        if not words:
            die("word anchors need edit/words_out.json — run cut.py first")
        target = [norm_word(t) for t in str(spec["word"]).split()]
        nth = int(spec.get("nth", 1))
        seen = 0
        toks = [norm_word(w["w"]) for w in words]
        for i in range(len(toks) - len(target) + 1):
            if toks[i:i + len(target)] == target:
                seen += 1
                if seen == nth:
                    edge = spec.get("edge", "start")
                    w = words[i] if edge == "start" else words[i + len(target) - 1]
                    return round(float(w["start" if edge == "start" else "end"]) + float(spec.get("offset", 0)), 3)
        die(f"anchor word not found: {spec}")
    die(f"bad time spec: {spec!r}")


def t_value(v, lang: str):
    """Localized prop: plain string, or {"es": "...", "en": "..."}."""
    if isinstance(v, dict) and lang in v:
        return v[lang]
    if isinstance(v, dict) and v and all(isinstance(k, str) and len(k) == 2 for k in v):
        return next(iter(v.values()))
    return v


def contact_sheet(tiles: list[tuple[str, str]], out: str | Path, cols: int = 4, tw: int = 270, th: int = 480) -> Path | None:
    """Grid of labeled frames. tiles = [(image_path, label)]. Labels are drawn under each frame."""
    tiles = [(p, lab) for p, lab in tiles if Path(p).exists()]
    if not tiles:
        return None
    font = Path(os.environ.get("REEL_FONTS", "")) / "Inter.ttf"
    fs = max(14, tw // 14)
    lab_h = fs + 18
    cols = max(1, min(cols, len(tiles)))
    rows = (len(tiles) + cols - 1) // cols
    inputs, fc = [], []
    for i, (p, lab) in enumerate(tiles):
        inputs += ["-i", str(p)]
        txt = lab.replace("\\", "\\\\").replace(":", r"\:").replace("'", "’").replace(",", r"\,")
        draw = f",drawtext=fontfile='{font}':text='{txt}':x=10:y={th + 8}:fontsize={fs}:fontcolor=white" if font.exists() else ""
        fc.append(f"[{i}:v]scale={tw}:{th}:force_original_aspect_ratio=decrease,pad={tw}:{th + lab_h}:(ow-iw)/2:0:0x111111,setsar=1{draw}[t{i}]")
    n = cols * rows
    for j in range(len(tiles), n):
        fc.append(f"color=c=0x111111:s={tw}x{th + lab_h}:d=1[t{j}]")
    layout = "|".join(f"{(i % cols) * tw}_{(i // cols) * (th + lab_h)}" for i in range(n))
    fc.append("".join(f"[t{i}]" for i in range(n)) + (f"xstack=inputs={n}:layout={layout}[s]" if n > 1 else "null[s]"))
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg(inputs + ["-filter_complex", ";".join(fc), "-map", "[s]", "-frames:v", "1", "-q:v", "3", str(out)])
    return out


def grab_frame(video: str | Path, t: float, out: str | Path) -> Path:
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg(["-ss", f"{max(0.0, t):.3f}", "-i", str(video), "-frames:v", "1", "-q:v", "3", str(out)])
    return out
