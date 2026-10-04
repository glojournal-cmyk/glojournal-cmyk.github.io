let noteUpdatesPromise;
export async function applyStudyNoteUpdates(pack) {
  if (!pack?.note) return pack;
  try {
    if (!noteUpdatesPromise) noteUpdatesPromise = fetch('/content/note-updates-20261003.json?v=20261004-continue3').then(response => {
      if (!response.ok) throw new Error('Topic note updates unavailable');
      return response.json();
    });
    const updates = await noteUpdatesPromise;
    const patch = updates[pack.topicId];
    return patch ? {...pack,note:{...pack.note,...patch}} : pack;
  } catch (error) {
    noteUpdatesPromise = undefined;
    console.error('Topic note updates unavailable',error);
    return pack;
  }
}
// Shared adapters keep older note packs readable without blank activities.
export function uniqueNoteText(values = []) {
  const seen = new Set();
  return values.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()).filter(x => {
    const key = x.toLowerCase().replace(/\s+/g, ' ').replace(/[.!]+$/, '');
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
export function cleanNoteRules(values = []) {
  const rules = uniqueNoteText(values);
  const key = value => value.toLowerCase().replace(/\s+/g,' ').replace(/[.!]+$/,'').trim();
  return rules.filter(rule => {
    const parts = rule.split(';').map(key);
    if (parts.length > 1 && parts.every(part => rules.some(other => other !== rule && key(other) === part))) return false;
    return !rules.some(other => other !== rule && [' → ',' — ',': '].some(separator => {
      const pair = other.split(separator);
      return pair.length === 2 && pair.some(part => key(part) === key(rule));
    }));
  });
}
export function noteBankChecks(questions = []) {
  const seen = new Set();
  const usable = questions.filter(q => q && q.status !== 'disabled' && !q.disabled && q.prompt && q.answer?.accepted?.length && !q.stimulus?.image && !q.stimulus?.svg && !q.stimulus?.diagram && !q.stimulus?.table);
  const selected = [];
  // Select distinct concepts across the available difficulty range, never invent difficulty labels.
  for (const level of [1, 2, 3, 4, 5]) {
    const q = usable.find(q => Number(q.difficulty || 1) === level && !seen.has(q.conceptId || q.prompt));
    if (q) { selected.push(q); seen.add(q.conceptId || q.prompt); }
    if (selected.length === 3) break;
  }
  for (const q of usable) {
    if (selected.length === 3) break;
    if (!seen.has(q.conceptId || q.prompt)) { selected.push(q); seen.add(q.conceptId || q.prompt); }
  }
  return selected.map(q => ({question:q.prompt, stimulus:q.stimulus?.text || '', answer:q.answer.accepted[0], accepted:q.answer.accepted.slice(1), options:q.format === 'mc_single' ? q.options : undefined, difficulty:q.difficulty, explanation:q.feedback?.short || q.feedback?.remember || '', markPoints:q.answer.markPoints || q.answer.rubric?.points, sourceQuestionId:q.id}));
}
export function normalizeStudyNote(note = {}, context = {}) {
  const schoolGuides = {
    'Unit 1 Holidays and opinions': {
      summary:['Use the passé composé for completed holiday activities.', 'Use the imperfect for past descriptions and opinions: c’était, ce n’était pas.', 'Give an opinion and a reason, keeping the tense consistent.'],
      detailedExplanation:['To describe a completed holiday activity, use the school’s passé composé phrases, such as j’ai passé des vacances. Keep the auxiliary and past participle together. A time phrase tells the reader when the event occurred; the verb form tells them the tense.', 'For a past description or opinion, distinguish c’est (it is) from c’était (it was), and ce n’est pas from ce n’était pas. Use the wording in the question to decide whether the description refers to now or to the holiday.', 'Build an answer in connected parts: identify the activity or place, state an opinion, and add a reason. La meilleure chose était quand introduces the best part; la pire chose était quand introduces the worst. Check that the following detail fits the opinion.']
    },
    'Unit 1 Weather and future': {
      summary:['Distinguish present weather from past weather descriptions.', 'Near future: present tense of aller + infinitive.', 'Keep time phrases and verb forms consistent.'],
      detailedExplanation:['French weather expressions use different structures: il pleut, il fait froid and il y a du vent. Learn each expression as a complete phrase rather than inserting fait into every sentence.', 'The question Quel temps fait-il aujourd’hui ? asks about present weather. Quel temps faisait-il ? asks about past weather. Follow the school’s model phrases and keep the time reference consistent throughout the answer.', 'To describe a plan with the near future, conjugate aller and keep the next verb in the infinitive: je vais visiter. A phrase such as demain indicates future time but does not replace the verb structure.']
    }
  };
  if (schoolGuides[note.title]) note = {...note,...schoolGuides[note.title]};
  const strings = key => uniqueNoteText(Array.isArray(note[key]) ? note[key] : []);
  const workedExamples = (note.workedExamples || []).map(x => typeof x === 'string' ? {prompt: 'Read this model sentence.', answer: x, why: ''} : x).filter(x => x?.prompt && x?.answer);
  const checks = (note.quickCheck || []).filter(x => x && typeof x === 'object' && (x.question || x.prompt) && ['string','number'].includes(typeof x.answer)).map(x => ({...x, question: x.question || x.prompt}));
  const concepts = checks.map(check => context.questions?.find(q => q.prompt === check.question)?.conceptId).filter(Boolean);
  const repeatedConcepts = concepts.length > 1 && new Set(concepts).size < concepts.length;
  const bankChecks = !checks.length || repeatedConcepts ? noteBankChecks(context.questions) : [];
  const quickCheck = bankChecks.length ? bankChecks : checks;
  const overviewKey = uniqueNoteText([note.overview])[0]?.toLowerCase().replace(/\s+/g, ' ').replace(/[.!]+$/, '');
  const detailedExplanation = strings('detailedExplanation').filter(x => x.toLowerCase().replace(/\s+/g, ' ').replace(/[.!]+$/, '') !== overviewKey);
  const sections = (note.additionalSourceSections || []).filter(x => x && typeof x === 'object' && (x.body || x.image));
  const wrongOptions = new Set((context.questions || []).flatMap(q => (q.options || []).filter(option => !(q.answer?.accepted || []).includes(option))));
  const commonMistakes = strings('commonMistakes').map(value => wrongOptions.has(value) ? `Common wrong answer to avoid: ${value}` : value);
  const sourceSeen = new Set();
  const additionalSourceSections = sections.filter(s => { const key = `${s.heading || ''}|${s.body || ''}|${s.image || ''}`; if(sourceSeen.has(key)) return false; sourceSeen.add(key); return true; });
  return {...note, mustMemoriseRules:cleanNoteRules(strings('mustMemoriseRules')), summary:strings('summary').length ? strings('summary') : uniqueNoteText([...cleanNoteRules(strings('mustMemoriseRules')),...workedExamples.map(x=>x.why)]).slice(0,5), detailedExplanation, examTips:strings('examTips'), beforeStartingPractice:strings('beforeStartingPractice'), commonMistakes, additionalSourceSections, workedExamples, quickCheck};
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
