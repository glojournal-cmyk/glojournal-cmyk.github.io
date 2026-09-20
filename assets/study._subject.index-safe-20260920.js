import{i as e,n as t,t as n}from"./jsx-runtime-Cltr0gcK.js";import{C as r,st as i,Ut as a}from"./index-BLVOhKhN.js";var o=e(t(),1),s=n();

const META={
  latin:{name:"Latin",quote:"Lingua Latina per semper.",art:"/art/subjects/latin.jpg"},
  french:{name:"French",quote:"Un monde plus grand t’attend.",art:"/art/subjects/french.jpg"},
  biology:{name:"Biology",quote:"Small wonders, big connections.",art:"/art/subjects/biology.jpg"},
  chemistry:{name:"Chemistry",quote:"Change creates opportunity.",art:"/art/subjects/chemistry.jpg"},
  physics:{name:"Physics",quote:"Curiosity moves the world.",art:"/art/subjects/physics.jpg"},
  english:{name:"English",quote:"Better words, brighter worlds.",art:"/art/subjects/english.jpg"}
};

function subjectFromPath(){
  if(typeof window==="undefined")return"latin";
  const m=window.location.pathname.match(/^\/study\/([^/]+)/);
  return m?.[1]&&META[m[1]]?m[1]:"latin";
}
function pct(n,d){return d?Math.round(n/d*100):0}
function Card({href,title,detail,tone="ivory",children}){
  const bg=tone==="sage"?"rgba(201,210,190,.38)":tone==="blush"?"rgba(235,218,217,.45)":tone==="gold"?"rgba(223,210,164,.28)":"rgba(255,250,240,.82)";
  return (0,s.jsx)("a",{href,className:"block rounded-2xl p-5 transition-transform duration-150 hover:-translate-y-0.5",style:{background:bg,border:"1px solid rgba(23,40,63,.10)",boxShadow:"0 8px 24px rgba(23,40,63,.06)"},children:(0,s.jsxs)("div",{children:[
    (0,s.jsx)("h2",{className:"font-display text-2xl font-semibold text-navy",children:title}),
    (0,s.jsx)("p",{className:"mt-1 text-sm text-muted",children:detail}),
    children
  ]})});
}
function c(){
  const subject=subjectFromPath(),meta=META[subject];
  const year=r(x=>x.year),setYear=r(x=>x.setYear),topicStats=r(x=>x.topicStats||{}),reviews=r(x=>x.reviews||{});
  const catalog=(i(subject,year)||[]).filter(x=>x?.status!=="disabled");
  const mastered=catalog.filter(x=>topicStats?.[x.topicId]?.state==="mastered").length;
  const secure=catalog.filter(x=>["secure","mastered"].includes(topicStats?.[x.topicId]?.state)).length;
  const due=Object.values(reviews||{}).filter(v=>v?.due&&v.due<=a()&&(!v.topicId||catalog.some(x=>x.topicId===v.topicId))).length;
  const masteryPct=pct(mastered,catalog.length),securePct=pct(secure,catalog.length);
  const language=subject==="latin"||subject==="french";
  const focus=catalog.find(x=>topicStats?.[x.topicId]?.state!=="mastered")||catalog[0]||null;
  return (0,s.jsxs)("div",{className:"space-y-6",children:[
    (0,s.jsxs)("header",{className:"overflow-hidden rounded-3xl",style:{background:"linear-gradient(145deg,rgba(255,250,240,.95),rgba(239,241,232,.92))",border:"1px solid rgba(23,40,63,.10)",boxShadow:"0 14px 34px rgba(23,40,63,.07)"},children:[
      (0,s.jsxs)("div",{className:"grid md:grid-cols-[1.3fr_.7fr]",children:[
        (0,s.jsxs)("div",{className:"p-6 sm:p-8",children:[
          (0,s.jsx)("p",{className:"text-xs font-semibold tracking-[0.18em] text-bronze uppercase",children:"Study"}),
          (0,s.jsx)("h1",{className:"mt-1 font-display text-5xl font-semibold text-navy",children:meta.name}),
          (0,s.jsx)("p",{className:"mt-2 text-muted",children:meta.quote}),
          (0,s.jsxs)("label",{className:"mt-5 inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm",style:{background:"rgba(255,255,255,.72)",border:"1px solid rgba(23,40,63,.10)"},children:[
            (0,s.jsx)("span",{className:"font-medium text-navy",children:"Study year"}),
            (0,s.jsxs)("select",{value:year,onChange:e=>setYear(Number(e.target.value)),className:"bg-transparent font-semibold text-navy outline-none",children:[
              (0,s.jsx)("option",{value:9,children:"Year 9"}),
              (0,s.jsx)("option",{value:8,children:"Year 8 · Previous year revision"})
            ]})
          ]}),
          (0,s.jsxs)("div",{className:"mt-5 grid gap-3 sm:grid-cols-3",children:[
            (0,s.jsxs)("div",{className:"rounded-2xl p-4",style:{background:"rgba(201,210,190,.35)"},children:[(0,s.jsx)("p",{className:"text-xs uppercase tracking-wide text-muted",children:"Mastered"}),(0,s.jsxs)("p",{className:"mt-1 font-display text-3xl font-semibold text-navy",children:[masteryPct,"%"]}),(0,s.jsxs)("p",{className:"text-xs text-muted",children:[mastered," / ",catalog.length," topics"]})]}),
            (0,s.jsxs)("div",{className:"rounded-2xl p-4",style:{background:"rgba(223,210,164,.26)"},children:[(0,s.jsx)("p",{className:"text-xs uppercase tracking-wide text-muted",children:"Secure + mastered"}),(0,s.jsxs)("p",{className:"mt-1 font-display text-3xl font-semibold text-navy",children:[securePct,"%"]}),(0,s.jsxs)("p",{className:"text-xs text-muted",children:[secure," / ",catalog.length," topics"]})]}),
            (0,s.jsxs)("div",{className:"rounded-2xl p-4",style:{background:"rgba(235,218,217,.38)"},children:[(0,s.jsx)("p",{className:"text-xs uppercase tracking-wide text-muted",children:"Due now"}),(0,s.jsx)("p",{className:"mt-1 font-display text-3xl font-semibold text-navy",children:due}),(0,s.jsx)("p",{className:"text-xs text-muted",children:"retention reviews"})]})
          ]}),
          focus?(0,s.jsxs)("div",{className:"mt-5 rounded-2xl p-4",style:{background:"rgba(97,119,95,.12)",border:"1px solid rgba(97,119,95,.22)"},children:[
            (0,s.jsx)("p",{className:"text-xs font-semibold tracking-[0.15em] text-navy uppercase",children:"Next mastery focus"}),
            (0,s.jsx)("p",{className:"mt-1 font-display text-2xl font-semibold text-navy",children:focus.title}),
            (0,s.jsx)("a",{href:`/study/${subject}/practise?mode=mastery&topic=${encodeURIComponent(focus.topicId)}&year=${year}`,className:"mt-3 inline-flex rounded-full bg-navy px-4 py-2 text-sm font-medium text-card",children:"Work towards mastery →"})
          ]}):null
        ]}),
        (0,s.jsx)("img",{src:meta.art,alt:"",className:"h-56 w-full object-cover md:h-full"})
      ]})
    ]}),
    (0,s.jsx)("section",{className:"grid gap-3 sm:grid-cols-2 lg:grid-cols-4",children:[
      {title:"Learn",detail:"Review the notes before formal practice.",href:`/study/${subject}/learn`,tone:"ivory"},
      {title:"Practise",detail:"Formal questions that build mastery evidence.",href:`/study/${subject}/practise`,tone:"sage"},
      {title:"Due Review",detail:due?`${due} retention review${due===1?"":"s"} waiting.`:"Nothing due right now.",href:`/study/${subject}/practise?mode=due`,tone:"blush"},
      {title:"Progress",detail:"See topic mastery and retention.",href:`/study/${subject}/progress`,tone:"gold"}
    ].map(x=>(0,s.jsx)(Card,{...x},x.title))}),
    language?(0,s.jsx)("section",{className:"grid gap-3 sm:grid-cols-2",children:[
      (0,s.jsx)(Card,{href:`/study/${subject}/practise?mode=vocab&scope=all`,title:"Vocabulary Bank",detail:subject==="french"?"Year 8 + Year 9 learned French words.":"Full learned Latin vocabulary.",tone:"sage"},"vocab"),
      (0,s.jsx)(Card,{href:`/study/${subject}/practise?mode=dictation&scope=all`,title:"Dictation",detail:"Spaced spelling and recall practice from the learned bank.",tone:"blush"},"dict")
    ]}):null
  ]});
}
export{c as component};