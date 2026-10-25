#!/usr/bin/env python3
"""Normalize ONLY Gloria's shared app entrypoint URL across production routes.

Every ES-module URL used for the student store must be byte-for-byte identical
or Safari can create a second store and show contradictory Daily progress.
Do not rewrite unrelated asset cache keys, CSS, PE imports or question data.
"""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
home_path = root / "index.html"
home = home_path.read_text(encoding="utf-8")
# Preserve the full canonical query string, including UX flags.
entry = re.search(r'index-BLVOhKhN\.js(\?v=[^"\x27`<>\s)]+)', home)
if not entry:
    raise SystemExit("The production Home page has no versioned student store")
canonical = "index-BLVOhKhN.js" + entry.group(1)

# Treat query strings as module identity; rewrite the WHOLE query, not just v.
# Do not touch index-BLVOhKhN.core.js (a different module).
pattern = re.compile(r'index-BLVOhKhN\.js\?v=[^"\x27`<>\s)]+')
changed = []
for source in sorted(root.rglob("*")):
    if not source.is_file() or source.suffix not in {".html", ".js"}:
        continue
    relative = source.relative_to(root)
    if any(p in {".git", "node_modules", "tests", "test-results"} for p in relative.parts):
        continue
    if relative.parts[:2] == ("__grok", "install"):
        continue
    current = source.read_text(encoding="utf-8")
    if "index-BLVOhKhN.js?v=" not in current:
        continue
    corrected = pattern.sub(canonical, current)
    if corrected != current:
        source.write_text(corrected, encoding="utf-8")
        changed.append(relative.as_posix())

# GitHub Pages falls back to 404.html when deep-linked from the iPad app.
# Its shell and imported module URLs must match Home, with no stale draft.
updated_home = home_path.read_text(encoding="utf-8")
not_found = root / "404.html"
if not_found.read_text(encoding="utf-8") != updated_home:
    not_found.write_text(updated_home, encoding="utf-8")
    changed.append("404.html")

# Reject accidental drift in any reachable production source.
errors = []
for source in sorted(root.rglob("*")):
    if not source.is_file() or source.suffix not in {".html", ".js"}:
        continue
    relative = source.relative_to(root)
    if any(p in {".git", "node_modules", "tests", "test-results"} for p in relative.parts):
        continue
    if relative.parts[:2] == ("__grok", "install"):
        continue
    for match in pattern.finditer(source.read_text(encoding="utf-8")):
        if match.group(0) != canonical:
            errors.append(str(relative))
if errors:
    raise SystemExit("Unexpected duplicate app versions: " + ", ".join(errors))

print(f"Production app entrypoint: {canonical}")
print(f"Synchronized {len(changed)} source files: {', '.join(changed)}")
