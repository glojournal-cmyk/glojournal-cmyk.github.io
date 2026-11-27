// Exact-stem source-first graph mathematics oracle (source bank only, no educational approval).
// TeX parsed using bounded arithmetic; no eval, executable input or external dependencies.
export function graphNumber(tex,env={}) {
 const s=String(tex).replace(/\\left|\\right/g,'').replace(/\$/g,'').replace(/\s+/g,'');
 let i=0,ops=0;
 const need=(ok,m)=>{if(!ok)throw Error('Graph TeX: '+m+' at '+i+' in '+s)};
 const group=()=>{need(s[i]==='{','expected opening brace');i++;const v=expr();need(s[i]==='}','missing close brace');i++;return v};
 const atom=()=>{
  if(++ops>2000)throw Error('Too many maths tokens');
  const ch=s[i];need(!!ch,'empty maths');
  if(ch==='('){i++;const v=expr();need(s[i]===')','missing close paren');i++;return v}
  if(ch==='{')return group();
  if(ch==='\\'){i++;const start=i;while(/[A-Za-z]/.test(s[i]||''))i++;const command=s.slice(start,i);
   if(command==='frac'||command==='dfrac'){const a=group(),b=group();need(b!==0,'zero denominator');return a/b}
   if(command==='sqrt')return Math.sqrt(group());
   throw Error('Unsupported graph macro '+command)}
  if(/[0-9.]/.test(ch)){const start=i;while(/[0-9.]/.test(s[i]||''))i++;const v=Number(s.slice(start,i));need(Number.isFinite(v),'numeric malformed');return v}
  if(/[A-Za-z]/.test(ch)){i++;need(Object.hasOwn(env,ch),'unknown variable '+ch);return env[ch]}
  throw Error('Unsupported expression '+s.slice(i));
 };
 const unary=()=>{if(s[i]==='+'){i++;return unary()}if(s[i]==='-'){i++;return -unary()}return atom()};
 const power=()=>{let v=unary();if(s[i]==='^'){i++;v=v**unary()}return v};
 const term=()=>{let v=power();while(i<s.length){
  if(s[i]==='*'||s[i]==='/'){let op=s[i++],w=power();v=op==='*'?v*w:v/w}
  else if(s[i]==='('||s[i]==='{'||s[i]==='\\'||/[0-9A-Za-z]/.test(s[i]))v*=power();
  else break;
 }return v};
 const expr=()=>{let v=term();while(s[i]==='+'||s[i]==='-'){let op=s[i++],w=term();v=op==='+'?v+w:v-w}return v};
 const value=expr();need(i===s.length,'trailing expression');need(Number.isFinite(value),'nonfinite');return value;
}
export function auditGraphSource40(questions) {
 const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
 const require=(c,s)=>{if(!c)throw Error('GRAPH_SOURCE_QA '+s)};
 const results=[];
 for(const q of questions) {
  const n=Number(q.sourceId.match(/GRAPHS-(\d+)$/)?.[1]);
  require(n>=1&&n<=40,'non-graph source ID');
  require(q.dailyEligible===false,'source credited '+q.sourceId);
  require(q.options?.length===6&&q.options.map(x=>x.id).join('')==='ABCDEF','six option source '+n);
  const pts=[...q.stem.matchAll(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  const equations=[...q.stem.matchAll(/\$([^$]+)\$/g)].map(m=>m[1]).filter(s=>/^y\s*=/.test(s.trim()));
  const lines=equations.map(s=>{
   const ex=s.slice(s.indexOf('=')+1);
   const intercept=graphNumber(ex,{x:0}),slope=graphNumber(ex,{x:1})-intercept;
   require(close(graphNumber(ex,{x:2}),intercept+2*slope),'source line must be linear '+n);
   return {intercept,slope,latex:s}
  });
  const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  const grad=(a,b)=>{require(b[0]!==a[0],'vertical segment needs separate handling '+n);return (b[1]-a[1])/(b[0]-a[0])};
  const perpbisector=(a,b)=>{const M=midpoint(a,b),m=-1/grad(a,b);return {m,b:M[1]-m*M[0],mid:M}};
  const inter=(l1,l2)=>{require(l1.slope!==l2.slope,'parallel source intersections '+n);const x=(l2.intercept-l1.intercept)/(l1.slope-l2.slope);return [x,l1.slope*x+l1.intercept]};
  let expected,detail;
  if(n<=4){require(pts.length===3,'3 points '+n);let m=grad(pts[0],pts[1]);expected=pts[2][0]+m*pts[2][1];detail='perpendicular x-intercept from a source segment';}
  else if(n<=8){require(pts.length===2,'2 points '+n);expected=perpbisector(pts[0],pts[1]).b;detail='perpendicular bisector y-intercept';}
  else if(n<=12){require(lines.length===3,'3 straight lines '+n);const P=inter(lines[0],lines[1]);expected=P[1]-lines[2].slope*P[0];detail='intersection P and parallel y-intercept';}
  else if(n<=16){require(lines.length===3,'3 straight lines '+n);const P=inter(lines[0],lines[1]);expected=P[0]+lines[2].slope*P[1];detail='intersection P and perpendicular x-intercept';}
  else if(n<=20){require(pts.length===2&&lines.length===1,'perpendicular bisector+line '+n);const perp=perpbisector(pts[0],pts[1]);expected=inter({slope:perp.m,intercept:perp.b},lines[0])[0];detail='bisector versus given line x-coordinate';}
  else if(n<=24){require(lines.length===1,'single source line '+n);const {slope:m,intercept:b}=lines[0];require(m!==0,'nonzero initial slope');expected=b/2-b/(2*m*m);detail='axis intercept midpoint perpendicular y-intercept';}
  else if(n<=28){require(lines.length===2&&pts.length===2,'two lines plus AB '+n);const P=inter(lines[0],lines[1]),m=grad(pts[0],pts[1]);require(m!==0,'zero segment slope');expected=P[0]-P[1]/m;detail='intersection and parallel segment x-intercept';}
  else if(n<=32){const match=q.stem.match(/A\(k,\s*(-?\d+)\).*?B\((-?\d+),\s*(-?\d+)\)/);require(!!match&&lines.length===1,'unknown A(k,..) '+n);const [ay,bx,by]=match.slice(1).map(Number);require(lines[0].slope!==0,'nonzero perpendicular source');expected=bx-(ay-by)*lines[0].slope;detail='unknown x-coordinate from perpendicular slopes';}
  else if(n<=36){require(lines.length===2&&pts.length===2,'two lines segment '+n);const P=inter(lines[0],lines[1]),m=grad(pts[0],pts[1]);expected=P[0]+m*P[1];detail='intersection plus perpendicular segment x-intercept';}
  else {require(lines.length===1&&pts.length===2,'bisector+line compound '+n);const perp=perpbisector(pts[0],pts[1]),P=inter({slope:perp.m,intercept:perp.b},lines[0]);
   if(n===37){expected=P[0]**2+P[1]**2;detail='squared distance';}
   if(n===38){expected=Math.abs(P[0]*P[1])/2;detail='triangle area';}
   if(n===39){expected=P[1]-perp.mid[1];detail='signed displacement';}
   if(n===40){require(P[0]!==0,'gradient through origin undefined');expected=P[1]/P[0];detail='origin-to-P slope';}
  }
  const alternatives=q.options.map(o=>({id:o.id,value:graphNumber(o.latex),rationale:o.errorPath||null}));
  const equal=alternatives.filter(o=>close(o.value,expected)).map(o=>o.id);
  require(equal.length===1,'multiple/no mathematically equal A-F options '+n+': '+JSON.stringify({expected,alternatives,equal}));
  require(equal[0]===q.correctOptionId,'wrong keyed option '+n+' key '+q.correctOptionId+' derived '+equal[0]);
  require(close(graphNumber(q.correctAnswerLatex),expected),'worked numeric answer mismatch '+n);
  results.push({sourceId:q.sourceId,key:equal[0],expected,detail,allSixValues:alternatives.map(a=>a.value),distinctNumeric:new Set(alternatives.map(a=>a.value.toPrecision(12))).size===6,wrongRouteCount:alternatives.filter(a=>a.id!==equal[0]&&a.rationale?.length>10).length});
 }
 require(results.length===40,'Graph source has '+results.length+' not 40');
 return results;
}
