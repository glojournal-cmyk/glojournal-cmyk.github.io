#!/usr/bin/env python3
"""Publish exactly two user-supplied image-page Year 9 Notes, without touching any backups.
PR event: source validation only. Main event: R2 PUT then verify read-only Worker."""
import json,os,re,sys,hashlib,time
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request,urlopen
from urllib.error import HTTPError

FILES=[
 {"subject":"maths","key":"year9/maths/Year_9_Maths_Topic_5_Notes_10_Pages.pdf",
  "filename":"Year_9_Maths_Topic_5_Notes_10_Pages.pdf",
  "url":"https://at.adobe.com/m2OL3J9uJukfsnBX","size":2760709,"pages":10},
 {"subject":"biology","key":"year9/biology/Biology_2Nov_Revision_Notes.pdf",
  "filename":"Biology_2Nov_Revision_Notes.pdf",
  "url":"https://at.adobe.com/3Vjsko6caD5rABwp","size":25041743,"pages":9},
]
OUT=Path("/tmp/gloria-year9-notes")
OUT.mkdir(exist_ok=True)
WRITE="--upload" in sys.argv

def read_req(url,method="GET",data=None,headers=None,timeout=110):
 req=Request(url,method=method,data=data,headers=headers or {})
 try:
  with urlopen(req,timeout=timeout) as rsp:return rsp.read()
 except HTTPError as e:
  raise RuntimeError(f"HTTP {e.code} on {method} to authorized endpoint") from None

def get_cloud_listing(base,headers):
 r=json.loads(read_req(base+"?per_page=1000",headers=headers,timeout=35))
 if not r.get("success"):raise RuntimeError("R2 listing returned an error")
 if r.get("result_info",{}).get("is_truncated"):raise RuntimeError("R2 listing truncated")
 objects=r.get("result",[])
 if isinstance(objects,dict):objects=objects.get("objects",[])
 return {x["key"]:int(x["size"]) for x in objects}

def main():
 # Depend on exact catalogue key+bytes; never expand scope to other files.
 catalogue=json.loads(Path("notes/catalog.json").read_text())["notes"]
 from pypdf import PdfReader
 for entry in FILES:
  note=next((n for n in catalogue if n["key"]==entry["key"]),None)
  if not note or int(note["sizeBytes"])!=entry["size"]:
   raise RuntimeError("Invalid catalogue key or size: "+entry["key"])
  content=read_req(entry["url"],timeout=110)
  if len(content)!=entry["size"] or not content.startswith(b"%PDF-"):
   raise RuntimeError("Source PDF does not match verified upload metadata for "+entry["filename"])
  target=OUT/entry["filename"]
  target.write_bytes(content)
  reader=PdfReader(str(target))
  if len(reader.pages)!=entry["pages"]:raise RuntimeError("PDF page count changed: "+entry["filename"])
  chars=sum(len(p.extract_text() or "") for p in reader.pages)
  if chars>600:
   raise RuntimeError("PDF is no longer an illustrated image-page Note: "+entry["filename"])
  entry["sha256"]=hashlib.sha256(content).hexdigest()
  print("SOURCE_IMAGE_PDF_VALID",entry["filename"],len(content),entry["pages"],"pages","text_chars",chars,"sha256",entry["sha256"])
 if not WRITE:
  print("SAFE_DRY_RUN_COMPLETE_NO_BUCKET_WRITES")
  return
 account=os.getenv("CF_ACCOUNT_ID")
 token=os.getenv("CF_API_TOKEN")
 if not account or not token:raise RuntimeError("Cloudflare R2 credentials unavailable")
 base=f"https://api.cloudflare.com/client/v4/accounts/{quote(account)}/r2/buckets/gloria-notes-library/objects"
 auth={"Authorization":"Bearer "+token}
 before=get_cloud_listing(base,auth)
 for entry in FILES:
  key=entry["key"];existing=before.get(key)
  if existing is not None:
   if existing!=entry["size"]:raise RuntimeError("Refuse overwrite differing R2 object "+key)
   print("ALREADY_PRESENT_EXACT_SIZE",key,existing)
   continue
  content=(OUT/entry["filename"]).read_bytes()
  response=read_req(base+"/"+quote(key,safe="/"),"PUT",content,
        {**auth,"Content-Type":"application/pdf"},timeout=180)
  try:result=json.loads(response)
  except ValueError:raise RuntimeError("Upload not confirmed by Cloudflare API for "+key)
  if not result.get("success"):raise RuntimeError("Cloudflare upload failed for "+key)
  print("R2_UPLOAD_SUCCEEDED",key,len(content))
 after=get_cloud_listing(base,auth)
 for entry in FILES:
  if after.get(entry["key"])!=entry["size"]:
   raise RuntimeError("Post-upload Cloudflare object list mismatch for "+entry["key"])
 print("YEAR9_TWO_PDFS_VERIFIED_IN_R2")
 # Real reader test, allow Cloudflare edge catalog cache a brief propagation.
 public="https://gloria-notes-public.glo-journal.workers.dev"
 for attempt in range(12):
  r=json.loads(read_req(public+"/catalog",timeout=35))
  published={x["key"] for x in r["files"]}
  if all(x["key"] in published for x in FILES):
   print("TWO_NOTES_AVAILABLE_VIA_PUBLIC_READER","attempt",attempt+1)
   break
  time.sleep(5)
 else:raise RuntimeError("R2 files exist but Cloudflare reader has not published both")
 for entry in FILES:
  u=public+"/pdf?key="+quote(entry["key"],safe="")
  h=read_req(u,"GET",headers={"Range":"bytes=0-4"},timeout=35)
  if h!=b"%PDF-":raise RuntimeError("Public reader PDF range content invalid "+entry["key"])
  print("VERIFIED_PDF_BYTES_PUBLIC",entry["key"])
 print("SUCCESS_2_IMAGE_NOTES_CLOUD_AVAILABLE_AND_OPENABLE")

if __name__=="__main__":main()
