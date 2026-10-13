#!/usr/bin/env python3
"""Reframe near-edge Night Spider sprites without redrawing any artwork.
Only operates on the original evolution assets. Existing progress is untouched.
Idempotent across repeated GitHub Action runs.
"""
from pathlib import Path
from PIL import Image
import hashlib
import io
import json

ROOT = Path("pet/art-level10-20261012")
MANIFEST = ROOT / "manifest.json"
BEFORE = "20261012-evolution1"
AFTER = "20261013-spider-safe1"
MARGIN = 68
manifest = json.loads(MANIFEST.read_text())
if manifest["version"] == AFTER:
    print("Spider artwork already reframed; no changes.")
    raise SystemExit(0)
if manifest["version"] != BEFORE:
    raise SystemExit("Unexpected art manifest version. Refusing to rewrite.")

for level in range(6, 11):
    path = ROOT / f"level-{level}" / "night-spider.webp"
    original = Image.open(path).convert("RGBA")
    width, height = original.size
    assert width == height == 1254, path
    bounds = original.getchannel("A").getbbox()
    assert bounds is not None, path
    x0, y0, x1, y1 = bounds
    scale = min(1.0, (width - 2 * MARGIN) / (x1 - x0),
                (height - 2 * MARGIN) / (y1 - y0))
    if scale < .997:
        resized = original.resize((round(width * scale), round(height * scale)),
                                  Image.Resampling.LANCZOS)
        xb0, yb0, xb1, yb1 = resized.getchannel("A").getbbox()
        left = (width - (xb1 - xb0)) // 2 - xb0
        top = (height - (yb1 - yb0)) // 2 - yb0
        canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        canvas.paste(resized, (left, top))
        canvas.save(path, "WEBP", quality=94, method=6, exact=True)
    final = Image.open(path).convert("RGBA")
    bounds = final.getchannel("A").getbbox()
    assert bounds and min(bounds[0], bounds[1], width - bounds[2],
                          height - bounds[3]) >= MARGIN - 3, (path, bounds)
    print(f"Reframed {path.name} level {level}: {scale:.3f}, bounding box {bounds}")

assets = manifest["assets"]
assert len(assets) == 60, "Do not alter the 60-form inventory."
for asset in assets:
    path = Path(asset["path"])
    image = Image.open(path)
    assert image.size == (1254, 1254), path
    assert image.mode in ("RGBA", "RGB"), (path, image.mode)
    assert "A" in image.getbands(), ("missing alpha", path)
    data = path.read_bytes()
    assert len(data) < 1500000, ("art too large", path)
    asset.update(width=image.width, height=image.height, bytes=len(data),
                 sha256=hashlib.sha256(data).hexdigest())
manifest["version"] = AFTER
MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
print("All 60 transparent artwork files decoded and catalogued.")
