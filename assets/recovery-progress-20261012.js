import {i as interop,n as factory} from './jsx-runtime-Cltr0gcK.js';
import {C as store} from './index-BLVOhKhN.js?v=20261011-vault2';
const R=interop(factory()),h=R.createElement;
export function RecoveryProgress({subject,date}){
 const row=store(s=>s.recoveryVocabByDay?.[date]?.[subject]);
 const current=Object.values(row?.items||{}).filter(Boolean).length,target=Number(row?.totalNeeded)||0;
 const done=row?.completed===true;
 return h('section',{'aria-label':'Recovery progress',role:'status',style:{padding:16,border:'1px solid #c6b485',borderRadius:16}},
 h('h2',null,(done?'Recovery complete · ':'Recovery · ')+date),
 h('p',null,done?'Credited to '+date+' · today’s Vocab is separate':current+' / '+target+' correct recovery answers · this set is saved'),
 h('a',{href:'/',style:{display:'inline-flex',minHeight:44,alignItems:'center'}},'Choose another recovery date →'));
}
