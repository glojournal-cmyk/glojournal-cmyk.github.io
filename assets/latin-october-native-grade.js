import {modelMatch} from './latin-oct17-bank.js?v=1&ux=20261013-corrections2';
export function gradeLatinOctober(question,value){
 const source=question.latinOctober,model=source.modelAnswer,total=source.marks,text=String(value??'').trim();
 const ok=modelMatch(source,text);
 const needsReview=!!text&&!ok&&(source.answer.mode==='review'||source.type==='vocabulary');
 return {ok,score:ok?total:0,total,model,accentOnly:false,errorKind:ok?'none':text?'wrong':'blank',pointResults:source.markingScheme.points.map(()=>ok),needsReview};
}
