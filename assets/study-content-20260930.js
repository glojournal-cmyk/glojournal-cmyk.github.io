// Shared adapters keep older note packs readable without blank activities.
export function normalizeStudyNote(note = {}) {
  const strings = key => (Array.isArray(note[key]) ? note[key] : []).filter(x => typeof x === 'string' && x.trim());
  const workedExamples = (note.workedExamples || []).map(x => typeof x === 'string' ? {prompt: 'Read this model sentence.', answer: x, why: ''} : x).filter(x => x?.prompt && x?.answer);
  const quickCheck = (note.quickCheck || []).filter(x => x && typeof x === 'object' && (x.question || x.prompt) && x.answer !== undefined).map(x => ({...x, question: x.question || x.prompt}));
  return {...note, detailedExplanation: strings('detailedExplanation'), examTips: strings('examTips'), beforeStartingPractice: strings('beforeStartingPractice'), commonMistakes: strings('commonMistakes'), additionalSourceSections: (note.additionalSourceSections || []).filter(x => x && typeof x === 'object'), workedExamples, quickCheck};
}
export function groupStudyTopics(topics = []) {
  const groups = new Map(), seen = new Set();
  for (const topic of topics) {
    if (!topic?.topicId || seen.has(topic.topicId)) continue;
    seen.add(topic.topicId);
    const id = topic.unitId || 'core';
    if (!groups.has(id)) groups.set(id, {id, name: topic.unitName || 'Core topics', topics: []});
    groups.get(id).topics.push(topic);
  }
  return [...groups.values()];
}
export async function releasedStudyNote(paper) {
  if (paper.topicId === 'exam-latin-verbs') return normalizeStudyNote({title:paper.title,
    overview:'Use the verb ending and tense stem to distinguish present, imperfect and perfect actions.',
    mustMemoriseRules:['Present: amat = he/she loves or is loving.', 'Imperfect: amabat = he/she was loving or used to love.', 'Perfect: amavit = he/she loved or has loved.', 'Learn the perfect stem from the dictionary entry; do not assume every verb adds v.'],
    workedExamples:[{prompt:'Translate: puella laborat.',answer:'The girl works / is working.',why:'The present ending -t identifies a singular subject.'},{prompt:'Translate: puella laborabat.',answer:'The girl was working / used to work.',why:'The -ba- marks the imperfect, describing ongoing or repeated past action.'},{prompt:'Translate: puella laboravit.',answer:'The girl worked / has worked.',why:'The perfect stem laborav- and ending -it show a completed past action.'}],
    quickCheck:[{question:'Translate laborat.',answer:'he works',accepted:['she works','he is working','she is working'],explanation:'Present tense, third person singular.'},{question:'Translate laborabat.',answer:'he was working',accepted:['she was working','he used to work','she used to work'],explanation:'The -ba- is an imperfect-tense clue.'},{question:'Translate laboravit.',answer:'he worked',accepted:['she worked','he has worked','she has worked'],explanation:'Perfect tense, third person singular.'}],
    commonMistakes:['Translating an imperfect form as a completed action without noticing -ba-.','Keeping the correct tense but losing the person or number.'],examTips:['Identify stem, tense clue and person ending before translating.']});

  const sources = {
    'exam-chemistry-school': '/content/topics/chem-y9-c4.json',
    
    'exam-french-school': '/content/topics/fr-y9-u1-paris-travel.json'
  };
  if (sources[paper.topicId]) {
    try {
      const response = await fetch(sources[paper.topicId]);
      if (response.ok) {
        const pack = await response.json();
        if (paper.topicId === 'exam-chemistry-school' && pack.note) {
          const extras=await Promise.all(['chem-y9-c1','chem-y9-c3'].map(async id=>{try{const r=await fetch(`/content/topics/${id}.json`);return r.ok?(await r.json()).note:null}catch{return null}}));
          const sections=extras.filter(Boolean).map(n=>({heading:n.title,body:[n.overview,...(n.mustMemoriseRules||[]).slice(0,5)].join('\n')}));
          pack.note={...pack.note,overview:'Review the periodic table, separation methods and chromatography calculations.',detailedExplanation:[...sections.map(s=>`${s.heading}: ${s.body}`),...(pack.note.detailedExplanation||[])]};
        }
        if (pack.note) return normalizeStudyNote({...pack.note, title: paper.title, overview: `${pack.note.overview} This released paper also revisits earlier school topics.`});
      }
    } catch (error) { console.error('Released paper notes unavailable', error); }
  }
  return normalizeStudyNote({title: paper.title,
    overview: 'Revisit the passage and support each comprehension answer with the event or detail that proves it.',
    mustMemoriseRules: ['Read the question before selecting evidence.', 'Distinguish what happens in the story from what you infer about a character.', 'Give one distinct point for each mark.'],
    workedExamples: [{prompt: 'What does Aeneas returning to the dangerous city suggest about his feelings for Creusa?', answer: 'He loves her and is desperate to find her, since he risks returning to the dangerous city.', why: 'State the feeling, then connect it to his action as evidence.'}],
    quickCheck: [{question: 'Why could Aeneas not take Creusa away with him?', answer: 'she was a ghost', accepted: ['she was a ghost not a living person', 'she was dead'], explanation: 'Creusa appears as a ghost rather than a living person.'}],
    commonMistakes: ['Retelling the story without answering the question.', 'Naming a feeling without the supporting action.'],
    examTips: ['For an inference, use point + evidence + explanation.']});
}
