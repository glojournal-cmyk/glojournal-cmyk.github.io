// Math V3.1 intake adapter. REVIEW ONLY: it never marks the 200-item upload approved.
// Copyright (c) Lux et Labor — 22 November 2026
// Converting fields must never silently manufacture taught/grade/QA evidence.
export const V31_SOURCE_SHA256 =
  '6fa88943a4233be04fc6be9f43f2079ffb008906c155d018913541852bb94268';
export const V31_TOPIC_MAP=Object.freeze({
  'math-y9-indices':'indices',
  'math-y9-standard-form':'standard-form',
  'math-y9-changing-subject':'changing-subject',
  'math-y9-straight-line-graphs':'straight-line-graphs',
  'math-y9-simultaneous-equations':'simultaneous-equations'
});
export const V31_BANDS=Object.freeze({'G7':'7','G8':'8','G8-9':'8-9'});
const filled=x=>typeof x==='string'&&x.trim().length>0;
const duplicates=arr=>new Set(arr).size!==arr.length;

// A sign-off is never inferred from the question pack's own qa.mathSecondPassVerified flag.
// Independent curriculum coverage, grade, distractor-by-distractor pedagogical review,
// full worked-solution proof and browser rendering each require EXTERNAL documented evidence.
export function mathsV31SignoffIssues(question,signoff={}){
 const issues=[];
 if(signoff.bankSha256!==V31_SOURCE_SHA256)issues.push('source-sha-approval-required');
 if(signoff.questionId!==question?.id)issues.push('question-id-signed-off-individually');
 if(signoff.teacherTaughtConfirmed!==true||!filled(signoff.teacherEvidence))
   issues.push('teacher-taught-subskill-unverified');
 if(signoff.gradeIndependentlyCalibrated!==true||!filled(signoff.gradeBenchmark))
   issues.push('higher-grade-independently-uncalibrated');
 if(signoff.workedSolutionProofChecked!==true||!filled(signoff.mathsChecker))
   issues.push('worked-solution-independent-check-required');
 if(!filled(signoff.pedagogyReviewer)||signoff.distractorRationales==null)
   issues.push('misconception-distractor-review-required');
 for(const option of question?.options||[]){
   if(option.id===question.correctOptionId)continue;
   if(!filled(signoff.distractorRationales?.[option.id]))
     issues.push('missing-rationale-'+option.id);
 }
 if(signoff.ipadLatexRendererVerified!==true||!filled(signoff.rendererEvidence))
   issues.push('ipad-maths-rendering-unverified');
 return issues;
}
export function stageMathsV31Question(question,signoff={}){
 const reasons=[];
 if(!question||question.subject!=='maths'||Number(question.year)!==9)
   reasons.push('wrong-subject-or-year');
 if(!V31_TOPIC_MAP[question?.topicId])reasons.push('topic-not-supported');
 if(!V31_BANDS[question?.difficultyTarget])reasons.push('unrecognized-grade-target');
 const choices=Array.isArray(question?.options)?question.options:[];
 if(choices.length!==6)reasons.push('exactly-six-options');
 if(choices.some(c=>!filled(c?.id)||!filled(c?.latex))||
    duplicates(choices.map(c=>c.id)))reasons.push('option-schema-invalid');
 if(!choices.some(c=>c.id===question?.correctOptionId)||
   choices.filter(c=>c.id===question?.correctOptionId).length!==1)
    reasons.push('unique-key-missing');
 if(!filled(question?.stem)||!filled(question?.id)||!filled(question?.templateId)||
    !filled(question?.correctAnswerLatex))reasons.push('stem-answer-concept-required');
 if(!Array.isArray(question?.workedSolutionSteps)||
    question.workedSolutionSteps.length<2||
    question.workedSolutionSteps.some(s=>!filled(s)))
    reasons.push('worked-solution-step-missing');
 const signoffIssues=mathsV31SignoffIssues(question,signoff);
 reasons.push(...signoffIssues);
 const eligible=reasons.length===0;
 const adapted={
  id:question?.id,subject:'maths',year:9,topicId:question?.topicId,
  topic:V31_TOPIC_MAP[question?.topicId]||'unsupported',
  grade:V31_BANDS[question?.difficultyTarget]||'unverified',
  gradeLabel:question?.difficultyTarget,
  difficultyTarget:question?.difficultyTarget, // required by the real 4/4/2 selector
  templateId:question?.templateId,conceptId:question?.templateId,
  stemLatex:question?.stem,answerLatex:question?.correctAnswerLatex,
  format:'mc_single',correctOptionId:question?.correctOptionId,
  // .text satisfies the legacy metadata validator ONLY; actual UI MUST render
  // .latex via KaTeX or MathJax. Do not show raw LaTeX as plain text.
  options:choices.map(o=>({id:o.id,latex:o.latex,text:o.latex,
   misconception:signoff.distractorRationales?.[o.id]||''})),
  workedSolution:question?.workedSolutionSteps||[],
  academicQA:eligible?'approved':'pending',
  taughtVerified:eligible,
  sourceRef:signoff.teacherEvidence||'',
  qaReviewer:signoff.pedagogyReviewer||'',
  mathsChecker:signoff.mathsChecker||'',
  approvedBankSha256:eligible?V31_SOURCE_SHA256:null,
  qaSourceStatus:question?.qa?.status||'unverified',
  renderRequired:true,
  // Both approval and a real Maths player/session are mandatory.
  mathDailyEnabled:eligible,
 };
 return {eligible,issues:reasons,question:adapted};
}
export function auditMathsV31Pack(pack,signoffs={}){
 const issues=[];
 if(pack?.version!=='3.1-independent-maths-second-pass')issues.push('not-V3.1-reviewed-bank');
 if(!Array.isArray(pack?.questions)||pack.questions.length!==200)
   issues.push('expect-200-questions');
 const questions=Array.isArray(pack?.questions)?pack.questions:[];
 if(duplicates(questions.map(q=>q.id)))issues.push('duplicate-question-ID');
 const results=questions.map(q=>stageMathsV31Question(q,signoffs[q.id]));
 const eligible=results.filter(r=>r.eligible);
 const blocked=results.filter(r=>!r.eligible);
 return {issues,sourceSHA256Expected:V31_SOURCE_SHA256,total:questions.length,
    eligible:issues.length===0?eligible.length:0,blocked:blocked.length,
    items:results.map(r=>({id:r.question.id,topicId:r.question.topicId,
      templateId:r.question.templateId,grade:r.question.gradeLabel,
      eligible:issues.length===0&&r.eligible,issues:r.issues}))};
}
