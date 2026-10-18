import{i as e,n as t,t as n}from './jsx-runtime-Cltr0gcK.js?ux=20261013-corrections2';
import{directoryGroups,topicKinds,relatedTopicRows,topicDisplayTitle}from './topic-directory-data-20261003.js?v=20261010-chem-marking1&ux=20261013-corrections2';
const React=e(t(),1),J=n();
const h=J.jsx,hs=J.jsxs;
if(typeof document!=='undefined'&&!document.getElementById('topic-directory-style')){const style=document.createElement('link');style.id='topic-directory-style';style.rel='stylesheet';style.href='/topic-directory-20261003.css?v=20261018-clarity1&ux=20261013-corrections2';document.head.appendChild(style);}
const buttonClass='topic-flag';
const TONE_LABEL={secure:'Secure',building:'Building',due:'Due',new:'Not started'};

function storedStats(){
 try{const entry=JSON.parse(localStorage.getItem('lux-scholar-garden-v1')||'{}');return (entry.state||entry).topicStats||{}}catch{return {}}
}

export function TopicBrowser({topics=[],selected='',onSelect,subject,year,stats={},allowAll=false,mode='select',compact=false}){
 const [query,setQuery]=React.useState(()=>typeof window==='undefined'?'':new URLSearchParams(window.location.search).get('q')||''),[kind,setKind]=React.useState('all'),[availability,setAvailability]=React.useState('all'),[progress,setProgress]=React.useState('all');
 const [learned,setLearned]=React.useState(()=>{try{return JSON.parse(localStorage.getItem('lux-topic-learning-v1')||'{}')}catch{return {}}}),[taughtFilter,setTaughtFilter]=React.useState('all');
 const saved=storedStats();
 const isTaught=topic=>learned[topic.topicId]??Number(year)<=8;
 const toggle=topic=>{const next={...learned,[topic.topicId]:!isTaught(topic)};try{localStorage.setItem('lux-topic-learning-v1',JSON.stringify(next));setLearned(next);window.dispatchEvent(new Event('scholar:learning-changed'))}catch{alert('Could not save the learned-topic setting. Please make a backup and check device storage.')}};
 const tone=topic=>{
  const st=stats[topic.topicId]||saved[topic.topicId]||{};
  const attempted=Number(st.attempted)||0;
  const due=Number(st.due);
  if(st.state==='secure'||st.state==='mastered')return 'secure';
  if(due&&due<=Date.now()&&attempted>0)return 'due';
  if(attempted>0)return 'building';
  return 'new';
 };
 const counts=topics.reduce((n,topic)=>{const key=tone(topic);n[key]+=1;return n},{secure:0,due:0,building:0,new:0});
 const visible=topics.filter(t=>taughtFilter==='all'||(taughtFilter==='taught'?isTaught(t):!isTaught(t)));
 const kinds=new Set(topics.flatMap(topicKinds));
 const groups=directoryGroups(visible,{query,kind,availability,progress,stats});
 const found=groups.reduce((n,g)=>n+g.topics.length,0),questions=groups.reduce((n,g)=>n+g.enabled,0);
 const select=(label,value,onChange,options)=>hs('label',{className:'grid gap-1 text-xs text-muted',children:[label,h('select',{'aria-label':label,value,onChange:e=>onChange(e.target.value),className:'min-w-0 rounded-xl border border-line bg-card px-3 py-2 text-sm text-navy',children:options.map(([id,name])=>h('option',{value:id,children:name},id))})]});
 const learningControl=topic=>h('button',{type:'button',onClick:()=>toggle(topic),className:buttonClass+(isTaught(topic)?' is-learned':''),'aria-label':`Change learned status for ${topic.title}`,'aria-pressed':isTaught(topic),children:isTaught(topic)?'Learned':'New'});
 const line=topic=>hs('div',{className:'topic-line',children:[h('button',{type:'button',onClick:()=>onSelect?.(topic.topicId),'aria-pressed':topic.topicId===selected,className:'topic-row',children:[h('span',{className:'topic-dot topic-dot-'+tone(topic),title:TONE_LABEL[tone(topic)],'aria-label':TONE_LABEL[tone(topic)]}),h('span',{className:'topic-name',children:topicDisplayTitle(topic)}),h('span',{className:'topic-count',children:Number(topic.enabled)>0?String(topic.enabled):'–'})]}),learningControl(topic)]},topic.topicId);
 const actions=topic=>hs('div',{className:'topic-actions',children:[h('a',{href:`/study/${subject}/learn?topic=${encodeURIComponent(topic.topicId)}&year=${year}`,children:'Notes'}),Number(topic.enabled)>0?h('a',{href:`/study/${subject}/practise?topic=${encodeURIComponent(topic.topicId)}&year=${year}&mode=standard`,children:'Practise'}):h('span',{children:'Not ready'})]});
 const filtersOpen=kind!=='all'||availability!=='all'||progress!=='all'||taughtFilter!=='all';
 return hs('section',{className:'topic-browser space-y-3','aria-label':`Year ${year} topic directory`,children:[
  hs('header',{children:[h('h2',{className:'font-display text-2xl text-navy',children:mode==='directory'?'Topic library':'Topics'}),h('p',{className:'topic-summary',children:[
   h('span',{children:[h('i',{className:'topic-dot topic-dot-secure','aria-hidden':'true'}),h('b',{children:counts.secure}),' secure']}),
   h('span',{children:[h('i',{className:'topic-dot topic-dot-building','aria-hidden':'true'}),h('b',{children:counts.building}),' building']}),
   h('span',{children:[h('i',{className:'topic-dot topic-dot-new','aria-hidden':'true'}),h('b',{children:counts.new}),' not started']}),
   h('span',{children:[h('i',{className:'topic-dot topic-dot-due','aria-hidden':'true'}),h('b',{children:counts.due}),' due']})
  ]})]}),
  h('input',{type:'search',value:query,onChange:e=>setQuery(e.target.value),placeholder:'Search topics','aria-label':'Search topics',className:'w-full rounded-xl border border-line bg-card px-3 py-3 text-sm'}),
  hs('details',{className:'topic-filters',open:filtersOpen||!!query,children:[h('summary',{children:'Filters'}),hs('div',{className:'mt-3 grid gap-2',children:[
   select('School learning',taughtFilter,setTaughtFilter,[['all','All topics'],['taught','Already learned'],['untaught','Not learned yet']]),
   hs('div',{className:compact?'grid grid-cols-2 gap-2':'grid gap-2 sm:grid-cols-3',children:[
    select('Question focus',kind,setKind,[['all','All question types'],['vocabulary','Vocabulary'],['grammar','Grammar'],['calculations','Calculations'],['practicals','Practicals'],['reading','Reading & translation'],['writing','Writing & explanations'],['diagrams','Diagram questions'],['short','Short answers'],['choices','Multiple choice']].filter(([id])=>kinds.has(id))),
    select('Availability',availability,setAvailability,[['all','All topics'],['ready','Ready to practise']]),
    select('Progress',progress,setProgress,[['all','All progress'],['unmastered','Not yet mastered'],['mastered','Mastered']])
   ]}),
   filtersOpen||query?h('button',{type:'button',onClick:()=>{setQuery('');setKind('all');setAvailability('all');setProgress('all');setTaughtFilter('all')},className:buttonClass,children:'Clear'}):null
  ]})]}),
  allowAll&&!query&&kind==='all'?h('button',{type:'button',onClick:()=>onSelect?.('all'),'aria-pressed':selected==='all',className:'topic-mix','children':'All topics'}),
  found===0?h('p',{className:'rounded-xl bg-sage/40 p-4 text-sm',role:'status',children:topics.length?'No topics match.':'Choose another year.'}):null,
  h('div',{className:'space-y-2',style:compact?{maxHeight:'60vh',overflowY:'auto',paddingRight:'4px'}:undefined,children:groups.map((group,index)=>hs('details',{className:'topic-group',open:!!query||group.topics.some(t=>t.topicId===selected)||(!selected&&index===0),children:[
   hs('summary',{children:[group.name,h('span',{children:`${group.topics.length}`})]}),
   h('div',{className:'topic-group-body',children:relatedTopicRows(group.topics).map(({topic,related})=>{
    const ready=Number(topic.enabled)>0;
    const relatedSets=related.length?hs('details',{className:'topic-related',children:[h('summary',{children:`School sets (${related.length})`}),...related.map(child=>hs('div',{className:'topic-line',children:[h('button',{type:'button',className:'topic-row',onClick:()=>onSelect?.(child.topicId),'aria-pressed':child.topicId===selected,children:[h('span',{className:'topic-dot topic-dot-'+tone(child),title:TONE_LABEL[tone(child)]}),h('span',{className:'topic-name',children:child.title}),h('span',{className:'topic-count',children:String(child.enabled||0)})]}),learningControl(child),mode==='directory'?actions(child):null]},child.topicId))]}):null;
    return mode==='directory'?hs('article',{className:'topic-directory-item',children:[line(topic),relatedSets,actions(topic)]},topic.topicId):hs('div',{children:[line(topic),relatedSets]},topic.topicId);
   })})
  ]},group.id))})
 ]});
}

function formatSummary(){return ''}
