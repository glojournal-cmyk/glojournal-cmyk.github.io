#!/usr/bin/env python3
"""Keep route shells on the same deployed app bundle version as root."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
home = (root / "index.html").read_text(encoding="utf-8")
pattern = re.compile(r'(/assets/index-BLVOhKhN\.js)\?v=([^&"\x27<> ]+)')
versions = set(pattern.findall(home))
if len(versions) != 1:
    raise SystemExit(f"Unexpected root module version set: {versions}")
version = next(iter(versions))[1]
standalone = {
    "progress/weekly/index.html", "pet/index.html", "assessment/index.html",
    "preview/index.html", "study/biology/school-notes/index.html",
    "assessment/biology-cell-structure/index.html",
}
updated = []
for file in sorted(root.rglob("index.html")):
    rel = file.relative_to(root).as_posix()
    if rel == "index.html" or rel in standalone or ".git" in file.parts or "node_modules" in file.parts or rel.startswith("__grok/install/"):
        continue
    current = file.read_text(encoding="utf-8")
    new = pattern.sub(lambda m: f"{m.group(1)}?v={version}", current)
    if current != new:
        file.write_text(new, encoding="utf-8")
        updated.append(rel)
not_found = root / "404.html"
if not_found.read_text(encoding="utf-8") != home:
    not_found.write_text(home, encoding="utf-8")
    updated.append("404.html")
print(f"Synchronized {len(updated)} route shells to main module {version}: {', '.join(updated)}")

# Keep imports of the central store on the root shell's cache version.
# Use a real single backslash in Python regex patterns (not double-escaped).
import_re = re.compile(r"""(from["']\./index-BLVOhKhN\.js)\?v=[^"']+""")
pe_re = re.compile(r"""pe-circuit-v3-20260920\.js\?v=[^"']+""")
for file in sorted((root / "assets").glob("*.js")):
    if file.name in {"index-BLVOhKhN.js", "index-BLVOhKhN.core.js"}:
        continue
    current = file.read_text(encoding="utf-8")
    new = import_re.sub(lambda m: f"{m.group(1)}?v={version}", current)
    if file.name in {"play.index-sR2wZ5CM.js", "play._game-BbpxhxeZ.js"}:
        new = pe_re.sub(f"pe-circuit-v3-20260920.js?v={version}", new)
    if new != current:
        file.write_text(new, encoding="utf-8")
        updated.append(file.relative_to(root).as_posix())
print(f"Aligned JS imports: {len([p for p in updated if p.startswith('assets/')])}")
