/* Original AQA-style Biology rubrics: one mark per distinct point.
   School short answers also accept a narrow equivalent form: one article,
   membrane synonyms, unit spacing, and magnification layout. */
(function(){
  const previous=mark;
  function biologySchoolCanon(s){
    let t=String(s||'').normalize('NFKC').trim().toLowerCase()
      .replace(/[’‘]/g,"'")
      .replace(/[μµ]/g,'u')
      .replace(/×/g,'x')
      .replace(/\bmicrometers\b/g,'micrometres')
      .replace(/\bmillimeters\b/g,'millimetres')
      .replace(/\bnanometers\b/g,'nanometres')
      .replace(/\s+/g,' ')
      .replace(/[.!?]+$/,'');
    t=t.replace(/\b(?:cell[\s-]*surface|plasma)\s+membranes?\b/g,'cell membrane');
    t=t.replace(/^(?:it is|it's|they are|this is|that is)\s+/,'');
    t=t.replace(/^(?:a|an|the)\s+/,'');
    t=t.replace(/^\.(\d)/,'0.$1');
    t=t.replace(/(\d)\s*(um|mm|cm|nm)\b/g,'$1 $2');
    t=t.replace(/\s+/g,' ').trim();
    const trailing=t.match(/^(\d+(?:\.\d+)?)\s*x$/);
    const leading=t.match(/^x\s*(\d+(?:\.\d+)?)$/);
    if(trailing)t='x'+trailing[1];
    else if(leading)t='x'+leading[1];
    return t;
  }
  // Only bio-school exact answers. Do not treat extra organelles or a bare
  // shorter word ("plant", "electron") as the accepted phrase.
  function biologySchoolEquivalent(q,value){
    const response=biologySchoolCanon(value);
    if(!response)return false;
    const accepted=(q.answer?.accepted||[]).map(biologySchoolCanon).filter(Boolean);
    if(accepted.includes(response))return true;
    if(/\b(?:not|never|isn't|cannot|can't)\b/.test(response)&&!/^not all\b/.test(response))return false;
    if(accepted.some(a=>response===a+' cell'||response===a+' cells'))return true;
    if(accepted.some(a=>/(?:cell|disc|disk)$/.test(a)&&response===a+'s'))return true;
    if(accepted.includes('not all')&&/^(?:not all|not all bacteria|not all bacterial cells?|not all of them)$/.test(response))return true;
    const prefix=/^(?:its|the|main|circular)\s+/;
    for(const answer of accepted){
      let rest=answer,guard=0,stripped=false;
      while(prefix.test(rest)&&guard++<6){rest=rest.replace(prefix,'');stripped=true;}
      if(stripped&&rest===response&&rest.length>=2)return true;
    }
    return false;
  }
  mark=function(q,value){
    if(String(q.id||'').startsWith('bio-school-')&&q.answer?.mode==='exact_or_equivalent'){
      const base=previous(q,value);
      if((base?.credit||0)>=0.999)return base;
      if(biologySchoolEquivalent(q,value))return {credit:1,status:'Correct',matched:1,total:1};
      return base;
    }
    if(q.answer?.mode!=='biology_rubric')return previous(q,value);
    const response=String(value||'').normalize('NFKC').replace(/[μµ]/g,'u').replace(/[−–]/g,'-');
    const points=q.answer.points||[];
    const clauses=response.split(/[.;\n]|\bbut\b/i).filter(x=>x.trim());
    const pointResults=points.map(point=>{
      if((point.rejectPatterns||[]).some(p=>new RegExp(p,'i').test(response)))return false;
      return (point.patterns||[]).some(pattern=>{
        const re=new RegExp(pattern,'i');
        if(!re.test(response))return false;
        // Negative scientific claims cannot earn a positive structure-function point.
        if(/no\||without|not\)|\(not|\(no/.test(pattern))return true;
        const matching=clauses.filter(c=>re.test(c)).map(c=>c.replace(/\bnot just\b/gi,''));
        if(matching.length)return matching.some(c=>!(/\b(not|never|cannot|can't|doesn't|don't|isn't|aren't)\b/i.test(c)));
        return !/\b(not|never|cannot|can't|doesn't|don't)\b/i.test(response);
      });
    });
    const pointLabels=points.map(p=>(p.variants||[]).find(v=>new RegExp(v.pattern,'i').test(response))?.label||p.label);
    for(const pool of q.answer.distinctPools||[]){
      const hits=pool.options.filter(p=>new RegExp(p.pattern,'i').test(response)&&!clauses.some(c=>new RegExp(p.pattern,'i').test(c)&&/\b(not|never|cannot|can't|doesn't|don't|isn't)\b/i.test(c)));
      pool.indices.forEach((idx,i)=>{pointResults[idx]=i<hits.length;pointLabels[idx]=hits[i]?.label||pool.missingLabel;});
    }
    const matched=pointResults.filter(Boolean).length,credit=points.length?matched/points.length:0;
    return {credit,status:credit===1?'Correct':credit>0?'Partly correct':'Incorrect',matched,total:points.length,pointResults,pointLabels};
  };
})();
