import {mathsOriginalGradeDemandDecision} from './math-study/math-v311-grade-demand-gate.js';
// Math V3.1 intake adapter. REVIEW ONLY: it never marks the 200-item upload approved.
// Copyright (c) Lux et Labor — 22 November 2026
// Converting fields must never silently manufacture taught/grade/QA evidence.
export const V31_SOURCE_SHA256 =
  '6fa88943a4233be04fc6be9f43f2079ffb008906c155d018913541852bb94268';
export const V31_EDITORIAL_CANDIDATE_SHA256 =
  'cb26ea0dd961228dd95e47c29b5ce210f7261e9cb06eadb7b9c6a4824f2419ae';
export const V31_SOURCE_BY_VERSION=Object.freeze({
  '3.1-independent-maths-second-pass':V31_SOURCE_SHA256,
  '3.1.1-editorial-candidate-not-approved':V31_EDITORIAL_CANDIDATE_SHA256
});
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
 if(!Object.values(V31_SOURCE_BY_VERSION).includes(signoff.bankSha256))
   issues.push('source-sha-approval-required');
 if(signoff.questionId!==question?.id)issues.push('question-id-signed-off-individually');
 if(signoff.teacherTaughtConfirmed!==true||!filled(signoff.teacherEvidence))
   issues.push('teacher-taught-subskill-unverified');
 if(signoff.gradeIndependentlyCalibrated!==true||!filled(signoff.gradeBenchmark))
   issues.push('higher-grade-independently-uncalibrated');
 // Independent grade-review evidence cannot bypass an original-family source hold.
 const demand=mathsOriginalGradeDemandDecision({...question,
   gradeDemandQA:signoff.gradeDemandQA,
   independentGradeCalibrated:signoff.gradeIndependentlyCalibrated,
   gradeDemandBenchmark:signoff.gradeBenchmark,
   gradeDemandReviewer:signoff.gradeDemandReviewer});
 if(!demand.ok)issues.push(demand.reason);
 if(!filled(signoff.conceptFamilyId)||!filled(signoff.conceptFamilyEvidence)||!filled(signoff.conceptFamilyReviewer))
   issues.push('independent-cross-template-concept-review-required');
 if(signoff.workedSolutionProofChecked!==true||!filled(signoff.mathsChecker))
   issues.push('worked-solution-independent-check-required');
 if(!filled(signoff.pedagogyReviewer)||signoff.distractorRationales==null)
   issues.push('misconception-distractor-review-required');
 for(const option of question?.options||[]){
   if(option.id===question.correctOptionId)continue;
   if(!filled(signoff.distractorRationales?.[option.id]))
     issues.push('missing-rationale-'+option.id);
 }
 if(signoff.ipadNativeMathMLVerified!==true||!filled(signoff.rendererEvidence))
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
    duplicates(choices.map(c=>c.id))||
    !['A','B','C','D','E','F'].every(id=>choices.some(c=>c.id===id)))
    reasons.push('option-schema-invalid');
 if(duplicates(choices.map(c=>String(c.latex||'').normalize('NFKC').trim())))
    reasons.push('identical-option-expression');
 if(!choices.some(c=>c.id===question?.correctOptionId)||
   choices.filter(c=>c.id===question?.correctOptionId).length!==1)
    reasons.push('unique-key-missing');
 if(question?.qa?.mathSecondPassVerified!==true||
    question?.qa?.oneCorrectChoiceSecondPass!==true||
    question?.qa?.sixMathematicallyDistinctChoicesSecondPass!==true)
    reasons.push('source-maths-second-pass-incomplete');
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
  templateId:question?.templateId,
  // Semantic equivalence across DIFFERENT template IDs must be signed by a
  // real reviewer; never accept the author's template label as proof.
  conceptId:eligible?signoff.conceptFamilyId:null,
  conceptFamilyId:eligible?signoff.conceptFamilyId:null,
  conceptFamilyEvidence:eligible?signoff.conceptFamilyEvidence:'',
  conceptFamilyReviewer:eligible?signoff.conceptFamilyReviewer:'',
  stemLatex:question?.stem,answerLatex:question?.correctAnswerLatex,
  format:'mc_single',correctOptionId:question?.correctOptionId,
  // .text satisfies the legacy metadata validator ONLY; actual UI MUST use
  // the tested native MathML renderer; never show raw TeX as plain text.
  options:choices.map(o=>({id:o.id,latex:o.latex,text:o.latex,
   misconception:signoff.distractorRationales?.[o.id]||''})),
  workedSolution:question?.workedSolutionSteps||[],
  gradeDemandQA:eligible?signoff.gradeDemandQA:null,
  independentGradeCalibrated:eligible&&signoff.gradeIndependentlyCalibrated===true,
  gradeDemandBenchmark:eligible?signoff.gradeBenchmark:'',
  gradeDemandReviewer:eligible?signoff.gradeDemandReviewer:'',
  academicQA:eligible?'approved':'pending',
  taughtVerified:eligible,
  sourceRef:signoff.teacherEvidence||'',
  qaReviewer:signoff.pedagogyReviewer||'',
  mathsChecker:signoff.mathsChecker||'',
  approvedBankSha256:eligible?signoff.bankSha256:null,
  qaSourceStatus:question?.qa?.status||'unverified',
  renderRequired:true,
  // Both approval and a real Maths player/session are mandatory.
  mathDailyEnabled:eligible,
 };
 return {eligible,issues:reasons,question:adapted};
}
export function auditMathsV31Pack(pack,signoffs={}, {verifiedSourceSha256=null}={}){
 const issues=[];
 // A bank's self-declared provenance is insufficient. The importing caller
 // MUST hash the exact uploaded RAW BYTES independently before any admission.
 const expectedSha=V31_SOURCE_BY_VERSION[pack?.version]||null;
 if(!expectedSha)issues.push('unrecognized-bank-version');
 if(!expectedSha||verifiedSourceSha256!==expectedSha)
   issues.push('independently-verified-raw-bank-sha-required');
 if(pack?.questionCount!==200)issues.push('source-header-question-count-mismatch');
 if(!Array.isArray(pack?.questions)||pack.questions.length!==200)
   issues.push('expect-200-questions');
 const questions=Array.isArray(pack?.questions)?pack.questions:[];
 if(duplicates(questions.map(q=>q.id)))issues.push('duplicate-question-ID');
 const results=questions.map(q=>stageMathsV31Question(q,
    signoffs[q.id]?.bankSha256===expectedSha?signoffs[q.id]:{}));
 const eligible=results.filter(r=>r.eligible);
 const blocked=results.filter(r=>!r.eligible);
 return {issues,sourceSHA256Expected:expectedSha,total:questions.length,
    eligible:issues.length===0?eligible.length:0,blocked:blocked.length,
    items:results.map(r=>({id:r.question.id,topicId:r.question.topicId,
      templateId:r.question.templateId,grade:r.question.gradeLabel,
      eligible:issues.length===0&&r.eligible,issues:r.issues}))};
}
