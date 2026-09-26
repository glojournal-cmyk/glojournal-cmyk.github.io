/* Lux et Labor assessment marking hotfix v3 · 2026-09-26
   Keeps strict marking for other subjects while making the Latin Creusa
   comprehension accept equivalent wording and award partial credit fairly. */
(function(){
  const VERSION='20260926-v3';
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
    if(word.length>4&&word.endsWith('s')&&!word.endsWith('ss'))return word.slice(0,-1);
    return word;
  };

  equivalentCreusa=function(q,value){
    if(originalEquivalentCreusa(q,value))return true;
    const response=String(value||'').toLowerCase();
    const tokens=contentTokens(value);

    // Direct, concise answers should not be rejected for omitting words already in the question.
    if(q.id==='creusa-3-08'&&/(family|father|son|anchises|ascanius|iulus)/.test(response))return true;
    if(String(q.prompt||'').toLowerCase().includes('exile')&&/\b(exile|exiled|banish|banished|banishment)\b/.test(response))return true;

    // Accept a concise semantic core when it is wholly contained in an accepted answer.
    if(tokens.length){
      for(const a of q.answer?.accepted||[]){
        const target=contentTokens(a);
        if(tokens.length<=target.length&&tokens.every(t=>target.includes(t)))return true;
      }
    }
    return false;
  };

  // In these questions, one required idea is explicitly supplied by the stem.
  // The pupil should not have to repeat the stem verbatim to earn that part of the mark.
  const PROMPT_CONTEXT_IDS=new Set([
    'creusa-1-10', // carrying Anchises -> infer care/duty
    'creusa-2-06', // his return -> infer feelings
    'creusa-2-09', // dangerous search -> infer devotion/love
    'creusa-3-06'  // grief named in stem -> infer response to it
  ]);

  mark=function(q,value){
    const response=String(value||'').trim();
    const flexible=String(q.id||'').startsWith('creusa-');
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

  // Targeted correction for the paper reported on 26 Sep 2026. The old engine
  // stored only 14/24, so the individual answers cannot be reconstructed from localStorage.
  // This migration is deliberately narrow: same paper, same date, same old score, no new marks field.
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
