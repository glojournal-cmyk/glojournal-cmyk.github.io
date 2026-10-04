export function backupPreview(data, current, meta = {}) {
  const parsed = JSON.parse(data);
  if (parsed.app !== 'lux-scholar-garden' || !parsed.state || !Array.isArray(parsed.state.daily)) throw new Error('This is not a valid Scholar Garden progress backup.');
  const describe = state => ({day: state.today || 'Unknown day', done: state.daily.filter(t => Number(t.target) > 0 && Number(t.progress) >= Number(t.target)).length, total: state.daily.length, xp: Number(state.xp) || 0});
  return {saved: describe(parsed.state), current: describe(current), savedAt: meta.savedAt || parsed.exportedAt || parsed.savedAt || null};
}
