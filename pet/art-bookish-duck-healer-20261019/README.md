# Bookish Duck → Celestial Healer, levels 1–10

Approved by the user. This folder contains ten individually processed full-body cutouts, backgrounds removed from ten source character images; no sheet cropping. Each `level-N.png` is an RGBA PNG (1122 × 1402 px). Level 5 begins the human-girl healer transformation; Level 10 is the celestial healer archon.

**Staging only until a target pet slot is selected.** To show these in Companion Corner, update `/pet/pet-art-hd-20261009.js` for the chosen existing species ID, update its display name and all ten form labels in `pet/pet.js` + `pet/pet-evolution-config-20261012.js`, and cache-bust the Home/Pet JS entrypoints. Do not replace the `species` storage key or alter XP/MP, unlocks or saved study progress. Run app visual QA (chooser, pet page, evolution gallery, home HUD) after mapping.
