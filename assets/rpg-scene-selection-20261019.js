/* Home reads the Scholar reward catalogue; only the PLAYER's equipped, owned scene is shown.
 * This selector cannot award, unlock, equip or change saved progress.
 */
const DEFAULT_SCENE_ID = 'dusk';
const SAFE_ART = /^\/art\/(?:stages|scenes)\/[a-z0-9-]+\.jpg$/;
const SAFE_FOCUS = /^(?:[0-9]|[1-9][0-9]|100)%(?:\s+)(?:[0-9]|[1-9][0-9]|100)%$/;

export function selectedRewardScene(state, catalogue) {
  const entries = Array.isArray(catalogue) ? catalogue : [];
  const unlocked = new Set(Array.isArray(state?.unlockedScenes) ? state.unlockedScenes : []);
  const available = scene => !!scene && (scene.free === true || unlocked.has(scene.id));
  const selected = entries.find(scene => scene.id === state?.equippedScene && available(scene));
  // Never select the newest unlock or derive a scene from XP: choosing is the player's right.
  const fallback = entries.find(scene => scene.id === DEFAULT_SCENE_ID && scene.free === true);
  const scene = selected || fallback;
  return {
    id: scene?.id || DEFAULT_SCENE_ID,
    name: String(scene?.name || 'Dusk'),
    art: SAFE_ART.test(scene?.art || '') ? scene.art : '/art/stages/dusk.jpg',
    focus: SAFE_FOCUS.test(scene?.focus || '') ? scene.focus : '50% 68%'
  };
}
