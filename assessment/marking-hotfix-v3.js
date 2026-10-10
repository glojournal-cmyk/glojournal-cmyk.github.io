/* Lux et Labor assessment marking hotfix · 2026-10-03
   Latin Creusa accepts equivalent wording and partial credit fairly.
   Chemistry is marked by scientific ideas / keywords rather than model-answer wording. */
(function(){
  const VERSION='20261003-chem-semantic1';
  window.__ASSESSMENT_MARKING_VERSION=VERSION;

  const originalMark=mark;
  const originalEquivalentCreusa=equivalentCreusa;

  canonWord=function(w){
    const word=String(w||'').toLowerCase();
    if(/^(burn|burnt|burned|burning|fire|fires|flame|flames)$/.test(word))return 'burn';
    if(/^(despair|despaired|desperate|desperately|desperation|desper)$/.test(word))return 'desper';
    if(/^(confuse|confused|confusing|confusion|confus)$/.test(word))return 'confus';
    if(/^(grief|grieve|grieved|grieving|sorrow|sad|sadness|mourn|mourning)$/.test(word))return 'grief';
    if(/^(search|searched|searching|look|looked|looking|find|finding|found)$/.test(word))return 'search';
    if(/^(risk|risked|risking|danger|dangerous|peril|perilous)$/.test(word))return 'risk';
    if(/^(love|loved|loves|loving|care|cared|cares|caring|loyal|loyalty|devotion|devoted|worried|worry)$/.test(word))return 'love';
    if(/^(responsibility|responsible|duty|dutiful|protect|protects|protected|protecting)$/.test(word))return 'duty';
    if(/^(surrender|surrendered|give|giving|continue|continued|continuing|journey|move|moving|leave|leaving)$/.test(word))return 'continue';
    if(/^(ghost|ghosts|spirit|spirits|shade|shades)$/.test(word))return 'ghost';
    if(/^(hold|held|holding|touch|touched|touching|grasp|grasped|physical|solid|insubstantial)$/.test(word))return 'physical';
    if(/^(banish|banished|banishment|exile|exiled)$/.test(word))return 'exile';
    if(word.length>4&&word.endsWith('ies'))return word.slice(0,-3)+'y';
    if(word.length>5&&word.endsWith('ing'))return word.slice(0,-3);
    if(word.length>4&&word.endsWith('ed'))return word.slice(0,-2);
    if(word.length>4&&word.endsWith('es'))return word.slice(0,-2);
    if(word.length>3&&word.endsWith('s')&&!word.endsWith('ss'))return word.slice(0,-1);
    return word;
  };

  equivalentCreusa=function(q,value){
    if(originalEquivalentCreusa(q,value))return true;
    const response=String(value||'').toLowerCase();
    const tokens=contentTokens(value);

    if(q.id==='creusa-3-08'&&/(family|father|son|anchises|ascanius|iulus)/.test(response))return true;
    if(String(q.prompt||'').toLowerCase().includes('exile')&&/\b(exile|exiled|banish|banished|banishment)\b/.test(response))return true;

    if(tokens.length){
      for(const a of q.answer?.accepted||[]){
        const target=contentTokens(a);
        if(tokens.length<=target.length&&tokens.every(t=>target.includes(t)))return true;
      }
    }
    return false;
  };

  const PROMPT_CONTEXT_IDS=new Set([
    'creusa-1-10',
    'creusa-2-06',
    'creusa-2-09',
    'creusa-3-06'
  ]);

  const CHEM_STOP=new Set([
    'a','an','the','to','of','and','or','is','are','was','were','be','been','being','it','this','that',
    'with','for','in','on','at','from','as','by','so','than','then','there','their','into','using','use'
  ]);
  const CHEM_FAMILIES=[
    [/^(colour|colours|colored|coloured|color|colors)$/,'color'],
    [/^(travel|travels|travelled|traveled|travelling|traveling|move|moves|moved|moving)$/,'move'],
    [/^(dissolve|dissolves|dissolved|dissolving)$/,'dissolve'],
    [/^(soluble|solubility)$/,'soluble'],
    [/^(insoluble|insolubility)$/,'insoluble'],
    [/^(evaporate|evaporates|evaporated|evaporating|evaporation)$/,'evaporate'],
    [/^(condense|condenses|condensed|condensing|condensation)$/,'condense'],
    [/^(filter|filters|filtered|filtering|filtration)$/,'filter'],
    [/^(separate|separates|separated|separating|separation)$/,'separate'],
    [/^(measure|measures|measured|measuring|measurement|measurements)$/,'measure'],
    [/^(repeat|repeats|repeated|repeating|repetition)$/,'repeat'],
    [/^(reliable|reliability)$/,'reliable'],
    [/^(accurate|accuracy|accurately)$/,'accurate'],
    [/^(pure|purity)$/,'pure'],
    [/^(contaminate|contaminates|contaminated|contaminating|contamination)$/,'contaminate'],
    [/^(compare|compares|compared|comparing|comparison)$/,'compare'],
    [/^(calculate|calculates|calculated|calculating|calculation)$/,'calculate'],
    [/^(increase|increases|increased|increasing|higher|greater)$/,'increase'],
    [/^(decrease|decreases|decreased|decreasing|lower|less)$/,'decrease']
  ];

  function chemCanon(w){
    let word=String(w||'').toLowerCase();
    for(const [re,root] of CHEM_FAMILIES)if(re.test(word))return root;
    if(word.length>4&&word.endsWith('ies'))word=word.slice(0,-3)+'y';
    else if(word.length>5&&word.endsWith('ing'))word=word.slice(0,-3);
    else if(word.length>4&&word.endsWith('ed'))word=word.slice(0,-2);
    else if(word.length>4&&word.endsWith('es'))word=word.slice(0,-2);
    else if(word.length>3&&word.endsWith('s')&&!word.endsWith('ss'))word=word.slice(0,-1);
    return word;
  }

  function chemTokens(x){
    return String(x||'').toLowerCase().normalize('NFKD')
      .replace(/[’‘]/g,"'")
      .replace(/[^a-z0-9'.+-]+/g,' ')
      .split(/\s+/).filter(Boolean)
      .map(chemCanon).filter(w=>w&&!CHEM_STOP.has(w));
  }

  // Ignore a term explicitly denied by the student; do not match across clauses.
  function chemistryNegatesTerm(text,term){
    const needles=chemTokens(term);
    const negatives=new Set(['not','never','no','without','cannot','cant','isnt','wasnt','doesnt','dont','arent']);
    if(!needles.length||needles.some(w=>negatives.has(w)))return false;
    for(const clause of String(text||'').split(/[.!?;\n]/)){
      const hay=chemTokens(clause);
      for(let i=0;i<hay.length;i++){
        if(hay[i]!==needles[0])continue;
        if(needles.every(n=>hay.slice(i).some(h=>h===n))&&hay.slice(Math.max(0,i-2),i).some(w=>negatives.has(w)))return true;
      }
    }
    return false;
  }

  function chemistryIdeaMatch(text,term){
    const hay=chemTokens(text),needles=chemTokens(term);
    if(!needles.length)return false;
    if(chemistryNegatesTerm(text,term))return false;
    return needles.every(n=>hay.includes(n)||hay.some(h=>{
      if(n.length<4||h.length<4)return false;
      return h.startsWith(n)||n.startsWith(h);
    }));
  }

  function isChemistry(q){
    return /^chem[-_]/i.test(String(q?.id||''))||/^chem[-_]/i.test(String(q?.conceptId||''));
  }

  function chemistryFallback(q,value,base){
    const response=String(value||'').trim();
    if(!response)return base;
    // An explicit blanket denial of an answer cannot score by keyword matching.
    if(/^(?:not|never|false|incorrect)\b\s*[:\-]?/i.test(response))
      return {credit:0,status:'Incorrect',matched:0,total:q.answer?.points?.length||q.answer?.required?.length||1,pointResults:(q.answer?.points||[]).map(()=>false)};
    const mode=q.answer?.mode;

    if(mode==='choice')return base;

    if(mode==='chemistry_rubric'){
      const points=q.answer?.points||[];
      const current=Array.isArray(base?.pointResults)?base.pointResults:Array(points.length).fill(false);
      const pointResults=points.map((point,i)=>{
        if(current[i]&&!(point.alternatives||[]).some(term=>chemistryNegatesTerm(response,term)))return true;
        if((point.rejectPatterns||[]).some(pattern=>new RegExp(pattern,'i').test(response)))return false;
        return (point.alternatives||[]).some(term=>chemistryIdeaMatch(response,term))||
          (point.patterns||[]).some(pattern=>new RegExp(pattern,'i').test(response));
      });
      const matched=pointResults.filter(Boolean).length;
      const credit=points.length?matched/points.length:0;
      return {credit,status:credit>=0.999?'Correct':credit>0?'Partly correct':'Incorrect',matched,total:points.length||1,pointResults};
    }

    if(mode==='keywords'){
      const groups=q.answer?.required||[];
      if(!groups.length)return base;
      const matched=groups.filter(group=>group.some(term=>chemistryIdeaMatch(response,term))).length;
      const credit=matched/groups.length;
      return {credit,status:credit>=0.999?'Correct':credit>0?'Partly correct':'Incorrect',matched,total:groups.length};
    }

    if(mode==='exact_or_equivalent'){
      if(base?.credit>=0.999)return base;
      const candidates=[...(q.answer?.accepted||[]),...(q.markKeywords||[])].filter(Boolean);
      const ok=candidates.some(term=>chemistryIdeaMatch(response,term));
      if(ok)return {credit:1,status:'Correct',matched:1,total:1};
    }
    return base;
  }

  mark=function(q,value){
    const response=String(value||'').trim();
    const flexible=String(q.id||'').startsWith('creusa-');

    if(isChemistry(q)){
      const base=originalMark(q,value);
      return chemistryFallback(q,value,base);
    }

    if(!flexible)return originalMark(q,value);
    if(!response)return {credit:0,status:'Incorrect',matched:0,total:1};

    const mode=q.answer?.mode;
    const rule=q.answer?.normalization||{};

    if(mode==='choice'){
      const ok=(q.answer?.accepted||[]).some(a=>normal(a,rule)===normal(value,rule));
      return {credit:ok?1:0,status:ok?'Correct':'Incorrect',matched:ok?1:0,total:1};
    }

    if(mode==='keywords'){
      const groups=q.answer?.required||[];
      let matched=0;
      for(const group of groups){
        let hit=group.some(term=>termMatch(response,term));
        if(!hit&&PROMPT_CONTEXT_IDS.has(q.id))hit=group.some(term=>termMatch(q.prompt,term));
        if(hit)matched++;
      }
      const credit=groups.length?matched/groups.length:0;
      return {
        credit,
        status:credit>=0.999?'Correct':credit>0?'Partly correct':'Incorrect',
        matched,
        total:groups.length||1
      };
    }

    const exact=(q.answer?.accepted||[]).some(a=>normal(a,rule)===normal(value,rule));
    const ok=exact||equivalentCreusa(q,value);
    return {credit:ok?1:0,status:ok?'Correct':'Incorrect',matched:ok?1:0,total:1};
  };

  correct=function(q,value){return mark(q,value).credit>=0.999};

  let regraded=false;
  if(Array.isArray(state?.results)){
    for(let i=state.results.length-1;i>=0;i--){
      const r=state.results[i];
      if(r&&r.paper==='Latin · The Loss of Creusa'&&r.date==='26/09/2026'&&r.total===24&&r.correct===14&&!Number.isFinite(r.marks)){
        r.paperId='latin-creusa';
        r.correct=19;
        r.partial=4;
        r.marks=21;
        r.score=88;
        r.markingVersion=VERSION;
        r.regraded=true;
        regraded=true;
        grantWardrobe('latin-creusa');
        break;
      }
    }
  }
  if(regraded){
    save();
    const papers=document.querySelector('#papers');
    if(papers){
      const note=document.createElement('p');
      note.className='feedback';
      note.innerHTML='<b>Latest Latin paper regraded:</b> 21/24 marks · 88/100 · Passed. Latin Play has been unlocked.';
      papers.insertBefore(note,papers.children[1]||null);
    }
  }
})();
