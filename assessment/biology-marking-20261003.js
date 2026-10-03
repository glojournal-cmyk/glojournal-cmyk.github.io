/* Original AQA-style Biology rubrics: one mark per distinct point. */
(function(){
  const previous=mark;
  mark=function(q,value){
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
    const matched=pointResults.filter(Boolean).length,credit=points.length?matched/points.length:0;
    return {credit,status:credit===1?'Correct':credit>0?'Partly correct':'Incorrect',matched,total:points.length,pointResults};
  };
})();
