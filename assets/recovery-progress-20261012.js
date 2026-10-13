import {recoveryReplay} from './recovery-session-20261012.js?ux=20261013-player-ux3';
import {i as interop,n as factory} from './jsx-runtime-Cltr0gcK.js?ux=20261013-player-ux3';
import {C as store} from './index-BLVOhKhN.js?v=20261011-vault2&ux=20261013-player-ux3';
const R=interop(factory()),h=R.createElement;
export function RecoveryProgress({subject,date}){
 const row=store(s=>s.recoveryVocabByDay?.[date]?.[subject]);
 const current=Object.values(row?.items||{}).filter(Boolean).length,target=Number(row?.totalNeeded)||0;
 const done=row?.completed===true,remaining=Math.max(0,target-current);
 const href=recoveryReplay(location.href);
 return h('section',{'aria-label':'Recovery progress',role:'status',style:{padding:16,border:'1px solid #c6b485',borderRadius:16}},
 h('h2',null,(done?'Recovery complete · ':'Recovery · ')+date),
 h('p',null,done?'Credited to '+date+' · today’s Vocab is separate':current+' / '+target+' correct recovery answers · '+remaining+' more needed to credit '+date),
 !done&&remaining>0?h('a',{href,style:{display:'inline-flex',minHeight:44,alignItems:'center',marginRight:16}},'Continue recovery · '+remaining+' more correct answers'):null,
 h('a',{href:'/',style:{display:'inline-flex',minHeight:44,alignItems:'center'}},'Choose another recovery date →'));
}
