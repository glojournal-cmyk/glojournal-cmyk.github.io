#!/usr/bin/env python3
"""Append nine paired Festival Mastery rewards after Medical 100/100.

Policy: Halloween remains free. Bonfire through Mid-Autumn unlock at 110..190
unique genuinely Mastered topics. Previously equipped Festival looks/backgrounds
are grandfathered. Legacy auto-granted (not earned) Festival rewards migrate
separately in app entry logic. Learner evidence and storage keys never change.
"""
from pathlib import Path
import json,re

R=Path(__file__).resolve().parents[1]
F=R/"art/doll/festival/manifest.json"
S=R/"art/scenes/festival/manifest.json"
C=R/"assets/index-BLVOhKhN.core.js"
E=R/"assets/index-BLVOhKhN.js"
SRC=R/"src/lib/content/outfits.ts"
VERSION="20261024-medical-then-festival-mastery-v1"
SLUGS=["bonfire","christmas","new-year","lunar-new-year","valentine","easter","cherry-blossom","midsummer","mid-autumn"]
THRESHOLDS={slug:110+10*i for i,slug in enumerate(SLUGS)}

def configure(rows,is_scene=False):
    assert len(rows)==10
    for row in rows:
        slug=row["id"].replace("festival-scene-" if is_scene else "festival-","")
        if slug=="halloween":
            row["free"]=True
            row.pop("needIf",None)
            row["need"]="Halloween Gift · Free for everyone"
        else:
            minimum=THRESHOLDS[slug]
            row.pop("free",None)
            row["needIf"]={"masteredTopics":minimum}
            row["need"]=f"Reach full Mastery in {minimum} different topics"
        if is_scene:
            row.setdefault("category","Festival")
    return rows

outfits=json.loads(F.read_text(encoding="utf8"))
scenes=json.loads(S.read_text(encoding="utf8"))
configure(outfits["items"])
configure(scenes["scenes"],True)
outfits.update({"unlockPolicy":"mastery-after-medical-100; halloween-free",
 "masteryStart":110,"masteryStep":10,"completeAt":190,
 "rewardPairing":"each Festival Outfit and its matching Background unlock at the same cumulative unique Mastered Topics count"})
scenes.update({"access":"halloween-free; other festival scenes require genuine cumulative Mastery after Medical",
 "masteryStart":110,"masteryStep":10,"completeAt":190,
 "selection":"manual and independent of equipped outfit; current equipped legacy scene remains grandfathered"})
assert outfits["items"][0]["free"] and scenes["scenes"][0]["free"]
assert all(outfits["items"][i]["needIf"]==scenes["scenes"][i]["needIf"] for i in range(1,10))
F.write_text(json.dumps(outfits,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
S.write_text(json.dumps(scenes,indent=2,ensure_ascii=False)+"\n",encoding="utf8")

core=C.read_text(encoding="utf8")
# Surgical JSON sections, with no changes to all other unlock catalogues.
def replace_catalogue(contents,start_mark,end_mark,rows,expected_name):
    a=contents.find(start_mark)
    assert a>=0 and contents.count(start_mark)==1,expected_name+" start moved"
    b=contents.find(end_mark,a+len(start_mark))
    assert b>a,expected_name+" end moved"
    current=json.loads("["+contents[a+len(start_mark):b]+"]")
    assert len(current)==10,expected_name+" old length changed"
    ids=[x["id"] for x in current]
    assert ids==[x["id"] for x in rows],expected_name+" unexpected ordering"
    compact=json.dumps(rows,ensure_ascii=False,separators=(",",":"))[1:-1]
    return contents[:a+len(start_mark)]+compact+contents[b:]

core=replace_catalogue(core,'eT.push(`Medical`);$w.push(...[',']);eT.push(`Festival`);',
                       outfits["items"],"Outfit Festival")
core=replace_catalogue(core,'Jw.push(...[',']);var Yw=Jw.filter(e=>e.free)',
                       [{k:v for k,v in row.items() if k!="mood"} for row in scenes["scenes"]],"Background Festival")
assert 'medical-10-medical-student' in core
assert 'lux-scholar-garden-v1' in core
C.write_text(core,encoding="utf8")

# Future source-build parity (production currently executes the compiled bundle).
source=SRC.read_text(encoding="utf8")
for row in outfits["items"]:
    marker='"id": "'+row["id"]+'"'
    assert source.count(marker)==1,marker
    # Source has a minimal typed object; update only the displayed need.
    pattern=r'(\{"id": "'+re.escape(row["id"])+r'",.*?"need": )"[^"]*"'
    replacement=lambda m:m.group(1)+json.dumps(row["need"],ensure_ascii=False)
    source,n=re.subn(pattern,replacement,source,count=1)
    assert n==1,(row["id"],"source need missing")
if "masteredTopics?: number;" not in source:
    source=source.replace("  writingDone?: number;","  writingDone?: number;\n  masteredTopics?: number;",1)
old='  if (id.startsWith("festival-")) return true;'
new='  if (id === "festival-halloween") return true;\n  if (id.startsWith("festival-")) return (ctx.masteredTopics ?? 0) >= (110 + 10 * ["bonfire","christmas","new-year","lunar-new-year","valentine","easter","cherry-blossom","midsummer","mid-autumn"].indexOf(id.slice("festival-".length)));'
assert old in source or new in source
source=source.replace(old,new)
SRC.write_text(source,encoding="utf8")

entry=E.read_text(encoding="utf8")
entry=entry.replace('  A as medicalOutfitCatalog,','  A as medicalOutfitCatalog,\n  B as rewardScenes,')
assert "  B as rewardScenes," in entry
start=entry.index('// medical-career-unlock-sync-v1:')
end=entry.index('if(typeof window!=="undefined"){\n window.__luxStore=store;',start)
replacement="""// festival-mastery-after-medical-v1: only genuine cumulative Mastered topics count.
// An earlier release auto-granted all Festival items. On first load this migration
// keeps Halloween and already equipped looks/scenes without deleting academic records;
// other old freebie flags become real 110..190 cumulative Mastery rewards.
const festivalLooks=medicalOutfitCatalog.filter(o=>o.category==="Festival");
const festivalScenes=rewardScenes.filter(o=>o.category==="Festival" && o.id.startsWith("festival-scene-"));
function syncMasteryCollections(){
 const state=store.getState();
 const count=Object.values(state.topicStats||{}).filter(t=>t?.state==="mastered").length;
 const wasMigrated=state.festivalMasteryGateV1===true;
 const oldLooks=Array.isArray(state.unlockedOutfits)?state.unlockedOutfits:["day"];
 const oldScenes=Array.isArray(state.unlockedScenes)?state.unlockedScenes:[];
 const festivalLookIds=new Set(festivalLooks.map(o=>o.id));
 const festivalSceneIds=new Set(festivalScenes.map(o=>o.id));
 // Once migration is recorded, an earned item stays earned even if a
 // later topic status changes temporarily. This does not award new Mastery.
 const ownedLooks=oldLooks.filter(id=>wasMigrated || !festivalLookIds.has(id) ||
    id==="festival-halloween" || id===state.equippedOutfit);
 const ownedScenes=oldScenes.filter(id=>wasMigrated || !festivalSceneIds.has(id) ||
    id==="festival-scene-halloween" || id===state.equippedScene);
 const earnedLooks=medicalOutfitCatalog.filter(o=>
    (o.category==="Medical" || o.category==="Festival") &&
    (o.needIf?.masteredTopics??Infinity)<=count).map(o=>o.id);
 const earnedScenes=festivalScenes.filter(o=>
    (o.needIf?.masteredTopics??Infinity)<=count).map(o=>o.id);
 const outfits=[...new Set([...ownedLooks,"festival-halloween",...earnedLooks])];
 const scenes=[...new Set([...ownedScenes,"festival-scene-halloween",...earnedScenes])];
 const outfitsChanged=outfits.length!==oldLooks.length || outfits.some((id,i)=>oldLooks[i]!==id);
 const scenesChanged=scenes.length!==oldScenes.length || scenes.some((id,i)=>oldScenes[i]!==id);
 if(!wasMigrated || outfitsChanged || scenesChanged){
    store.setState({unlockedOutfits:outfits,unlockedScenes:scenes,festivalMasteryGateV1:true});
 }
}
if(typeof window!=="undefined"){
 store.subscribe((next,prior)=>{
   if(next.topicStats!==prior?.topicStats ||
      next.unlockedOutfits!==prior?.unlockedOutfits ||
      next.unlockedScenes!==prior?.unlockedScenes ||
      next.equippedOutfit!==prior?.equippedOutfit ||
      next.equippedScene!==prior?.equippedScene) syncMasteryCollections();
 });
 store.persist?.onFinishHydration?.(syncMasteryCollections);
 queueMicrotask(()=>{
   // Never overwrite older persisted records with a pre-hydration migration.
   if(store.persist?.hasHydrated?.()!==false)syncMasteryCollections();
 });
}
"""
entry=entry[:start]+replacement+entry[end:]
E.write_text(entry,encoding="utf8")
assert 'festival-outfit-availability-v1' not in E.read_text()
assert core.count('"masteredTopics":190')>=2
# Bust module version globally (safe; no storage key or educational record edits).
changes=[]
for path in [*R.rglob("*.html"),*(R/"assets").glob("*.js")]:
    if any(p in (".git","node_modules") for p in path.parts):
        continue
    original=path.read_text(encoding="utf8")
    # Refresh all core/entry/Scholar module import version tags together to
    # prevent duplicate instances of the persistent Zustand store on iPad.
    current=re.sub(r'(index-BLVOhKhN(?:\.core)?\.js\?v=)[a-zA-Z0-9_-]+',
        lambda m:m.group(1)+VERSION,original)
    current=re.sub(r'(scholar-iJ2ilQWG\.js\?v=)[a-zA-Z0-9_-]+',
        lambda m:m.group(1)+VERSION,current)
    if current!=original:
        path.write_text(current,encoding="utf8")
        changes.append(str(path.relative_to(R)))
assert VERSION in (R/"index.html").read_text()
assert VERSION in (R/"scholar/index.html").read_text()
print("PASS: Medical 10-100 unchanged; nine paired Festival rewards 110-190; Halloween free")
print("PASS: past equipped pieces retained; old auto-free statuses migrated safely")
print("Cache-busted:",len(changes),"JS/HTML files")
