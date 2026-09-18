import{t as jx}from"./jsx-runtime-Cltr0gcK.js";
import{C as useStore,t as router,rt as unavailable,buildProgressDashboard as buildDashboard}from"./index-BLVOhKhN.js";
import{t as Card}from"./card-t5JqoXqT.js";
import{t as YearSelect}from"./study-year-select-Dx5P4Ogw.js";
import{n as getSubject}from"./subjects-B4IlB2zW.js";

var J=jx();

function pct(value){return Math.round((value||0)*100)}
function stateLabel(value){return value==="mastered"?"Mastered":value==="secure"?"Secure":value==="practising"?"Practising":"Learning"}
function reviewLabel(date){
  if(!date)return"Not scheduled";
  const today=new Date();const d=new Date(date+"T12:00:00");
  const t=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime();
  const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
  const days=Math.round((x-t)/86400000);
  return days<0?"Overdue":days===0?"Due today":days===1?"Tomorrow":date;
}
function Bar({value}){
  const width=Math.max(0,Math.min(100,value||0));
  return J.jsx("div",{className:"mt-3 h-2 w-full overflow-hidden rounded-md bg-sage",children:J.jsx("div",{className:"h-full rounded-md bg-leaf",style:{width:width+"%"}})});
}
function Metric({label,value,detail,progress}){
  return J.jsxs(Card,{className:"p-5",children:[
    J.jsx("p",{className:"text-xs tracking-[0.16em] text-navy uppercase",children:label}),
    J.jsx("p",{className:"mt-1 font-display text-4xl font-semibold",children:value}),
    detail?J.jsx("p",{className:"mt-2 text-sm text-muted",children:detail}):null,
    typeof progress==="number"?J.jsx(Bar,{value:progress}):null
  ]});
}
function Empty({children}){return J.jsx("p",{className:"mt-2 text-sm text-muted",children})}
function SmallTopic({row,mode}){
  const second=mode==="improving"&&typeof row.improvement==="number"
    ?"+"+Math.round(row.improvement*100)+" percentage points in recent practice"
    :row.errorType
      ?"Main issue: "+row.errorType.replace(/[-/]/g," ")
      :row.nextAction;
  return J.jsxs("li",{className:"rounded-xl bg-sage p-3 text-sm",children:[
    J.jsxs("div",{className:"flex items-center justify-between gap-3",children:[
      J.jsx("span",{className:"font-medium",children:row.title}),
      J.jsx("span",{className:"text-xs text-muted",children:row.attempted?pct(row.accuracy)+"%":"New"})
    ]}),
    J.jsx("p",{className:"mt-1 text-xs text-muted",children:second})
  ]},row.topicId);
}
function SnapshotCard({title,items,empty,mode}){
  return J.jsxs(Card,{className:"p-5",children:[
    J.jsx("h2",{className:"font-display text-2xl font-semibold",children:title}),
    items&&items.length?J.jsx("ul",{className:"mt-3 space-y-2",children:items.map(row=>J.jsx(SmallTopic,{row,mode},row.topicId))}):J.jsx(Empty,{children:empty})
  ]});
}
function ErrorCard({items}){
  return J.jsxs(Card,{className:"p-5",children:[
    J.jsx("h2",{className:"font-display text-2xl font-semibold",children:"Main error patterns"}),
    items.length?J.jsx("ul",{className:"mt-3 space-y-2",children:items.map(item=>J.jsxs("li",{className:"flex items-center justify-between gap-3 rounded-xl bg-sage p-3 text-sm",children:[
      J.jsx("span",{children:item.label}),
      J.jsx("span",{className:"text-xs text-muted",children:item.count})
    ]},item.type))}):J.jsx(Empty,{children:"No repeated error pattern yet."})
  ]});
}
function RecentMastered({items}){
  return J.jsxs(Card,{className:"p-5",children:[
    J.jsx("h2",{className:"font-display text-2xl font-semibold",children:"Recently Mastered"}),
    items.length?J.jsx("ul",{className:"mt-3 space-y-2",children:items.map(row=>J.jsxs("li",{className:"rounded-xl bg-sage p-3 text-sm",children:[
      J.jsxs("div",{className:"flex items-center justify-between gap-3",children:[
        J.jsx("span",{className:"font-medium",children:row.title}),
        J.jsx("span",{className:"text-xs text-muted",children:row.masteredAt})
      ]}),
      J.jsx("p",{className:"mt-1 text-xs text-muted",children:"Mastered with ≥85% accuracy and independent production evidence."})
    ]},row.topicId))}):J.jsx(Empty,{children:"No topics have met the new Mastery rule yet."})
  ]});
}
function TopicRow({row}){
  const production=row.productionOk?"Independent evidence ✓":"Independent evidence needed";
  const issue=row.errorType?row.errorType.replace(/[-/]/g," "):"—";
  return J.jsxs("li",{className:"rounded-xl bg-card p-4 ring-1 ring-line",children:[
    J.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[
      J.jsxs("div",{children:[
        J.jsx("p",{className:"font-medium",children:row.title}),
        J.jsxs("p",{className:"mt-1 text-xs text-muted",children:[
          stateLabel(row.state)," · ",
          row.attempted?pct(row.accuracy)+"% accuracy":"Not started",
          " · ",row.attempted," attempts"
        ]})
      ]}),
      J.jsx("span",{className:"rounded-full bg-sage px-3 py-1 text-xs text-navy",children:stateLabel(row.state)})
    ]}),
    row.attempted?J.jsx(Bar,{value:pct(row.accuracy)}):null,
    J.jsxs("div",{className:"mt-3 grid gap-2 sm:grid-cols-2",children:[
      J.jsxs("p",{className:"text-xs text-muted",children:["Production: ",production]}),
      J.jsxs("p",{className:"text-xs text-muted",children:["Next review: ",reviewLabel(row.nextDue)]}),
      J.jsxs("p",{className:"text-xs text-muted",children:["Main issue: ",issue]}),
      J.jsxs("p",{className:"text-xs text-muted",children:["Due now: ",row.dueCount]})
    ]}),
    J.jsxs("p",{className:"mt-3 text-sm",children:[J.jsx("span",{className:"font-medium",children:"Next: "}),row.nextAction]})
  ]},row.topicId);
}

function Progress(){
  let{subject}=router.useParams();
  const subjectInfo=getSubject(subject);
  const state=useStore(s=>s);
  const year=state.year;
  const waiting=unavailable(subject,year);
  const data=buildDashboard(state,subject,year);

  if(waiting)return J.jsxs(Card,{className:"p-6",children:[
    J.jsx("h1",{className:"font-display text-3xl font-semibold",children:"Year 9 French is waiting"}),
    J.jsx("p",{className:"mt-2 text-muted",children:"There is no verified Year 9 French question bank yet. Switch to Previous year revision to see Year 8 French progress."})
  ]});

  const masteryProgress=data.totalTopics?Math.round(data.masteredCount/data.totalTopics*100):0;
  const productionProgress=data.exploredTopics?Math.round(data.productionTopics/data.exploredTopics*100):0;
  const maxActivity=Math.max(1,...data.activity7.map(x=>x.value));

  return J.jsxs("div",{className:"space-y-6",children:[
    J.jsxs("p",{className:"text-xs text-muted",children:[
      J.jsx("a",{href:"/study/"+subject,className:"hover:text-ink",children:subjectInfo.name})," · Progress"
    ]}),
    J.jsxs("header",{children:[
      J.jsxs("h1",{className:"font-display text-4xl font-semibold",children:[subjectInfo.name," Progress"]}),
      J.jsx("p",{className:"mt-2 text-muted",children:"Parent view · Mastered means ≥85% accuracy plus at least one independent typed or spelled answer."}),
      J.jsx("div",{className:"mt-3",children:J.jsx(YearSelect,{subjectName:subjectInfo.name})})
    ]}),

    J.jsxs("div",{className:"grid gap-3 sm:grid-cols-2 lg:grid-cols-4",children:[
      J.jsx(Metric,{label:"Study days this week",value:data.weekStudyDays,detail:"Genuine study days only."}),
      J.jsx(Metric,{label:"Subject accuracy",value:data.attempted?pct(data.accuracy)+"%":"—",detail:data.attempted?data.correct+" / "+data.attempted+" correct":"No attempts yet.",progress:data.attempted?pct(data.accuracy):0}),
      J.jsx(Metric,{label:"Due reviews",value:data.dueReviews,detail:data.dueReviews?"Spaced reviews waiting now.":"Nothing overdue."}),
      J.jsx(Metric,{label:"Mastered",value:data.masteredCount+"/"+data.totalTopics,detail:data.secureCount+" more Secure.",progress:masteryProgress})
    ]}),

    J.jsxs("div",{className:"grid gap-3 sm:grid-cols-2",children:[
      J.jsx(Metric,{label:"Topics explored",value:data.exploredTopics+"/"+data.totalTopics,detail:"Topics with at least one formal attempt."}),
      J.jsx(Metric,{label:"Independent production",value:data.productionTopics+"/"+data.exploredTopics,detail:"Explored topics with typed/spelled evidence.",progress:productionProgress})
    ]}),

    J.jsxs("div",{className:"flex flex-wrap gap-2",children:[
      J.jsx("a",{href:"/study/"+subject+"/practise?mode=due",className:"rounded-xl bg-navy px-3 py-2 text-sm text-card",children:"Do due reviews"}),
      J.jsx("a",{href:"/study/"+subject+"/practise?mode=weak",className:"rounded-xl bg-sage px-3 py-2 text-sm text-navy",children:"Practise weak areas"})
    ]}),

    J.jsxs("section",{children:[
      J.jsx("p",{className:"text-xs tracking-[0.16em] text-navy uppercase",children:"Parent snapshot"}),
      J.jsx("h2",{className:"mt-1 font-display text-3xl font-semibold",children:"What needs attention now"}),
      J.jsxs("div",{className:"mt-4 grid gap-4 lg:grid-cols-2",children:[
        J.jsx(SnapshotCard,{title:"Weakest 3",items:data.weakest,empty:"No weak topic has enough evidence yet."}),
        J.jsx(SnapshotCard,{title:"Improving fastest",items:data.improving,mode:"improving",empty:"Trend data starts building from new practice attempts. Six or more recent attempts are needed."}),
        J.jsx(RecentMastered,{items:data.recentMastered}),
        J.jsx(ErrorCard,{items:data.errorPatterns})
      ]})
    ]}),

    J.jsxs(Card,{className:"p-5",children:[
      J.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[
        J.jsxs("div",{children:[
          J.jsx("h2",{className:"font-display text-2xl font-semibold",children:"7-day study activity"}),
          J.jsx("p",{className:"mt-1 text-sm text-muted",children:"Question activity plus genuine study-day markers."})
        ]}),
        J.jsxs("p",{className:"text-sm text-muted",children:[data.activity7.filter(x=>x.studied).length," / 7 days studied"]})
      ]}),
      J.jsx("div",{className:"mt-6 flex h-40 items-end gap-2",children:data.activity7.map(item=>J.jsxs("div",{className:"flex flex-1 flex-col items-center gap-2",children:[
        J.jsx("div",{className:"flex h-28 w-full items-end rounded-md bg-sage",children:J.jsx("div",{className:"w-full rounded-md bg-leaf",style:{height:Math.max(8,item.value/maxActivity*100)+"%"}})}),
        J.jsxs("span",{className:"text-[11px] text-muted",children:[item.label,item.studied?" ✓":""]})
      ]},item.date))})
    ]}),

    J.jsxs("section",{children:[
      J.jsx("p",{className:"text-xs tracking-[0.16em] text-navy uppercase",children:"Topic detail"}),
      J.jsx("h2",{className:"mt-1 font-display text-3xl font-semibold",children:"Every topic"}),
      J.jsx("p",{className:"mt-2 text-sm text-muted",children:"Accuracy, production evidence, due review, main error pattern and the next useful action."}),
      data.topics.length?J.jsx("ul",{className:"mt-4 space-y-3",children:data.topics.map(row=>J.jsx(TopicRow,{row},row.topicId))}):J.jsx(Empty,{children:"No topics are available in this subject yet."})
    ]})
  ]});
}

export{Progress as component};
