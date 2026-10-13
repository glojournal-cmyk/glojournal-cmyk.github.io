#!/usr/bin/env python3
"""Keep route shells on the same deployed app bundle version as root."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
# Keep the full module graph on one release marker. This changes URLs only;
# asset paths, the central store and browser progress keys remain the same.
from urllib.parse import parse_qsl, urlencode
UX_RELEASE = "20261013-player-ux2"
store_match = re.search(r'/assets/index-BLVOhKhN\.js\?v=([^&"<> ]+)', (root / 'index.html').read_text(encoding='utf-8'))
if not store_match:
    raise SystemExit('Root store URL is missing')
STORE_CACHE_VERSION = store_match.group(1)
asset_ref = re.compile(r"([\"'`])([A-Za-z0-9_./-]+\.(?:js|css))(\?[^\"'`<>\s]*)?\1")
production_files = list(root.glob("*.js")) + list(root.rglob("*.html"))
for folder in ("assets", "pet", "assessment", "progress"):
    production_files.extend((root / folder).rglob("*.js"))
for file in dict.fromkeys(production_files):
    if any(part in {".git", "node_modules", "tests"} for part in file.parts) or "__grok/install" in file.as_posix():
        continue
    current = file.read_text(encoding="utf-8")
    def version_asset(match):
        quote, path, query = match.groups()
        disk = root / path.lstrip("/") if path.startswith("/") else file.parent / path
        if not disk.is_file():
            disk = root / path.lstrip("./")
        if not disk.is_file():
            return match.group(0)
        params = [(key, value) for key, value in parse_qsl((query or "")[1:]) if key != "ux"]
        if path.rsplit('/', 1)[-1] in {'index-BLVOhKhN.js', 'index-BLVOhKhN.core.js'}:
            params = [('v', STORE_CACHE_VERSION)]
        params.append(("ux", UX_RELEASE))
        return quote + path + "?" + urlencode(params) + quote
    new = asset_ref.sub(version_asset, current)
    if new != current:
        file.write_text(new, encoding="utf-8")

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

# Legacy store/PE alignment above changes their query strings. Reapply the
# release marker after that alignment so every caller resolves one module URL.
for file in dict.fromkeys(production_files):
    if any(part in {'.git', 'node_modules', 'tests'} for part in file.parts) or '__grok/install' in file.as_posix():
        continue
    current = file.read_text(encoding='utf-8')
    new = asset_ref.sub(version_asset, current)
    if new != current:
        file.write_text(new, encoding='utf-8')
print(f'Applied production resource marker: {UX_RELEASE}')
