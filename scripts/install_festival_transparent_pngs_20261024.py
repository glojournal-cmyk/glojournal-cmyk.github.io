#!/usr/bin/env python3
"""Swap the ten original Festival sheet-crops for ten separate transparent PNGs.

Do not touch learner activity, scores, storage keys, or unlocked/equipped outfits.
"""
from pathlib import Path
import json, struct
ROOT=Path(__file__).resolve().parents[1]
F=ROOT/"art/doll/festival"
NAMES=["halloween","bonfire","christmas","new-year","lunar-new-year","valentine","easter","cherry-blossom","midsummer","mid-autumn"]
LEGACY_VER="20261024-festival-wardrobe1"
FRESH_VER="20261024-festival-independent-png2"
assets={}
for i,name in enumerate(NAMES,1):
    old=f"{i:02d}-{name}.webp"
    new=f"{i:02d}-{name}-transparent.png"
    path=F/new
    raw=path.read_bytes()
    assert raw[:8]==b"\x89PNG\r\n\x1a\n",f"Not a PNG: {path}"
    w,h,depth,color=struct.unpack(">IIBB",raw[16:26])
    assert color==6 and depth==8,f"{path}: expected true RGBA (color 6), got {color}"
    assert w>=1000 and h>=1000,f"{path}: too small"
    assert len(raw)>100000,f"{path}: truncated"
    assets[old]=new
    print(f"Verified {new}: {w}x{h}, RGBA, {len(raw):,} bytes")

paths=[ROOT/"assets/index-BLVOhKhN.core.js",ROOT/"src/lib/content/outfits.ts",F/"manifest.json",ROOT/"assets/math-study/outfits.json"]
for p in paths:
    if not p.is_file():continue
    src=p.read_text(encoding="utf8")
    changed=src
    for a,b in assets.items():
        changed=changed.replace("/art/doll/festival/"+a,"/art/doll/festival/"+b)
    if p.name=="manifest.json":
        obj=json.loads(changed)
        assert len(obj["items"])==10
        assert all(x["art"].endswith("-transparent.png") and x["art"]==x["closet"] for x in obj["items"])
        obj["assetSource"]="10 independently generated full-body transparent PNG illustrations; original sheet crops superseded"
        obj["assetRevision"]=FRESH_VER
        changed=json.dumps(obj,indent=2,ensure_ascii=False)+"\n"
    if changed!=src:
        p.write_text(changed,encoding="utf8")
        print("Updated",p.relative_to(ROOT))
core=(ROOT/"assets/index-BLVOhKhN.core.js").read_text(encoding="utf8")
assert len([x for x in assets.values() if "/art/doll/festival/"+x in core])==10
assert "/art/doll/festival/01-halloween.webp" not in core
assert "medical-10-medical-student" in core
assert "lux-scholar-garden-v1" in core

# Explicit cache fingerprint required for PWA Safari not to render old cropped thumbnails.
targets=[ROOT/"assets/index-BLVOhKhN.js",*ROOT.rglob("*.html")]
count=0
for p in targets:
    if any(part in ("node_modules",".git") for part in p.parts):continue
    src=p.read_text(encoding="utf8")
    changed=src.replace(LEGACY_VER,FRESH_VER)
    if changed!=src:
        p.write_text(changed,encoding="utf8")
        count+=1
assert FRESH_VER in (ROOT/"index.html").read_text(encoding="utf8")
assert FRESH_VER in (ROOT/"assets/index-BLVOhKhN.js").read_text(encoding="utf8")
print("PASS: all 10 Festival looks are independent RGBA PNG; iPad cache busted",count,"files")
