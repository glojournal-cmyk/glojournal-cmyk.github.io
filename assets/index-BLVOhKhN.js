export * from "./index-BLVOhKhN.core.js?v=20260919-y9-1";
import {
  C as store,
  U as collectibles,
  Ut as todayKey,
  Ot as frenchVocab,
  bt as latinVocab,
  ht as englishVocab,
  yt as latinLegacyQuestions,
  Dt as frenchLegacyQuestions,
  Nt as biologyLegacyQuestions,
  st as getTopicCatalog,
} from "./index-BLVOhKhN.core.js?v=20260919-y9-1";

const SUBJECTS = ["latin", "french", "biology", "chemistry", "physics", "english"];
const DAILY_SUBJECTS = ["latin", "french", "biology", "chemistry", "physics"];
const YEAR8_MASTERY_SUBJECTS = ["latin", "french"];
const SUBJECT_LABELS = {
  latin: "Latin",
  french: "French",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  english: "English",
};
const FRENCH_DAILY_HREF = "/session/french-vocab";
const MASTERY_MIN_ATTEMPTS = 6;
const MASTERY_ACCURACY = 0.85;
const SECURE_MIN_ATTEMPTS = 5;
const SECURE_ACCURACY = 0.8;

// Keep Cat Companion as a genuine multi-day reward even if games are replayed heavily.
const cat = collectibles.find((item) => item.id === "cat-companion");
if (cat) {
  cat.needIf = { ...(cat.needIf || {}), studyDays: Math.max(7, cat.needIf?.studyDays || 0) };
  cat.need = "Play 3 different learning games and complete 12 qualifying learning games across different days, and study on 7 different days";
}

function localDayFromIso(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftDay(day, offset) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function verifiedLegacyPeDays(state) {
  const peDays = Array.isArray(state.peDays) ? [...new Set(state.peDays)] : [];
  const sessions = Math.max(0, state.peSessions || 0);
  if (!peDays.length || peDays.length !== sessions) return null;

  const today = todayKey();
  const expected = new Set(Array.from({ length: peDays.length }, (_, i) => shiftDay(today, -i)));
  if (!peDays.every((day) => expected.has(day))) return null;

  const fromHistory = [...new Set((state.history || [])
    .filter((entry) => entry?.kind === "pe_complete" && entry?.at)
    .map((entry) => localDayFromIso(entry.at))
    .filter(Boolean))];

  return fromHistory.length < peDays.length ? fromHistory : null;
}

function slug(value) {
  return String(value || "topic")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "topic";
}

function legacyTopicId(subject, topic) {
  const prefix = subject === "biology" ? "bio" : subject === "chemistry" ? "chem" : subject === "physics" ? "phys" : subject === "english" ? "eng" : subject;
  return `${prefix}-legacy-${slug(topic)}`;
}

const SHARED_SKILL_PREFIXES = ["latin", "french", "biology", "chemistry", "physics", "english"];
function canonicalSkill(value) {
  const skill = String(value || "").trim().toLowerCase().replace(/\s+/g, "-");
  return SHARED_SKILL_PREFIXES.some((prefix) => skill.startsWith(`${prefix}:`)) ? skill : null;
}
function getQuestionSkills(item = {}, subject) {
  const known = [...new Set((item.skills || []).map(canonicalSkill).filter(Boolean))];
  if (known.length) return known;
  const resolved = SUBJECTS.includes(subject) ? subject : inferSubjectFromTopic(item.topicId) || null;
  if (!resolved || !SHARED_SKILL_PREFIXES.includes(resolved)) return [];
  const catalogTopic = typeof bC !== "undefined" && bC?.topics?.find((topic) => topic.topicId === item.topicId);
  const text = [
    item.topicId, item.topic, item.topicTitle, item.unitName, catalogTopic?.title, catalogTopic?.unitName,
    item.conceptId, item.prompt, item.stimulus?.text, item.task?.label,
    item.feedback?.short, item.feedback?.remember,
  ].filter(Boolean).join(" ").toLowerCase();
  const out = [];
  const add = (...skills) => skills.forEach((skill) => {
    const value = canonicalSkill(skill);
    if (value && !out.includes(value)) out.push(value);
  });

  if (resolved === "latin") {
    for (const value of ["dative","ablative","accusative","nominative","genitive","vocative"]) if (text.includes(value)) add(`latin:case:${value}`);
    if (/\bcase\b|declen/.test(text)) add("latin:cases");
    for (const value of ["perfect","imperfect","present","pluperfect","future"]) if (text.includes(value)) add(`latin:tense:${value}`);
    const persons = [
      ["1st-singular", /1st\s*(?:person\s*)?singular|first\s+person\s+singular/],
      ["2nd-singular", /2nd\s*(?:person\s*)?singular|second\s+person\s+singular/],
      ["3rd-singular", /3rd\s*(?:person\s*)?singular|third\s+person\s+singular/],
      ["1st-plural", /1st\s*(?:person\s*)?plural|first\s+person\s+plural/],
      ["2nd-plural", /2nd\s*(?:person\s*)?plural|second\s+person\s+plural/],
      ["3rd-plural", /3rd\s*(?:person\s*)?plural|third\s+person\s+plural/],
    ];
    for (const [value, re] of persons) if (re.test(text)) add(`latin:person:${value}`);
    if (/conjug|verb|ending|person|tense|finite verb/.test(text)) add("latin:verb-forms");
    if (/infinitive/.test(text)) add("latin:verb-form:infinitive");
    if (/imperative/.test(text)) add("latin:verb-form:imperative");
    if (/irregular verb/.test(text)) add("latin:verbs:irregular");
    if (/regular verb|verb paradigm/.test(text)) add("latin:verbs:regular");
    if (/\bin\b/.test(text) && /preposition|place|movement|ablative|accusative/.test(text)) add("latin:preposition:in");
    if (/\bad\b/.test(text) && /preposition|movement|accusative/.test(text)) add("latin:preposition:ad");
    if (/\bcum\b/.test(text) && /preposition|ablative/.test(text)) add("latin:preposition:cum");
    if (/preposition/.test(text)) add("latin:prepositions");
    if (/pronoun|\bille\b|\bis ea id\b/.test(text)) add("latin:pronouns");
    if (/possessive/.test(text)) add("latin:possessives");
    if (/adjective/.test(text)) add("latin:adjectives");
    if (/agreement/.test(text)) add("latin:agreement");
    if (/noun/.test(text)) add("latin:nouns");
    if (/dictionary entr/.test(text)) add("latin:dictionary-forms");
    if (/word.?order|syntax|restore the sentence/.test(text)) add("latin:syntax:word-order");
    if (/translat|english → latin|latin → english|choose the exact latin/.test(text)) add("latin:translation");
    if (/comprehension|passage|whole.?passage/.test(text)) add("latin:comprehension");
    if (/set.?text/.test(text)) add("latin:set-text");
    if (/production|english → latin/.test(text)) add("latin:production");
    if (/vocab|meaning|miscellaneous words|stage \d+/.test(text)) add("latin:vocabulary");
    if (/map location|place matters/.test(text)) add("latin:culture:places");
    if (/research question/.test(text)) add("latin:research");
  } else if (resolved === "french") {
    if (item.format === "spelling_restore" || /correct (?:the )?(?:error|spelling)|rewrite correctly|spell(?:ing)?/.test(text)) add("french:spelling");
    if (/accent|é|è|ê|à|ç|ù|ô|î|ï|ë/.test(text) && /accent|spelling|rewrite correctly|correct the error/.test(text)) add("french:accents");
    for (const value of ["present","imperfect","perfect","past","future","conditional"]) if (text.includes(value)) add(`french:tense:${value === "past" ? "past" : value}`);
    if (/pass[ée] compos|past participle/.test(text)) add("french:tense:perfect");
    if (/negat|pas de|ne\s+.*pas/.test(text)) add("french:negation");
    if (/gender|mascul|femin/.test(text)) add("french:gender");
    if (/agree|agreement|plural|adjective/.test(text)) add("french:agreement");
    if (/adjective/.test(text)) add("french:adjectives");
    if (/compar|superlat|plus de|moins de|aussi/.test(text)) add("french:comparisons");
    if (/time|heure|clock|date|numbers|age/.test(text)) add("french:time");
    if (/number|age/.test(text)) add("french:numbers");
    if (/reflexive|routine/.test(text)) add("french:reflexives");
    if (/irregular verb/.test(text)) add("french:verbs:irregular");
    if (/regular present|present pattern/.test(text)) add("french:verbs:regular-present");
    if (/\baller\b/.test(text)) add("french:verb:aller");
    if (/word.?order|sentence|phrase|sentence building/.test(text)) add("french:word-order");
    if (/translat/.test(text)) add("french:translation");
    if (/listen|authentic spoken/.test(text)) add("french:listening");
    if (/speak|conversation|spoken/.test(text)) add("french:speaking");
    if (/postcard|writing|model answer|high-scoring structure/.test(text)) add("french:writing");
    if (/reading|cultural|revolution|marie-antoinette/.test(text)) add("french:reading");
    if (/family|friend|personal information/.test(text)) add("french:vocabulary:family");
    if (/school|classroom|subject/.test(text)) add("french:vocabulary:school");
    if (/town|paris|travel|tourist|station|metro/.test(text)) add("french:vocabulary:travel");
    if (/food|drink|restaurant/.test(text)) add("french:vocabulary:food");
    if (/weather/.test(text)) add("french:vocabulary:weather");
    if (/leisure|activit/.test(text)) add("french:vocabulary:leisure");
    if (/opinion|reason/.test(text)) add("french:opinions");
    if (/daily life|social convention/.test(text)) add("french:vocabulary:daily-life");
    if (/vocab|word|master vocabulary|teacher vocabulary/.test(text)) add("french:vocabulary");
    if (/accuracy|quick rules|targeted practice|mixed assessment|checkpoint|synthesis/.test(text)) add("french:accuracy");
  } else if (resolved === "biology") {
    if (/cell|organelle|nucleus|mitochond|membrane|ribosome|vacuole|cytoplasm|prokary|eukary/.test(text)) add("biology:cells","biology:cell-structure-function");
    if (/specialis|differentiation/.test(text)) add("biology:cell-specialisation");
    if (/microscop/.test(text)) add("biology:microscopy");
    if (/microorganism|aseptic|culture/.test(text)) add("biology:microorganisms");
    if (/chromosome|cell cycle|mitosis/.test(text)) add("biology:cell-cycle-mitosis");
    if (/stem cell/.test(text)) add("biology:stem-cells");
    if (/dna|gene|genome|allele|karyogram|homologous/.test(text)) add("biology:genetics");
    if (/fertilis|inheritance/.test(text)) add("biology:inheritance");
    if (/punnett|probability/.test(text)) add("biology:punnett-squares");
    if (/genetic disorder/.test(text)) add("biology:genetic-disorders");
    if (/variation|mutation/.test(text)) add("biology:variation");
    if (/natural selection|evolution/.test(text)) add("biology:evolution");
    if (/diffusion/.test(text)) add("biology:diffusion");
    if (/osmosis/.test(text)) add("biology:osmosis");
    if (/active transport/.test(text)) add("biology:active-transport");
    if (/respir/.test(text)) add("biology:respiration");
    if (/exercise/.test(text)) add("biology:exercise-response");
    if (/metabolism/.test(text)) add("biology:metabolism");
    if (/photo|chloroplast|chlorophyll|glucose|palisade|starch/.test(text)) add("biology:photosynthesis");
    if (/limiting factor/.test(text)) add("biology:photosynthesis:limiting-factors");
    if (/enzyme/.test(text)) add("biology:enzymes");
    if (/digest|absorption|gut/.test(text)) add("biology:digestion");
    if (/balanced diet|nutrient|nutrition|bmi|basal energy|fats|cholesterol/.test(text)) add("biology:nutrition");
    if (/food test/.test(text)) add("biology:food-tests");
    if (/leaf structure|plant and leaf|mineral ion|greenhouse/.test(text)) add("biology:plant-biology");
    if (/eco|producer|consumer|food chain|food web|trophic|population|community|habitat/.test(text)) add("biology:ecology");
    if (/competition/.test(text)) add("biology:ecology:competition");
    if (/predator|prey|adaptation/.test(text)) add("biology:ecology:adaptations");
    if (/pyramid|energy transfer/.test(text)) add("biology:ecology:energy-transfer");
    if (/pollutant|indicator species|human impact/.test(text)) add("biology:ecology:human-impact");
    if (/classification|binomial|identification key/.test(text)) add("biology:classification");
    if (/drug|alcohol|caffeine|smoking|tobacco/.test(text)) add("biology:health");
    if (/correlation|graph|calculation|unit conversion/.test(text)) add("biology:data-skills");
    if (/practical|variables|control|reliability|validity|conclusion|evidence/.test(text)) add("biology:working-scientifically");
  } else if (resolved === "chemistry") {
    if (/periodic|element|symbol|halogen|alkali|group\s*[17]|newlands|mendeleev/.test(text)) add("chemistry:periodic-table","chemistry:elements");
    if (/atom|particle|proton|neutron|electron|isotope|atomic model/.test(text)) add("chemistry:atomic-structure");
    if (/compound|mixture/.test(text)) add("chemistry:elements-compounds-mixtures");
    if (/formula|valency|balanced equation|conservation of mass/.test(text)) add("chemistry:formulae-equations");
    if (/bond|ionic|covalent/.test(text)) add("chemistry:bonding");
    if (/acid|alkali|neutral|ph|indicator|salt|carbonate/.test(text)) add("chemistry:acids-alkalis");
    if (/reactivity|displacement|rust/.test(text)) add("chemistry:reactivity");
    if (/react|oxid|combust|hydrogenation|hydration|halogenation/.test(text)) add("chemistry:reactions");
    if (/separation|filtration|distillation/.test(text)) add("chemistry:separation");
    if (/chromatograph|\brf\b|reproducib/.test(text)) add("chemistry:chromatography");
    if (/crude oil|fractional distillation|alkane|hydrocarbon/.test(text)) add("chemistry:organic:crude-oil");
    if (/cracking|alkene/.test(text)) add("chemistry:organic:alkenes");
    if (/polymer/.test(text)) add("chemistry:polymers");
    if (/rate of reaction|rates practical|collision theory/.test(text)) add("chemistry:rates");
    if (/atmosphere|greenhouse gas|climate change/.test(text)) add("chemistry:atmosphere");
    if (/earth structure|rock|resource/.test(text)) add("chemistry:earth-resources");
    if (/energy change|exotherm|endotherm/.test(text)) add("chemistry:energy-changes");
    if (/chemical analysis|interpreting evidence/.test(text)) add("chemistry:analysis");
    if (/working scientifically|safety|peer review|practical|graphical analysis/.test(text)) add("chemistry:working-scientifically");
  } else if (resolved === "physics") {
    if (/particle model|kinetic theory|solid|liquid|gas/.test(text)) add("physics:particle-model");
    if (/density/.test(text)) add("physics:density");
    if (/internal energy|heating/.test(text)) add("physics:internal-energy");
    if (/conduction|thermal insulation/.test(text)) add("physics:thermal-transfer");
    if (/infrared|absorption|emission|leslie cube/.test(text)) add("physics:infrared-radiation");
    if (/specific heat capacity/.test(text)) add("physics:specific-heat-capacity");
    if (/change of state|changes of state|melting|boiling|freezing/.test(text)) add("physics:changes-of-state");
    if (/latent heat/.test(text)) add("physics:specific-latent-heat");
    if (/evaporation/.test(text)) add("physics:evaporation");
    if (/boyle|gas pressure/.test(text)) add("physics:gas-pressure");
    if (/pressure/.test(text)) add("physics:pressure");
    if (/wave|frequency|hertz|amplitude|wavelength|sound/.test(text)) add("physics:waves");
    if (/force|newton|friction|weight|balanced|hooke|spring/.test(text)) add("physics:forces");
    if (/hooke|spring/.test(text)) add("physics:hookes-law");
    if (/moment|lever|equilibrium/.test(text)) add("physics:moments");
    if (/energy|joule|kinetic|gravitational|elastic|thermal|chemical|dissipation/.test(text)) add("physics:energy-stores");
    if (/power|watt/.test(text)) add("physics:power");
    if (/efficien/.test(text)) add("physics:efficiency");
    if (/unit|measure|convert|metre|second|kilogram|pascal|watt/.test(text)) add("physics:units");
    if (/speed|velocity|speed-time|distance.*time|motion/.test(text)) add("physics:motion");
    if (/circuit|current|potential difference|voltage/.test(text)) add("physics:circuits");
    if (/resistance|series|parallel/.test(text)) add("physics:resistance");
    if (/magnet|electromagnet|domain|magnetic/.test(text)) add("physics:magnetism");
    if (/light|reflection|refraction|colour|vision|eye/.test(text)) add("physics:light");
    if (/universe|star|gravity|eclipse|stellar/.test(text)) add("physics:space");
    if (/practical|required practical/.test(text)) add("physics:working-scientifically");
  } else if (resolved === "english") {
    if (/language technique|simile|metaphor|alliteration|personification|onomatopoeia|hyperbole|imagery|device/.test(text)) add("english:language-techniques");
    if (/narrative|tone|mood|climax|protagonist|character/.test(text)) add("english:narrative");
    if (/word class|noun|verb|adjective|adverb/.test(text)) add("english:word-classes");
    if (/writing|stanza|paragraph|structure|essay|teal|line of argument/.test(text)) add("english:writing");
    if (/evidence|quote|analysis|explain|critical commentary/.test(text)) add("english:evidence-analysis");
    if (/dystopian|genre|convention/.test(text)) add("english:genre");
    if (/othello|iago|tragedy/.test(text)) add("english:drama");
    if (/northanger|gothic/.test(text)) add("english:gothic");
    if (/journalism|rhetoric|opinion/.test(text)) add("english:journalism");
    if (/ww1|poetry|poem/.test(text)) add("english:poetry");
    if (/context/.test(text)) add("english:context");
  }
  if (!out.length) add(`${resolved}:topic:${slug(item.topicId || item.topic || item.topicTitle || "general")}`);
  return out;
}

const QUESTION_META = new Map();
function addQuestionMeta(items, subject, isVocab = false) {
  for (const item of items || []) {
    if (!item?.id) continue;
    QUESTION_META.set(item.id, {
      subject,
      topicId: legacyTopicId(subject, item.topic || (isVocab ? "vocabulary" : "core")),
      topicTitle: item.topic || (isVocab ? "Vocabulary" : "Core"),
      skills: getQuestionSkills(item, subject),
    });
  }
}
addQuestionMeta(latinVocab, "latin", true);
addQuestionMeta(frenchVocab, "french", true);
addQuestionMeta(englishVocab, "english", true);
addQuestionMeta(latinLegacyQuestions, "latin");
addQuestionMeta(frenchLegacyQuestions, "french");
addQuestionMeta(biologyLegacyQuestions, "biology");

function inferSubjectFromTopic(topicId) {
  const id = String(topicId || "").toLowerCase();
  if (id.startsWith("la-") || id.startsWith("latin")) return "latin";
  if (id.startsWith("fr-") || id.startsWith("french")) return "french";
  if (id.startsWith("bio-") || id.startsWith("bi-")) return "biology";
  if (id.startsWith("chem-") || id.startsWith("ch-")) return "chemistry";
  if (id.startsWith("phys-") || id.startsWith("ph-")) return "physics";
  if (id.startsWith("eng-") || id.startsWith("en-")) return "english";
  return null;
}

function inferAttemptMeta(questionId, subject, meta = {}) {
  const known = QUESTION_META.get(questionId) || {};
  const resolvedSubject = SUBJECTS.includes(subject) ? subject : known.subject || inferSubjectFromTopic(meta.topicId);
  const topicId = meta.topicId || known.topicId || (resolvedSubject ? legacyTopicId(resolvedSubject, "general") : null);
  return {
    ...meta,
    subject: resolvedSubject,
    topicId,
    topicTitle: meta.topicTitle || known.topicTitle || null,
    skills: [...new Set((meta.skills?.length ? meta.skills : known.skills || []).map(canonicalSkill).filter(Boolean))],
  };
}

function isVisible(el) {
  if (!el || el.disabled) return false;
  const rect = el.getBoundingClientRect?.();
  if (!rect || rect.width <= 0 || rect.height <= 0) return false;
  const style = window.getComputedStyle?.(el);
  return !style || (style.display !== "none" && style.visibility !== "hidden");
}

function isIndependentProduction(meta) {
  if (meta?.production === true) return true;
  if (meta?.production === false) return false;
  const format = String(meta?.format || "");
  if (["typed_exact", "typed_short", "typed_equivalent", "controlled_translation", "extended_response", "practical_design", "mark_points", "calculation", "spelling_restore", "unordered_set"].includes(format)) return true;
  if (["mc_single", "matching", "sorting", "diagram_label", "word_tiles", "sequence"].includes(format)) return false;
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  return [...document.querySelectorAll("main form input:not([type='hidden']), main form textarea")].some(isVisible);
}

function diagnoseError(subject, topicId, errorKind, format, topicTitle) {
  if (!errorKind || errorKind === "none") return null;
  const text = `${topicId || ""} ${topicTitle || ""}`.toLowerCase();
  if (errorKind === "blank") return "incomplete";
  if (errorKind === "partial") return "incomplete";
  if (subject === "latin") {
    if (errorKind === "spelling") return "spelling";
    if (/case|dative|ablative|accusative|nominative|genitive|declen|preposition/.test(text)) return "case";
    if (/person|number/.test(text)) return "person-number";
    if (/tense|perfect|imperfect|present|pluperfect|verb/.test(text)) return errorKind === "ending" ? "verb-ending" : "tense";
    if (/vocab|noun|adjective|pronoun|word/.test(text)) return "vocabulary";
    if (/translat|sentence|comprehension|passage/.test(text)) return "translation";
    return errorKind === "ending" ? "ending" : "grammar/concept";
  }
  if (subject === "french") {
    if (errorKind === "spelling" || errorKind === "accent") return errorKind;
    if (/negat|pas de|article/.test(text)) return "negative/article";
    if (/gender|mascul|femin|article/.test(text)) return "gender/article";
    if (/agree|adjective|plural/.test(text)) return "agreement";
    if (/tense|imperfect|present|perfect|past|future|verb/.test(text)) return errorKind === "ending" ? "verb-ending" : "tense";
    if (/order|sentence|translat|phrase/.test(text)) return "word-order/translation";
    if (/vocab|word|town|school|family|food|time|opinion/.test(text)) return "vocabulary";
    return errorKind === "ending" ? "agreement/ending" : "grammar/concept";
  }
  if (["biology", "chemistry", "physics"].includes(subject)) {
    if (format === "calculation") return "calculation";
    if (/unit|measure|convert/.test(text)) return "unit/measurement";
    if (/name|identify|term|definition|vocab/.test(text)) return "terminology";
    return "concept";
  }
  if (subject === "english") {
    if (/evidence|quote|explain|analysis/.test(text)) return "evidence/explanation";
    if (/term|technique|language/.test(text)) return "terminology";
    return "concept";
  }
  return errorKind;
}

function errorLabel(value) {
  return String(value || "").replace(/[-/]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dominantError(stat) {
  const entries = Object.entries(stat?.errorTypes || {}).filter(([, count]) => count > 0);
  return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function questionTopicId(item, subject) {
  return item?.topicId || legacyTopicId(subject, item?.topic || "general");
}

function adaptiveContentKey(item) {
  const clean = (value) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const answer = item?.answer?.accepted?.[0] ?? item?.answer?.modelAnswer ?? item?.answer?.value ?? item?.answer?.correct ?? "";
  const stimulus = item?.stimulus?.text ?? item?.stimulus?.masked ?? item?.stimulus?.audio ?? "";
  return [clean(item?.prompt), clean(stimulus), clean(answer)].join("|");
}

function adaptiveCognitiveDepth(item) {
  const explicit = Number(item?.cognitiveDepth || item?.cognitiveLevel);
  if (Number.isFinite(explicit) && explicit >= 1) return Math.max(1, Math.min(4, Math.round(explicit)));
  const format = String(item?.format || "");
  const text = [item?.prompt, item?.task?.label, item?.task?.instruction, item?.stimulus?.text].filter(Boolean).join(" ").toLowerCase();
  let depth = 2;
  if (format === "mc_single") depth = 1;
  else if (["matching", "sorting", "diagram_label", "word_tiles", "spelling_restore", "typed_exact", "typed_short", "typed_equivalent"].includes(format)) depth = 2;
  else if (["controlled_translation", "unordered_set", "sequence", "calculation"].includes(format)) depth = 3;
  else if (["mark_points", "extended_response", "practical_design"].includes(format)) depth = 4;
  if (/\b(explain|justify|evaluate|analyse|analyze|discuss|compare|why|give a reason|using evidence|design)\b/.test(text)) depth = Math.max(depth, 4);
  else if (/\b(apply|calculate|work out|determine|predict|interpret|use the data|use this|translate|construct|derive)\b/.test(text)) depth = Math.max(depth, 3);
  else if (/\b(name|state|identify|define|complete|conjugate|recall|give the term)\b/.test(text)) depth = Math.max(depth, 2);
  const difficulty = Number(item?.difficulty) || 0;
  if (difficulty >= 4) depth = Math.max(depth, 4);
  else if (difficulty >= 3) depth = Math.max(depth, 3);
  return Math.max(1, Math.min(4, depth));
}

function adaptiveSkillTargetDepth(stat = {}) {
  const normalized = normalizeSkillStat(stat);
  let level = normalized.challengeLevel || 2;
  const recent = (normalized.recentOutcomes || []).slice(-3);
  const lastTwo = recent.slice(-2);
  if (normalized.retentionFailed) return Math.max(1, level - 1);
  if (lastTwo.length === 2 && lastTwo.every((row) => row.correct === false)) return Math.max(1, level - 1);
  if (normalized.attempted >= 2 && normalized.accuracy < 0.6) return 1;
  if (normalized.needsPractice || (normalized.attempted >= 2 && normalized.accuracy < SECURE_ACCURACY)) return Math.min(2, level);
  return Math.max(1, Math.min(4, level));
}

function adaptiveFormatLane(item) {
  const format = String(item?.format || "");
  if (format === "mc_single") return "recognition";
  if (["matching", "sorting", "diagram_label", "word_tiles", "sequence"].includes(format)) return "interaction";
  if (["extended_response", "practical_design", "mark_points"].includes(format)) return "explanation";
  if (format === "calculation") return "calculation";
  if (format === "spelling_restore") return "spelling";
  if (["typed_exact", "typed_short", "typed_equivalent", "controlled_translation", "unordered_set"].includes(format)) return "typed";
  return format || "other";
}

function adaptiveIsProduction(item) {
  return ["typed", "explanation", "calculation", "spelling"].includes(adaptiveFormatLane(item));
}

function adaptiveQuotaPlan(target) {
  const weights = { weak: 0.4, new: 0.3, mistake: 0.2, retention: 0.1 };
  const order = ["weak", "new", "mistake", "retention"];
  const quotas = {};
  let used = 0;
  const fractions = [];
  for (const name of order) {
    const exact = target * weights[name];
    quotas[name] = Math.floor(exact);
    used += quotas[name];
    fractions.push({ name, fraction: exact - Math.floor(exact), priority: order.indexOf(name) });
  }
  fractions.sort((a, b) => b.fraction - a.fraction || a.priority - b.priority);
  for (let i = 0; used < target; i += 1, used += 1) quotas[fractions[i % fractions.length].name] += 1;
  if (target >= 8 && quotas.retention === 0) {
    const donor = quotas.new > 1 ? "new" : quotas.weak > 1 ? "weak" : null;
    if (donor) {
      quotas[donor] -= 1;
      quotas.retention = 1;
    }
  }
  return quotas;
}

function rankAdaptiveQuestions(items, subject, size = 10) {
  const state = store.getState();
  const today = todayKey();
  const seen = state.seenTotal || {};
  const correct = state.seenCorrect || {};
  const recentIds = new Set((state.recentQuestionIds || []).slice(-16));
  const source = (items || []).map((item) => ({ ...item, skills: getQuestionSkills(item, subject) }));
  const recentConcepts = new Set(
    source
      .filter((item) => recentIds.has(item.id))
      .map((item) => item.conceptId || item.skills?.[0] || questionTopicId(item, subject))
      .filter(Boolean)
  );
  const rows = source.map((item, index) => {
    const topicId = questionTopicId(item, subject);
    const itemSkills = item.skills || [];
    const conceptKey = item.conceptId || itemSkills[0] || topicId;
    const primarySkill = itemSkills[0] || topicId;
    const stat = normalizeTopicStat(state.topicStats?.[topicId] || {});
    const skillRows = itemSkills.map((skill) => ({ skill, stat: normalizeSkillStat(state.skillStats?.[skill] || {}) }));
    const weakSkill = skillRows.some(({ stat }) => stat.needsPractice || (stat.attempted >= 2 && stat.accuracy < SECURE_ACCURACY));
    const retentionSkill = skillRows.some(({ stat }) => stat.retentionReady || (stat.attempted >= 2 && stat.accuracy >= MASTERY_ACCURACY));
    const retentionSkillDue = skillRows.some(({ stat }) => !!stat.retentionDue && stat.retentionDue <= today);
    const nextSkillDue = skillRows.map(({ stat }) => stat.retentionDue).filter(Boolean).sort()[0] || null;
    const review = state.reviews?.[item.id];
    const due = !!review?.due && review.due <= today;
    const seenCount = seen[item.id] || 0;
    const correctCount = correct[item.id] || 0;
    const unseen = seenCount === 0;
    const mastered = stat.state === "mastered";
    const weakTopic = !mastered && stat.attempted >= 2 && (stat.accuracy < MASTERY_ACCURACY || stat.productionCorrect < 1);
    const mistake = !unseen && (due || correctCount < seenCount || !!review?.wrong || (!!review && (review.stage || 1) < 3));
    const weak = (weakTopic || weakSkill) && !mistake;
    const fresh = unseen && !weakTopic && !weakSkill && !retentionSkillDue;
    const retention = !mistake && !weak && (retentionSkillDue || (!unseen && (mastered || stat.accuracy >= MASTERY_ACCURACY || retentionSkill)));
    const attemptedSkillRows = skillRows.filter(({ stat }) => stat.attempted > 0);
    const skillAccuracy = attemptedSkillRows.length ? Math.min(...attemptedSkillRows.map(({ stat }) => stat.accuracy)) : 1;
    return {
      item, index, topicId, conceptKey, primarySkill, contentKey: adaptiveContentKey(item), stat, skillRows, skillAccuracy,
      retentionSkillDue, nextSkillDue, review, due, unseen, mastered, weak, fresh, mistake, retention,
      recent: recentIds.has(item.id), recentConcept: recentConcepts.has(conceptKey),
      lane: adaptiveFormatLane(item), production: adaptiveIsProduction(item),
      depth: adaptiveCognitiveDepth(item),
      targetDepth: skillRows.length
        ? Math.min(...skillRows.map(({ stat }) => adaptiveSkillTargetDepth(stat)))
        : adaptiveSkillTargetDepth({
            attempted: stat.attempted,
            correct: stat.correct,
            accuracy: stat.accuracy,
            productionCorrect: stat.productionCorrect,
            recentOutcomes: stat.recentOutcomes,
            challengeLevel: stat.state === "mastered" ? 4 : stat.state === "secure" ? 3 : 2,
          }),
    };
  });

  const byNeed = (a, b) =>
    Number(a.recent || a.recentConcept) - Number(b.recent || b.recentConcept) ||
    Number(b.due || b.retentionSkillDue) - Number(a.due || a.retentionSkillDue) ||
    (a.review?.due || a.nextSkillDue || "9999-12-31").localeCompare(b.review?.due || b.nextSkillDue || "9999-12-31") ||
    Math.abs(a.depth - a.targetDepth) - Math.abs(b.depth - b.targetDepth) ||
    a.skillAccuracy - b.skillAccuracy ||
    a.stat.accuracy - b.stat.accuracy ||
    (seen[a.item.id] || 0) - (seen[b.item.id] || 0) ||
    a.index - b.index;

  const bucketName = (row) => row.mistake ? "mistake" : row.weak ? "weak" : row.fresh ? "new" : row.retention ? "retention" : "other";
  const buckets = {
    weak: rows.filter((r) => r.weak).sort(byNeed),
    new: rows.filter((r) => r.fresh).sort(byNeed),
    mistake: rows.filter((r) => r.mistake).sort(byNeed),
    retention: rows.filter((r) => r.retention).sort(byNeed),
    other: rows.filter((r) => !r.weak && !r.fresh && !r.mistake && !r.retention).sort(byNeed),
  };

  const target = Math.max(1, Math.min(Number(size) || 10, rows.length));
  const quotas = adaptiveQuotaPlan(target);
  const selected = [];
  const ids = new Set();
  const concepts = new Set();
  const contents = new Set();

  const takeDistinct = (name, count) => {
    for (const row of buckets[name]) {
      if (count <= 0) break;
      if (ids.has(row.item.id) || concepts.has(row.conceptKey) || contents.has(row.contentKey)) continue;
      ids.add(row.item.id);
      concepts.add(row.conceptKey);
      contents.add(row.contentKey);
      selected.push({ ...row, bucket: name });
      count -= 1;
    }
    return count;
  };

  const deficits = {};
  for (const name of ["weak", "new", "mistake", "retention"]) deficits[name] = takeDistinct(name, quotas[name]);

  let missing = Object.values(deficits).reduce((sum, value) => sum + value, 0);
  if (missing > 0) {
    const refill = [...buckets.weak, ...buckets.mistake, ...buckets.new, ...buckets.retention, ...buckets.other]
      .filter((row) => !ids.has(row.item.id) && !concepts.has(row.conceptKey) && !contents.has(row.contentKey))
      .sort(byNeed);
    for (const row of refill) {
      if (missing <= 0) break;
      if (concepts.has(row.conceptKey) || contents.has(row.contentKey)) continue;
      ids.add(row.item.id);
      concepts.add(row.conceptKey);
      contents.add(row.contentKey);
      selected.push({ ...row, bucket: bucketName(row) === "other" ? "new" : bucketName(row) });
      missing -= 1;
    }
  }

  for (const name of ["weak", "mistake", "new", "retention", "other"]) {
    for (const row of buckets[name]) {
      if (selected.length >= target) break;
      if (ids.has(row.item.id) || contents.has(row.contentKey)) continue;
      ids.add(row.item.id);
      contents.add(row.contentKey);
      selected.push({ ...row, bucket: name });
    }
  }

  if (selected.length < target) {
    for (const row of rows.sort(byNeed)) {
      if (selected.length >= target) break;
      if (ids.has(row.item.id)) continue;
      ids.add(row.item.id);
      selected.push({ ...row, bucket: bucketName(row) === "other" ? "new" : bucketName(row) });
    }
  }

  // Guarantee independent production evidence when the bank can support it.
  const desiredProduction = target >= 15 ? 3 : target >= 10 ? 2 : target >= 5 ? 1 : 0;
  let productionCount = selected.filter((row) => row.production).length;
  if (productionCount < desiredProduction) {
    const candidates = rows.filter((row) => row.production && !ids.has(row.item.id)).sort(byNeed);
    for (const candidate of candidates) {
      if (productionCount >= desiredProduction) break;
      const replaceable = selected
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => !row.production && row.bucket !== "mistake" && row.bucket !== "retention")
        .reverse();
      const choice = replaceable.find(({ index }) =>
        !selected.some((row, otherIndex) => otherIndex !== index && (row.conceptKey === candidate.conceptKey || row.contentKey === candidate.contentKey))
      );
      if (!choice) continue;
      const removed = selected[choice.index];
      ids.delete(removed.item.id);
      ids.add(candidate.item.id);
      selected[choice.index] = { ...candidate, bucket: bucketName(candidate) === "other" ? removed.bucket : bucketName(candidate) };
      productionCount += 1;
    }
  }

  // Keep calibrated difficulty varied: the learner's level should lead the mix without monopolising it.
  const targetDepths = selected.map((row) => row.targetDepth || 2).sort((a, b) => a - b);
  const sessionTargetDepth = targetDepths.length ? targetDepths[Math.floor(targetDepths.length / 2)] : 2;
  const maxSameDepthRatio = sessionTargetDepth <= 1 ? 0.7 : sessionTargetDepth === 2 ? 0.6 : sessionTargetDepth === 3 ? 0.6 : 0.5;
  const maxSameDepth = target >= 5 ? Math.ceil(target * maxSameDepthRatio) : target;
  const depthCount = (depth) => selected.filter((row) => row.depth === depth).length;

  // For higher-level learners, reserve some genuine application as a bridge between recall and explanation.
  const desiredApplication = sessionTargetDepth >= 4
    ? Math.max(1, Math.round(target * 0.2))
    : sessionTargetDepth === 3
      ? Math.max(1, Math.round(target * 0.35))
      : 0;
  if (desiredApplication > 0 && depthCount(3) < desiredApplication) {
    const selectedConcepts = new Set(selected.map((row) => row.conceptKey));
    const applicationPool = rows
      .filter((row) => row.depth === 3 && !ids.has(row.item.id) && !selectedConcepts.has(row.conceptKey))
      .sort(byNeed);
    for (const candidate of applicationPool) {
      if (depthCount(3) >= desiredApplication) break;
      const replaceable = selected
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.depth !== 3 && row.bucket !== "mistake" && row.bucket !== "retention")
        .sort((a, b) =>
          Math.abs(b.row.depth - sessionTargetDepth) - Math.abs(a.row.depth - sessionTargetDepth) ||
          b.index - a.index
        );
      const choice = replaceable[0];
      if (!choice) break;
      const removed = selected[choice.index];
      ids.delete(removed.item.id);
      selectedConcepts.delete(removed.conceptKey);
      ids.add(candidate.item.id);
      selectedConcepts.add(candidate.conceptKey);
      selected[choice.index] = { ...candidate, bucket: removed.bucket };
    }
  }

  for (let depth = 1; depth <= 4; depth += 1) {
    let count = depthCount(depth);
    if (count <= maxSameDepth) continue;
    for (let index = selected.length - 1; index >= 0 && count > maxSameDepth; index -= 1) {
      const current = selected[index];
      if (current.depth !== depth) continue;
      const alternate = rows
        .filter((row) =>
          row.conceptKey === current.conceptKey &&
          row.depth !== depth &&
          !ids.has(row.item.id)
        )
        .sort((a, b) =>
          Math.abs(a.depth - current.targetDepth) - Math.abs(b.depth - current.targetDepth) ||
          b.depth - a.depth ||
          byNeed(a, b)
        )[0];
      if (!alternate) continue;
      ids.delete(current.item.id);
      ids.add(alternate.item.id);
      selected[index] = { ...alternate, bucket: current.bucket };
      count -= 1;
    }
  }

  // Recognition allowance also adapts: more support at Level 1, much less at higher levels.
  const recognitionRatio = sessionTargetDepth <= 1 ? 0.7 : sessionTargetDepth === 2 ? 0.4 : sessionTargetDepth === 3 ? 0.3 : 0.2;
  const maxRecognition = target >= 5 ? Math.ceil(target * recognitionRatio) : target;
  let recognitionCount = selected.filter((row) => row.lane === "recognition").length;
  if (recognitionCount > maxRecognition) {
    for (let index = selected.length - 1; index >= 0 && recognitionCount > maxRecognition; index -= 1) {
      const current = selected[index];
      if (current.lane !== "recognition") continue;
      const alternate = rows
        .filter((row) =>
          row.conceptKey === current.conceptKey &&
          row.lane !== "recognition" &&
          !ids.has(row.item.id)
        )
        .sort(byNeed)[0];
      if (!alternate) continue;
      ids.delete(current.item.id);
      ids.add(alternate.item.id);
      selected[index] = { ...alternate, bucket: current.bucket };
      recognitionCount -= 1;
    }
  }

  // Compose the session rather than merely sorting it.
  const pool = [...selected];
  const composed = [];
  const bucketPattern = ["weak", "new", "mistake", "weak", "retention", "new"];
  const productionSlots = new Set(
    target >= 15 ? [3, 8, 12] : target >= 10 ? [3, 7] : target >= 5 ? [3] : []
  );
  const recentConceptWindow = [];
  const recentSkillWindow = [];
  let lastLane = null;
  let lastProduction = false;
  let lastDepth = null;

  const pickCandidate = (position) => {
    const preferredBucket = bucketPattern[position % bucketPattern.length];
    const alternativesExist = (predicate) => pool.some(predicate);
    const strict = (row) =>
      !recentConceptWindow.includes(row.conceptKey) &&
      !recentSkillWindow.includes(row.primarySkill) &&
      row.lane !== lastLane &&
      !(row.production && lastProduction);
    const conceptSpaced = (row) =>
      !recentConceptWindow.includes(row.conceptKey) &&
      row.lane !== lastLane &&
      !(row.production && lastProduction);
    const laneSpaced = (row) =>
      !recentConceptWindow.includes(row.conceptKey) &&
      !(row.production && lastProduction);

    let candidates = pool.filter((row) => row.bucket === preferredBucket);
    if (!candidates.length) candidates = pool;
    const globalStrict = pool.filter(strict);
    if (globalStrict.length && !candidates.some(strict)) candidates = globalStrict;
    let allowed = candidates.filter(strict);
    if (!allowed.length) allowed = candidates.filter(conceptSpaced);
    if (!allowed.length) allowed = candidates.filter(laneSpaced);
    if (!allowed.length) allowed = candidates;

    // If another bucket has a much better spacing option, prefer the healthier rhythm.
    if (allowed.every((row) => recentConceptWindow.includes(row.conceptKey)) && alternativesExist(strict)) {
      allowed = pool.filter(strict);
    }

    const wantsProduction = productionSlots.has(position);
    const remainingProduction = pool.filter((row) => row.production).length;
    const remainingNonProduction = pool.length - remainingProduction;
    if (!lastProduction && position > 0 && remainingProduction >= remainingNonProduction) {
      const productionAllowed = allowed.filter((row) => row.production);
      if (productionAllowed.length) allowed = productionAllowed;
    }
    allowed.sort((x, y) => {
      const score = (row) => {
        let value = 0;
        if (row.bucket === preferredBucket) value += 12;
        if (!recentConceptWindow.includes(row.conceptKey)) value += 10;
        if (!recentSkillWindow.includes(row.primarySkill)) value += 4;
        if (row.lane !== lastLane) value += 5;
        if (!(row.production && lastProduction)) value += 4;
        if (wantsProduction === row.production) value += 5;
        if (position === 0 && row.production) value -= 5;
        const phaseTarget = position < 2
          ? Math.max(1, row.targetDepth - 1)
          : position >= Math.max(3, target - 3)
            ? Math.min(4, row.targetDepth + 1)
            : row.targetDepth;
        value += Math.max(0, 10 - Math.abs(row.depth - phaseTarget) * 4);
        if (lastDepth != null && Math.abs(row.depth - lastDepth) > 1) value -= 8;
        if (position === 0 && row.depth > 2) value -= 10;
        value -= (row.recent || row.recentConcept) ? 4 : 0;
        return value;
      };
      return score(y) - score(x) || byNeed(x, y);
    });
    return allowed[0] || pool[0];
  };

  while (composed.length < target && pool.length) {
    const position = composed.length;
    const row = pickCandidate(position);
    const index = pool.indexOf(row);
    pool.splice(index, 1);
    composed.push(row);
    recentConceptWindow.push(row.conceptKey);
    recentSkillWindow.push(row.primarySkill);
    while (recentConceptWindow.length > 2) recentConceptWindow.shift();
    while (recentSkillWindow.length > 1) recentSkillWindow.shift();
    lastLane = row.lane;
    lastProduction = row.production;
    lastDepth = row.depth;
  }

  // Final small-bank rebalance: when repeated concepts are unavoidable, interleave
  // them rather than leaving a duplicate stranded at the end of the session.
  const sequencePenalty = (list) => {
    let penalty = 0;
    for (let i = 0; i < list.length; i += 1) {
      for (let j = Math.max(0, i - 2); j < i; j += 1) {
        if (list[i].conceptKey === list[j].conceptKey) penalty += 100;
        if (list[i].contentKey === list[j].contentKey) penalty += 200;
      }
      if (i > 0) {
        if (list[i].lane === list[i - 1].lane) penalty += 2;
        if (list[i].production && list[i - 1].production) penalty += 3;
        if (Math.abs((list[i].depth || 2) - (list[i - 1].depth || 2)) > 1) penalty += 1;
      }
    }
    return penalty;
  };
  let currentPenalty = sequencePenalty(composed);
  for (let pass = 0; pass < composed.length * 2 && currentPenalty >= 100; pass += 1) {
    let bestPenalty = currentPenalty;
    let bestSwap = null;
    for (let i = 0; i < composed.length - 1; i += 1) {
      for (let j = i + 1; j < composed.length; j += 1) {
        const candidate = [...composed];
        [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
        const penalty = sequencePenalty(candidate);
        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          bestSwap = [i, j];
        }
      }
    }
    if (!bestSwap) break;
    [composed[bestSwap[0]], composed[bestSwap[1]]] = [composed[bestSwap[1]], composed[bestSwap[0]]];
    currentPenalty = bestPenalty;
  }

  const chosenIds = new Set(composed.map((row) => row.item.id));
  const leftovers = rows.filter((row) => !chosenIds.has(row.item.id)).sort(byNeed);
  const ordered = [...composed, ...leftovers.map((row) => ({ ...row, bucket: bucketName(row) }))];
  return ordered.map((row, index) => ({
    ...row.item,
    _adaptiveRank: index,
    _adaptiveBucket: row.bucket,
    _sessionComposed: index < target,
    _sessionLane: row.lane,
    _sessionConcept: row.conceptKey,
    _sessionContent: row.contentKey,
    _sessionPrimarySkill: row.primarySkill,
    _sessionProduction: !!row.production,
    _sessionDepth: row.depth,
    _sessionTargetDepth: row.targetDepth,
    _sessionCalibratedLevel: sessionTargetDepth,
  }));
}
function topicState(attempted, correct, productionCorrect) {
  const accuracy = attempted > 0 ? correct / attempted : 0;
  if (attempted >= MASTERY_MIN_ATTEMPTS && accuracy >= MASTERY_ACCURACY && productionCorrect > 0) return "mastered";
  if (attempted >= SECURE_MIN_ATTEMPTS && accuracy >= SECURE_ACCURACY) return "secure";
  if (attempted >= 2 || correct > 0) return "practising";
  return "learning";
}

function normalizeTopicStat(stat = {}) {
  const attempted = Math.max(0, Number(stat.attempted) || 0);
  const correct = Math.max(0, Math.min(attempted, Number(stat.correct) || 0));
  const productionIds = Array.isArray(stat.productionIds) ? [...new Set(stat.productionIds)].slice(-20) : [];
  const productionCorrect = Math.max(Number(stat.productionCorrect) || 0, productionIds.length);
  const accuracy = attempted ? correct / attempted : 0;
  return {
    ...stat,
    attempted,
    correct,
    accuracy,
    productionAttempted: Math.max(0, Number(stat.productionAttempted) || 0),
    productionCorrect,
    productionIds,
    state: topicState(attempted, correct, productionCorrect),
    masteryRule: 1,
  };
}

function normalizeSkillStat(stat = {}) {
  const attempted = Math.max(0, Number(stat.attempted) || 0);
  const correct = Math.max(0, Math.min(attempted, Number(stat.correct) || 0));
  const accuracy = attempted ? correct / attempted : 0;
  return {
    ...stat,
    attempted,
    correct,
    accuracy,
    productionAttempted: Math.max(0, Number(stat.productionAttempted) || 0),
    productionCorrect: Math.max(0, Number(stat.productionCorrect) || 0),
    productionIds: Array.isArray(stat.productionIds) ? [...new Set(stat.productionIds)].slice(-20) : [],
    repairs: {
      attempted: Math.max(0, Number(stat.repairs?.attempted) || 0),
      correct: Math.max(0, Number(stat.repairs?.correct) || 0),
    },
    retentionStage: Math.max(0, Math.min(3, Number(stat.retentionStage) || 0)),
    retentionDue: stat.retentionDue || null,
    retentionReady: !!stat.retentionReady,
    retentionFailed: !!stat.retentionFailed,
    retentionPasses: Math.max(0, Number(stat.retentionPasses) || 0),
    retentionFailures: Math.max(0, Number(stat.retentionFailures) || 0),
    recoveryStreak: Math.max(0, Number(stat.recoveryStreak) || 0),
    needsPractice: !!stat.needsPractice,
    challengeLevel: Math.max(1, Math.min(4, Number(stat.challengeLevel) || (
      attempted >= 6 && accuracy >= 0.9 && (Number(stat.productionCorrect) || 0) >= 2 ? 4 :
      attempted >= 3 && accuracy >= MASTERY_ACCURACY && (Number(stat.productionCorrect) || 0) > 0 ? 3 :
      attempted >= 2 && accuracy < 0.6 ? 1 : 2
    ))),
    challengeStreak: Math.max(0, Number(stat.challengeStreak) || 0),
    lastChallengeDepth: Math.max(0, Math.min(4, Number(stat.lastChallengeDepth) || 0)),
    recentOutcomes: Array.isArray(stat.recentOutcomes) ? stat.recentOutcomes.slice(-20) : [],
  };
}

function topicTitle(state, topicId, subject) {
  try {
    const catalog = getTopicCatalog(subject, state.year);
    const found = catalog?.find((topic) => topic.topicId === topicId);
    if (found?.title) return found.title;
  } catch {}
  return String(topicId || "Focus topic")
    .replace(/^(latin|french|bio|chem|phys|eng)-legacy-/, "")
    .replace(/^(la|fr|bio|chem|phys|eng)-y\d+-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function topicMatchesYear(topicId, year) {
  const match = String(topicId || "").match(/-y(\d+)-/i);
  return !match || Number(match[1]) === Number(year);
}

function inferReviewSubject(questionId, review) {
  return review?.subject || inferSubjectFromTopic(review?.topicId) || QUESTION_META.get(questionId)?.subject || inferSubjectFromTopic(questionId) || null;
}

function adaptiveFocus(state) {
  const today = todayKey();
  const due = [];
  for (const [questionId, review] of Object.entries(state.reviews || {})) {
    if (!review?.due || review.due > today) continue;
    const reviewTopicId = review.topicId || QUESTION_META.get(questionId)?.topicId || null;
    if (!topicMatchesYear(reviewTopicId, state.year)) continue;
    const subject = inferReviewSubject(questionId, review);
    if (!DAILY_SUBJECTS.includes(subject)) continue;
    due.push({ questionId, subject, topicId: reviewTopicId });
  }

  if (due.length) {
    const counts = new Map();
    for (const item of due) counts.set(item.subject, (counts.get(item.subject) || 0) + 1);
    const subject = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const subjectDue = due.filter((item) => item.subject === subject);
    const topicCounts = new Map();
    for (const item of subjectDue) if (item.topicId) topicCounts.set(item.topicId, (topicCounts.get(item.topicId) || 0) + 1);
    const topicId = [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return { subject, topicId, reason: "due", dueCount: subjectDue.length };
  }

  const dueSkills = Object.entries(state.skillStats || {})
    .map(([skillId, raw]) => ({ skillId, ...normalizeSkillStat(raw), subject: skillId.split(":")[0] }))
    .filter((item) => DAILY_SUBJECTS.includes(item.subject) && item.retentionDue && item.retentionDue <= today && (!item.lastTopicId || topicMatchesYear(item.lastTopicId, state.year)));
  if (dueSkills.length) {
    const counts = new Map();
    for (const item of dueSkills) counts.set(item.subject, (counts.get(item.subject) || 0) + 1);
    const subject = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const subjectDue = dueSkills.filter((item) => item.subject === subject).sort((a, b) => String(a.retentionDue).localeCompare(String(b.retentionDue)) || a.accuracy - b.accuracy);
    const first = subjectDue[0];
    return { subject, topicId: first.lastTopicId || null, skillId: first.skillId, skillLabel: skillLabel(first.skillId), reason: "due", dueCount: subjectDue.length };
  }

  const weakSkillRows = Object.entries(state.skillStats || {})
    .map(([skillId, raw]) => ({ skillId, ...normalizeSkillStat(raw), subject: skillId.split(":")[0] }))
    .filter((item) => DAILY_SUBJECTS.includes(item.subject) && item.attempted >= 2 && (item.needsPractice || item.accuracy < SECURE_ACCURACY) && (!item.lastTopicId || topicMatchesYear(item.lastTopicId, state.year)))
    .sort((a, b) => Number(b.retentionFailed) - Number(a.retentionFailed) || a.accuracy - b.accuracy || b.attempted - a.attempted);
  if (weakSkillRows.length) {
    const first = weakSkillRows[0];
    return { subject: first.subject, topicId: first.lastTopicId || null, skillId: first.skillId, skillLabel: skillLabel(first.skillId), reason: "weak", accuracy: first.accuracy, errorType: first.lastErrorType || null };
  }

  const weak = Object.entries(state.topicStats || {})
    .map(([topicId, raw]) => ({ topicId, ...normalizeTopicStat(raw), subject: inferSubjectFromTopic(topicId) }))
    .filter((item) => DAILY_SUBJECTS.includes(item.subject) && topicMatchesYear(item.topicId, state.year) && item.attempted >= 2 && item.state !== "mastered")
    .sort((a, b) => {
      const aProdPenalty = a.productionCorrect > 0 ? 0 : 0.08;
      const bProdPenalty = b.productionCorrect > 0 ? 0 : 0.08;
      return (a.accuracy - aProdPenalty) - (b.accuracy - bProdPenalty) || b.attempted - a.attempted;
    });
  if (weak.length) return { subject: weak[0].subject, topicId: weak[0].topicId, reason: "weak", accuracy: weak[0].accuracy, errorType: dominantError(weak[0]) };

  if (DAILY_SUBJECTS.includes(state.lastSubject)) return { subject: state.lastSubject, topicId: state.lastTopic || null, reason: "continue" };
  const rotation = ["latin", "biology", "chemistry", "physics", "french"];
  return { subject: rotation[new Date().getDay() % rotation.length], topicId: null, reason: "rotate" };
}

function focusHref(focus, state) {
  const base = `/study/${focus.subject}/practise`;
  const params = new URLSearchParams();
  params.set("daily", "1");
  params.set("locked", "1");
  params.set("year", String(state.year || 9));
  if (focus.topicId) params.set("topic", focus.topicId);
  if (focus.reason === "due") params.set("mode", "due");
  else if (focus.reason === "weak") params.set("mode", "weak");
  else params.set("mode", "standard");
  return `${base}?${params.toString()}`;
}

function focusAttemptsToday(state, focus) {
  const day = state.today || todayKey();
  let total = 0;
  for (const [topicId, stat] of Object.entries(state.topicStats || {})) {
    if (focus.topicId) {
      if (topicId !== focus.topicId) continue;
    } else if (inferSubjectFromTopic(topicId) !== focus.subject) {
      continue;
    }
    total += (stat?.recentOutcomes || []).filter((row) => row?.date === day).length;
  }
  return total;
}

function vocabGateState(state, subject) {
  const day = state.today || todayKey();
  const row = state.dailyVocabByDay?.[day]?.[subject] || {};
  const items = row.items && typeof row.items === "object" ? row.items : {};
  const attempts = Object.keys(items).length;
  const correct = Object.values(items).filter(Boolean).length;
  const passed = attempts >= 5 && correct >= 4;
  const progress = passed ? 5 : Math.min(4, attempts);
  return { attempts, correct, passed, progress };
}

function year8ReviewPlan(state) {
  const day = state.today || todayKey();
  const seed = [...day].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

  const allTopics = YEAR8_MASTERY_SUBJECTS.flatMap((subject) => {
    try {
      return (getTopicCatalog(subject, 8) || []).map((topic) => {
        const stat = normalizeTopicStat(state.topicStats?.[topic.topicId] || {});
        return {
          ...stat,
          subject,
          topicId: topic.topicId,
          topicLabel: topic.title || topicTitle({ ...state, year: 8 }, topic.topicId, subject),
        };
      });
    } catch {
      return [];
    }
  }).filter((item) => item.topicId && item.state !== "mastered");

  const sortWeakest = (rows) => [...rows].sort((a, b) => {
    const aProdPenalty = a.productionCorrect > 0 ? 0 : 0.08;
    const bProdPenalty = b.productionCorrect > 0 ? 0 : 0.08;
    return (a.accuracy - aProdPenalty) - (b.accuracy - bProdPenalty) ||
      b.attempted - a.attempted ||
      a.topicId.localeCompare(b.topicId);
  });

  const started = sortWeakest(allTopics.filter((item) => item.attempted > 0));
  let chosen = started[0] || null;

  if (!chosen) {
    const preferredSubject = YEAR8_MASTERY_SUBJECTS[seed % YEAR8_MASTERY_SUBJECTS.length];
    chosen = allTopics.find((item) => item.subject === preferredSubject) || allTopics[0] || null;
  }

  const subject = chosen?.subject || YEAR8_MASTERY_SUBJECTS[seed % YEAR8_MASTERY_SUBJECTS.length];
  const topicId = chosen?.topicId || null;
  const label = SUBJECT_LABELS[subject] || subject;
  const topicLabel = chosen?.topicLabel || null;

  const params = new URLSearchParams();
  params.set("daily", "1");
  params.set("locked", "1");
  params.set("year", "8");
  params.set("mode", "year8long");
  if (topicId) params.set("topic", topicId);

  return {
    subject,
    topicId,
    label,
    topicLabel,
    href: `/study/${subject}/practise?${params.toString()}`,
  };
}

function buildAdaptiveDaily(state) {
  const previous = new Map((state.daily || []).map((task) => [task.id, task]));
  const existingPlan = previous.get("study-session");
  const locked = existingPlan?.planDate === state.today && DAILY_SUBJECTS.includes(existingPlan.focusSubject) && (!existingPlan.focusTopic || topicMatchesYear(existingPlan.focusTopic, state.year)) && !(state.year === 9 && existingPlan.focusSubject === "french" && existingPlan.href === FRENCH_DAILY_HREF);
  const focus = locked
    ? { subject: existingPlan.focusSubject, topicId: existingPlan.focusTopic || null, skillId: existingPlan.focusSkill || null, skillLabel: existingPlan.focusSkillLabel || null, reason: existingPlan.focusReason || "continue", dueCount: existingPlan.focusDueCount || 0, accuracy: existingPlan.focusAccuracy, errorType: existingPlan.focusErrorType || null }
    : adaptiveFocus(state);
  const label = SUBJECT_LABELS[focus.subject] || "Study";
  const title = locked ? existingPlan.title : focus.reason === "due"
    ? focus.skillLabel ? `Retention check · ${focus.skillLabel}` : `Review due ${label}`
    : focus.reason === "weak" && focus.skillLabel
      ? `Strengthen ${focus.skillLabel}`
      : focus.reason === "weak" && focus.topicId
        ? `Strengthen ${topicTitle(state, focus.topicId, focus.subject)}`
        : `Continue ${label}`;
  const detail = locked ? existingPlan.detail : focus.reason === "due"
    ? `${focus.dueCount} review item${focus.dueCount === 1 ? "" : "s"} due · use spaced review.`
    : focus.reason === "weak"
      ? `${Math.round((focus.accuracy || 0) * 100)}% so far · build towards ≥85%${focus.errorType ? ` · main issue: ${errorLabel(focus.errorType)}` : ""}.`
      : `Ten focused questions in ${label}.`;

  const studyProgress = Math.min(10, Math.max(existingPlan?.progress || 0, state.questionsToday || 0));
  const oldFocusProgress = previous.get("adaptive-focus")?.progress || 0;
  const focusEvidence = focusAttemptsToday(state, focus);
  const focusProgress = Math.min(4, Math.max(oldFocusProgress, focusEvidence));
  const year8Review = year8ReviewPlan(state);
  const frenchVocab = vocabGateState(state, "french");
  const latinVocab = vocabGateState(state, "latin");
  const oldYear8Review = previous.get("year8-long-review") || {};
  const sameYear8Plan = oldYear8Review.planDate === state.today && oldYear8Review.reviewSubject === year8Review.subject && (oldYear8Review.reviewTopic || null) === (year8Review.topicId || null);
  const year8ReviewProgress = sameYear8Plan ? Math.min(15, oldYear8Review.progress || 0) : 0;
  const garden = previous.get("tend-garden") || { id: "tend-garden", title: "Water your plants", detail: "Tend the Scholar’s Garden.", href: "/garden", target: 1, progress: 0, xp: 10 };
  const game = previous.get("play-game") || { id: "play-game", title: "Play a quick game", detail: "One short learning game.", href: "/play", target: 1, progress: 0, xp: 10 };

  return [
    { id: "study-session", title, detail, href: focusHref(focus, state), target: 10, progress: studyProgress, xp: 10, planDate: state.today, focusSubject: focus.subject, focusTopic: focus.topicId, focusSkill: focus.skillId || null, focusSkillLabel: focus.skillLabel || null, focusReason: focus.reason, focusDueCount: focus.dueCount || 0, focusAccuracy: focus.accuracy, focusErrorType: focus.errorType || null },
    { id: "french-vocab", title: "French vocab check", detail: `5 different French words minimum · ${frenchVocab.correct}/4 correct · ${frenchVocab.attempts} tested${frenchVocab.passed ? " · passed" : frenchVocab.attempts >= 5 ? " · keep going until 4 are correct" : ""}.`, href: "/session/french-vocab", target: 5, progress: frenchVocab.progress, xp: 10, requiredAttempts: 5, requiredCorrect: 4, attempts: frenchVocab.attempts, correct: frenchVocab.correct, planDate: state.today },
    { id: "latin-vocab", title: "Latin vocab check", detail: `5 different Latin words minimum · ${latinVocab.correct}/4 correct · ${latinVocab.attempts} tested${latinVocab.passed ? " · passed" : latinVocab.attempts >= 5 ? " · keep going until 4 are correct" : ""}.`, href: "/session/latin-vocab", target: 5, progress: latinVocab.progress, xp: 10, requiredAttempts: 5, requiredCorrect: 4, attempts: latinVocab.attempts, correct: latinVocab.correct, planDate: state.today },
    { id: "adaptive-focus", title: focus.skillLabel ? `${focus.skillLabel} focus` : `${label} focus`, detail: "Four questions in today’s priority subject. Mastery needs ≥85% plus one independent typed or spelled answer.", href: focusHref(focus, state), target: 4, progress: focusProgress, xp: 10, planDate: state.today, focusSubject: focus.subject, focusTopic: focus.topicId, focusSkill: focus.skillId || null, focusSkillLabel: focus.skillLabel || null, focusReason: focus.reason },
    { id: "year8-long-review", title: year8Review.topicLabel ? `Year 8 ${year8Review.label} mastery · ${year8Review.topicLabel}` : `Year 8 ${year8Review.label} topic mastery`, detail: "15-question topic mastery review · Latin/French only · prioritises an unmastered or weaker Year 8 topic.", href: year8Review.href, target: 15, progress: year8ReviewProgress, xp: 20, planDate: state.today, reviewYear: 8, reviewSubject: year8Review.subject, reviewTopic: year8Review.topicId || null },
    { ...garden, progress: Math.min(garden.target || 1, garden.progress || 0) },
    { ...game, progress: Math.min(game.target || 1, game.progress || 0) },
  ];
}

let normalizing = false;
function normalizeState() {
  if (normalizing) return;
  const state = store.getState();
  const patch = {};

  const verified = verifiedLegacyPeDays(state);
  if (verified) {
    patch.peDays = verified;
    patch.peSessions = verified.length;
  } else {
    const peCount = Array.isArray(state.peDays) ? state.peDays.length : 0;
    if ((state.peSessions || 0) !== peCount) patch.peSessions = peCount;
  }

  const normalizedTopics = {};
  let topicsChanged = false;
  for (const [topicId, raw] of Object.entries(state.topicStats || {})) {
    const next = normalizeTopicStat(raw);
    normalizedTopics[topicId] = next;
    if (raw.masteryRule !== 1 || raw.state !== next.state || raw.accuracy !== next.accuracy || !Array.isArray(raw.productionIds)) topicsChanged = true;
  }
  if (topicsChanged) patch.topicStats = normalizedTopics;

  const normalizedSkills = {};
  let skillsChanged = false;
  for (const [skillId, raw] of Object.entries(state.skillStats || {})) {
    const next = normalizeSkillStat(raw);
    if (next.retentionReady && !next.retentionDue) {
      next.retentionStage = Math.max(1, next.retentionStage || 0);
      next.retentionDue = shiftDay(todayKey(), 14);
      skillsChanged = true;
    }
    normalizedSkills[skillId] = next;
    if (raw.accuracy !== next.accuracy || !Array.isArray(raw.recentOutcomes) || !raw.repairs || raw.retentionStage == null || raw.retentionReady == null || raw.needsPractice == null || raw.challengeLevel == null || raw.challengeStreak == null || raw.lastChallengeDepth == null) skillsChanged = true;
  }
  if (skillsChanged) patch.skillStats = normalizedSkills;

  const stateForDaily = { ...state, ...(patch.topicStats ? { topicStats: patch.topicStats } : {}) };
  const daily = buildAdaptiveDaily(stateForDaily);
  if (JSON.stringify(daily) !== JSON.stringify(state.daily || [])) patch.daily = daily;

  if (Object.keys(patch).length) {
    normalizing = true;
    store.setState(patch);
    normalizing = false;
  }
}

const initial = store.getState();
const originalHydrateDay = initial.hydrateDay;
const originalAward = initial.award;
const originalRecordPe = initial.recordPe;
const originalRecordGame = initial.recordGame;
const originalRecordAttempt = initial.recordAttempt;
const originalRecordSpelling = initial.recordSpelling;
const originalBumpDaily = initial.bumpDaily;

const STUDY_REWARD_XP = {
  daily_complete: 40,
  practice_first_correct: 4,
  practice_repeat_correct: 1,
  due_review_correct: 6,
  spelling_first: 8,
  spelling_repair: 2,
  vocab_review: 8,
  quiz_complete_80: 16,
  quiz_bonus_90: 8,
  writing_complete: 20,
  mastery_retention: 10,
};

function patchedAward(kind, options = {}) {
  if (options?.amount != null || !(kind in STUDY_REWARD_XP)) return originalAward(kind, options);

  const state = store.getState();
  const day = todayKey();
  const detail = String(options?.detail || kind);
  const dayLedger = { ...(state.rewardLedgerByDay?.[day] || {}) };
  const allLedger = { ...(state.rewardLedgerByDay || {}) };
  const base = STUDY_REWARD_XP[kind];

  // First-correct and genuinely due reviews are already constrained by question state.
  // Give them their designed base value rather than the core's lifetime event-count scaling.
  if (kind === "practice_first_correct" || kind === "due_review_correct") {
    return originalAward(kind, { ...options, amount: base });
  }

  // A writing task is a one-time learning reward, even if its text is edited later.
  if (kind === "writing_complete") {
    const rewarded = { ...(state.rewardedWriting || {}) };
    if (rewarded[detail]) return originalAward(kind, { ...options, amount: 0 });
    const result = originalAward(kind, { ...options, amount: base });
    rewarded[detail] = day;
    store.setState({ rewardedWriting: rewarded });
    return result;
  }

  // All remaining study/session rewards are capped by kind + detail within the local day.
  const key = `${kind}::${String(options?.subject || "")}::${detail}`;
  if (dayLedger[key]) return originalAward(kind, { ...options, amount: 0 });
  const result = originalAward(kind, { ...options, amount: base });
  dayLedger[key] = true;
  allLedger[day] = dayLedger;
  const days = Object.keys(allLedger).sort();
  while (days.length > 14) delete allLedger[days.shift()];
  store.setState({ rewardLedgerByDay: allLedger });
  return result;
}

function patchedHydrateDay(...args) {
  const result = originalHydrateDay(...args);
  normalizeState();
  return result;
}

function patchedRecordPe(points, stars, level) {
  const before = store.getState();
  const day = todayKey();
  const rewards = { ...(before.peRewardByDay || {}) };
  const previousReward = Math.max(0, Number(rewards[day]) || 0);
  const targetReward = stars >= 2 ? 8 : stars === 1 ? 4 : 0;
  const hadRealDay = Array.isArray(before.peDays) && before.peDays.includes(day);

  // On a repeat attempt, make core see today as already rewarded so it cannot pay again.
  let insertedTemporaryDay = false;
  if (previousReward > 0 && !hadRealDay) {
    store.setState({ peDays: [...(before.peDays || []), day] });
    insertedTemporaryDay = true;
  }

  const result = originalRecordPe(points, stars, level);
  const after = store.getState();
  let peDays = [...new Set(after.peDays || [])];

  if (stars >= 2) {
    if (!peDays.includes(day)) peDays.push(day);
  } else if (insertedTemporaryDay && !hadRealDay) {
    peDays = peDays.filter((value) => value !== day);
  }

  // If a 1-star attempt earned 4 earlier and the learner later reaches 2 stars,
  // award only the 4-XP difference so PE can never exceed 8 XP in one day.
  const topUp = Math.max(0, targetReward - previousReward);
  if (previousReward > 0 && topUp > 0) {
    originalAward("pe_complete", { detail: "PE circuit upgrade", amount: topUp });
  }

  rewards[day] = Math.max(previousReward, targetReward);
  const rewardDays = Object.keys(rewards).sort();
  while (rewardDays.length > 30) delete rewards[rewardDays.shift()];

  store.setState({
    peDays,
    peSessions: peDays.length,
    peRewardByDay: rewards,
  });
  return result;
}

function recordGamePractice(gameId, conceptKey, correct, options = {}) {
  if (!gameId || !conceptKey) return;
  const state = store.getState();
  const all = { ...(state.gamePractice || {}) };
  const game = { ...(all[gameId] || {}) };
  const concepts = { ...(game.concepts || {}) };
  const key = String(conceptKey).slice(0, 120);
  const previous = concepts[key] || { attempts: 0, correct: 0, errors: 0, repairs: 0, repairCorrect: 0, recoveryCorrect: 0, streak: 0 };
  const repair = !!options.repair;
  const unresolvedBefore = Math.max(0, (previous.errors || 0) - (previous.repairCorrect || 0) - (previous.recoveryCorrect || 0));
  const recoveryCredit = !repair && correct && (previous.streak || 0) >= 1 && unresolvedBefore > 0 ? 1 : 0;
  const next = {
    ...previous,
    label: String(options.label || previous.label || key).slice(0, 120),
    attempts: (previous.attempts || 0) + (repair ? 0 : 1),
    correct: (previous.correct || 0) + (!repair && correct ? 1 : 0),
    errors: (previous.errors || 0) + (!repair && !correct ? 1 : 0),
    repairs: (previous.repairs || 0) + (repair ? 1 : 0),
    repairCorrect: (previous.repairCorrect || 0) + (repair && correct ? 1 : 0),
    recoveryCorrect: (previous.recoveryCorrect || 0) + recoveryCredit,
    streak: correct ? Math.min(12, (previous.streak || 0) + 1) : 0,
    lastSeen: todayKey(),
    lastError: !correct ? todayKey() : previous.lastError || null,
    itemKey: String(options.itemKey || previous.itemKey || "").slice(0, 120),
  };
  concepts[key] = next;

  const conceptEntries = Object.entries(concepts);
  if (conceptEntries.length > 80) {
    conceptEntries
      .sort((a, b) => String(b[1]?.lastSeen || "").localeCompare(String(a[1]?.lastSeen || "")))
      .slice(80)
      .forEach(([oldKey]) => delete concepts[oldKey]);
  }

  const recent = [...(game.recent || []), {
    concept: key,
    correct: !!correct,
    repair,
    at: new Date().toISOString(),
  }].slice(-60);

  all[gameId] = { concepts, recent };
  store.setState({ gamePractice: all });
}

function patchedRecordGame(gameId, points, stars, level) {
  const before = store.getState();
  const day = todayKey();
  const beforeCount = before.gameRewardByDay?.[day]?.[gameId] || 0;
  const beforeQualifying = before.qualifyingGamePlays || 0;
  const qualifyingByDay = { ...(before.qualifyingGameByDay || {}) };
  const dayQualifying = { ...(qualifyingByDay[day] || {}) };
  const alreadyQualifiedToday = !!dayQualifying[gameId];

  const result = originalRecordGame(gameId, points, stars, level);
  const after = store.getState();
  const patch = {};

  if (stars <= 0) {
    const ledger = { ...(after.gameRewardByDay || {}) };
    const dayLedger = { ...(ledger[day] || {}) };
    if ((dayLedger[gameId] || 0) !== beforeCount) {
      if (beforeCount > 0) dayLedger[gameId] = beforeCount;
      else delete dayLedger[gameId];
      ledger[day] = dayLedger;
      patch.gameRewardByDay = ledger;
    }
  }

  if (stars >= 2) {
    const increment = alreadyQualifiedToday ? 0 : 1;
    dayQualifying[gameId] = true;
    qualifyingByDay[day] = dayQualifying;
    patch.qualifyingGameByDay = qualifyingByDay;
    patch.qualifyingGamePlays = beforeQualifying + increment;
  } else if ((after.qualifyingGamePlays || 0) !== beforeQualifying) {
    patch.qualifyingGamePlays = beforeQualifying;
  }

  if (Object.keys(patch).length) store.setState(patch);
  return result;
}

function applyFormalSkillAttempt(skillStats, skills, questionId, correct, production, isRepair, errorType, topicId, cognitiveDepth = 2) {
  const next = { ...(skillStats || {}) };
  const day = todayKey();
  for (const rawSkill of skills || []) {
    const skill = canonicalSkill(rawSkill);
    if (!skill) continue;
    const current = normalizeSkillStat(next[skill] || {});
    const attempted = current.attempted + (isRepair ? 0 : 1);
    const correctCount = current.correct + (!isRepair && correct ? 1 : 0);
    const productionIds = Array.isArray(current.productionIds) ? [...current.productionIds] : [];
    if (!isRepair && production && correct && questionId && !productionIds.includes(questionId)) productionIds.push(questionId);
    const productionCorrect = productionIds.length;
    const repairs = {
      attempted: (current.repairs?.attempted || 0) + (isRepair ? 1 : 0),
      correct: (current.repairs?.correct || 0) + (isRepair && correct ? 1 : 0),
    };
    const depth = Math.max(1, Math.min(4, Number(cognitiveDepth) || 2));
    const recentOutcomes = isRepair
      ? [...(current.recentOutcomes || [])]
      : [...(current.recentOutcomes || []), { date: day, correct: !!correct, depth }].slice(-20);
    const accuracy = attempted ? correctCount / attempted : 0;
    let challengeLevel = current.challengeLevel || 2;
    let challengeStreak = current.challengeStreak || 0;
    if (!isRepair) {
      if (correct) {
        challengeStreak = depth >= challengeLevel ? challengeStreak + 1 : Math.max(0, challengeStreak - 1);
        if (challengeStreak >= 2 && accuracy >= SECURE_ACCURACY && depth >= challengeLevel) {
          challengeLevel = Math.min(4, challengeLevel + 1);
          challengeStreak = 0;
        }
      } else {
        const retentionMiss = !!current.retentionDue && current.retentionDue <= day;
        if (depth >= challengeLevel || retentionMiss) challengeLevel = Math.max(1, challengeLevel - 1);
        challengeStreak = 0;
      }
    }
    const wasDue = !isRepair && !!current.retentionDue && current.retentionDue <= day;
    let retentionStage = current.retentionStage || 0;
    let retentionDue = current.retentionDue || null;
    let retentionFailed = current.retentionFailed || false;
    let retentionPasses = current.retentionPasses || 0;
    let retentionFailures = current.retentionFailures || 0;
    let recoveryStreak = current.recoveryStreak || 0;

    if (!isRepair && wasDue) {
      if (correct) {
        retentionStage = Math.min(3, Math.max(1, retentionStage) + 1);
        retentionDue = shiftDay(day, retentionStage >= 3 ? 60 : 30);
        retentionFailed = false;
        retentionPasses += 1;
        recoveryStreak = 0;
      } else {
        retentionStage = 0;
        retentionDue = shiftDay(day, 2);
        retentionFailed = true;
        retentionFailures += 1;
        recoveryStreak = 0;
      }
    } else if (!isRepair && retentionFailed) {
      recoveryStreak = correct ? recoveryStreak + 1 : 0;
      if (recoveryStreak >= 2 && accuracy >= SECURE_ACCURACY) {
        retentionFailed = false;
        retentionStage = 1;
        retentionDue = shiftDay(day, 14);
        recoveryStreak = 0;
      }
    }

    const qualifiesForRetention = attempted >= 3 && accuracy >= MASTERY_ACCURACY && productionCorrect > 0 && !retentionFailed;
    if (!isRepair && !wasDue && qualifiesForRetention && !retentionDue) {
      retentionStage = Math.max(1, retentionStage);
      retentionDue = shiftDay(day, 14);
    }
    const retentionReady = qualifiesForRetention;
    const needsPractice = retentionFailed || (attempted >= 2 && accuracy < SECURE_ACCURACY);

    next[skill] = {
      ...current,
      attempted,
      correct: correctCount,
      accuracy,
      productionAttempted: current.productionAttempted + (!isRepair && production ? 1 : 0),
      productionCorrect,
      productionIds: productionIds.slice(-20),
      repairs,
      recentOutcomes,
      lastErrorType: !correct && !isRepair ? (errorType || current.lastErrorType || null) : current.lastErrorType || null,
      lastTopicId: topicId || current.lastTopicId || null,
      lastAttempt: day,
      retentionStage,
      retentionDue,
      retentionReady,
      retentionFailed,
      retentionPasses,
      retentionFailures,
      recoveryStreak,
      needsPractice,
      challengeLevel,
      challengeStreak,
      lastChallengeDepth: isRepair ? current.lastChallengeDepth || 0 : depth,
    };
  }
  return next;
}

function appendLearningEvents(existing, beforeSkills, afterSkills, skills, context = {}) {
  const rows = Array.isArray(existing) ? [...existing] : [];
  const now = new Date().toISOString();
  const day = todayKey();
  const push = (event) => {
    const row = { at: now, day, ...event };
    const duplicate = rows.some((old) =>
      old.day === row.day &&
      old.skillId === row.skillId &&
      old.type === row.type &&
      old.questionId === row.questionId
    );
    if (!duplicate) rows.unshift(row);
  };
  for (const rawSkill of skills || []) {
    const skillId = canonicalSkill(rawSkill);
    if (!skillId) continue;
    const before = normalizeSkillStat(beforeSkills?.[skillId] || {});
    const after = normalizeSkillStat(afterSkills?.[skillId] || {});
    const common = {
      skillId,
      subject: context.subject || skillId.split(":")[0],
      year: Number(context.year || store.getState().year || 9),
      topicId: context.topicId || after.lastTopicId || before.lastTopicId || null,
      questionId: context.questionId || null,
    };
    if (after.challengeLevel > before.challengeLevel) {
      push({ ...common, type: "challenge-up", fromLevel: before.challengeLevel, toLevel: after.challengeLevel });
    } else if (after.challengeLevel < before.challengeLevel) {
      push({ ...common, type: "challenge-down", fromLevel: before.challengeLevel, toLevel: after.challengeLevel });
    }
    if (!before.retentionFailed && after.retentionFailed) {
      push({ ...common, type: "retention-failed", fromLevel: before.challengeLevel, toLevel: after.challengeLevel });
    } else if (before.retentionFailed && !after.retentionFailed) {
      push({ ...common, type: "retention-recovered", fromLevel: before.challengeLevel, toLevel: after.challengeLevel });
    }
    if ((after.retentionPasses || 0) > (before.retentionPasses || 0)) {
      push({ ...common, type: "retention-passed", fromLevel: before.challengeLevel, toLevel: after.challengeLevel });
    }
    if (context.isRepair && context.correct) {
      push({ ...common, type: "repair-secured", fromLevel: before.challengeLevel, toLevel: after.challengeLevel });
    }
  }
  return rows.slice(0, 80);
}

const TOPIC_MASTERY_XP = 50;

function emitMasteryReward(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("scholar:mastery-earned", { detail }));
}

function awardFirstTopicMastery(topicId, subject, title, previousState, nextState) {
  if (!topicId || nextState !== "mastered" || previousState === "mastered") return null;
  const state = store.getState();
  const stat = state.topicStats?.[topicId] || {};
  if (stat.masteryRewardedAt) return null;

  const reward = originalAward("topic_mastered", {
    subject,
    detail: `Mastery · ${title || topicId}`,
    amount: TOPIC_MASTERY_XP,
  });
  const latest = store.getState();
  const latestStat = latest.topicStats?.[topicId] || stat;
  store.setState({
    topicStats: {
      ...(latest.topicStats || {}),
      [topicId]: {
        ...latestStat,
        masteryRewardedAt: todayKey(),
        masteryRewardXp: TOPIC_MASTERY_XP,
      },
    },
  });
  emitMasteryReward({
    kind: "mastery",
    topicId,
    subject,
    title: title || topicId,
    xp: reward?.awarded ?? TOPIC_MASTERY_XP,
    unlocked: reward?.unlocked || [],
  });
  return reward;
}

function awardMasteryRetention(topicId, subject, title) {
  const reward = patchedAward("mastery_retention", {
    subject,
    detail: `Mastery retention · ${topicId}`,
  });
  if ((reward?.awarded || 0) > 0) {
    emitMasteryReward({
      kind: "retention",
      topicId,
      subject,
      title: title || topicId,
      xp: reward.awarded,
      unlocked: reward?.unlocked || [],
    });
  }
  return reward;
}

function patchedRecordAttempt(questionId, correct, subject, meta = {}) {
  const before = store.getState();
  const dueBefore = !!before.reviews?.[questionId]?.due && before.reviews[questionId].due <= todayKey();
  const resolved = inferAttemptMeta(questionId, subject, meta || {});
  const production = isIndependentProduction(resolved);

  // Keep core XP/review scheduling, but stop its old streak-only topic mastery from running.
  const coreMeta = { ...meta, topicId: undefined };
  const result = originalRecordAttempt(questionId, correct, subject, coreMeta);
  const after = store.getState();

  if (meta?.formal === false) {
    const reviews = { ...(after.reviews || {}) };
    delete reviews[questionId];
    const recentQuestionIds = [...(after.recentQuestionIds || []).filter((id) => id !== questionId), questionId].slice(-20);
    store.setState({ reviews, recentQuestionIds, lastSubject: resolved.subject || subject });
    return result;
  }
  if (!resolved.topicId) return result;
  const current = normalizeTopicStat(before.topicStats?.[resolved.topicId] || {});
  const isRepair = !!meta?.repair;
  const attempted = current.attempted + (isRepair ? 0 : 1);
  const correctCount = current.correct + (!isRepair && correct ? 1 : 0);
  const productionIds = [...(current.productionIds || [])];
  if (!isRepair && production && correct && !productionIds.includes(questionId)) productionIds.push(questionId);
  const productionCorrect = productionIds.length;
  const errorKind = meta?.errorKind && meta.errorKind !== "none" ? meta.errorKind : null;
  const errorType = !correct && !isRepair ? diagnoseError(resolved.subject, resolved.topicId, errorKind, meta?.format, resolved.topicTitle || meta?.topicTitle) : null;
  const errors = { ...(current.errors || {}) };
  const errorTypes = { ...(current.errorTypes || {}) };
  if (errorKind && !isRepair) errors[errorKind] = (errors[errorKind] || 0) + 1;
  if (errorType) errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
  const review = after.reviews?.[questionId];
  const accuracy = attempted ? correctCount / attempted : 0;
  const repairs = { attempted: (current.repairs?.attempted || 0) + (isRepair ? 1 : 0), correct: (current.repairs?.correct || 0) + (isRepair && correct ? 1 : 0) };
  const nextState = topicState(attempted, correctCount, productionCorrect);
  const recentOutcomes = isRepair
    ? [...(current.recentOutcomes || [])]
    : [...(current.recentOutcomes || []), { date: todayKey(), correct: !!correct }].slice(-20);
  const nextTopic = {
    ...current,
    attempted,
    correct: correctCount,
    accuracy,
    productionAttempted: current.productionAttempted + (!isRepair && production ? 1 : 0),
    productionCorrect,
    productionIds: productionIds.slice(-20),
    state: nextState,
    due: review?.due || current.due,
    errors,
    errorTypes,
    lastErrorType: errorType || current.lastErrorType || null,
    repairs,
    recentOutcomes,
    masteredAt: nextState === "mastered" ? (current.state === "mastered" && current.masteredAt ? current.masteredAt : todayKey()) : current.masteredAt || null,
    masteryRule: 1,
    lastAttempt: todayKey(),
  };
  const reviews = { ...(after.reviews || {}) };
  if (review) reviews[questionId] = { ...review, subject: resolved.subject, topicId: resolved.topicId, skills: resolved.skills || [], production: !!production, repair: isRepair, errorType: errorType || review.errorType || null };
  // A wrong formal answer must never become due again on the same day.
  // Treat the first miss as stage 1: retry after 2 days; a later success then moves to 7 days.
  if (!correct && !isRepair && reviews[questionId]) {
    const day = todayKey();
    reviews[questionId] = { ...reviews[questionId], stage: 1, streak: 1, due: shiftDay(day, 2), last: day, retriedToday: day };
  }
  if (isRepair && meta?.repairOf && reviews[meta.repairOf]) {
    const original = reviews[meta.repairOf];
    const day = todayKey();
    reviews[meta.repairOf] = {
      ...original,
      stage: Math.max(1, original.stage || 0),
      streak: Math.max(1, original.streak || 0),
      due: shiftDay(day, 2),
      last: day,
      retriedToday: day,
      repairedBy: questionId,
      repairCorrect: !!correct,
    };
  }
  if (isRepair && meta?.repairOf && questionId !== meta.repairOf) delete reviews[questionId];
  const recentQuestionIds = [...(after.recentQuestionIds || []).filter((id) => id !== questionId), questionId].slice(-20);
  const skillStats = applyFormalSkillAttempt(
    after.skillStats || {},
    resolved.skills || [],
    questionId,
    correct,
    production,
    isRepair,
    errorType,
    resolved.topicId,
    meta?.cognitiveDepth || 2
  );
  const learningEvents = appendLearningEvents(
    after.learningEvents || [],
    after.skillStats || {},
    skillStats,
    resolved.skills || [],
    {
      subject: resolved.subject || subject,
      year: meta?.yearOverride || after.year || before.year || 9,
      topicId: resolved.topicId,
      questionId,
      isRepair,
      correct,
    }
  );
  store.setState({
    topicStats: { ...(after.topicStats || {}), [resolved.topicId]: { ...nextTopic, due: reviews[meta?.repairOf || questionId]?.due || nextTopic.due } },
    skillStats,
    learningEvents,
    reviews,
    recentQuestionIds,
    lastTopic: resolved.topicId,
    lastSubject: resolved.subject || subject,
  });

  const masteryTitle = resolved.topicTitle || meta?.topicTitle || topicTitle({ ...store.getState(), year: meta?.yearOverride || store.getState().year }, resolved.topicId, resolved.subject || subject);
  if (!isRepair && nextState === "mastered" && current.state !== "mastered") {
    awardFirstTopicMastery(resolved.topicId, resolved.subject || subject, masteryTitle, current.state, nextState);
  } else if (!isRepair && correct && current.state === "mastered" && dueBefore) {
    awardMasteryRetention(resolved.topicId, resolved.subject || subject, masteryTitle);
  }

  const focus = store.getState().daily?.find((task) => task.id === "adaptive-focus");
  if (!isRepair && !meta?.excludeGeneralDaily && focus && focus.focusSubject === (resolved.subject || subject)) originalBumpDaily("adaptive-focus", 1);
  normalizeState();
  return result;
}

function recordDailyVocabAttempt(subject, questionId, correct) {
  if (!["french", "latin"].includes(subject) || !questionId) return;
  const state = store.getState();
  const day = todayKey();
  const all = { ...(state.dailyVocabByDay || {}) };
  const dayRow = { ...(all[day] || {}) };
  const current = dayRow[subject] || {};
  const items = { ...(current.items || {}) };
  items[String(questionId)] = !!correct || !!items[String(questionId)];
  dayRow[subject] = { items, updatedAt: new Date().toISOString() };
  all[day] = dayRow;
  const days = Object.keys(all).sort();
  while (days.length > 30) delete all[days.shift()];
  store.setState({ dailyVocabByDay: all });
  normalizeState();
  originalBumpDaily(subject === "french" ? "french-vocab" : "latin-vocab", 0);
}

function patchedRecordSpelling(questionId, correct) {
  const before = store.getState();
  const previous = before.spellingDue?.[questionId] || null;
  const result = originalRecordSpelling(questionId, correct);
  const after = store.getState();
  const day = todayKey();
  const spellingDue = { ...(after.spellingDue || {}) };

  if (!correct) {
    spellingDue[questionId] = { due: shiftDay(day, 2), stage: 1, wrong: true, last: day };
  } else if (previous) {
    const stage = Math.max(1, Number(previous.stage) || 1);
    spellingDue[questionId] = {
      due: shiftDay(day, stage >= 2 ? 30 : 7),
      stage: stage >= 2 ? 3 : 2,
      wrong: false,
      last: day,
    };
  }
  store.setState({ spellingDue });

  if (!correct) return result;
  const known = QUESTION_META.get(questionId);
  if (!known?.topicId) return result;
  const current = normalizeTopicStat(store.getState().topicStats?.[known.topicId] || {});
  const productionIds = current.productionIds.includes(questionId) ? current.productionIds : [...current.productionIds, questionId].slice(-20);
  const productionCorrect = productionIds.length;
  const next = {
    ...current,
    productionCorrect,
    productionIds,
    state: topicState(current.attempted, current.correct, productionCorrect),
    masteryRule: 1,
    lastProduction: day,
  };
  store.setState({ topicStats: { ...(store.getState().topicStats || {}), [known.topicId]: next } });
  if (next.state === "mastered" && current.state !== "mastered") {
    const masteryTitle = known.topicTitle || topicTitle(store.getState(), known.topicId, known.subject || "french");
    awardFirstTopicMastery(known.topicId, known.subject || "french", masteryTitle, current.state, next.state);
  }
  normalizeState();
  return result;
}

store.setState({
  award: patchedAward,
  hydrateDay: patchedHydrateDay,
  recordPe: patchedRecordPe,
  recordGame: patchedRecordGame,
  recordGamePractice,
  recordAttempt: patchedRecordAttempt,
  recordSpelling: patchedRecordSpelling,
  recordDailyVocabAttempt,
});

function aiHelpActionLabel(action) {
  return ({
    why_correct: "Why correct",
    simpler: "Simpler explanation",
    similar_example: "Similar example",
    chinese: "中文解釋",
    where_wrong: "Where went wrong",
    explain_rule: "Explain rule",
  })[action] || String(action || "AI help").replace(/_/g, " ");
}

function recordAiHelpUsage(detail = {}) {
  const subject = SUBJECTS.includes(detail.subject) ? detail.subject : null;
  if (!subject) return;
  const state = store.getState();
  const day = todayKey();
  const year = Number(detail.year || state.year || 9);
  const scope = `${subject}:y${year}`;
  const questionKey = String(detail.questionId || detail.topicId || "unknown");
  const action = String(detail.action || "help");
  const ledgerKey = `${scope}::${questionKey}::${action}`;

  const ledgers = { ...(state.aiHelpLedgerByDay || {}) };
  const dayLedger = { ...(ledgers[day] || {}) };
  if (dayLedger[ledgerKey]) return;
  dayLedger[ledgerKey] = true;
  ledgers[day] = dayLedger;

  const byDay = { ...(state.aiHelpByDay || {}) };
  const rawDay = byDay[day] || {};
  const scopes = { ...(rawDay.scopes || {}) };
  const rawScope = scopes[scope] || {};
  const actions = { ...(rawScope.actions || {}) };
  const topics = { ...(rawScope.topics || {}) };
  actions[action] = (actions[action] || 0) + 1;
  if (detail.topicId) topics[detail.topicId] = (topics[detail.topicId] || 0) + 1;
  scopes[scope] = { total: (rawScope.total || 0) + 1, actions, topics };
  byDay[day] = { ...rawDay, scopes };

  for (const key of Object.keys(ledgers).sort().slice(0, Math.max(0, Object.keys(ledgers).length - 30))) delete ledgers[key];
  for (const key of Object.keys(byDay).sort().slice(0, Math.max(0, Object.keys(byDay).length - 90))) delete byDay[key];

  store.setState({ aiHelpByDay: byDay, aiHelpLedgerByDay: ledgers });
}

function applyPracticeModeFromUrl() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (!/^\/study\/[^/]+\/practise\/?$/.test(window.location.pathname)) return;
  const mode = new URL(window.location.href).searchParams.get("mode");
  if (mode !== "due" && mode !== "weak" && mode !== "exam") return;
  const key = `${window.location.pathname}${window.location.search}`;
  if (applyPracticeModeFromUrl.lastKey === key) return;
  const wanted = mode === "due" ? "Due Review" : mode === "weak" ? "Weakness Review" : "Exam Mix 15";
  const button = [...document.querySelectorAll("main button")].find((node) => node.textContent?.includes(wanted));
  if (!button) return;
  applyPracticeModeFromUrl.lastKey = key;
  button.click();
}
applyPracticeModeFromUrl.lastKey = "";

normalizeState();
store.subscribe(() => normalizeState());
store.persist?.onFinishHydration?.(() => normalizeState());

if (typeof document !== "undefined") {
  if (!window.__SCHOLAR_AI_USAGE_LISTENER__) {
    window.__SCHOLAR_AI_USAGE_LISTENER__ = true;
    window.addEventListener("scholar:ai-help-used", (event) => recordAiHelpUsage(event.detail || {}));
  }
  queueMicrotask(applyPracticeModeFromUrl);
  new MutationObserver(applyPracticeModeFromUrl).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", () => {
    applyPracticeModeFromUrl.lastKey = "";
    applyPracticeModeFromUrl();
  });
}


function subjectForTopic(topicId) {
  return inferSubjectFromTopic(topicId);
}

function daysAgoKey(days) {
  return shiftDay(todayKey(), -days);
}

function calendarWeekStart() {
  const d = new Date();
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function improvementDelta(stat) {
  const outcomes = Array.isArray(stat?.recentOutcomes) ? stat.recentOutcomes.slice(-10) : [];
  if (outcomes.length < 6) return null;
  const split = Math.max(3, Math.floor(outcomes.length / 2));
  const prior = outcomes.slice(0, split);
  const recent = outcomes.slice(split);
  if (prior.length < 3 || recent.length < 3) return null;
  const mean = (items) => items.reduce((sum, item) => sum + (item.correct ? 1 : 0), 0) / items.length;
  return mean(recent) - mean(prior);
}

function minCorrectToMaster(attempted, correct) {
  if (attempted >= MASTERY_MIN_ATTEMPTS && attempted > 0 && correct / attempted >= MASTERY_ACCURACY) return 0;
  let n = 0;
  while (n < 50 && (attempted + n < MASTERY_MIN_ATTEMPTS || (correct + n) / Math.max(1, attempted + n) < MASTERY_ACCURACY)) n += 1;
  return n;
}

function progressNextAction(row) {
  if (row.dueCount > 0) return `Complete ${row.dueCount} due review${row.dueCount === 1 ? "" : "s"}.`;
  if (row.state === "mastered") return "Keep it fresh with occasional retrieval.";
  if (row.attempted === 0) return "Start with the core questions.";
  if (row.accuracy < MASTERY_ACCURACY || row.attempted < MASTERY_MIN_ATTEMPTS) {
    const more = minCorrectToMaster(row.attempted, row.correct);
    return more > 0 ? `Aim for ${more} more correct recall${more === 1 ? "" : "s"} without new errors.` : "Build accuracy to at least 85%.";
  }
  if (row.productionCorrect < 1) return "Add one independent typed or spelled answer.";
  return "One more strong retrieval session.";
}

function skillLabel(skillId) {
  const parts = String(skillId || "").split(":");
  const subject = parts.shift() || "";
  const nice = (value) => String(value || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (subject === "latin" && parts[0] === "case" && parts[1]) return `${nice(parts[1])} case`;
  if (subject === "latin" && parts[0] === "tense" && parts[1]) return `${nice(parts[1])} tense`;
  if (subject === "latin" && parts[0] === "person" && parts[1]) return nice(parts[1]);
  if (subject === "latin" && parts[0] === "ending" && parts[1]) return `${parts[1]} ending`;
  if (subject === "chemistry" && parts[0] === "periodic-table" && parts[1]) return `${nice(parts[1])} · Periodic table`;
  return parts.map(nice).join(" · ") || nice(skillId);
}

function gamePracticeEvidence(state, skillId) {
  const result = { attempts: 0, correct: 0, errors: 0, repairs: 0, repairCorrect: 0, recoveryCorrect: 0, games: [] };
  for (const [gameId, game] of Object.entries(state.gamePractice || {})) {
    const row = game?.concepts?.[skillId];
    if (!row) continue;
    result.attempts += Number(row.attempts) || 0;
    result.correct += Number(row.correct) || 0;
    result.errors += Number(row.errors) || 0;
    result.repairs += Number(row.repairs) || 0;
    result.repairCorrect += Number(row.repairCorrect) || 0;
    result.recoveryCorrect += Number(row.recoveryCorrect) || 0;
    result.games.push(gameId);
  }
  return result;
}

function skillGameSuggestion(skillId, subject) {
  if (subject === "latin") {
    if (/^latin:(case|cases|preposition|grammar-evidence|place-where|movement-to)/.test(skillId)) return { label: "Manuscript Mystery", href: "/play/manuscript" };
    if (/^latin:(syntax|translation|agreement)/.test(skillId)) return { label: "Sentence Mosaic", href: "/play/sentence-mosaic" };
    if (/^latin:(tense|person|conjugation|ending|verb|vocabulary:verb)/.test(skillId)) return { label: "Forma Forge", href: "/play/forma-forge" };
  }
  if (subject === "biology") return { label: "Biology Match", href: "/play/organelle-match" };
  if (subject === "chemistry") return { label: "Chemistry Match", href: "/play/element-match" };
  if (subject === "physics") return { label: "Physics Match", href: "/play/force-match" };
  if (subject === "english") return { label: "English Match", href: "/play/word-match" };
  return { label: `${SUBJECT_LABELS[subject] || "Subject"} games`, href: `/study/${subject}/play` };
}

function buildProgressDashboard(state, subject, year = state?.year) {
  const catalog = (() => {
    try { return getTopicCatalog(subject, year) || []; } catch { return []; }
  })();
  const today = todayKey();
  const weekStart = calendarWeekStart();
  const topicIds = new Set(catalog.map((topic) => topic.topicId));
  const titleMap = new Map(catalog.map((topic) => [topic.topicId, topic.title]));
  const assessmentIds = new Set(catalog.filter((topic) => topic.unitId === "french-y9-assessment").map((topic) => topic.topicId));

  // Keep formal progress scoped to the selected school year. Only fall back to stored
  // subject topics when a subject has no year-specific catalogue at all.
  if (!catalog.length) {
    for (const topicId of Object.keys(state.topicStats || {})) {
      if (subjectForTopic(topicId) !== subject) continue;
      const explicitYear = String(topicId).match(/-y(\d+)-/i)?.[1];
      if (!explicitYear || Number(explicitYear) === Number(year)) topicIds.add(topicId);
    }
  }

  const reviewByTopic = new Map();
  let dueReviews = 0;
  for (const [questionId, review] of Object.entries(state.reviews || {})) {
    const reviewSubject = inferReviewSubject(questionId, review);
    if (reviewSubject !== subject) continue;
    const topicId = review.topicId || QUESTION_META.get(questionId)?.topicId || null;
    if (!topicId || !topicIds.has(topicId)) continue;
    if (review.due && review.due <= today) dueReviews += 1;
    const entry = reviewByTopic.get(topicId) || { dueCount: 0, nextDue: null };
    if (review.due) {
      if (!entry.nextDue || review.due < entry.nextDue) entry.nextDue = review.due;
      if (review.due <= today) entry.dueCount += 1;
    }
    reviewByTopic.set(topicId, entry);
  }

  const topics = [...topicIds].map((topicId) => {
    const stat = normalizeTopicStat(state.topicStats?.[topicId] || {});
    const review = reviewByTopic.get(topicId) || { dueCount: 0, nextDue: null };
    const errorType = dominantError(stat);
    const improvement = improvementDelta(stat);
    const row = {
      topicId,
      title: titleMap.get(topicId) || topicTitle(state, topicId, subject),
      state: stat.state,
      attempted: stat.attempted,
      correct: stat.correct,
      accuracy: stat.attempted ? stat.correct / stat.attempted : 0,
      productionAttempted: stat.productionAttempted || 0,
      productionCorrect: stat.productionCorrect || 0,
      productionOk: (stat.productionCorrect || 0) > 0,
      dueCount: review.dueCount,
      nextDue: review.nextDue,
      errorType,
      errorCount: errorType ? (stat.errorTypes?.[errorType] || 0) : 0,
      improvement,
      masteredAt: stat.masteredAt || null,
      lastAttempt: stat.lastAttempt || null,
      repairs: stat.repairs || { attempted: 0, correct: 0 },
    };
    row.nextAction = progressNextAction(row);
    return row;
  });

  const skillRows = Object.entries(state.skillStats || {})
    .filter(([skillId, raw]) => skillId.startsWith(`${subject}:`) && (Number(raw?.attempted) || 0) > 0)
    .map(([skillId, raw]) => {
      const stat = normalizeSkillStat(raw);
      const dueNow = !!stat.retentionDue && stat.retentionDue <= today;
      const game = gamePracticeEvidence(state, skillId);
      const gameSuggestion = skillGameSuggestion(skillId, subject);
      const status = stat.retentionFailed || stat.needsPractice
        ? "needs-practice"
        : dueNow
          ? "retention-due"
          : stat.retentionReady
            ? "retention-ready"
            : "building";
      const nextAction = status === "needs-practice"
        ? `Repair ${skillLabel(skillId)} in formal Practice.`
        : status === "retention-due"
          ? `Retention check due now for ${skillLabel(skillId)}.`
          : status === "retention-ready"
            ? `Keep it fresh · next formal retention check ${stat.retentionDue || "will be scheduled"}.`
            : `Build more formal evidence for ${skillLabel(skillId)}.`;
      return {
        skillId,
        label: skillLabel(skillId),
        attempted: stat.attempted,
        correct: stat.correct,
        accuracy: stat.accuracy,
        productionCorrect: stat.productionCorrect,
        challengeLevel: stat.challengeLevel || 2,
        challengeStreak: stat.challengeStreak || 0,
        lastChallengeDepth: stat.lastChallengeDepth || 0,
        targetDepth: adaptiveSkillTargetDepth(stat),
        needsPractice: !!stat.needsPractice,
        retentionReady: !!stat.retentionReady,
        retentionFailed: !!stat.retentionFailed,
        retentionDue: stat.retentionDue,
        retentionStage: stat.retentionStage || 0,
        dueNow,
        status,
        lastErrorType: stat.lastErrorType || null,
        lastTopicId: stat.lastTopicId || null,
        game,
        gameSuggestion,
        nextAction,
      };
    })
    .filter((row) => !row.lastTopicId || topicMatchesYear(row.lastTopicId, year))
    .sort((a, b) => {
      const priority = { "needs-practice": 0, "retention-due": 1, building: 2, "retention-ready": 3 };
      return (priority[a.status] ?? 4) - (priority[b.status] ?? 4) || a.accuracy - b.accuracy || b.attempted - a.attempted || a.label.localeCompare(b.label);
    });
  const skillWeakCount = skillRows.filter((row) => row.status === "needs-practice").length;
  const skillRetentionDue = skillRows.filter((row) => row.status === "retention-due").length;
  const skillRetentionReady = skillRows.filter((row) => row.status === "retention-ready").length;
  const nextSkill = skillRows.find((row) => row.retentionFailed)
    || skillRows.find((row) => row.status === "retention-due")
    || skillRows.find((row) => row.status === "needs-practice")
    || skillRows.find((row) => row.status === "building")
    || skillRows.find((row) => row.status === "retention-ready")
    || null;
  const nextBestAction = nextSkill ? {
    type: nextSkill.status,
    title: nextSkill.status === "retention-due"
      ? `Check retention: ${nextSkill.label}`
      : nextSkill.status === "needs-practice"
        ? `Repair ${nextSkill.label}`
        : nextSkill.status === "building"
          ? `Build evidence: ${nextSkill.label}`
          : `Keep ${nextSkill.label} fresh`,
    detail: nextSkill.nextAction,
    practiceHref: nextSkill.status === "retention-due" ? `/study/${subject}/practise?mode=due` : `/study/${subject}/practise?mode=weak`,
    gameLabel: nextSkill.gameSuggestion.label,
    gameHref: nextSkill.gameSuggestion.href,
    skillId: nextSkill.skillId,
  } : null;

  const learningHistory = (state.learningEvents || [])
    .filter((event) => event.subject === subject && Number(event.year || year) === Number(year))
    .slice(0, 12)
    .map((event) => ({
      ...event,
      skillLabel: skillLabel(event.skillId),
      fromLabel: event.fromLevel ? ["","Recognition","Recall","Application","Explanation"][event.fromLevel] : null,
      toLabel: event.toLevel ? ["","Recognition","Recall","Application","Explanation"][event.toLevel] : null,
    }));

  const attemptedTopics = topics.filter((row) => row.attempted > 0);
  const attempted = attemptedTopics.reduce((sum, row) => sum + row.attempted, 0);
  const correct = attemptedTopics.reduce((sum, row) => sum + row.correct, 0);
  const accuracy = attempted ? correct / attempted : 0;
  const mastered = topics.filter((row) => row.state === "mastered");
  const secure = topics.filter((row) => row.state === "secure");
  const productionTopics = topics.filter((row) => row.productionOk).length;

  const weakest = attemptedTopics
    .filter((row) => row.state !== "mastered")
    .sort((a, b) => b.dueCount - a.dueCount || a.accuracy - b.accuracy || b.attempted - a.attempted)
    .slice(0, 3);

  const improving = attemptedTopics
    .filter((row) => typeof row.improvement === "number" && row.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement || b.attempted - a.attempted)
    .slice(0, 3);

  const recentMastered = mastered
    .filter((row) => row.masteredAt)
    .sort((a, b) => String(b.masteredAt).localeCompare(String(a.masteredAt)))
    .slice(0, 3);

  const errorTotals = {};
  for (const row of attemptedTopics) {
    const stat = state.topicStats?.[row.topicId] || {};
    for (const [kind, count] of Object.entries(stat.errorTypes || {})) errorTotals[kind] = (errorTotals[kind] || 0) + count;
  }
  const errorPatterns = Object.entries(errorTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, label: errorLabel(type), count }));

  const assessmentRows = topics.filter((row) => assessmentIds.has(row.topicId));
  const assessmentAttemptedRows = assessmentRows.filter((row) => row.attempted > 0);
  const assessmentAttempted = assessmentAttemptedRows.reduce((sum, row) => sum + row.attempted, 0);
  const assessmentCorrect = assessmentAttemptedRows.reduce((sum, row) => sum + row.correct, 0);
  const assessmentPractice = assessmentRows.length ? {
    totalTopics: assessmentRows.length,
    exploredTopics: assessmentAttemptedRows.length,
    attempted: assessmentAttempted,
    correct: assessmentCorrect,
    accuracy: assessmentAttempted ? assessmentCorrect / assessmentAttempted : 0,
    secureOrMastered: assessmentRows.filter((row) => row.state === "secure" || row.state === "mastered").length,
    mastered: assessmentRows.filter((row) => row.state === "mastered").length,
    productionTopics: assessmentRows.filter((row) => row.productionOk).length,
    topics: assessmentRows,
  } : null;

  const aiScope = `${subject}:y${Number(year)}`;
  const aiHelpActionsMap = {};
  let aiHelpWeek = 0;
  for (const [date, day] of Object.entries(state.aiHelpByDay || {})) {
    if (date < weekStart || date > today) continue;
    const usage = day?.scopes?.[aiScope];
    if (!usage) continue;
    aiHelpWeek += Number(usage.total) || 0;
    for (const [action, count] of Object.entries(usage.actions || {})) aiHelpActionsMap[action] = (aiHelpActionsMap[action] || 0) + Number(count || 0);
  }
  const aiHelpActions = Object.entries(aiHelpActionsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([action, count]) => ({ action, label: aiHelpActionLabel(action), count }));

  const activity7 = Array.from({ length: 7 }, (_, index) => {
    const date = daysAgoKey(6 - index);
    const d = new Date(`${date}T12:00:00`);
    return { date, label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()], value: state.activity?.[date] || 0, studied: (state.studyDays || []).includes(date) };
  });

  return {
    subject,
    weekStudyDays: (state.studyDays || []).filter((date) => date >= weekStart && date <= today).length,
    accuracy,
    attempted,
    correct,
    dueReviews,
    skillWeakCount,
    skillRetentionDue,
    skillRetentionReady,
    skills: skillRows,
    learningHistory,
    nextBestAction,
    totalTopics: topics.length,
    exploredTopics: attemptedTopics.length,
    masteredCount: mastered.length,
    secureCount: secure.length,
    productionTopics,
    weakest,
    improving,
    recentMastered,
    errorPatterns,
    assessmentPractice,
    aiHelpWeek,
    aiHelpActions,
    topics: topics.sort((a, b) => b.dueCount - a.dueCount || ({ learning: 0, practising: 1, secure: 2, mastered: 3 }[a.state] - ({ learning: 0, practising: 1, secure: 2, mastered: 3 }[b.state])) || a.accuracy - b.accuracy || a.title.localeCompare(b.title)),
    activity7,
  };
}

export { rankAdaptiveQuestions, buildProgressDashboard, getQuestionSkills };
