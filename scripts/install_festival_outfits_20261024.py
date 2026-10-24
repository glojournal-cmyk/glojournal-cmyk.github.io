#!/usr/bin/env python3
"""Install the ten festival looks into the live prebuilt Gloria application.

Only artwork, outfit catalogue, and module cache tags are changed.
No learning events, stored progress, grades, records or storage keys are touched.
"""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/"art/doll/festival"
CORE=ROOT/"assets/index-BLVOhKhN.core.js"
ENTRY=ROOT/"assets/index-BLVOhKhN.js"
FESTIVALS=[
 ("halloween","Halloween Night","Violet-and-black witch cape, gold stars and lace-up boots","Autumn"),
 ("bonfire","Bonfire Night","Midnight coat, amber tartan scarf and lantern","Autumn"),
 ("christmas","Christmas Evergreen","Evergreen velvet, holly trim and winter boots","Winter"),
 ("new-year","New Year Starlight","Navy-and-gold constellation cloak and cream dress","Winter"),
 ("lunar-new-year","Lunar New Year","Ruby silk-inspired dress with golden floral embroidery","Winter"),
 ("valentine","Valentine Rose","Blush-pink dress, burgundy scarf and heart purse","Winter"),
 ("easter","Easter Meadow","Ivory and lilac floral dress, straw hat and basket","Spring"),
 ("cherry-blossom","Cherry Blossom","Rose-pink blossom layers with sage-green accents","Spring"),
 ("midsummer","Midsummer Garden","Cream-and-sage meadow dress, straw hat and flowers","Summer"),
 ("mid-autumn","Mid-Autumn Moon","Midnight-blue moonlit cape and delicate lantern","Autumn"),
]
items=[]
for i,(key,name,desc,season) in enumerate(FESTIVALS,1):
    filename=f"{i:02d}-{key}.webp"
    path=DEST/filename
    assert path.is_file() and path.stat().st_size>10000, f"Missing festival artwork: {path}"
    items.append({"id":f"festival-{key}","name":name,"blurb":desc,
        "art":"/art/doll/festival/"+filename,
        "closet":"/art/doll/festival/"+filename,
        "category":"Festival","tags":[season,"Limited Edition"],
        "free":True,"need":"Festival Edition · Ready to wear"})
manifest={"collectionId":"festival-edition-2026","title":"Festival Wardrobe — 10 Looks",
 "unlockPolicy":"available-to-all-no-date-lock","items":items}
(DEST/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf8")

core=CORE.read_text(encoding="utf8")
marker="festival-halloween"
if marker not in core:
    anchor="function nT(e,t){if(e===`day`)return!0;"
    assert core.count(anchor)==1, "Outfit catalogue anchor moved"
    rows=json.dumps(items,ensure_ascii=False,separators=(",",":"))
    core=core.replace(anchor, "$w.push(..."+rows+");eT.push(`Festival`);"+anchor,1)
    CORE.write_text(core,encoding="utf8")
assert core.count('festival-halloween')==1, "Festival looks duplicated in core"
assert core.count('eT.push(`Festival`)')==1, "Festival tab not found"
assert 'medical-10-medical-student' in core, "Medical Collection must remain"
assert 'lux-scholar-garden-v1' in core, "Existing saved-progress namespace changed"

entry=ENTRY.read_text(encoding="utf8")
if "festival-outfit-availability-v1" not in entry:
    old=' const earned=medicalOutfitCatalog.filter(o=>o.category==="Medical" && (o.needIf?.masteredTopics||Infinity)<=count && !unlocked.includes(o.id));'
    replacement=(' // festival-outfit-availability-v1: grant all ten full looks, without changing academic progression.\n'
                 ' const ready=medicalOutfitCatalog.filter(o=>o.category==="Festival" && !unlocked.includes(o.id));\n'
                 +old+'\n')
    assert entry.count(old)==1, "Medical unlock sync anchor moved"
    entry=entry.replace(old,replacement,1)
    old2=' if(earned.length)store.setState({unlockedOutfits:[...new Set([...unlocked,...earned.map(o=>o.id)])]});'
    new2=' if(earned.length||ready.length)store.setState({unlockedOutfits:[...new Set([...unlocked,...earned.map(o=>o.id),...ready.map(o=>o.id)])]});'
    assert entry.count(old2)==1
    entry=entry.replace(old2,new2,1)
    ENTRY.write_text(entry,encoding="utf8")
assert "festival-outfit-availability-v1" in ENTRY.read_text(encoding="utf8")

# Keep the human-readable source catalogue in sync for future rebuilds.
source=ROOT/"src/lib/content/outfits.ts"
ts=source.read_text(encoding="utf8")
if 'festival-halloween' not in ts:
    type_start='export type OutfitId = '
    type_end=';\n\nexport type Outfit = '
    start=ts.index(type_start)+len(type_start)
    end=ts.index(type_end,start)
    ts=ts[:end]+' | '+' | '.join(json.dumps(x["id"]) for x in items)+ts[end:]
    ts=ts.replace(' | "Achievement";',' | "Achievement" | "Festival";',1)
    anchor='\n];\n\n\nexport const EXTRA_WARDROBE_LOOK_IDS'
    assert ts.count(anchor)==1
    entries="".join('  '+json.dumps({k:x[k] for k in ("id","name","blurb","art","closet","need","category")},ensure_ascii=False)+',\n' for x in items)
    ts=ts.replace(anchor,'\n'+entries+'];\n\n\nexport const EXTRA_WARDROBE_LOOK_IDS',1)
    ex='export const EXTRA_WARDROBE_LOOK_IDS: OutfitId[] = ['
    ts=ts.replace(ex,ex+'\n'+''.join('  '+json.dumps(x["id"])+',\n' for x in items),1)
    ts=ts.replace('  switch (id) {\n    case "day":','  if (id.startsWith("festival-")) return true;\n  switch (id) {\n    case "day":',1)
    source.write_text(ts,encoding="utf8")

# Change URL fingerprints so iPad/PWA cannot mix old catalogue with new UI.
oldver="20261024-correct-credit1"
newver="20261024-festival-wardrobe1"
changed=[]
for p in [ENTRY,*ROOT.rglob("*.html")]:
    # Avoid generated test fixtures or node_modules.
    if any(part in (".git","node_modules") for part in p.parts):continue
    original=p.read_text(encoding="utf8")
    updated=original.replace(oldver,newver)
    if updated!=original:
        p.write_text(updated,encoding="utf8")
        changed.append(str(p.relative_to(ROOT)))
assert newver in ENTRY.read_text(encoding="utf8")
assert newver in (ROOT/"index.html").read_text(encoding="utf8")
assert len(items)==10 and len({x["id"] for x in items})==10
print("PASS: 10 Festival outfits, immediate unlock, no saved-learning-data edits")
print("Cache-busted:",len(changed),"HTML and entry files")
