#!/usr/bin/env python3
"""Print a JSON summary of a video: display size, fps, duration, HDR kind (hlg/pq/sdr), audio.

Usage: probe.py VIDEO [--out FILE]
"""
import argparse
import json

from reel_common import probe, save_json

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("video")
ap.add_argument("--out")
a = ap.parse_args()
info = probe(a.video)
if a.out:
    save_json(a.out, info)
print(json.dumps(info, indent=2, ensure_ascii=False))
