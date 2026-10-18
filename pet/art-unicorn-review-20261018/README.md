# Celestial Unicorn — App sprite preparation

Prepared from the latest user-approved 10-stage Unicorn evolution lineup.

- 10 separate PNG sprites, one for each LV1–LV10, square 1024 × 1024, transparent background, without level labels.
- LV1–LV5: unicorn, LV6–LV7: human-faced female maiden, LV8–LV10: human-faced female shield-bearing crusader.
- Existing App species identifier to preserve: `star-toadlet`. Do not reset player XP/MP, unlocks or selection.
- **Review branch only; main/live App unchanged.** Do not deploy automatically.
- These are upscaled cutouts of a single 1402 × 1122 concept chart, **not native high-resolution renders**; check natural image quality and edges before deployment.
- Certain edges may contain small isolated overlap remnants from adjacent stage art. Manual QC recommended especially LV8–LV10.

To install in the future: copy these files into the main branch, map `star-toadlet` to this artwork folder in `pet/pet-art-hd-20261009.js`, update pet visible labels and personality text, then run browser evolution QA before deploying.
