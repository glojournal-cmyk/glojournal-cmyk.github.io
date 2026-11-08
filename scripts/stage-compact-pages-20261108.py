#!/usr/bin/env python3
"""Stage the public Scholar's Garden app without changing its repository source.

All data, assets, history and learning state remain in main. Only the temporary
GitHub Pages upload omits development files and provably unreferenced legacy
Pet art folders. This script does not modify the original files.
"""
from __future__ import annotations
import argparse
import json
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITE_DIRS = frozenset({
    "__grok", "api", "art", "assessment", "assets", "cloudflare-backup",
    "cloudflare-notes", "content", "docs", "extras", "garden", "notes",
    "pet", "play", "preview", "progress", "public", "repair", "scholar",
    "session", "study",
})
SITE_ROOT_SUFFIXES = frozenset({
    ".html", ".css", ".js", ".mjs", ".json", ".svg", ".ico",
    ".png", ".webp", ".avif", ".jpg", ".jpeg", ".gif", ".txt",
    ".webmanifest", ".xml",
})
READABLE_SUFFIXES = frozenset({
    ".html", ".css", ".js", ".mjs", ".json", ".svg", ".txt", ".xml",
    ".webmanifest",
})
REQUIRED = (
    "index.html",
    "404.html",
    ".nojekyll",
    "app.css",
    "assets/index-BLVOhKhN.js",
    "assets/index-BLVOhKhN.core.js",
    "assets/study._subject.practise-y8fix-20260920.js",
    "assets/latin-recovery-topic-pool-20261107.js",
    "assets/recovery-question-diversity-20261025.js",
    "assets/latin-daily-capacity-20261107.js",
    "assets/year8-daily-v2-20261018.js",
    "content/catalog.json",
    "content/topics/la-y8-stage-1-vocabulary.json",
    "content/topics/la-y8-stage-12-vocabulary.json",
    "study/latin/practise/index.html",
    "study/french/practise/index.html",
    "pet/index.html",
    "pet/pet-art-hd-20261009.js",
    "pet/art-hd-20261009/level-1/moss-hornling.webp",
    "pet/art-baphomet-assassin-20261019/level-10.png",
    "__grok/manifest.webmanifest",
)

def public_files():
    for child in REPO.iterdir():
        if child.name == ".nojekyll":
            yield child
        elif child.is_file() and child.suffix.lower() in SITE_ROOT_SUFFIXES:
            yield child
        elif child.is_dir() and child.name in SITE_DIRS:
            for path in child.rglob("*"):
                if path.is_file() and not path.is_symlink():
                    yield path

def analyze_pet_folders(files):
    # Conservative: retain every named historical folder if even a single
    # serving JS/HTML/CSS/JSON/SVG file mentions it. Unknown dynamic references
    # therefore stay included; no active image is discarded just for size.
    serving_text = []
    for path in files:
        if path.suffix.lower() in READABLE_SUFFIXES and path.stat().st_size <= 15_000_000:
            try:
                serving_text.append(path.read_text("utf-8"))
            except (UnicodeError, OSError):
                continue
    combined = "\n".join(serving_text)
    # Preserve hidden pets and older 3D art in case a learner has a
    # previously saved outfit/skin URL, even when no current JS uses it.
    saved_url_compatibility = {"art-secret", "art-3d-v2"}
    archived = set()
    for d in (REPO / "pet").iterdir():
        if d.is_dir() and d.name.startswith("art-") and d.name not in combined and d.name not in saved_url_compatibility:
            archived.add(d.name)
    return archived

def stage(destination, report_path=None):
    destination = destination.resolve()
    if destination == REPO or REPO in destination.parents:
        # _site inside a repository would otherwise recursively copy itself;
        # only a simple directly nested output directory is supported.
        if destination != REPO / "_pages_build":
            raise ValueError("Output must be external or the dedicated _pages_build folder")
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    files = sorted(public_files())
    retired = analyze_pet_folders(files)
    included = 0
    bytes_included = 0
    bytes_excluded = 0
    count_excluded = 0
    for source in files:
        rel = source.relative_to(REPO)
        if len(rel.parts) > 2 and rel.parts[0] == "pet" and rel.parts[1] in retired:
            bytes_excluded += source.stat().st_size
            count_excluded += 1
            continue
        target = destination / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        included += 1
        bytes_included += source.stat().st_size
    missing = [p for p in REQUIRED if not (destination / p).is_file()]
    if missing:
        raise AssertionError("Missing required live app resources: " + ", ".join(missing))
    if (destination / ".github").exists() or (destination / "tests").exists():
        raise AssertionError("Development files leaked into public Pages artifact")
    if not retired:
        raise AssertionError("No unused archive folders identified; do not claim compaction")
    summary = {
        "file_count": included,
        "bytes_published": bytes_included,
        "MB_published": round(bytes_included / 1_000_000, 1),
        "archived_pet_folders_excluded": sorted(retired),
        "archived_pet_files_excluded": count_excluded,
        "bytes_pet_archives_excluded": bytes_excluded,
        "MB_pet_archives_excluded": round(bytes_excluded / 1_000_000, 1),
        "source_commit": "GITHUB_SHA provided by workflow",
    }
    if report_path:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return summary

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    try:
        stage(args.output, args.report)
    except Exception as error:
        print(f"Compact Pages staging failed: {error}", file=sys.stderr)
        sys.exit(1)
