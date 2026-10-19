# Lux et Labor — RPG Home integration preview (19 October 2026)

This patch integrates the uploaded Grok Garden artwork into the existing **glojournal-cmyk/glojournal-cmyk.github.io** site, without replacing its learning engine.

## Install into a checked-out copy of the current `main` branch

Copy the `assets/` files into the repository `assets/` directory and the four `art/home-rpg/` image files into the matching directory.

In `assets/home-continue-20261010.js`, append this guarded dynamic import (Home only):

```js
if (location.pathname === '/' || location.pathname === '/index.html') {
  import('/assets/home-rpg-live-20261019.js?v=20261019-preview2').catch(error => console.warn('RPG Home preview unavailable', error));
}
```

The preview script injects its own stylesheet. Do **not** edit `index.html`: shared route shells must remain byte-for-byte aligned.

**Preview/QA only.** Do not deploy to the live site before checking Chromium, iPad WebKit, navigation, Recovery, task totals, persistence, and rollback. An integration PR must include the required binary artwork and the new CSS/JS together. Existing legacy `home-rpg-shell-20261019.js` remains disabled.

### Data safety & known boundaries

- Daily task rows and task links are read from the actual persisted app state through `LuxHomeJourneyV2Logic`, not hard-coded prototype tasks. App data is never rewritten by this display module.
- If the authoritative ten-task plan is absent, it shows a loading state instead of fake `0/30` completions.
- Recovery opens the existing `#lux-recovery-quests` element on the original page. It deliberately does not implement a competing Recovery ledger.
- The 30-day dots are derived from the existing `dailyLog`, with saved marked attempt records used only for a **partial** marker. The original full record remains authoritative.
- Biology Cell Structure assessment is labelled **2 Nov**. The former 16 Nov date in the prototype was removed; please re-check school materials before launch.
- Mind shows mastered topic count; Body shows recorded PE sessions; Spark shows XP. The stat meanings differ from the prototype's arbitrary demo scores. The XP **bar only** is decorative.
- The final avatar and companion are backed by supplied uploaded artwork; when a non-default outfit is equipped, the existing wardrobe art is used.
- Star Map and Settings open original app routes/screen instead of substituting unverified demo panels.

### Rollback

Remove the guarded dynamic import in `assets/home-continue-20261010.js`. No learning records or LocalStorage schema are edited by this UI. Leaving the `/art/home-rpg/` files is harmless.

## Art reuse / new blobs

These three exact uploaded image blobs already exist in `main`: `/art/garden-wide.jpg`, `/art/scholar-avatar.jpg`, `/art/rpg/moss.png`. Add the *four* new files: `scholar-clean.png`, `shield-cardigan.png`, `shield-recovery.png`, and `shield-starmap.png` under `/art/home-rpg/`.