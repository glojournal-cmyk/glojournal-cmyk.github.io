import {frenchAliasGroups} from './french-duplicate-aliases-20261018.js';
// Runtime-only deduplication. Do not delete historical question IDs: older
// saved wrong-answer and review evidence still refers to those IDs.
const normalise = value => String(value ?? '').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[’‘`]/g, "'")
  .toLowerCase().replace(/[^a-z0-9' -]+/g, ' ')
  .replace(/\s+/g, ' ').trim();

export function frenchQuestionFingerprint(q) {
  const answer = q?.answer?.accepted?.[0] ?? q?.answer?.modelAnswer ?? '';
  // Match the actual content-quality audit's definition of an exact duplicate.
  return normalise(q?.prompt) + '||' + normalise(answer);
}

const stableSelectionByBank = new WeakMap();
const aliasById = new Map(frenchAliasGroups.flatMap(group => group.map(id => [id,group])));

export function uniqueFrenchQuestions(items = [], state = {}, mode = 'standard') {
  // React rerenders after every marked answer. Freeze the candidate pool while
  // its loaded bank array is unchanged so question 4/10 never disappears.
  const key = mode+'|'+String(state.today||'');
  const cached = stableSelectionByBank.get(items)?.get(key);
  if (cached) return cached;
  const groups = new Map();
  for (const q of items) {
    if (!q?.id) continue;
    const key = frenchQuestionFingerprint(q);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  }
  const reviewMode = ['due', 'retention', 'weak', 'mistakes'].includes(mode);
  const now = state.today || '';
  const selected = [];
  for (const variants of groups.values()) {
    // One previously correct alias means the identical prompt/answer has already
    // been practised, even if a second copy has a different question ID.
    if (!reviewMode && variants.some(q => (aliasById.get(q.id) || [q.id]).some(id => Number(state.seenCorrect?.[id] || 0) > 0))) continue;
    const due = q => {
      const r = state.reviews?.[q.id];
      return !!r?.due && r.due <= now;
    };
    const ranked = [...variants].sort((a,b) => {
      const priority = q => {
        const r = state.reviews?.[q.id];
        if (reviewMode && due(q)) return -3;
        if (reviewMode && r?.wrong) return -2;
        if (!state.seenTotal?.[q.id]) return -1;
        return 0;
      };
      return priority(a) - priority(b);
    });
    selected.push(ranked[0]);
  }
  // Keep the bank's ordering to avoid changing the existing adaptive ranking
  // or the question count for tasks that already have sufficient fresh work.
  const keep = new Set(selected.map(q => q.id));
  const selectedRows = items.filter(q => keep.has(q.id));
  let entries = stableSelectionByBank.get(items);
  if (!entries) {entries=new Map(); stableSelectionByBank.set(items,entries);}
  entries.set(key,selectedRows);
  return selectedRows;
}
