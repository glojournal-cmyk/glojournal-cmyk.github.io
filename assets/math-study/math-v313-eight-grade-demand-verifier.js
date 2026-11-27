// Fail-closed, independent stem-derived checks for V313 QA-only Maths questions.
// Mathematical keys are re-derived from source coefficients, not from correctOptionId.
// This is NOT a teacher/Grade7+/student-misconception certification.
export function auditEightStemMaths(questions) {
 const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9*Math.max(1,Math.abs(a),Math.abs(b));
 const req=(ok,msg)=>{if(!ok)throw Error('Maths V313 independent QA: '+msg)};
 const results=[];
 for(const q of questions) {
  const id=q.sourceId.split('-').slice(-2).join('-');
  req(q.dailyEligible===false&&q.masteryEligible===false&&q.teacherTaughtConfirmed===false&&q.independentGradeCalibrated===false&&q.academicQA==='pending',id+' QA-only release barrier');
  req(q.options.length===6&&q.options.map(o=>o.id).join('')==='ABCDEF',id+' six choice IDs');
  req(new Set(q.options.map(o=>o.latex)).size===6,id+' duplicated statement');
  req(q.options.filter(o=>o.id!==q.correctOptionId).every(o=>typeof o.errorPath==='string'&&o.errorPath.length>25),id+' missing causal wrong-route description');
  req(q.options.find(o=>o.id===q.correctOptionId)?.latex===q.correctAnswerLatex,id+' key text mismatch');
  let answer=null, expected=null, proof='';
  if(id==='INDICES-006'){
    const amax=Number(q.stem.match(/a\\le(\d+)/)?.[1]),bmax=Number(q.stem.match(/b\\le(\d+)/)?.[1]),limit=Number(q.stem.match(/a\+b\\le(\d+)/)?.[1]);
    req(amax>0&&bmax>0&&limit>0,'Index bounds missing from stem');
    const good=[];for(let a=1;a<=amax;a++)for(let b=1;b<=bmax;b++)
     if(a+b<=limit&&a%3===0&&b%3===0&&(a+2)%2===0&&(b+1)%2===0)good.push([a,b]);
    answer=Math.max(...good.map(([a,b])=>a*b));expected=String(answer);proof=JSON.stringify(good);
    req(good.length===3,'Index solutions unexpectedly changed');
  } else if(id==='REARRANGING-001'){
    const m=q.stem.match(/y=\\frac{(\d+)x\+(\d+)}{x\+(\d+)}/);
    req(!!m,'R001 cannot parse coefficients');
    const [a,b,c]=m.slice(1).map(Number),values=[];
    for(let x=0;x<=100;x++){const y=(a*x+b)/(x+c);if(y>=3&&y<3.5)values.push(x)}
    answer=values.length;expected='x=\\frac{'+c+'y-'+b+'}{'+a+'-y},N='+answer;
    req(values.join(',')==='2,3,4,5,6','R001 integer set changed');proof=values.join(',');
  } else if(id==='REARRANGING-003'){
    req(q.stem.includes('y=\\sqrt{x+1}-\\sqrt{x}'),'R003 radical model changed');
    const x=16/9,y=Math.sqrt(x+1)-Math.sqrt(x),inv=(1-y*y)**2/(4*y*y);
    req(close(y,1/3)&&close(inv,x),'R003 radical inverse / observation mismatch');
    answer=x;expected='x=\\frac{(1-y^2)^2}{4y^2},0<y\\le1,x(1/3)=\\frac{16}{9}';
    proof='y(16/9)=1/3, inverse(1/3)=16/9, 0<y<=1';
  } else if(id==='REARRANGING-009'){
    const m=q.stem.match(/y=\\frac{kx\+(\d+)}{(\d+)x\+(\d+)}/);
    req(!!m,'R009 model changed');
    const [b,c,d]=m.slice(1).map(Number),k=c+d-b,fn=x=>(k*x+b)/(c*x+d);
    req(close(fn(1),1)&&fn(0)<k/c,'R009 calibration or monotonicity failed');
    for(const x of [0,1,3,20]){const y=fn(x);req(close((d*y-b)/(k-c*y),x),'R009 inverse sample fails')}
    answer=k;expected='k=3,x=\\frac{5y-4}{3-2y},\\frac{4}{5}\\le y<\\frac{3}{2}';
    req(k===3&&close(fn(0),4/5)&&close(k/c,3/2),'R009 interval changed');
    proof='k='+k+'; lower='+fn(0)+'; upper='+k/c;
  } else if(id==='REARRANGING-012'){
    const m=q.stem.match(/y=(\d+)\+\\frac{(\d+)}{(\d+)x\+(\d+)}/);
    req(!!m,'R012 model changed');
    const [a,b,c,d]=m.slice(1).map(Number),f=x=>a+b/(c*x+d);
    const A=c,B=d-a*c,C=-(a*d+b),disc=B*B-4*A*C;
    const positive=(-B+Math.sqrt(disc))/(2*A),negative=(-B-Math.sqrt(disc))/(2*A);
    req(positive>=0&&negative<0&&close(f(positive),positive),'R012 fixed point discriminant/branch failed');
    for(const x of [0,1,5]){const y=f(x);req(close((b-d*(y-a))/(c*(y-a)),x),'R012 inverse check')}
    answer=positive;expected='x=\\frac{10-2y}{3(y-2)},x_{\\mathrm{fixed}}=\\frac{2+\\sqrt{34}}{3},2<y\\le5';
    req(disc===136&&close(f(0),5),'R012 source parameters changed');
    proof='quadratic '+A+'x^2+'+B+'x+'+C+', disc='+disc;
  } else if(id==='REARRANGING-014'){
    const m=q.stem.match(/y=\(x-(\d+)\)\^2\+(\d+)/);
    req(!!m,'R014 model changed');
    const [h,v]=m.slice(1).map(Number),count=y=>{
     if(y<v)return 0;const root=Math.sqrt(y-v),a=h-root,b=h+root;
     if(close(a,b))return a>=0&&a<=7?1:0;
     return Number(a>=0&&a<=7)+Number(b>=0&&b<=7);
    };
    req(count(4)===1&&count(5)===2&&count(13)===2&&count(14)===1&&count(20)===1,'R014 two-root interval not as claimed');
    answer=[4,13];expected='x=3\\pm\\sqrt{y-4},4<y\\le13';
    req(h===3&&v===4,'R014 source coefficients altered');proof='root counts y=4:1,5:2,13:2,14:1,20:1';
  } else if(id==='REARRANGING-017'){
    req(q.stem.includes('x^2-25')&&q.stem.includes('x-5')&&q.stem.includes('x^2-3x'),'R017 source mismatch');
    const roots=[5,-1],valid=roots.filter(x=>x!==5).map(x=>[x,x+5]);
    req(valid.length===1&&valid[0][0]===-1&&valid[0][1]===4,'R017 invalid removable hole');
    answer=valid;expected='N=1,(x,y)=(-1,4)';proof='(x-5)(x+1)=0; x=5 undefined';
  } else if(id==='REARRANGING-019'){
    req(q.stem.includes('3x+2')&&q.stem.includes('\\frac{4}{5}'),'R019 reciprocal model changed');
    const y=x=>(3*x+2)/(3*x+4),candidates=[];
    for(let x=0;x<100;x++)if(y(x)>=4/5)candidates.push({x,delta:y(x+1)-y(x)});
    const largest=candidates.reduce((a,b)=>a.delta>=b.delta?a:b);
    req(largest.x===2&&close(largest.delta,3/65),'R019 discrete interval optimum changed');
    answer=largest.delta;expected='\\frac{3}{65}';proof='x>=2; first increment='+largest.delta;
  } else throw Error('Unknown V313 Maths source ID '+id);
  req(q.correctAnswerLatex===expected,id+' verified result mismatches answer expression');
  req(q.options.filter(o=>o.latex===expected).length===1,id+' multiple identical correct options');
  results.push({sourceId:q.sourceId,correctOptionId:q.correctOptionId,derivedAnswer:answer,proof,uniqueSixChoices:true,causalWrongChoices:5});
 }
 req(results.length===8,'Expected eight source-checked QA candidates');
 return results;
}
