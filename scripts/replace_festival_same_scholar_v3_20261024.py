#!/usr/bin/env python3
"""Install verified same-hero Festival Edition cutouts without touching learning data.

Executed in GitHub Actions after all ten external source images are downloaded and SHA checked.
Exact filenames are cache-busted so iPad Safari cannot reuse the previous nonmatching characters.
"""
from pathlib import Path
import json,re,hashlib
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
F=ROOT/"art/doll/festival"
ID_NAMES=["halloween","bonfire","christmas","new-year","lunar-new-year","valentine","easter","cherry-blossom","midsummer","mid-autumn"]
NEW_VERSION="20261024-same-scholar-festival-v3"
OLD_CATALOGUE="20261024-festival-scenes1"
SOURCES=F/"incoming"
assert SOURCES.is_dir(),f"Missing incoming source artwork: {SOURCES}"
mapping={}
for i,slug in enumerate(ID_NAMES,1):
    old=f"{i:02}-{slug}-transparent.png"
    new=f"{i:02}-{slug}-same-scholar-v3.png"
    source=SOURCES/new
    assert source.is_file(),f"Missing original independent art {source}"
    with Image.open(source) as raw:
        assert raw.format=="PNG" and raw.mode=="RGBA",f"Not RGBA: {source}"
        assert raw.size==(1086,1448),f"Unexpected source size: {source}, {raw.size}"
        assert raw.getchannel("A").getextrema()==(0,255),f"Not actually transparent: {source}"
        assert all(raw.getpixel(pt)[3]==0 for pt in [(0,0),(1085,0),(0,1447),(1085,1447)]),f"Background opaque: {source}"
        # Add small safe margins so shoes/hats/flowing skirts are not clipped on tablets.
        img=raw.convert("RGBA")
        resized=img.resize((1002,1336),Image.Resampling.LANCZOS)
        canvas=Image.new("RGBA",img.size,(0,0,0,0))
        canvas.alpha_composite(resized,((1086-1002)//2,(1448-1336)//2))
        assert canvas.getchannel("A").getbbox()[0]>=40
        assert canvas.getchannel("A").getbbox()[1]>=50
        out=F/new
        canvas.save(out,format="PNG",optimize=True)
        assert out.stat().st_size>100000
        mapping[f"/art/doll/festival/{old}"]=f"/art/doll/festival/{new}"
        print("PASS image:",out.name,canvas.size,canvas.getchannel("A").getbbox())
assert len(mapping)==10

# New images use distinct URLs, leave all old ones physically present for clients with old HTML.
for p in [ROOT/"assets/index-BLVOhKhN.core.js",ROOT/"src/lib/content/outfits.ts"]:
    text=p.read_text(encoding="utf8")
    for old,new in mapping.items():
        assert text.count(old)>=1,(p,old,"Catalogue mapping not found")
        text=text.replace(old,new)
    p.write_text(text,encoding="utf8")

manifest=F/"manifest.json"
m=json.loads(manifest.read_text(encoding="utf8"))
assert len(m.get("items",[]))==10
for x in m["items"]:
    n=next((slug for slug in ID_NAMES if x["id"]=="festival-"+slug),None)
    assert n is not None,x
    assert x["art"] in mapping and x["closet"] in mapping
    x["art"]=mapping[x["art"]]
    x["closet"]=mapping[x["closet"]]
m["assetRevision"]=NEW_VERSION
m["assetSource"]="Ten separate full-body, transparent PNGs generated with a consistent protagonist design; independent festival artwork"
m["safeMargins"]=True
manifest.write_text(json.dumps(m,ensure_ascii=False,indent=2)+"\n",encoding="utf8")

# Only replace literal asset import query versions, preserving all other app dependencies.
# Keep shared store instance unified for Home, Scholar, Garden and other tabs.
def update_versions(p):
    text=p.read_text(encoding="utf8")
    changed=re.sub(r'(index-BLVOhKhN(?:\.core)?\.js\?v=)[a-zA-Z0-9_-]+',lambda m:m.group(1)+NEW_VERSION,text)
    # Fresh route module and Home script ensure iPad replaces stale references.
    changed=re.sub(r'(scholar-iJ2ilQWG\.js\?v=)[a-zA-Z0-9_-]+',lambda m:m.group(1)+NEW_VERSION,changed)
    changed=re.sub(r'(home-rpg-live-20261019\.js\?v=)[a-zA-Z0-9_-]+',lambda m:m.group(1)+NEW_VERSION,changed)
    if changed!=text:
        p.write_text(changed,encoding="utf8")
        return True
    return False
changed=[]
for p in list((ROOT/"assets").glob("*.js"))+list(ROOT.rglob("*.html")):
    if any(part in ("node_modules",".git","incoming") for part in p.parts):
        continue
    if update_versions(p):
        changed.append(str(p.relative_to(ROOT)))
assert NEW_VERSION in (ROOT/"index.html").read_text(encoding="utf8")
assert NEW_VERSION in (ROOT/"scholar/index.html").read_text(encoding="utf8")
assert NEW_VERSION in (ROOT/"assets/index-BLVOhKhN.js").read_text(encoding="utf8")
core=(ROOT/"assets/index-BLVOhKhN.core.js").read_text(encoding="utf8")
for old,new in mapping.items():
    assert new in core and old not in core
assert core.count('festival-halloween')==1
assert "lux-scholar-garden-v1" in core
assert "medical-10-medical-student" in core
print("PASS: ten new Festival artwork URLs, unchanged outfit IDs, store key intact; modules refreshed:",changed)
