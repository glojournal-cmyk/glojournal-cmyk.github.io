// Score the actual category_map bank, including typed iPad answers.
// The source requires every statement in the correct named category.
// Never award marks for a loose keyword match or a copied JSON rubric.
const clean=s=>String(s||'').normalize('NFKC').toLowerCase()
 .replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const label=s=>clean(s).replace(/\bvariables\b/g,'variable').replace(/\banomalies\b/g,'anomaly');
export function scoreCategoryMapText(answer,response){
 if(answer?.mode!=='category_map'||!answer.categories||
    typeof answer.categories!=='object')return null;
 const groups=Object.entries(answer.categories).filter(([name,values])=>
   name&&Array.isArray(values)&&values.length);
 if(!groups.length)return null;
 const text=String(response||'').replace(/^\s*correct\s+answer\s*:\s*/i,'');
 const rows=text.split(/[;\n]+/).map(x=>x.trim()).filter(Boolean);
 const assigned=new Map();
 for(const row of rows){
   const colon=row.indexOf(':');
   if(colon<1)continue;
   const key=label(row.slice(0,colon)),value=row.slice(colon+1).trim();
   if(!key||!value||assigned.has(key))continue;
   assigned.set(key,value);
 }
 const results=[];
 for(const [name,expected] of groups){
   const value=assigned.get(label(name));
   const tokens=value?.split(/\s*,\s*/).map(clean).filter(Boolean)||[];
   const got=clean(value||'');
   const expectedTokens=expected.map(clean);
   // One statement per category is the ordinary case. If a category
   // contains several statements, they can be given in either order.
   const matched=expectedTokens.length===1?
     expectedTokens.map(x=>got===x):
     expectedTokens.map(x=>tokens.includes(x));
   results.push(...matched);
 }
 const raw=results.filter(Boolean).length,total=Number(answer.totalMarks)||results.length;
 const score=raw===results.length?total:raw;
 const ok=raw===results.length;
 return {ok,score,total,pointResults:results,errorKind:ok?'none':raw?'partial':'wrong'};
}
