#!/usr/bin/env python3
"""Integrate ten independently produced festival scenes into the existing Scholar scene picker.

Respect the stored equippedScene and save namespace; never touch learner records.
"""
from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/"art/scenes/festival"
CORE=ROOT/"assets/index-BLVOhKhN.core.js"
SCENE_SELECTOR=ROOT/"assets/rpg-scene-selection-20261019.js"
HOME=ROOT/"assets/home-rpg-live-20261019.js"
SCHOLAR=ROOT/"assets/scholar-iJ2ilQWG.js"
SCHOLAR_REBUILT=ROOT/"assets/scholar-rebuilt-20261021.js"
STAMP="20261024-festival-scenes1"
SCENES=[
 ("halloween","Halloween · Haunted Library","Moonlit gothic library, ravens, jack-o-lanterns, cobwebs","night"),
 ("bonfire","Bonfire Night · Fireworks","Open festival terrace, glowing bonfires and fireworks","night"),
 ("christmas","Christmas · Grand Library","Evergreen Christmas tree, presents, red ribbons and snow","winter"),
 ("new-year","New Year · Midnight Stars","Observatory ballroom with countdown clock and fireworks","night"),
 ("lunar-new-year","Lunar New Year · Lantern Court","Red and gold lanterns, plum blossom and festive banners","warm"),
 ("valentine","Valentine · Rose Conservatory","Rose-filled conservatory with hearts and ribbons","warm"),
 ("easter","Easter · Spring Greenhouse","Spring blooms, pastel eggs and Easter rabbits","day"),
 ("cherry-blossom","Cherry Blossom · Sakura Court","Pink sakura trees, petals and flowering gazebo","day"),
 ("midsummer","Midsummer · Sunlit Terrace","Golden afternoon, daisies and botanical garlands","day"),
 ("mid-autumn","Mid-Autumn · Moonlit Balcony","Moonlight, floating lanterns and golden osmanthus","night"),
]
entries=[]
for key,name,description,mood in SCENES:
    p=DEST/(key+".webp")
    assert p.exists() and p.stat().st_size>60000,f"Missing generated background {p}"
    entries.append(dict(id="festival-scene-"+key,name=name,blurb=description,
        art="/art/scenes/festival/"+key+".webp",focus="50% 54%",
        category="Festival",free=True,need="Festival Edition · Ready to use",
        mood=mood))
assert len(entries)==10 and len({x["id"] for x in entries})==10
manifest=dict(collection="Festival Backgrounds 2026",count=10,
    access="always available",selection="manual, persists independently of outfit",
    scenes=entries)
(DEST/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")

core=CORE.read_text(encoding="utf8")
anchor="].map(e=>Gw(e,`Starter scene`)),Yw=Jw.filter(e=>e.free).map(e=>e.id);"
assert core.count(anchor)==1,"Expected Reward Scene catalogue anchor moved"
if "festival-scene-halloween" not in core:
    # Add all ten before free-scenes collection and retain all old scenes/conditions.
    rows=[{k:v for k,v in scene.items() if k!="mood"} for scene in entries]
    insert="].map(e=>Gw(e,`Starter scene`));Jw.push(..."+json.dumps(rows,ensure_ascii=False,separators=(",",":"))+");var Yw=Jw.filter(e=>e.free).map(e=>e.id);"
    core=core.replace(anchor,insert,1)
    CORE.write_text(core,encoding="utf8")
assert core.count('"id":"festival-scene-halloween"')==1
assert "lux-scholar-garden-v1" in core
assert "equippedScene:n||`dusk`" in core
assert "medical-10-medical-student" in core

selector=SCENE_SELECTOR.read_text(encoding="utf8")
old="const SAFE_ART = /^\\/art\\/(?:stages|scenes)\\/[a-z0-9-]+\\.jpg$/;"
new="const SAFE_ART = /^\\/art\\/(?:stages|scenes)\\/[a-z0-9-]+\\.jpg$|^\\/art\\/scenes\\/festival\\/[a-z0-9-]+\\.webp$/;"
assert selector.count(old)==1 or new in selector,"Scene safety allowlist moved"
SCENE_SELECTOR.write_text(selector.replace(old,new),encoding="utf8")
assert "scenes\\/festival" in SCENE_SELECTOR.read_text(encoding="utf8")

# Put festival scenes first in the scene selection grid, retaining everything else.
for path in (SCHOLAR,SCHOLAR_REBUILT):
    src=path.read_text(encoding="utf8")
    before="children:h===`places`?o.map(e=>"
    after="children:h===`places`?o.filter(e=>e.category===`Festival`).concat(o.filter(e=>e.category!==`Festival`)).map(e=>"
    assert src.count(before)==1 or after in src,(path,"scene grid anchor moved")
    src=src.replace(before,after)
    src=src.replace("Places are backgrounds, not clothes. Study unlocks the later rooms.",
        "Festival scenes are ready to use. Choose any backdrop independently of her outfit.")
    path.write_text(src,encoding="utf8")

home=HOME.read_text(encoding="utf8")
night="const nightScenes = new Set(['chem-lab','sports-hall','boss-moon-garden']);"
newnight="const nightScenes = new Set(['chem-lab','sports-hall','boss-moon-garden','festival-scene-halloween','festival-scene-bonfire','festival-scene-new-year','festival-scene-mid-autumn']);"
assert home.count(night)==1 or newnight in home
home=home.replace(night,newnight)
HOME.write_text(home,encoding="utf8")

# Repoint all old hashed-module imports to ONE version to prevent two Zustand instances.
# Existing storage key and education modules are left untouched.
for path in list((ROOT/"assets").glob("*.js")) + list(ROOT.rglob("*.html")):
    if any(part in (".git","node_modules") for part in path.parts):continue
    old=path.read_text(encoding="utf8")
    fresh=old.replace("20261024-festival-independent-png2",STAMP).replace("20261024-correct-credit1",STAMP)
    if path==HOME:
        fresh=fresh.replace("20261019-selected-scene1","20261024-festival-scene-allowlist1")
    if path.name=="index.html" or path.name.startswith("scholar-"):
        fresh=fresh.replace("scholar-iJ2ilQWG.js?v=20261024-festival-independent-png2",
                            "scholar-iJ2ilQWG.js?v="+STAMP)
    if fresh!=old:path.write_text(fresh,encoding="utf8")
assert STAMP in (ROOT/"index.html").read_text(encoding="utf8")
assert STAMP in (ROOT/"assets/index-BLVOhKhN.js").read_text(encoding="utf8")
assert STAMP in (ROOT/"assets/scholar-iJ2ilQWG.js").read_text(encoding="utf8")
print("PASS: 10 free independent festival backgrounds, scene selection, shared Home + Garden state")
