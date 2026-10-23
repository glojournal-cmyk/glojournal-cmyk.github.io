#!/usr/bin/env python3
"""Safely copy only curated Gloria Image Notes from misnested R2 keys.
The original R2 objects are NEVER deleted or overwritten.
"""
import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

BUCKET = "gloria-notes-library"
PREFIX = "year9/french/"
API = "https://api.cloudflare.com/client/v4/accounts/{}/r2/buckets/{}/objects"
ACCOUNT = os.environ["CF_ACCOUNT_ID"]
TOKEN = os.environ["CF_API_TOKEN"]
BASE = API.format(ACCOUNT, BUCKET)
AUTH = {"Authorization": "Bearer " + TOKEN}
DRY = "--dry-run" in sys.argv

def call(url, method="GET", data=None, headers=None, timeout=90):
    request = urllib.request.Request(url, data=data, method=method,
                                     headers={**AUTH, **(headers or {})})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        # Never print the Authorization header, token or binary response.
        raise RuntimeError("Cloudflare R2 request failed: HTTP "
                           + str(exc.code) + " method=" + method) from None

def object_url(key):
    return BASE + "/" + urllib.parse.quote(key, safe="/")

def listing():
    raw = call(BASE + "?per_page=1000")
    obj = json.loads(raw)
    if not obj.get("success"):
        raise RuntimeError("Cloudflare R2 object listing was not successful")
    if obj.get("result_info", {}).get("is_truncated"):
        raise RuntimeError("Object list is truncated; refusing partial repairs")
    objects = obj.get("result", [])
    if isinstance(objects, dict):
        objects = objects.get("objects", [])
    return {o["key"]: o for o in objects}

def check_pdf(key, expected):
    data = call(object_url(key))
    if len(data) != expected:
        raise RuntimeError("Size mismatch for " + key +
                           ": " + str(len(data)) + " vs " + str(expected))
    if not data.startswith(b"%PDF-"):
        raise RuntimeError("Non-PDF content at " + key)
    return data

def main():
    notes = json.loads(Path("notes/catalog.json").read_text())["notes"]
    allowed = {n["key"]: int(n["sizeBytes"]) for n in notes
               if n["key"].endswith(".pdf")}
    objects = listing()
    source = {k: v for k, v in objects.items()
              if k.startswith((PREFIX + "summer/", PREFIX + "year9/"))
              and k.endswith(".pdf")}
    matches = []
    ignored = []
    for old, meta in source.items():
        dest = old[len(PREFIX):]
        size = int(meta["size"])
        if dest not in allowed or allowed[dest] != size:
            ignored.append(old)
            continue
        existing = objects.get(dest)
        if existing and int(existing["size"]) != size:
            raise RuntimeError("Destination already exists with different size: " + dest)
        matches.append((old, dest, size, bool(existing)))
    if not matches:
        raise RuntimeError("No safe catalogue-matching misplaced PDF objects found")
    if len(matches) > 29 or sum(item[2] for item in matches) > 220_000_000:
        raise RuntimeError("Repair scope exceeds reviewed limit; refusing to copy")
    print("MATCHING_CURATED_IMAGE_NOTES",len(matches))
    print("MATCHED_BYTES",sum(x[2] for x in matches))
    print("EXCLUDED_NONCURATED",len(ignored))
    print("ALREADY_IN_CORRECT_LOCATION",sum(x[3] for x in matches))
    print("TO_COPY",sum(not x[3] for x in matches))
    if DRY:
        # One end-to-end source read verifies API permissions and PDF bytes,
        # without writing anything before the PR has been reviewed by CI.
        old, dest, size, _ = min(matches, key=lambda x: x[2])
        check_pdf(old, size)
        print("READ_ONLY_SOURCE_PDF_VERIFIED",dest,size)
        print("DRY_RUN_COMPLETE_NO_WRITES")
        return
    copied = 0
    for old, dest, size, already in sorted(matches):
        if already:
            print("UNCHANGED_ALREADY_EXISTS",dest,size)
            continue
        pdf = check_pdf(old, size)
        response = call(object_url(dest),method="PUT",data=pdf,
                        headers={"Content-Type":"application/pdf"},timeout=120)
        try:
            payload = json.loads(response)
        except ValueError as err:
            raise RuntimeError("Unexpected non-JSON Cloudflare upload response") from err
        if not payload.get("success"):
            raise RuntimeError("Cloudflare upload not confirmed for " + dest)
        print("COPIED_VERIFIED_SOURCE",dest,size)
        copied += 1
    after = listing()
    for _,dest,size,_ in matches:
        if dest not in after or int(after[dest]["size"]) != size:
            raise RuntimeError("Post-copy bucket listing disagrees with expected file: " + dest)
    print("VERIFIED_IMAGE_NOTE_PDFS_AT_CORRECT_PATH",len(matches))
    print("NEWLY_COPIED",copied)
    print("ORIGINAL_KEYS_PRESERVED",len(matches))
    print("ALL_MATCHING_DESTINATIONS_VERIFIED")

if __name__ == "__main__":
    main()
