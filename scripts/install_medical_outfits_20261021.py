#!/usr/bin/env python3
"""Install ten Medical Career outfits in the production Scholar Garden build."""
import json, pathlib

ROOT=pathlib.Path(__file__).resolve().parents[1]
CAT=json.loads((ROOT/"art/doll/medical/manifest.json").read_text("utf-8"))
CORE=ROOT/"assets/index-BLVOhKhN.core.js"
ENTRY=ROOT/"assets/index-BLVOhKhN.js"
ITEMS=CAT["items"]
T=chr(96)
assert len(ITEMS)==10
assert [x["requiredMastery"] for x in ITEMS]==list(range(10,101,10))
for item in ITEMS:
    assert (ROOT/item["image"].lstrip("/")).is_file(),item["image"]
s=CORE.read_text("utf-8")
anchor="function nT(e,t){if(e==="+T+"day"+T+")return!0;"
assert s.count(anchor)==1,"Wardrobe source changed"
if "medical-01-forensic-pathologist" not in s:
    rows=[]
    for i,x in enumerate(ITEMS,1):
        rows.append({"id":f"medical-{i:02d}-{x['id']}","name":x["name"],
             "blurb":f"Medical Careers · {x['nameZh']}","art":x["image"],
             "closet":x["image"],"category":"Medical","tags":["Medical"],
             "needIf":{"masteredTopics":x["requiredMastery"]},
             "need":f"Reach full Mastery in {x['requiredMastery']} different topics"})
    addition="$w.push(..."+json.dumps(rows,ensure_ascii=False,separators=(",",":"))+");eT.push("+T+"Medical"+T+");"
    s=s.replace(anchor,addition+anchor,1)
    CORE.write_text(s,"utf-8")
assert "masteredTopics:MwM(n)" in s
assert "function MwM(e){return Object.values(e??{}).filter(e=>e?.state==="+T+"mastered"+T+").length}" in s
assert "eT.push("+T+"Medical"+T+")" in s
assert s.count("medical-10-medical-student")==1

js=ENTRY.read_text("utf-8")
if "medical-career-unlock-sync-v1" not in js:
    needle="  C as store,\n"
    assert js.count(needle)==1
    js=js.replace(needle,needle+"  A as medicalOutfitCatalog,\n",1)
    anchor='if(typeof window!=="undefined"){\n window.__luxStore=store;'
    assert js.count(anchor)==1
    addition="""// medical-career-unlock-sync-v1: only unlock earned looks; never edits academic evidence.
function syncEarnedMedicalOutfits(){
 const state=store.getState();
 const count=Object.values(state.topicStats||{}).filter(t=>t?.state==="mastered").length;
 const unlocked=state.unlockedOutfits||[];
 const earned=medicalOutfitCatalog.filter(o=>o.category==="Medical" && (o.needIf?.masteredTopics||Infinity)<=count && !unlocked.includes(o.id));
 if(earned.length)store.setState({unlockedOutfits:[...new Set([...unlocked,...earned.map(o=>o.id)])]});
}
if(typeof window!=="undefined"){
 store.subscribe((next,prior)=>{if(next.topicStats!==prior?.topicStats || next.unlockedOutfits!==prior?.unlockedOutfits)syncEarnedMedicalOutfits()});
 store.persist?.onFinishHydration?.(syncEarnedMedicalOutfits);
 queueMicrotask(syncEarnedMedicalOutfits);
}
"""
    js=js.replace(anchor,addition+anchor,1)

# Ensure iPad sees one fresh shared module rather than mixed old and new stores.
old="20261021-daily-credit1"
new="20261021-medical-careers1"
files=[ENTRY]
files += list(ROOT.rglob("*.html"))
files += list((ROOT/"assets").rglob("*.js"))
files=list(dict.fromkeys(files))
changes=[]
for path in files:
    prev=path.read_text("utf-8")
    updated=(js if path==ENTRY else prev).replace(old,new) if "index-BLVOhKhN" in (js if path==ENTRY else prev) else prev
    if updated!=prev:
        path.write_text(updated,"utf-8")
        changes.append(str(path.relative_to(ROOT)))
assert "medical-career-unlock-sync-v1" in ENTRY.read_text("utf-8")
assert old not in ENTRY.read_text("utf-8")
print("PASS: 10 Medical careers, thresholds 10–100, original mastered-topic accounting")
print("Cache-busted ESM references:",len(changes))
print("Example updated files:",changes[:12])
