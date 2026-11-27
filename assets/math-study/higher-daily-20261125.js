// This dated release pins the exact 35 published revisions and their marking keys.
const topics = [
  [
    [
      "LUX-MATH-Y9-INDICES-009-AUTUMN-DEMAND-REWRITE-20261125",
      "B"
    ],
    [
      "LUX-MATH-Y9-INDICES-010-AUTUMN-DEMAND-REWRITE-20261125",
      "D"
    ],
    [
      "LUX-MATH-Y9-INDICES-015-DEMAND-UPGRADE-20261124",
      "A"
    ],
    [
      "LUX-MATH-Y9-INDICES-019-DEMAND-SECOND-PASS-REPAIR-20261125",
      "D"
    ],
    [
      "LUX-MATH-Y9-INDICES-022-AUTUMN-DEMAND-REWRITE-20261125",
      "E"
    ],
    [
      "LUX-MATH-Y9-INDICES-034-BALANCED-OPTION-ORDER-20261125",
      "A"
    ],
    [
      "LUX-MATH-Y9-INDICES-040-DISTRACTOR-REPAIR-20261124",
      "F"
    ]
  ],
  [
    [
      "LUX-MATH-Y9-STANDARD_FORM-002-DEMAND-UPGRADE-20261124",
      "B"
    ],
    [
      "LUX-MATH-Y9-STANDARD_FORM-014-CORE-EXPANSION-20261125",
      "D"
    ],
    [
      "LUX-MATH-Y9-STANDARD_FORM-021-POST35-QA-REPAIR-20261125",
      "B"
    ],
    [
      "LUX-MATH-Y9-STANDARD_FORM-026-FINAL-GATE-DISTRACTOR-REPAIR-20261125",
      "B"
    ],
    [
      "LUX-MATH-Y9-STANDARD_FORM-027-CORE-EXPANSION-20261125",
      "A"
    ],
    [
      "LUX-MATH-Y9-STANDARD_FORM-031-FINAL-GATE-DISTRACTOR-REPAIR-20261125",
      "C"
    ]
  ],
  [
    [
      "LUX-MATH-Y9-REARRANGING-007-AUTUMN-DEMAND-REWRITE-20261125",
      "A"
    ],
    [
      "LUX-MATH-Y9-REARRANGING-010-GRADE-DEMAND-REWRITE-20261125",
      "A"
    ],
    [
      "LUX-MATH-Y9-REARRANGING-011-POST35-QA-REPAIR-20261125",
      "D"
    ],
    [
      "LUX-MATH-Y9-REARRANGING-012-COMPOUND-OPTION-QA-REPAIR-20261125",
      "F"
    ],
    [
      "LUX-MATH-Y9-REARRANGING-019-GRADE-DEMAND-REWRITE-20261125",
      "D"
    ],
    [
      "LUX-MATH-Y9-REARRANGING-021-COMPOUND-OPTION-QA-REPAIR-20261125",
      "E"
    ],
    [
      "LUX-MATH-Y9-REARRANGING-030-GRADE-DEMAND-REWRITE-20261125",
      "F"
    ],
    [
      "LUX-MATH-Y9-REARRANGING-033-GRADE-DEMAND-REWRITE-20261125",
      "E"
    ],
    [
      "LUX-MATH-Y9-REARRANGING-036-GRADE-DEMAND-REWRITE-20261125",
      "B"
    ]
  ],
  [
    [
      "LUX-MATH-Y9-GRAPHS-010-BALANCED-OPTION-ORDER-20261125",
      "B"
    ],
    [
      "LUX-MATH-Y9-GRAPHS-013-AUTUMN-DEMAND-REWRITE-20261125",
      "D"
    ],
    [
      "LUX-MATH-Y9-GRAPHS-019-DEMAND-ORDER-RECONCILED-20261125",
      "D"
    ],
    [
      "LUX-MATH-Y9-GRAPHS-023-BALANCED-OPTION-ORDER-20261125",
      "B"
    ],
    [
      "LUX-MATH-Y9-GRAPHS-027-BALANCED-OPTION-ORDER-20261125",
      "A"
    ],
    [
      "LUX-MATH-Y9-GRAPHS-032-GRADE-DEMAND-REWRITE-20261125",
      "E"
    ]
  ],
  [
    [
      "LUX-MATH-Y9-SIMULTANEOUS-007-AUTUMN-DEMAND-REWRITE-20261125",
      "F"
    ],
    [
      "LUX-MATH-Y9-SIMULTANEOUS-014-FINAL-DEMAND-CANDIDATE-20261125",
      "C"
    ],
    [
      "LUX-MATH-Y9-SIMULTANEOUS-015-DEMAND-ORDER-RECONCILED-20261125",
      "D"
    ],
    [
      "LUX-MATH-Y9-SIMULTANEOUS-023-DEMAND-ORDER-RECONCILED-20261125",
      "C"
    ],
    [
      "LUX-MATH-Y9-SIMULTANEOUS-026-DEMAND-UPGRADE-20261124",
      "B"
    ],
    [
      "LUX-MATH-Y9-SIMULTANEOUS-035-PRIORITY-CONTENT-REVIEW-20261124",
      "E"
    ],
    [
      "LUX-MATH-Y9-SIMULTANEOUS-036-BALANCED-OPTION-ORDER-20261125",
      "A"
    ]
  ]
];
export const dailyURL = '/study/maths/higher-practice/?daily=1';
const taskId = 'maths-daily';
const release = 'higher-35-20261125';
const london = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/London', year:'numeric', month:'2-digit', day:'2-digit'});
export function schoolDay(instant = new Date()) {
  const parts = Object.fromEntries(london.formatToParts(instant).map(p => [p.type,p.value]));
  return [parts.year,parts.month,parts.day].join('-');
}
export function assignment(day) {
  const ordinal = (Date.parse(day+'T00:00:00Z') - Date.UTC(2026,10,25)) / 86400000;
  if (!Number.isInteger(ordinal) || ordinal < 0) return [];
  const pair = topics.map((pool,i) => [0,1].map(k => pool[(2*ordinal+i+k)%pool.length]));
  return [...pair.map(p=>p[0]), ...pair.map(p=>p[1])];
}
export function dailyAnswer(day,id,choice,now = new Date()) {
  const item = assignment(day).find(([key]) => key===id);
  if (!item || !/^[A-F]$/.test(choice) || schoolDay(now)!==day) throw Error('Reopen today’s Maths Daily assignment.');
  return {questionId:id, selectedOptionId:choice, correct:choice===item[1], at:now.toISOString(),
    day, subject:'maths', year:9, dailyTaskId:taskId, bankVersion:release,
    formal:true, assisted:false, hintUsed:false, scaffolded:false, repair:false, recoveryFor:null};
}
export function dailyScore(rows,day) {
  const choices = new Map(), keys = new Map(assignment(day));
  for(const a of rows || []) {
    if(a?.day!==day || a.dailyTaskId!==taskId || a.bankVersion!==release ||
       a.attemptId!==[taskId,day,a.questionId].join(':') || !keys.has(a.questionId) ||
       a.subject!=='maths'||a.year!==9||a.formal!==true||a.repair!==false||
       a.assisted!==false||a.hintUsed!==false||a.scaffolded!==false||a.recoveryFor||
       !/^[A-F]$/.test(a.selectedOptionId)||a.correct!==(a.selectedOptionId===keys.get(a.questionId))||
       !Number.isFinite(Date.parse(a.at))||schoolDay(new Date(a.at))!==day) continue;
    const old=choices.get(a.questionId);
    choices.set(a.questionId,old===undefined||old===a.selectedOptionId?a.selectedOptionId:null);
  }
  let correct=0;
  for (const [id,choice] of choices) if (choice===keys.get(id)) correct++;
  return {choices,correct,submitted:choices.size,passed:choices.size===10&&correct>=9};
}
// Both the student player and Home derive their ten immutable keys from this release.
export function releasedMathsTask(day, rows) {
  const keys = assignment(day);
  if (keys.length !== 10) return null;
  const result = dailyScore(rows, day);
  return {
    id:taskId, title:'Year 9 Higher Maths MCQ', planDate:day, dailyV3:true, planVersion:3,
    assignedSubject:'maths', assignedYear:9, target:10, xp:0, href:dailyURL,
    approvedQuestionIds:keys.map(([id])=>id), approvedCorrectOptionByQuestion:Object.fromEntries(keys),
    progress:result.passed ? 10 : result.correct, done:result.passed,
    detail:result.submitted+'/10 answered · '+result.correct+' correct · 9/10 to pass'
  };
}
// An earned bonus contributes one completed Daily task without replacing an assigned task.
export function includeEarnedMaths(tasks,rows,day) {
  if (!rows?.some(a=>a?.dailyTaskId===taskId && a.day===day && a.bankVersion===release)) return tasks;
  const result=dailyScore(rows,day);
  const existing=tasks.find(t=>t.id===taskId);
  if (existing) {
    if (!existing.dailyV3 || existing.supplyBlocked || existing.href!==dailyURL) return tasks;
    const scored=releasedMathsTask(day,rows);
    if (!scored || !scored.approvedQuestionIds.every((id,i)=>existing.approvedQuestionIds?.[i]===id &&
        existing.approvedCorrectOptionByQuestion?.[id]===scored.approvedCorrectOptionByQuestion[id])) return tasks;
    if (existing.progress===scored.progress && existing.done===scored.done && existing.detail===scored.detail) return tasks;
    return tasks.map(t=>t===existing ? {...t,progress:scored.progress,done:scored.done,detail:scored.detail} : t);
  }
  if (!result.passed) return tasks;
  return [...tasks,{id:taskId,title:'Higher Maths Daily',detail:result.correct+'/10 correct · counted into today',
    planDate:day,assignedYear:9,assignedSubject:'maths',progress:10,target:10,done:true,xp:0,href:dailyURL}];
}
