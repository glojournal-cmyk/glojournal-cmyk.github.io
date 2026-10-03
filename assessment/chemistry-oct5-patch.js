/* Chemistry assessment scope patch · 2026-10-03
   Ensures every paper covers C1.1 Atoms, C1.3 Separating Mixtures,
   C2.1 History of the Periodic Table and RP6 Chromatography/Rf. */
(function(){
  const VERSION='20261003-chem-oct5-atoms1';
  const paper=PAPERS.find(p=>p.id==='chemistry');
  if(!paper)return;

  Object.assign(paper,{
    name:'Chemistry · assessment week of 5 Oct',
    subtitle:'C1.1 Atoms · C1.3 Separating Mixtures · C2.1 History of the Periodic Table · RP6 Chromatography + Rf',
    count:30,
    minutes:45,
    groups:{
      'Atoms':6,
      'Periodic table':5,
      'Separation':5,
      'RP6 method':3,
      'RP6 errors':2,
      'Chromatogram':3,
      'Rf':5,
      'Solvents':1
    }
  });
  const examGroup=EXAM_GROUPS.find(g=>g.subject==='Chemistry');
  if(examGroup)examGroup.exam='2026-10-05';

  const norm={ignoreCase:true,ignoreExtraWhitespace:true,ignoreTerminalPunctuation:true,ignorePunctuationForScore:true};
  const base=(id,prompt,concept,difficulty=1)=>({
    id:`chem-atoms-${id}`,topic:'Atoms',prompt,diagram:null,conceptId:`chem-atoms-${concept}`,
    difficulty,contentTier:'school_aqa_style'
  });
  const choice=(id,prompt,options,accepted,concept,hint,difficulty=1)=>({
    ...base(id,prompt,concept,difficulty),format:'mc_single',options,
    answer:{mode:'choice',accepted:[accepted],normalization:norm},
    feedback:{short:accepted},markKeywords:[accepted],hint
  });
  const exact=(id,prompt,accepted,concept,hint,difficulty=1,model='')=>({
    ...base(id,prompt,concept,difficulty),format:'typed_exact',options:null,
    answer:{mode:'exact_or_equivalent',accepted,normalization:norm},
    feedback:{short:model||accepted[0]},markKeywords:accepted,hint,
    ...(model?{modelAnswer:model}:{})
  });
  const keywords=(id,prompt,accepted,required,concept,hint,difficulty=2,model='')=>({
    ...base(id,prompt,concept,difficulty),format:'typed_exact',options:null,
    answer:{mode:'keywords',accepted,required,normalization:norm},
    feedback:{short:model||accepted[0]},markKeywords:required.flat(),hint,modelAnswer:model||accepted[0]
  });
  const rubric=(id,prompt,accepted,points,concept,hint,difficulty=3,model='')=>({
    ...base(id,prompt,concept,difficulty),format:'typed_exact',options:null,
    answer:{mode:'chemistry_rubric',accepted,points,normalization:norm},
    feedback:{short:model||accepted[0]},markKeywords:points.flatMap(p=>p.alternatives||[]),hint,
    modelAnswer:model||accepted[0],
    examGuidance:{strategy:'Give one distinct scientific idea for each mark and show working for calculations.',commonError:hint}
  });

  const ATOMS=[
    choice('01','What is the relative charge of a proton?',['+1','0','-1','+2'],'+1','proton-charge','Protons are positively charged particles in the nucleus.'),
    choice('02','What is the relative charge of a neutron?',['+1','0','-1','-2'],'0','neutron-charge','A neutron has no electrical charge.'),
    choice('03','What is the relative charge of an electron?',['+1','0','-1','+0.5'],'-1','electron-charge','Electrons are negatively charged.'),
    choice('04','Which particles are found in the nucleus of an atom?',['protons and neutrons','protons and electrons','neutrons and electrons','electrons only'],'protons and neutrons','nucleus-particles','Electrons are outside the nucleus.'),
    choice('05','Where are electrons found in an atom?',['in shells or energy levels around the nucleus','inside protons','only in the nucleus','mixed evenly through the nucleus'],'in shells or energy levels around the nucleus','electron-location','Think of the central nucleus with electrons outside it.'),
    choice('06','What is the approximate relative mass of a proton?',['1','0','1/1840','2'],'1','proton-mass','Protons and neutrons each have relative mass about 1.'),
    choice('07','What is the approximate relative mass of a neutron?',['1','0','1/1840','2'],'1','neutron-mass','Neutrons have almost the same mass as protons.'),
    choice('08','Which best describes the mass of an electron compared with a proton?',['very small, about 1/1840 of a proton','the same as a proton','about twice a proton','exactly zero'],'very small, about 1/1840 of a proton','electron-mass','Electron mass is tiny, but not literally zero.'),
    exact('09','What does the atomic number of an element tell you?',['the number of protons','number of protons','proton number'],'atomic-number','Atomic number identifies the element because it equals proton number.',1,'The atomic number is the number of protons in the nucleus.'),
    exact('10','What does the mass number of an atom tell you?',['the total number of protons and neutrons','number of protons plus neutrons','protons + neutrons'],'mass-number','Electrons are not included in mass number.',1,'Mass number = number of protons + number of neutrons.'),
    exact('11','A neutral sodium atom has atomic number 11. How many protons does it contain?',['11','11 protons'],'na-protons','Atomic number equals number of protons.'),
    exact('12','A neutral magnesium atom has atomic number 12. How many electrons does it contain?',['12','12 electrons'],'mg-electrons','In a neutral atom, electrons equal protons.'),
    exact('13','An atom has mass number 23 and atomic number 11. How many neutrons does it contain?',['12','12 neutrons'],'neutrons-23-11','Neutrons = mass number − atomic number.',2,'23 − 11 = 12 neutrons.'),
    exact('14','An aluminium atom has mass number 27 and atomic number 13. How many neutrons does it contain?',['14','14 neutrons'],'neutrons-al','Subtract the proton number from the mass number.',2,'27 − 13 = 14 neutrons.'),
    exact('15','A chlorine atom has 17 protons and 18 neutrons. What is its mass number?',['35'],'cl-mass','Mass number counts protons and neutrons.',2,'17 + 18 = 35.'),
    keywords('16','Explain why an atom has no overall electrical charge.',['It has equal numbers of positively charged protons and negatively charged electrons, so the charges cancel.'],[['equal numbers of protons and electrons','same number of protons and electrons'],['positive and negative charges cancel','charges balance','charges cancel']],'neutral-explain','For full marks, state the equal numbers and explain what happens to the charges.',2),
    keywords('17','Explain why nearly all the mass of an atom is concentrated in its nucleus.',['Protons and neutrons are in the nucleus and have relative mass about 1, while electrons have negligible mass.'],[['protons and neutrons are in the nucleus','nucleus contains protons and neutrons'],['electrons have very small mass','electron mass is negligible','electrons are about 1/1840']],'mass-nucleus','Mention both the heavy nuclear particles and the very small electron mass.',2),
    choice('18','Two atoms are isotopes of the same element. Which statement must be true?',['They have the same number of protons but different numbers of neutrons.','They have different numbers of protons and the same number of neutrons.','They have the same mass number.','They have different atomic numbers.'],'They have the same number of protons but different numbers of neutrons.','isotope-definition','Same element means same proton number.',2),
    exact('19','Carbon-14 has atomic number 6. How many neutrons are in one carbon-14 atom?',['8','8 neutrons'],'c14-neutrons','Use mass number − atomic number.',2,'14 − 6 = 8 neutrons.'),
    rubric('20','A neutral atom has 15 protons and 16 neutrons. State its atomic number, mass number and number of electrons.',['Atomic number 15, mass number 31, and 15 electrons.'],[{label:'Atomic number = 15',alternatives:['atomic number 15','proton number 15'],patterns:['atomic number.{0,10}15']},{label:'Mass number = 31',alternatives:['mass number 31','15 plus 16 equals 31'],patterns:['mass number.{0,10}31']},{label:'Electrons = 15',alternatives:['15 electrons','electron number 15'],patterns:['15.{0,8}electrons?','electrons?.{0,8}15']}],'particle-table-15','Three separate facts are required for full marks.',3,'Atomic number = 15; mass number = 31; a neutral atom has 15 electrons.'),
    rubric('21','An atom has mass number 40 and atomic number 20. Work out the numbers of protons, neutrons and electrons in a neutral atom.',['20 protons, 20 neutrons and 20 electrons.'],[{label:'20 protons',alternatives:['20 protons','proton number 20'],patterns:['20.{0,8}protons?','protons?.{0,8}20']},{label:'20 neutrons',alternatives:['20 neutrons','40 minus 20 equals 20 neutrons'],patterns:['20.{0,8}neutrons?','neutrons?.{0,8}20']},{label:'20 electrons',alternatives:['20 electrons','electron number 20'],patterns:['20.{0,8}electrons?','electrons?.{0,8}20']}],'40-20','Atomic number gives protons; neutral means electrons = protons; neutrons = 40 − 20.',3),
    choice('22','Which subatomic particle determines which element an atom is?',['proton','neutron','electron','nucleus as a whole'],'proton','element-identity','Changing proton number changes the atomic number and therefore the element.',2),
    keywords('23','Why do isotopes of the same element have the same atomic number?',['They have the same number of protons, and atomic number is the number of protons.'],[['same number of protons','same proton number'],['atomic number is proton number','atomic number counts protons']],'isotope-atomic-number','Link the definition of atomic number to what isotopes share.',2),
    rubric('24','An isotope has mass number 37 and contains 17 protons. Another isotope of the same element has mass number 35. State the number of neutrons in each isotope and explain what remains the same.',['The mass-37 isotope has 20 neutrons; the mass-35 isotope has 18 neutrons. Both have 17 protons, so they have atomic number 17 and are the same element.'],[{label:'Mass-37 isotope has 20 neutrons',alternatives:['37 - 17 = 20','20 neutrons'],patterns:['20.{0,12}neutrons?']},{label:'Mass-35 isotope has 18 neutrons',alternatives:['35 - 17 = 18','18 neutrons'],patterns:['18.{0,12}neutrons?']},{label:'Both have 17 protons / atomic number 17',alternatives:['both have 17 protons','same 17 protons','same atomic number 17'],patterns:['(both|same).{0,30}17.{0,12}(protons?|atomic number)']},{label:'Therefore they are the same element',alternatives:['same element','isotopes of the same element'],patterns:['same element']}],'isotope-multistep','Calculate neutrons twice, then use the definition of isotope.',4)
  ];

  const originalStart=start;
  async function loadChemistryBank(){
    const res=await fetch(bankUrl(paper));
    if(!res.ok)throw Error('Question bank unavailable');
    const bank=await res.json();
    const main=bank.groups?bank.groups.flatMap(g=>g.questions):bank.questions;
    return [...main,...ATOMS];
  }

  start=async function(id){
    if(id!=='chemistry')return originalStart(id);
    const p=paper;
    show('exam');
    $('#exam').innerHTML='<h2>Preparing a new paper…</h2>';
    try{
      let draft=state.drafts[id];
      if(draft?.version!==2){delete state.drafts[id];draft=null}
      const answered=draft?Object.keys(draft.answers||{}).length:0;
      const hasAtoms=draft?.questions?.some(q=>q.topic==='Atoms');
      if(draft&&!hasAtoms&&!answered){delete state.drafts[id];draft=null;save()}
      const pool=await loadChemistryBank();
      const byId=new Map(pool.map(q=>[q.id,q]));
      if(draft){
        draft.questions=draft.questions.map(q=>byId.get(q.id)||q);
        draft.coverageVersion=draft.coverageVersion||'legacy';
        save();
      }
      if(!draft){
        const valid=pool.filter(q=>q.prompt&&q.answer?.accepted?.length&&['choice','exact_or_equivalent','keywords','chemistry_rubric'].includes(q.answer.mode));
        const previous=state.recent[id]||[];
        let selected=selectChemistry(valid,p.count,previous,p.groups);
        if(selected.length<p.count)throw Error('Not enough questions in this bank');
        const required=['Atoms','Periodic table','Separation','RP6 method','Rf'];
        if(required.some(topic=>!selected.some(q=>q.topic===topic)))throw Error('Coverage check failed; please start a fresh paper');
        draft={version:2,coverageVersion:VERSION,questions:selected,answers:{},index:0,remaining:p.minutes*60,running:true,started:Date.now()};
        state.drafts[id]=draft;save();
      }
      renderTest(p,draft);
    }catch(e){
      $('#exam').innerHTML=`<h2>Could not prepare this paper</h2><p>${esc(e.message)}</p><button id="back">Back to papers</button>`;
      $('#back').onclick=()=>show('papers');
    }
  };

  window.__CHEMISTRY_COVERAGE_VERSION=VERSION;
  cards();
})();
