import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('assets/phase7-voice-cheers-20261011.js','utf8');
function harness({unsupported=false,quota=false}={}){
 const events={},devents={},spoken=[],writes=[],attrs={},button={textContent:'',style:{},addEventListener:(k,f)=>button[k]=f,getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v};
 let mounted=false,time=100000;
 const host={append:()=>mounted=true};
 const document={body:{},hidden:false,querySelector:()=>host,getElementById:()=>mounted?button:null,createElement:()=>button,addEventListener:(k,f)=>devents[k]=f};
 const root={__luxAppReady:true,addEventListener:(k,f)=>events[k]=f,setTimeout:()=>1,clearTimeout:()=>{},SpeechSynthesisUtterance:class{constructor(t){this.text=t}},speechSynthesis:unsupported?null:{speaking:false,getVoices:()=>[],cancel:()=>{},speak:v=>spoken.push(v.text)}};
 vm.runInNewContext(source,{globalThis:root,document,location:{pathname:'/'},Date:{now:()=>time},localStorage:{getItem:()=>null,setItem:(k,v)=>{writes.push([k,v]);if(quota)throw Error('quota')}}});
 return {root,document,events,devents,button,spoken,writes,tick:()=>time+=13000};
}
test('voice requires opt-in and an interaction; 3-correct streak and 12-second cooldown',()=>{
 const h=harness();h.events['scholar:question-answered']({detail:{correct:true}});assert.equal(h.spoken.length,0);
 h.button.click();assert.equal(h.spoken[0],'Well done!');
 for(let i=0;i<3;i++)h.events['scholar:question-answered']({detail:{correct:true}});
 assert.equal(h.spoken.length,1);
 h.tick();for(let i=0;i<3;i++)h.events['scholar:question-answered']({detail:{correct:true}});
 assert.equal(h.spoken[1],'Superb!');
 assert.deepEqual(h.writes,[['lux-encouragement-voice-v1','on']]);
});
test('wrong answers reset streak, unverified completions and hidden tabs never speak',()=>{
 const h=harness();h.button.click();h.tick();h.events['lux:phase7-mission-complete']({detail:{verified:false}});assert.equal(h.spoken.length,1);
 h.events['scholar:question-answered']({detail:{correct:false}});
 for(let i=0;i<2;i++)h.events['scholar:question-answered']({detail:{correct:true}});assert.equal(h.spoken.length,1);
 h.document.hidden=true;h.events['lux:phase7-mission-complete']({detail:{verified:true}});assert.equal(h.spoken.length,1);
 h.document.hidden=false;h.events['lux:phase7-mission-complete']({detail:{verified:true}});assert.equal(h.spoken.length,2);
 h.button.click();h.tick();h.events['lux:phase7-mission-complete']({detail:{verified:true}});assert.equal(h.spoken.length,2);
});
test('unsupported browsers and storage quota cannot stop app startup',()=>{
 const h=harness({unsupported:true});assert.equal(h.button.disabled,true);
 const q=harness({quota:true});assert.doesNotThrow(()=>q.button.click());assert.equal(q.spoken.length,1);
 assert.doesNotMatch(source,/MutationObserver|setInterval|awardXP|setState/);
});
