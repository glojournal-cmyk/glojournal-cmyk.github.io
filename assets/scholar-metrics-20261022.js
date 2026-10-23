// Read-only definitions shared by Home and Scholar. No progress migration.
const count = value => Math.max(0, Number(value) || 0);
export function scholarMetrics(state = {}) {
  return {
    mind: ['latinXp','frenchXp','bioXp','chemXp','physXp','engXp'].reduce((sum,key)=>sum+count(state[key]),0),
    body: count(state.bodyXp),
    spark: Object.values(state.games || {}).reduce((sum,game)=>sum+count(game?.points),0)
  };
}
