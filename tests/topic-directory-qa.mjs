import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {directoryGroups,topicCategory,topicKinds} from '../assets/topic-directory-data-20261003.js';
const catalog=JSON.parse(fs.readFileSync('content/catalog.json')).topics;
for(const subject of ['latin','french','biology','chemistry','physics','english'])for(const year of [8,9]){
 const topics=catalog.filter(t=>t.subject===subject&&t.year===year&&t.status!=='disabled');
 const groups=directoryGroups([...topics,...topics]);
 assert.equal(groups.flatMap(g=>g.topics).length,topics.length,subject+' year '+year+' topic lost or duplicated');
 assert.ok(groups.every(g=>g.subject===subject&&g.year===year));
 assert.equal(groups.reduce((n,g)=>n+g.enabled,0),topics.reduce((n,t)=>n+t.enabled,0));
 assert.ok(groups.every(g=>!/^Unit \d+$/.test(g.name)),'Generic unit labels remain');
}
assert.equal(topicCategory({subject:'latin',title:'Stage 8 vocabulary'}).name,'Vocabulary & dictionary entries');
assert.equal(topicCategory({subject:'chemistry',title:'Paper chromatography, Rf and reproducibility'}).name,'Separation & chromatography');
assert.equal(topicCategory({subject:'physics',title:'Electric circuits, current and potential difference'}).name,'Electricity & magnetism');
assert.ok(directoryGroups(catalog,{query:'chromatography rf',kind:'calculations'}).flatMap(g=>g.topics).length);
assert.ok(directoryGroups(catalog,{query:'RP6'}).flatMap(g=>g.topics).length);
assert.ok(directoryGroups(catalog,{query:'Year 7 vocabulary'}).flatMap(g=>g.topics).length);
assert.ok(directoryGroups(catalog,{query:'passe compose'}).flatMap(g=>g.topics).some(t=>t.title==='Passé composé'));
assert.equal(directoryGroups(catalog,{query:'zzzz-not-a-topic'}).length,0);
const tid=catalog[0].topicId;
assert.ok(directoryGroups(catalog,{progress:'mastered',stats:{[tid]:{state:'mastered'}}}).flatMap(g=>g.topics).every(t=>t.topicId===tid));
assert.ok(directoryGroups(catalog,{availability:'ready'}).flatMap(g=>g.topics).every(t=>t.enabled>0));
const jsx=(type,props,key)=>({type,props,key});
const flatten=(node,out=[])=>{if(node==null)return out;if(Array.isArray(node)){node.forEach(x=>flatten(x,out));return out;}out.push(node);if(typeof node==='object')flatten(node.props?.children,out);return out;};
let state=[],cursor=0;
const React={useState(initial){const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],value=>{state[i]=value}];}};
const source=fs.readFileSync('assets/topic-browser-20261003.js','utf8');
const ctx=vm.createContext({React,J:{jsx,jsxs:jsx},directoryGroups,topicKinds});
vm.runInContext(source.slice(source.indexOf('const h=' )).replace('export function TopicBrowser','function TopicBrowser'),ctx);
const topics=catalog.filter(t=>t.subject==='chemistry'&&t.year===9);
function render(props){cursor=0;return flatten(ctx.TopicBrowser({topics,subject:'chemistry',year:9,mode:'directory',...props}));}
let nodes=render({});
assert.ok(nodes.some(n=>n?.props?.['aria-label']==='Search topics'));
const details=nodes.filter(n=>n?.type==='details');assert.ok(details.length>1);assert.ok(details.every(n=>n.props.open===false));
const search=nodes.find(n=>n?.props?.['aria-label']==='Search topics');search.props.onChange({target:{value:'Rf'}});
nodes=render({});assert.ok(nodes.filter(n=>n?.type==='details').every(n=>n.props.open===true));
for(const link of nodes.filter(n=>n?.type==='a')){const url=new URL(link.props.href,'https://example.test');assert.equal(url.searchParams.get('year'),'9');assert.ok(url.searchParams.get('topic'));}
state=[];nodes=render({topics:[{subject:'chemistry',year:9,topicId:'pending',title:'New lesson',enabled:0,status:'preview'}]});
assert.ok(nodes.some(n=>n==='Preview only · Building confidence'));assert.ok(!nodes.some(n=>n?.type==='a'&&n.props.children==='Practise'));
state=[];nodes=render({mode:'select',selected:topics[0].topicId,onSelect:id=>{ctx.selected=id}});
const chosen=nodes.find(n=>n?.props?.['aria-pressed']===true);assert.ok(chosen);chosen.props.onClick();assert.equal(ctx.selected,topics[0].topicId);
for(const file of ['assets/study._subject.index-safe-20260920.js','assets/study._subject.learn-BvTzW3pu.js','assets/study._subject.practise-y8fix-20260920.js'])assert.ok(fs.readFileSync(file,'utf8').includes('TopicBrowser'),file);
const assessment=fs.readFileSync('assessment/app-v2.js','utf8');assert.ok(assessment.includes('assessment-search'));assert.ok(assessment.includes('assessment-kind'));
console.log('TOPIC_DIRECTORY_QA passed: all six subjects, every catalog topic exactly once, categories, accent-free search, kind/progress/availability filters, year-correct links, selection and empty/preview states.');
