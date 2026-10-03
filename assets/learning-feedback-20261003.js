/* Shared, deterministic coaching. Does not change marks or learning progress. */
(function(root){
  const normal=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLowerCase().replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
  const cue=q=>normal(String(q.prompt||'').replace(/^[A-Z &→—-]+\s*—\s*/,''))+'|'+normal(q.stimulus?.text||q.passage||'');
  function selectTransferQuestion(source,bank,excluded=[]){
    const used=new Set(excluded),group=source.transferGroup||source.conceptId;
    if(!group)return null;
    const pool=(bank||[]).filter(q=>q.id!==source.id&&!used.has(q.id)&&q.status!=='disabled'&&q.formal!==false&&
      (q.transferGroup||q.conceptId)===group&&(!source.topicId||q.topicId===source.topicId)&&cue(q)!==cue(source));
    return pool.find(q=>q.format!==source.format&&Number(q.difficulty||2)<=Number(source.difficulty||2)+1)||pool[0]||null;
  }
  function buildCorrection(question,result,subject){
    const answer=question.answer||{},given=String(result.given??''),model=result.model||question.modelAnswer||answer.modelAnswer||answer.accepted?.[0]||'';
    const points=answer.points||answer.markPoints||[],missing=[...(result.missing||[])];
    if(Array.isArray(result.pointResults))points.forEach((point,i)=>{if(!result.pointResults[i])missing.push(result.pointLabels?.[i]||point.label||point)});
    if(question.format==='diagram_label'&&result.pairs)for(const [anchor,label] of Object.entries(answer.labelMap||{}))if(normal(result.pairs[anchor])!==normal(label))missing.push(`Label ${anchor}: ${label}`);
    let reason=question.feedback?.distractors?.[given]||'';
    const correct=result.ok??result.credit===1;
    if(!correct&&!reason){
      if(result.errorKind==='blank'||!given.trim())reason='No answer was supplied, so there is no evidence to award this point.';
      else if(question.format==='calculation')reason=result.score===.5?'The numerical value is right, but the required unit is missing or incorrect.':'The numerical value does not match. Check the formula, substitution and unit conversion.';
      else if(missing.length)reason='Your response has not demonstrated every required point. Add the missing ideas below in your own words.';
      else if(question.format==='mc_single')reason=`You selected “${given}”. It does not satisfy the complete cue. Compare it with “${model}” using the explanation below.`;
      else if(subject==='french'||subject==='latin')reason=`Compare “${given}” with the accepted wording “${model}”. Check the specific language rule below; a familiar stem alone is not enough.`;
      else reason='The response does not match the required idea. Use the explanation and model to check your reasoning.';
    }
    const expected=normal(model).split(' ').filter(Boolean),actual=new Set(normal(given).split(' '));
    const missingWords=(subject==='french'||subject==='latin')&&!correct&&!missing.length?expected.filter(x=>!actual.has(x)):[];
    return {reason,missing:[...new Set(missing)],missingWords:[...new Set(missingWords)],rule:question.feedback?.rule||question.examGuidance?.commonError||question.hint||question.feedback?.remember||'',next:question.feedback?.nextStep||'Cover the correction, explain the rule aloud, then answer a different question on the same idea.'};
  }
  root.LuxLearningFeedback={buildCorrection,selectTransferQuestion};
})(globalThis);
