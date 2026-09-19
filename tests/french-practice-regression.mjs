import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=p=>process.env.REGRESSION_BASELINE==='1' ? execFileSync('git',['show',`4ed009ddfd3d5b65479d298912a5f332be5cfb19:${p}`],{cwd:root,encoding:'utf8'}) : fs.readFileSync(new URL(p,root),'utf8');
const quiz=read('assets/quiz-session-rWAnuDVj.js');
const practice=read('assets/study._subject.practise-D_PWgUd7.js');
const norm=(value)=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ']/g,'').replace(/\s+/g,' ').trim();
const context=vm.createContext({d:norm,a:norm,x:s=>s.normalize('NFC').trim().replace(/\s+/g,' ')});
vm.runInContext(quiz.slice(quiz.indexOf('function A(e)'),quiz.indexOf('function re(e)')),context);
const mark=(q,value)=>context.B(q,value,'french');
const numbers=JSON.parse(read('content/topics/fr-y8-s24-numbers-and-age.json')).questions;
test('trois accepts 3; wrong numeric answers are rejected',()=>{
 const q=numbers.find(q=>q.id==='fr-y8-src-fr-24-1156-trois');
 assert.equal(mark(q,'3').ok,true);assert.equal(mark(q,' 3 ').ok,true);
 assert.equal(mark(q,'4').ok,false);
 const reverse=numbers.find(q=>q.id==='fr-y8-src-fr-24-1155-3');
 assert.equal(mark(reverse,'trois').ok,true);assert.equal(mark(reverse,'3').ok,false);
});
test('every French MC has a usable answer and every option is marked consistently',()=>{
 let count=0;
 for(const file of fs.readdirSync(new URL('content/topics/',root)).filter(f=>f.startsWith('fr-'))){
  for(const q of JSON.parse(read('content/topics/'+file)).questions||[]){
   if(q.format!=='mc_single')continue;
   assert.ok(q.answer.accepted?.length,q.id);
   assert.ok(q.options.some(o=>q.answer.accepted.includes(o)),q.id);
   for(const option of q.options)assert.equal(mark(q,option).ok,q.answer.accepted.some(a=>norm(a)===norm(option)),q.id+': '+option);
   count++;
  }
 }
 assert.ok(count>=1734);console.log('Validated French MC questions:',count);
});
// A deterministic hook runner exercises the deployed components themselves.
// Store updates deliberately rerender the parent, as Zustand does in the app.
function hooks(){
 let cells=[],cursor=0,effects=[],dirty=false;
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
 return {api:{
  useState(initial){const i=cursor++;if(!(i in cells))cells[i]=typeof initial==='function'?initial():initial;return[cells[i],v=>{const next=typeof v==='function'?v(cells[i]):v;if(!Object.is(next,cells[i])){cells[i]=next;dirty=true;}}];},
  useRef(initial){const i=cursor++;if(!(i in cells))cells[i]={current:initial};return cells[i];},
  useMemo(fn,deps){const i=cursor++;if(!cells[i]||!same(cells[i].deps,deps))cells[i]={deps,value:fn()};return cells[i].value;},
  useEffect(fn,deps){const i=cursor++;if(!cells[i]||!same(cells[i].deps,deps)){const prev=cells[i];cells[i]={deps};effects.push(()=>{prev?.cleanup?.();cells[i].cleanup=fn();});}}
 },render(fn){let result,n=0;do{dirty=false;cursor=0;effects=[];result=fn();for(const effect of effects)effect();assert.ok(++n<20,'render must settle');}while(dirty);return result;}};
}
const jsx=(type,props,key)=>({type,props,key});
function flatten(node,out=[]){if(node==null||node===false)return out;if(Array.isArray(node)){node.forEach(n=>flatten(n,out));return out;}out.push(node);if(typeof node==='object')flatten(node.props?.children,out);return out;}
function textOf(node){return flatten(node).filter(n=>typeof n==='string'||typeof n==='number').join('');}
function button(tree,label){const node=flatten(tree).find(n=>n?.props?.children===label&&typeof n.props.onClick==='function');assert.ok(node,`button ${label}`);return node;}
const empty=()=>{};
function env(state,runner){const store=selector=>selector(state);store.getState=()=>state;return {o:store,w:runner.api,T:{jsx,jsxs:jsx},C:'Card',S:'Button',l:'Input',i:'Progress',r:'Link',ne:'Audio',s:a=>[...a],y:a=>[...a],m:()=>({}),v:q=>q.feedback,_:q=>q,ee:empty,h:empty,te:empty,u:empty,b:empty,E:empty,dayKey:()=> '2026-09-18',URLSearchParams,window:{dispatchEvent:empty,location:{search:''}},CustomEvent:class{},Event:class{}};}
function newState(){return {year:8,reviews:{},topicStats:{},lastTopic:'fr-y8-s24-numbers-and-age',seenTotal:{},spellingDue:{},sound:false,recordAttempt:empty,bumpDaily:empty,award:empty,recordSpelling:empty};}
test('a full ten-question session survives parent/store rerenders and finishes 10/10',async()=>{
 const state=newState();state.recordAttempt=(id)=>{state.seenTotal={...state.seenTotal,[id]:1};state.reviews={...state.reviews,[id]:{due:'2026-09-20'}};state.topicStats={...state.topicStats,x:{attempted:1}};};
 const hr=hooks(),pr=hooks();const questions=numbers.filter(q=>q.answer.accepted?.length).slice(0,12).map((q,i)=>({...q,_adaptiveRank:i}));
 const catalog=()=>[{topicId:state.lastTopic,title:'Numbers and age'}];
 const pc=vm.createContext({...env(state,pr),g:{useParams:()=>({subject:'french'})},C:()=>({name:'French'}),S:()=>false,s:sel=>sel(state),p:()=>true,v:()=>false,y:catalog,d:()=>0,l:()=> '2026-09-18',u:async()=>({questions}),h:topic=>topic.questions,RQ:(qs,subject,size)=>[...qs].sort((a,b)=>(state.seenTotal[a.id]||0)-(state.seenTotal[b.id]||0)).slice(0,size),x:'Card',YS:'YearSelect',f:[],c:[],m:[],FY9:[],i:'Dictation',o:'Quiz'});
 vm.runInContext(practice.slice(practice.indexOf('function E()'),practice.indexOf('export{')),pc);
 let parent=pr.render(()=>pc.E());await new Promise(resolve=>setImmediate(resolve));parent=pr.render(()=>pc.E());
 const props=tree=>flatten(tree).find(n=>n?.type==='Quiz')?.props;
 let qp=props(parent);assert.equal(qp.items.length,10);const frozenItems=[...qp.items];
 const qc=vm.createContext({...context,...env(state,hr)});vm.runInContext(quiz.slice(quiz.indexOf('function re('),quiz.indexOf('function ie(')),qc);
 let tree=hr.render(()=>qc.H(qp));
 for(let i=0;i<10;i++){
  assert.ok(textOf(tree).includes(`Question ${i+1} / 10`),textOf(tree));
  const current=frozenItems[i];
  if(current.format==='mc_single')button(tree,current.answer.accepted[0]).props.onClick();
  else{const input=flatten(tree).find(n=>n?.type==='Input');input.props.onChange({target:{value:current.answer.accepted[0]}});tree=hr.render(()=>qc.H(qp));flatten(tree).find(n=>n?.type==='form').props.onSubmit({preventDefault:empty});}
  parent=pr.render(()=>pc.E());const nextProps=props(parent);assert.equal(nextProps.items.length,10,'parent may re-rank but keeps a complete candidate session');qp=nextProps;
  tree=hr.render(()=>qc.H(qp));assert.ok(textOf(tree).includes(current.prompt),'active Quiz must keep the submitted question after parent/store rerender');assert.ok(textOf(tree).includes(`Question ${i+1} / 10`));
  button(tree,i===9?'Finish':'Next question').props.onClick();tree=hr.render(()=>qc.H(qp));
  if(i<9)assert.ok(textOf(tree).includes(frozenItems[i+1].prompt),'active Quiz must keep the original session order');
 }
 assert.ok(textOf(tree).includes('10 / 10 first-pass correct · 100%'),textOf(tree));
});
test('French dictation handles accents and does not reshuffle after scheduling a review',()=>{
 const state=newState();state.recordAttempt=empty;state.recordSpelling=(id)=>{state.spellingDue={...state.spellingDue,[id]:{due:'2026-09-20'}};};
 const runner=hooks();const ctx=vm.createContext({...context,...env(state,runner),D:()=>[{id:'zero',prompt:'zero',answer:'zéro'},{id:'three',prompt:'three',answer:'trois'}]});
 vm.runInContext(quiz.slice(quiz.indexOf('function O('),quiz.indexOf('function k(')),ctx);
 const props={lang:'french',size:2,backHref:'/study/french'};let tree=runner.render(()=>ctx.O(props));
 for(const [i,answer] of ['zero','trois'].entries()){
  flatten(tree).find(n=>n?.type==='Input').props.onChange({target:{value:answer}});tree=runner.render(()=>ctx.O(props));flatten(tree).find(n=>n?.type==='form').props.onSubmit({preventDefault:empty});tree=runner.render(()=>ctx.O(props));assert.ok(textOf(tree).includes('Well done!'));assert.ok(textOf(tree).includes(`${i+1} / 2`));button(tree,i===1?'Finish':'Next word').props.onClick();tree=runner.render(()=>ctx.O(props));
 }
 assert.ok(textOf(tree).includes('2 / 2 spelled independently.'));
});
