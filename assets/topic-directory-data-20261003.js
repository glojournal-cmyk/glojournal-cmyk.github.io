// Display taxonomy only: topic IDs, question banks and mastery history stay stable.
const CATEGORIES={
 latin:[['vocabulary','Vocabulary & dictionary entries',/vocab|dictionary|miscellaneous words|stage \d+$/i],['verbs','Verbs & tenses',/verb|tense|perfect|imperfect|present|conjugat|finite|person and number/i],['cases','Nouns, cases & prepositions',/noun|case|declension|accusative|genitive|dative|ablative|nominative|preposition/i],['agreement','Adjectives & pronouns',/adjective|pronoun|agreement|ille/i],['reading','Translation & comprehension',/translat|comprehension|set.text|creusa|reading|map locations/i]],
 french:[['verbs','Verbs & tenses',/tense|passé|participle|irregular verb|future|imperfect|conditional|conjugat|verb forms/i],['grammar','Sentence grammar & accuracy',/grammar|negative|reflexive|accuracy|quick rules|pronoun|agreement|compar|high.scoring|structures|question forms/i],['writing','Translation & writing',/writing|translat|sentence build|model answer/i],['school','School life & routines',/school|subjects|routine|unit 3 overview/i],['vocabulary','Vocabulary & everyday topics',/vocab|weather|activit|opinion|family|home|food|restaurant|town|time|number|age|paris|travel|france/i]],
 biology:[['cells','Cells & microscopy',/cell|microscop|magnification|bacteria|aseptic|organelle|microorganism/i],['inheritance','Genetics, reproduction & variation',/dna|gene|chromosom|inherit|fertilis|variation|reproduc|allele|karyogram/i],['nutrition','Nutrition, digestion & health',/diet|nutri|digest|absorp|enzyme|gut|energy balance|deficiency|bmi|basal|fat|drug|caffeine|alcohol|food test/i],['plants','Plants & photosynthesis',/plant|leaf|photosynth|colour of light/i],['ecology','Ecology & classification',/ecosystem|ecolog|habitat|population|communit|competition|food chain|food web|trophic|classification|identification key/i],['skills','Practical skills & data',/practical|graph|calculat|unit convers|correlation|safety/i]],
 chemistry:[['separation','Separation & chromatography',/separat|chromatogra|filtrat|distillat|\brf\b|chemical analysis/i],['periodic','Elements & the Periodic Table',/periodic|element|compound|mixture|symbol|formula|valency|newlands|mendeleev|atomic/i],['acids','Acids, alkalis & salts',/acid|alkali|indicator|\bph\b|neutralis|salt|carbonate/i],['organic','Organic chemistry & polymers',/cracking|alkene|alkane|polymer|hydrocarbon|hydrogenation|hydration|halogenation/i],['reactions','Reactions, rates & reactivity',/reaction|reactivity|displacement|rust|conservation|equation|collision|metal/i],['earth','Atmosphere, Earth & resources',/atmosphere|earth|rock|resource|greenhouse|climate|carbon dioxide/i],['skills','Practical skills & calculations',/scientif|safety|evidence|calculat|practical|graph/i]],
 physics:[['electricity','Electricity & magnetism',/circuit|current|potential difference|resistance|magnet|domain/i],['energy','Energy & power',/energy|power|efficiency|dissipation|transfer/i],['forces','Forces & motion',/force|newton|motion|moment|lever|equilibrium|speed|spring|hooke/i],['particles','Particles, pressure & fluids',/particle|kinetic theory|gas|boyle|pressure|density|fluid|evaporation|temperature/i],['waves','Light, sound & waves',/light|colour|vision|eye|reflect|refract|sound|wave/i],['space','Space & the Universe',/universe|gravity|eclipse|stellar|space/i],['skills','Practical skills & data',/practical|scientif|calculat|graph|safety/i]],
 english:[['dystopia','Dystopian literature',/dystopi/i],['shakespeare','Shakespeare · Othello',/othello|shakespeare|teal|analytical writing/i],['northanger','Northanger Abbey',/northanger/i],['poetry','Poetry',/poetry|poem|ww1/i],['journalism','Journalism & viewpoints',/journalis|rhetoric|opinion writing/i],['writing','Writing & language',/writing|language|grammar|vocab/i]]
};
export function topicCategory(topic){
 const text=`${topic.title||''} ${topic.topicId||''}`;
 for(const [id,name,rule] of CATEGORIES[topic.subject]||[])if(rule.test(text))return{id,name};
 // Preserve meaningful curriculum units when no category rule matches.
 const name=topic.unitName&&!/^Unit \d+$/.test(topic.unitName)?topic.unitName:'Other taught topics';
 return{id:'other-'+(topic.unitId||'core'),name};
}
export function topicKinds(topic){
 const title=String(topic.title||'');const formats=topic.formats||{};const out=['all'];
 if(/vocab|dictionary|stage \d+.*vocab/i.test(title))out.push('vocabulary');
 if(/verb|tense|case|grammar|noun|adjectiv|pronoun|agreement|conjugat|negative|reflexive/i.test(title))out.push('grammar');
 if(formats.calculation>0||/calculat|\brf\b|magnification|scale|conversion|energy balance|boyle/i.test(title))out.push('calculations');
 if(/practical|chromatogra|microscop|food test|aseptic|experiment/i.test(title)||formats.practical_design>0)out.push('practicals');
 if(/translat|comprehension|literature|othello|poetry|northanger|reading|set.text/i.test(title))out.push('reading');
 if(formats.extended_response>0||/writing|model answers|sentence build/i.test(title))out.push('writing');
 return out;
}
export const topicSearchKey=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function directoryGroups(topics,{query='',kind='all',availability='all',progress='all',stats={}}={}){
 const seen=new Set(),groups=new Map(),tokens=topicSearchKey(query).split(' ').filter(Boolean);
 for(const topic of topics){
  if(!topic?.topicId||seen.has(topic.topicId)||topic.status==='disabled')continue;
  seen.add(topic.topicId);const category=topicCategory(topic),state=stats[topic.topicId]?.state||'learning';
  if(kind!=='all'&&!topicKinds(topic).includes(kind))continue;
  if(availability==='ready'&&Number(topic.enabled||0)===0)continue;
  if(progress==='unmastered'&&state==='mastered'||progress==='mastered'&&state!=='mastered')continue;
  const stage=String(topic.title||'').match(/Stage (\d+)/i);
  const foundation=Number(topic.year)===8&&((topic.subject==='latin'&&stage&&Number(stage[1])<=8)||(topic.subject==='french'&&String(topic.topicId).startsWith('fr-y8-s02-')));
  const aliases=String(topic.title||'').replace(/required practical\s*(\d+)/ig,(_,number)=>`rp${number}`);
  const key=topicSearchKey([topic.title,topic.topicId,topic.unitName,category.name,aliases,`Year ${topic.year}`,foundation?'Year 7 foundation':''].join(' '));
  if(!tokens.every(token=>key.includes(token)))continue;
  const id=`${topic.subject}:${topic.year}:${category.id}`;
  if(!groups.has(id))groups.set(id,{id,name:category.name,year:topic.year,subject:topic.subject,topics:[],enabled:0});
  const group=groups.get(id);group.topics.push(topic);group.enabled+=Number(topic.enabled||0);
 }
 // Catalogue order remains the teaching order within each section, with natural stage ordering.
 for(const group of groups.values())if(group.name==='Vocabulary & dictionary entries')group.topics.sort((a,b)=>{
  const sa=a.title.match(/Stage (\d+)/i),sb=b.title.match(/Stage (\d+)/i);
  return sa&&sb?Number(sa[1])-Number(sb[1]):0;
 });
 return [...groups.values()];
}
