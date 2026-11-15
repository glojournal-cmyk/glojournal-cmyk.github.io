// Academic review EVIDENCE gate. This does not perform or replace human subject review.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const REVIEW_FIELDS = ['prompt','question','passage','stimulus','options','answer',
  'modelAnswer','markScheme','markingScheme','markKeywords','feedback',
  'examGuidance','source','sourceScope','specification','topic','year',
  'marks','difficulty','diagram','figure','coverageTags'];
const REVIEW_CHECKS = ['curriculumFit','scientificOrLinguisticAccuracy',
  'answerAndReasonableAlternatives','markingFairness','explanationQuality'];

export function isQuestionBankPath(p) {
  return /^(assessment|content\/topics|content\/exam-revision|content\/exam-practice|study)\/.*\.json$/i.test(p);
}

export function fingerprintQuestion(question) {
  const content = Object.fromEntries(REVIEW_FIELDS
    .filter(k=>Object.prototype.hasOwnProperty.call(question,k))
    .map(k=>[k,question[k]]));
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

export function indexQuestions(doc) {
  const out = new Map();
  const errors = [];
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (Array.isArray(value.questions)) {
      for (const q of value.questions) {
        if (!q || typeof q !== 'object' || typeof q.id !== 'string' || !q.id.trim()) {
          errors.push('missing_question_id');
          continue;
        }
        if (out.has(q.id)) errors.push('duplicate_question_id:' + q.id);
        out.set(q.id,q);
      }
    }
    for (const [key,v] of Object.entries(value)) {
      if (key !== 'questions' && v && typeof v === 'object') walk(v);
    }
  }
  walk(doc);
  // Fail closed on unrecognized question-bearing schemas, rather than silently pass.
  if (!out.size && JSON.stringify(doc).includes('"questions"')) {
    errors.push('question_container_not_parsed');
  }
  return {questions:out, errors};
}

export function compareQuestionBanks(previous,current,file) {
  const before=indexQuestions(previous||{});
  const after=indexQuestions(current||{});
  const issues=[...before.errors,...after.errors].map(reason=>({file,reason}));
  const changed=[],removed=[];
  for (const [id,q] of after.questions) {
    if (!before.questions.has(id)||fingerprintQuestion(q)!==fingerprintQuestion(before.questions.get(id))) {
      changed.push({file,id,fingerprint:fingerprintQuestion(q),kind:before.questions.has(id)?'changed':'new'});
    }
  }
  for (const id of before.questions.keys()) if (!after.questions.has(id)) removed.push({file,id});
  return {changed,removed,issues};
}

export function evidenceIssues(changed,ledger) {
  const reviews=Array.isArray(ledger?.reviews)?ledger.reviews:[];
  const issues=[];
  for (const item of changed) {
    const review=reviews.find(r=>r.file===item.file&&r.id===item.id&&r.fingerprint===item.fingerprint);
    if (!review) {issues.push({...item,reason:'missing_independent_academic_review_evidence'});continue;}
    const hasText=k=>typeof review[k]==='string'&&review[k].trim().length>=8;
    if (!hasText('reviewer')||!hasText('reviewDate')||!hasText('sourceReference')||
        !hasText('reviewNotes')||!REVIEW_CHECKS.every(k=>review.checks?.[k]===true)) {
      issues.push({...item,reason:'incomplete_academic_review_evidence'});
    }
  }
  return issues;
}

function git(args) {
  return execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
}
function loadVersion(base,file) {
  try { return JSON.parse(git(['show',base+':'+file])); }
  catch { return null; }
}

export function audit({base,head='HEAD',root=process.cwd(),ledgerPath='qa-reports/academic-review-ledger-20261115.json'}) {
  if (!base || !/^[\w./-]+$/.test(base)) throw Error('Provide a verified QA_BASE_SHA or QA_BASE_REF');
  const changedFiles=git(['diff','--name-only','--diff-filter=ACDMRT',base,head])
    .split('\n').filter(Boolean);
  const reviewedFiles=changedFiles.filter(isQuestionBankPath);
  const report={base,head,scannedFiles:reviewedFiles,changedQuestions:[],
    removedQuestions:[],issues:[],limitations:[
      'Automated evidence check is NOT independent academic validation.',
      'Only changed JSON question banks are gated; legacy unmodified content and JS/HTML-driven banks are not certified.',
      'Teacher/exam-board moderation and physical iPad validation are NOT performed by this gate.'
    ]};
  let ledger={reviews:[]};
  try {ledger=JSON.parse(fs.readFileSync(path.join(root,ledgerPath),'utf8'));}
  catch {report.issues.push({reason:'review_ledger_missing_or_unreadable',file:ledgerPath});}
  for (const file of reviewedFiles) {
    let current=null;
    const p=path.join(root,file);
    if (fs.existsSync(p)) {
      try {current=JSON.parse(fs.readFileSync(p,'utf8'));}
      catch {report.issues.push({reason:'invalid_bank_json',file});continue;}
    }
    const delta=compareQuestionBanks(loadVersion(base,file),current,file);
    report.changedQuestions.push(...delta.changed);
    report.removedQuestions.push(...delta.removed);
    report.issues.push(...delta.issues);
  }
  report.issues.push(...evidenceIssues(report.changedQuestions,ledger));
  report.summary={changedBankFiles:reviewedFiles.length,
    changedOrAddedQuestions:report.changedQuestions.length,
    deletedQuestions:report.removedQuestions.length,
    reviewEvidenceMatched:report.changedQuestions.length -
      report.issues.filter(x=>x.reason?.includes('academic_review_evidence')).length,
    blockers:report.issues.length};
  return report;
}

const cli=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if (cli) {
  const result=audit({base:process.env.QA_BASE_SHA||process.env.QA_BASE_REF});
  fs.mkdirSync('test-results',{recursive:true});
  fs.writeFileSync('test-results/academic-review-evidence-20261115.json',
    JSON.stringify(result,null,2)+'\n');
  console.log('ACADEMIC_REVIEW_EVIDENCE',JSON.stringify(result.summary));
  if (result.issues.length) {
    console.error(JSON.stringify(result.issues.slice(0,30),null,2));
    process.exitCode=1;
  }
}
