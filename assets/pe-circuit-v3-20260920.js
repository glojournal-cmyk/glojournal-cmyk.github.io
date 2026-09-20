import{i as e,n as t,t as n}from"./jsx-runtime-Cltr0gcK.js";
import{C as s,Qt as u,d as ok,g as bad,u as finishSound}from"./index-BLVOhKhN.js";
import{t as Button}from"./button-CgT0JZ5s.js";
import{t as Card}from"./card-t5JqoXqT.js";
var R=e(t(),1),J=n();
const meta={id:"pe-circuit",name:"Scholar Sprint 3.0",kicker:"PE · Active Arcade",blurb:"Eight iPad-first circuits with large controls, clear rules and a real difficulty curve.",levels:8};
const C=[
 ["Warm-up","Learn the controls.",["feet","reaction","target"]],
 ["Coordination","Faster feet and cleaner reactions.",["feet","memory","reaction"]],
 ["Control","Add timing and direction changes.",["target","hold","dodge"]],
 ["Agility","Switch between four skills.",["feet","memory","target","dodge"]],
 ["Pressure","Longer chains and shorter windows.",["reaction","hold","memory","feet"]],
 ["Full Circuit","Four skills under steady pressure.",["dodge","target","feet","memory"]],
 ["Elite","High-speed reactions and precision.",["reaction","feet","target","hold"]],
 ["House Final","Fast, precise and fair.",["feet","reaction","memory","dodge"]]
];
const N={feet:"Quick Feet",reaction:"Reaction Dash",target:"Precision Kick",memory:"Footwork Memory",hold:"Balance Hold",dodge:"Dodge Lane"};
const H={feet:"Alternate LEFT and RIGHT. Wrong-side taps do not end the station.",reaction:"Wait for GO. An early tap restarts the same round without losing the whole station.",target:"Tap when the moving marker is inside the green zone.",memory:"Watch the arrow chain, then repeat it. A mistake costs only that round.",hold:"Press and hold, then release near the target time.",dodge:"Tap the direction shown as quickly and accurately as possible."};
const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), stars=v=>v>=86?3:v>=68?2:v>=45?1:0, wait=ms=>new Promise(r=>setTimeout(r,ms));
const big="min-h-28 rounded-2xl border border-line bg-card px-4 py-4 text-3xl font-semibold text-navy shadow-sm active:scale-[.98] disabled:opacity-45";
function Bar({list,at,scores}){return J.jsx("div",{className:"overflow-x-auto",children:J.jsx("div",{className:"flex min-w-max gap-2",children:list.map((x,i)=>J.jsxs("div",{className:`rounded-xl border px-3 py-2 ${i===at?"border-leaf bg-sage/60":i<at?"border-bronze/40 bg-card":"border-line bg-card/70"}`,children:[J.jsx("b",{className:"block text-xs text-navy",children:N[x]}),J.jsx("span",{className:"text-[10px] uppercase text-muted",children:i<at?`✓ ${scores[i]}`:i===at?"Active":"Next"})]},x+i))})});}
function Feet({level,onDone,sound}){const goal=14+level*2,[c,setC]=R.useState(0),[side,setSide]=R.useState("left"),[err,setErr]=R.useState(0),start=R.useRef(0);const tap=x=>{if(!start.current)start.current=performance.now();if(x!==side){setErr(v=>v+1);sound&&bad();return}sound&&ok();let next=c+1;setC(next);setSide(x==="left"?"right":"left");if(next>=goal){let sec=(performance.now()-start.current)/1000,score=clamp(Math.round(52+(goal/sec)*13-err*7),0,100);setTimeout(()=>onDone(score),180)}};return J.jsxs(Card,{className:"p-5",children:[J.jsxs("div",{className:"flex justify-between text-sm",children:[J.jsx("span",{children:`Quick Feet ${c}/${goal}`}),J.jsx("span",{className:"text-muted",children:`${err} errors`})]}),J.jsx("div",{className:"mt-4 grid grid-cols-2 gap-3",children:["left","right"].map(x=>J.jsx("button",{onClick:()=>tap(x),className:`${big} ${side===x?"ring-4 ring-leaf/35":""}`,children:x==="left"?"← LEFT":"RIGHT →"},x))}),J.jsx("p",{className:"mt-3 text-center text-sm text-muted",children:H.feet})]});}
