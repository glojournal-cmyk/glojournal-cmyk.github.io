import test from 'node:test';
import assert from 'node:assert/strict';
import {auditMathsV31Pack,stageMathsV31Question,V31_SOURCE_SHA256} from '../assets/daily-maths-v31-intake-gate-20261122.js';
import {validateMathQuestion} from '../assets/daily-tasks-v3-20261122.js';
const sample=()=>({
  id:'LUX-MATH-Y9-INDICES-001',subject:'maths',year:9,
  topic:'Laws of Indices',topicId:'math-y9-indices',
  format:'mc_single',difficultyTarget:'G7',templateId:'V2-INDICES-1',
  stem:'Solve for $n$: $\\dfrac{4^{n+2}\\times 8^{3-n}}{2^{2}}=2^{9}$.',
  options:['0','2','3','6','-4','-2'].map((latex,i)=>({id:'ABCDEF'[i],latex})),
  correctOptionId:'B',correctAnswerLatex:'2',
  workedSolutionSteps:['Rewrite powers as base 2.','Equate exponents and solve n=2.'],
  qa:{mathSecondPassVerified:true,oneCorrectChoiceSecondPass:true,
    sixMathematicallyDistinctChoicesSecondPass:true,independentAcademicSignoff:false},
  academicReview:{confirmedTaught:false,gradeBandIndependentSignoff:false}
});
test('V3.1 source headings map into the existing Maths contract WITHOUT inventing academic QA',()=>{
 const p=stageMathsV31Question(sample());
 assert.equal(p.question.topic,'indices');
 assert.equal(p.question.grade,'7');
 assert.equal(p.question.templateId,'V2-INDICES-1');
 assert.equal(p.question.id,'LUX-MATH-Y9-INDICES-001');
 assert.equal(p.question.options[1].latex,'2');
 assert.equal(p.question.workedSolution.length,2);
 assert.equal(p.question.academicQA,'pending');
 assert.equal(p.question.taughtVerified,false);
 assert.equal(p.eligible,false);
 assert.equal(validateMathQuestion(p.question).valid,false);
 assert.ok(p.issues.includes('teacher-taught-subskill-unverified'));
 assert.ok(p.issues.includes('ipad-maths-rendering-unverified'));
 assert.ok(p.issues.includes('misconception-distractor-review-required'));
});
test('Second-round pack self-declared math pass is never equivalent to an independent teacher+GCSE sign-off',()=>{
 const x=sample();x.qa.mathSecondPassVerified=true;
 assert.equal(stageMathsV31Question(x).eligible,false);
});
test('Missing any one distractor pedagogical rationale prevents academic enablement',()=>{
 const x=sample();
 const s={
   bankSha256:V31_SOURCE_SHA256,questionId:x.id,
   teacherTaughtConfirmed:true,teacherEvidence:'teacher page / taught subsection',
   gradeIndependentlyCalibrated:true,gradeBenchmark:'GCSE Higher item matched and reviewed',
   workedSolutionProofChecked:true,mathsChecker:'separate independent checker',
   pedagogyReviewer:'independent curriculum specialist',
   distractorRationales:{A:'zero exponent misconception',C:'wrong base conversion',
      D:'multiply exponents instead of adding',E:'miss a minus sign',F:'incorrect power cancellation'},
   ipadNativeMathMLVerified:true,rendererEvidence:'iPad WebKit offline MathML question and worked steps screenshot QA'
 };
 assert.equal(stageMathsV31Question(x,s).eligible,true,'synthetic fully evidenced manifest');
 delete s.distractorRationales.E;
 assert.equal(stageMathsV31Question(x,s).eligible,false,'missing review for E');
});
test('A duplicate ID or an incomplete raw pack is rejected before any import',()=>{
 const x=sample();
 const invalid=auditMathsV31Pack({version:'3.1-independent-maths-second-pass',questions:[x,{...x}]});
 assert.ok(invalid.issues.includes('expect-200-questions'));
 assert.ok(invalid.issues.includes('duplicate-question-ID'));
 assert.ok(invalid.issues.includes('independently-verified-raw-bank-sha-required'));
 assert.ok(invalid.issues.includes('source-header-question-count-mismatch'));
 assert.equal(invalid.eligible,0);
});

test('A signed-looking record cannot bypass the independent raw-bank digest or six A-F option keys',()=>{
 const q=sample();
 assert.ok(stageMathsV31Question({...q,options:q.options.map(o=>({...o,id:o.id.toLowerCase()}))}).issues.includes('option-schema-invalid'));
 assert.ok(stageMathsV31Question({...q,qa:{...q.qa,mathSecondPassVerified:false}}).issues.includes('source-maths-second-pass-incomplete'));
 const fake={version:'3.1-independent-maths-second-pass',questionCount:200,
   questions:Array.from({length:200},(_,i)=>({...q,id:'sample-'+i}))};
 assert.ok(auditMathsV31Pack(fake).issues.includes('independently-verified-raw-bank-sha-required'));
});
