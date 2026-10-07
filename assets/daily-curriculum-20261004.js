// One curriculum policy for the daily planner and route guard. No reward writes.
export const progressionSubjects=['latin','french','biology','chemistry','physics'];
const orders={
 latin:['stage-1-vocabulary','stage-2-vocabulary','stage-3-vocabulary','core-verbs','nouns-and-dictionary-entries','present-person-and-number','prepositions','stage-4-vocabulary','stage-5-vocabulary','stage-6-vocabulary','stage-7-vocabulary','stage-8-vocabulary','stage-9-vocabulary','stage-10-vocabulary','stage-11-vocabulary','stage-12-vocabulary','adjective-agreement','personal-pronouns','ille-singular','ille-plural','nouns-with-genitives','set-text-translation','perfect-cues'],
 biology:['balanced-diet','food-tests','digestion-absorption','enzymes-gut','fats-cholesterol','nutrition-labels','energy-bmi','drugs-alcohol','smoking-health','leaf-structure','photosynthesis-glucose','starch-evidence','light-colour-practical','limiting-factors','minerals-greenhouse','ecology-terms','food-chains-webs','pyramids-energy','competition','predator-prey-adaptations','pollutants-indicators','classification','binomial-naming','dna-genes','dna-structure','fertilisation-inheritance','variation-mutation','genetic-disorders','punnett-squares','natural-selection','graphs-calculations','variables-quality','practical-conclusions','mixed-exam'],
 chemistry:['working-scientifically','formulae-valency','conservation-equations','acids-indicators-ph','neutralisation-salts','metals-reactions','reactivity-displacement-rusting','chemical-analysis','energy-changes','earth-rocks-resources'],
 physics:['energy-stores-transfers','power-efficiency','forces-newton-motion','speed-time-graphs','moments-levers','pressure-density-fluids','circuits-current-voltage','resistance-series-parallel','magnets-domains','electromagnets','light-reflection-refraction','colour-eye','universe-stars-gravity'],
};
const y9Orders={
 latin:['la-y9-20260919-chapters-1-and-2-revision','la-y9-s01-noun-declensions','la-y9-s01-case-functions','la-y9-s01-adjective-declensions','la-y9-s01-regular-verbs','la-y9-s01-irregular-verbs','la-y9-s01-infinitives-imperatives','la-y9-s01-personal-pronouns','la-y9-s01-is-ea-id','la-y9-s01-possessives',...['3','4','5','6'].flatMap(n=>['i','ii'].map(p=>`la-y9-20260919-chapter-${n}-part-${p}`))],
 french:['fr-y9-20260919-unit-1-holidays-and-opinions','fr-y9-20260919-unit-1-places-and-activities','fr-y9-u1-paris-travel','fr-y9-20260919-unit-1-cafe-and-restaurant','fr-y9-u1-perfect-tense','fr-y9-20260919-irregular-past-participles','fr-y9-20260919-perfect-tense-and-agreement','fr-y9-u1-perfect-negatives','fr-y9-u1-recent-event-postcard','fr-y9-20260919-unit-1-weather-and-future','fr-y9-u2-leisure-time','fr-y9-20260919-unit-2-leisure-and-reasons','fr-y9-u2-imperfect','fr-y9-20260919-unit-2-childhood-and-imperfect','fr-y9-u2-past-present-change','fr-y9-u2-perfect-vs-imperfect','fr-y9-u2-comparatives-superlatives','fr-y9-u3-personal-family-friends','fr-y9-u3-adjectives-social-daily-life','fr-y9-20260919-unit-3-esther-la-famille','fr-y9-20260919-unit-3-esther-chez-eugenie','fr-y9-20260919-unit-3-esther-le-futur','fr-y9-u3-authentic-spoken','fr-y9-u4-five-tense-synthesis'],
 chemistry:['chem-y9-c2','chem-y9-c5','chem-y9-c6','chem-y9-c1','chem-y9-c3','chem-y9-c4','chem-y9-c7',...Array.from({length:10},(_,i)=>`chem-y9-c${i+8}`)],
};
export function curriculumRank(topic){
 const id=topic.topicId||'',year=Number(topic.year)||Number(id.match(/-y(\d+)-/)?.[1])||8;
 if(year===9){const rank=y9Orders[topic.subject]?.indexOf(id);if(rank>=0)return rank;return Number(id.match(/-y9-[bp](\d+)$/)?.[1]||1000);}
 if(topic.subject==='french')return Number(id.match(/-y8-s(\d+)-/)?.[1]||1000);
 const slug=id.replace(/^[^-]+-y8-/,''),rank=orders[topic.subject]?.indexOf(slug);return rank>=0?rank:1000;
}
export function isCurriculumMastered(raw={}){
 const n=Math.max(0,Number(raw.attempted)||0),correct=Math.max(0,Math.min(n,Number(raw.correct)||0));
 return n>=15&&correct/n>=.85&&Math.max(Number(raw.productionCorrect)||0,new Set(raw.productionIds||[]).size)>0;
}
export const independentFormats=['typed_exact','typed_short','typed_equivalent','spelling_restore','controlled_translation','mark_points','extended_response','practical_design','calculation','unordered_set'];
export function curriculumTopics(subject,year,getCatalog,learning={}){
 return (getCatalog(subject,year)||[]).filter(t=>t?.status==='enabled'&&Number(t.enabled??t.questions??0)>=15&&(!t.formats||independentFormats.some(f=>Number(t.formats[f])>0))&&(year===8?learning[t.topicId]!==false:learning[t.topicId]===true)).map(t=>({...t,subject,year,topicLabel:t.title||t.topicId})).sort((a,b)=>curriculumRank(a)-curriculumRank(b)||a.topicId.localeCompare(b.topicId));
}
export function curriculumFrontier(state,subject,getCatalog,learning={}){
 const foundations=curriculumTopics(subject,8,getCatalog,learning),mastered=t=>isCurriculumMastered(state.topicStats?.[t.topicId]);
 const foundation=foundations.find(t=>!mastered(t));
 // Do not advance while the foundation catalog is still loading.
 if(!foundations.length)return null;
 const taught=Number(state.year)>=9?curriculumTopics(subject,9,getCatalog,learning):[];
 const next=foundation||taught.find(t=>!mastered(t));
 const pool=foundation?foundations:taught.length?taught:foundations;
 const pick=next||[...pool].sort((a,b)=>String(state.topicStats?.[a.topicId]?.last||'').localeCompare(String(state.topicStats?.[b.topicId]?.last||''))||curriculumRank(a)-curriculumRank(b))[0];
 return {...pick,phase:foundation?'foundation':next?'year9':'retention',position:pool.findIndex(t=>t.topicId===pick.topicId)+1,total:pool.length,foundationMastered:foundations.filter(mastered).length,foundationTotal:foundations.length,waitingForTaught:!foundation&&!taught.length};
}
export function curriculumAssignment(state,seed,old,getCatalog,learning={}){
 const subject=old?.planDate===state.today&&Number(old.progress)>0?old.assignedSubject:progressionSubjects[Math.abs(Number(seed)||0)%progressionSubjects.length];
 const frontier=curriculumFrontier(state,subject,getCatalog,learning);
 if(old?.planDate===state.today&&Number(old.progress)>0&&old.assignedTopic){
   const year=Number(old.assignedYear)||Number(old.assignedTopic.match(/-y(\d+)-/)?.[1])||8;
   const completed=Number(old.progress)>=Number(old.target||25);
   const topic=(getCatalog(subject,year)||[]).find(t=>t.topicId===old.assignedTopic)||{topicId:old.assignedTopic,title:old.assignedLabel};
   if(topic&&(completed||(year===8?learning[topic.topicId]!==false:learning[topic.topicId]===true)))return {...topic,subject,year,topicLabel:topic.title||old.assignedLabel,phase:completed?'complete':frontier?.phase||'foundation',position:frontier?.position||1,total:frontier?.total||1,waitingForTaught:frontier?.waitingForTaught||false};
 }
 return frontier;
}
export function curriculumHref(pick,mode,task){
 const p=new URLSearchParams({daily:'1',locked:'1',year:String(pick?.year||8),mode,task});if(pick?.topicId)p.set('topic',pick.topicId);
 return `/study/${pick?.subject||'latin'}/practise?${p}`;
}
export function selectProgressionQuestions(ranked,mode,size){
 const unique=[...new Map(ranked.filter(q=>q.formal!==false&&!q._repair&&q.status!=='preview').map(q=>[q.id,q])).values()];
 const depth=q=>Number(q._sessionDepth)||Number(q.cognitiveDepth)||Number(q.difficulty)||(['mc_single','matching','sorting','diagram_label'].includes(q.format)?1:['typed_exact','typed_short','spelling_restore','word_tiles'].includes(q.format)?2:['calculation','controlled_translation','sequence','unordered_set'].includes(q.format)?3:4);
 const production=q=>['typed_exact','typed_short','typed_equivalent','spelling_restore','controlled_translation','mark_points','extended_response','practical_design','calculation','unordered_set'].includes(q.format);
 const mastery=mode==='mastery'||mode==='year8long';
 const ordered=unique.map((q,i)=>({q,i,d:depth(q)})).sort((a,b)=>mastery?b.d-a.d||a.i-b.i:a.d-b.d||a.i-b.i);
 const warm=mastery?[...ordered].sort((a,b)=>a.d-b.d||a.i-b.i).slice(0,Math.min(3,size)).map(x=>x.q):[];
const warmIds=new Set(warm.map(q=>q.id));
 const picked=[...warm,...ordered.filter(x=>!warmIds.has(x.q.id)).slice(0,size-warm.length).map(x=>x.q)],ids=new Set(picked.map(q=>q.id));
 // Both phases require independent answers. Mastery also prioritises application.
 const minimum=Math.min(mastery?5:3,unique.filter(production).length,size);
 for(const {q} of ordered){if(picked.filter(production).length>=minimum)break;if(!production(q)||ids.has(q.id))continue;const i=picked.findLastIndex(x=>!production(x));if(i<0)break;ids.delete(picked[i].id);picked[i]=q;ids.add(q.id);}
 return picked.sort((a,b)=>depth(a)-depth(b)||(a._adaptiveRank??0)-(b._adaptiveRank??0)).map((q,i)=>({...q,_adaptiveRank:i,_progressionPhase:mastery?'mastery':'foundation'}));
}

export function creditCurriculumAttempt(existing,attempt){
 if(!attempt.questionId||!attempt.topicId||attempt.formal===false||attempt.repair||!['y8-practise','y8-mastery','year8-long-review'].includes(attempt.task))return existing||{};
 const day=attempt.day,phase=attempt.mode==='mastery'||attempt.mode==='year8long'?'mastery':'foundation';
 const ledger={...(existing||{})},days={...(ledger[day]||{})},topics={...(days[attempt.task]||{})},old=topics[attempt.topicId]||{},ids={...(old[phase]||{})};
 ids[attempt.questionId]=true;topics[attempt.topicId]={...old,[phase]:ids};days[attempt.task]=topics;ledger[day]=days;
 for(const key of Object.keys(ledger).sort().slice(0,-45))delete ledger[key];return ledger;
}
