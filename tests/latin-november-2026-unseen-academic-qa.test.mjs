// Human-reviewed baseline for original school-scope unseen passages, 14 Nov 2026.
// Changes to a passage or answer require a fresh academic reading, not just syntax QA.
import test from "node:test";
import assert from "node:assert/strict";
import {LATIN_BOOKLET_RECORDS} from "../assets/latin-vocabulary-booklet-20261023.js";
import {UNSEEN_PASSAGES,validateUnseens} from "../study/latin/november-2026/unseen-passages.js";

// Every surface form currently used in the five passages is mapped explicitly
// to its headword from the school's Taylor Ch 1–3 booklet.
// This is a scope gate, not a general Latin morphological analyser.
const IN_SCOPE_FORMS={
  ad:"ad", advenio:"advenit advenerunt", aedifico:"aedificare aedificaverunt",
  ager:"agro", ambulo:"ambulabant ambulabat", amicus:"amici amicis amico amicus",
  ancilla:"ancilla ancillae ancillam", aqua:"aquam", auxilium:"auxilium",
  bellum:"bello", bonus:"bonum", cibus:"cibum", consilium:"consilium",
  cum:"cum", curro:"cucurrerunt cucurrit",
  custodio:"custodiebat custodire custodite custodiverunt custodivit",
  de:"de", debeo:"debebant debebat", do:"dedit", discedo:"discessit",
  domina:"domina dominam", dominus:"dominum dominus", donum:"donum",
  duco:"duxit", epistula:"epistulam", equus:"equum equus", et:"et",
  festino:"festinant festinaverunt festinavit", forum:"foro forum",
  habeo:"habebat", habito:"habitabat", hora:"horas", hortus:"horto",
  in:"in", inquit:"inquit", insula:"insula insulam",
  invenio:"invenerunt invenit", iratus:"irati", iubeo:"iussit",
  laboro:"laborabant", laetus:"laeta laetus", lego:"legit",
  magnus:"magna magnum", maneo:"manebat", mitto:"misit",
  moneo:"monuit", multus:"multas", navigo:"navigabant navigavit",
  non:"non", novus:"novum", nuntius:"nuntium nuntius",
  paro:"parabant parabat", parvus:"parva", pecunia:"pecuniam",
  per:"per", periculum:"periculo periculum", porta:"portam",
  porto:"porta portabant portare portavit", possum:"poterat",
  puella:"puella puellae puellam puellas", puer:"puer pueri pueris",
  quaero:"quaerebat quaerere quaesivit", roma:"roma romae romam",
  romanus:"romano romanum romanus", saluto:"salutavit",
  scribo:"scripsit", sed:"sed", servus:"serve servi servis servo servos servum servus",
  statim:"statim", stultus:"stultus", subito:"subito",
  sum:"erant erat est", taberna:"tabernam", tandem:"tandem",
  templum:"templi templum", timeo:"timebant timebat",
  venio:"venit", video:"viderunt vidit", villa:"villa villam",
  via:"vias", vir:"viri viros", voco:"vocavit"
};

// Independently read answer key (each literal is the one intended correct
// response to its own MC question). This is independent of key indices.
const APPROVED_ANSWERS={
  letter:[
    "In Rome, in a villa","A friend","Carry the letter to the forum",
    "He could not find the letter","Walking and guarding a horse",
    "Imperfect, third-person singular","To express movement into a villa",
    "In the garden","The girl","The slave gave the letter to a friend"
  ],
  horse:[
    "The master","They were afraid","Through the gate","Into the forum",
    "To the temple","The horse was in the forum","Search for the horse",
    "No, they did not find it","A boy in the garden","They guarded"
  ],
  island:[
    "In Rome","On a small island","To Rome","He feared danger and was seeking help",
    "He left Rome","For many hours","His friend's villa","A girl","In the forum","Food and money"
  ],
  temple:[
    "A new temple in a field","Slaves and slave-girls","Food","To the slaves",
    "War","Guard the temple! (plural command)","To the villa",
    "The gate of the temple","There was no danger","The slaves built the temple"
  ],
  market:[
    "A shop in the forum","The slave-girl","Angry men were rushing towards the forum",
    "Present third-person plural","He needed to carry food and could not carry money",
    "The slave-girl","She guarded the gate","A large gift",
    "The men were not angry and brought a gift","Towards/to the mistress (ad + accusative)"
  ]
};
function words(source){return (source.toLowerCase().match(/[a-z]+/g)||[]);}
test("Academic vocabulary audit: every actual Latin passage form is from Taylor Chapters 1–3",()=>{
  const book=LATIN_BOOKLET_RECORDS.filter(r=>[1,2,3].includes(r.chapter));
  assert.equal(book.length,130);
  const headwords=new Set(book.map(r=>r.headword.toLowerCase().split(/[ ,]/)[0]));
  // The booklet writes inquit with a note 'pl inquiunt'; first element remains inquit.
  const tokensToLemma=new Map();
  for(const [lemma,list] of Object.entries(IN_SCOPE_FORMS)){
    assert.ok(headwords.has(lemma),"Not a Chapter 1–3 headword: "+lemma);
    for(const form of list.split(" ")){
      assert.ok(!tokensToLemma.has(form)||tokensToLemma.get(form)===lemma,"Conflicting form: "+form);
      tokensToLemma.set(form,lemma);
    }
  }
  const used=new Set(UNSEEN_PASSAGES.flatMap(p=>words(p.passage.join(" "))));
  const missing=[...used].filter(w=>!tokensToLemma.has(w));
  assert.deepEqual(missing,[],"Out-of-scope or unreviewed Latin forms");
  const listedButUnused=[...tokensToLemma.keys()].filter(w=>!used.has(w));
  assert.deepEqual(listedButUnused,[],"Delete stale forms from academic audit whitelist");
});

test("Independent 50/50 approved key, no multi-correct or duplicated answer choices",()=>{
  assert.equal(validateUnseens(),true);
  assert.deepEqual(UNSEEN_PASSAGES.map(p=>p.id),Object.keys(APPROVED_ANSWERS));
  for(const p of UNSEEN_PASSAGES){
    assert.equal(p.questions.length,10);
    assert.equal(APPROVED_ANSWERS[p.id].length,10);
    p.questions.forEach((q,i)=>{
      assert.equal(q.options[q.answer],APPROVED_ANSWERS[p.id][i],p.id+" Q"+(i+1));
      assert.equal(new Set(q.options.map(x=>x.toLowerCase().trim())).size,4);
      assert.ok(p.passage.join(" ").includes(q.evidence),"Latin evidence missing: "+q.id);
      assert.ok(q.explanation.length>=15,"Explanation missing: "+q.id);
    });
  }
});
test("Grammar and evidence: no unfair ambiguous Roman-case or iubeo readings",()=>{
  const by=Object.fromEntries(UNSEEN_PASSAGES.map(p=>[p.id,p]));
  const text=Object.fromEntries(UNSEEN_PASSAGES.map(p=>[p.id,p.passage.join(" ")]));
  assert.match(text.letter,/in villam cucurrit/);
  assert.match(text.horse,/servos equum quaerere iussit/);
  assert.match(text.island,/Romae/);
  assert.match(text.island,/Romam misit/);
  assert.match(text.island,/Roma discessit/);
  assert.match(text.island,/multas horas navigabant/);
  assert.match(text.temple,/servos templum custodire iussit/);
  assert.match(text.temple,/servi, templum custodite/);
  assert.equal(by.temple.questions[5].skill,'imperative');
  assert.match(text.market,/serve, pecuniam ad villam porta/);
  assert.match(text.market,/serve, pecuniam ad villam porta/);
  assert.match(text.market,/donum magnum ad dominam portabant/);
  assert.doesNotMatch(text.market,/donum magnum dominae portabant/);
  const q=by.market.questions[9];
  assert.equal(q.skill,"preposition");
  assert.match(q.evidence,/ad dominam/);
  assert.match(q.explanation,/accusative/);
});
test("Year 9 scope guard: no future, pluperfect, passives or 3rd-declension endings in tested passages",()=>{
  const sample=UNSEEN_PASSAGES.flatMap(p=>p.passage).join(" ").toLowerCase();
  // This check guards against a known list of out-of-scope forms; the exhaustive
  // surface-form whitelist above is the primary grammar gate.
  const tokens=new Set(words(sample));
  for(const banned of ["portabuntur","amaverant","fuissent","qui","quae","quod","legatus","milites"]){
    assert.ok(!tokens.has(banned),"Out-of-scope grammatical form: "+banned);
  }
  assert.match(sample,/laborabant|custodiebat/);
  assert.match(sample,/scripsit|misit|cucurrit/);
  assert.match(sample,/est|erant/);
});
