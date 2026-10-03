export function questionReason(question,seen=0){
 const bucket=String(question?._dailyBucket||question?._adaptiveBucket||'');
 if(question?._repair)return {label:'Repair practice',detail:'A previous answer in this session needs another try. Repairs do not count as a new formal attempt.'};
 if(/error|mistake/.test(bucket))return {label:'Previous mistake',detail:'You missed this question or word earlier. It is back for independent recall.'};
 if(/spaced|retention|due/.test(bucket))return {label:'Scheduled review',detail:'This question is due again so you can check what you still remember.'};
 if(/small.bank/.test(bucket))return {label:'Small bank repeat',detail:'Recent words may return because the available learned bank is small. Each word appears once in this set.'};
 if(/weak/.test(bucket))return {label:'Weak skill practice',detail:'This question targets a skill that still needs stronger independent answers.'};
 if(!seen)return {label:'New question',detail:'This is a new question in your current revision rotation.'};
 return {label:'Consolidation',detail:'You have met this question before. It was selected to strengthen recall or cover an available weak skill.'};
}
