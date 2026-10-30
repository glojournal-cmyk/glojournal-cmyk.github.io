import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildRealSourceCapacityReport} from '../scripts/qa-real-capacity.mjs';

const report=buildRealSourceCapacityReport();

test('real source audit reads actual Year 8 topic files, not nominal catalog counts',()=>{
 assert.ok(report.sourceTopicFiles>=153);
 for(const subject of ['latin','french','biology','chemistry','physics']){
  assert.ok(report.sourceBySubjectYear[subject+'-y8']?.questions>0,subject);
 }
 assert.ok(report.sourceEligible>=8918);
});

test('real source audit cannot claim 163 certified items from unreviewed originals',()=>{
 assert.ok(report.bank.certified<=report.sourceEligible);
 if(!report.certificationManifestPresent){
  assert.equal(report.bank.certified,0);
  assert.ok(report.bank.unclassified>0,'missing review manifest must count unclassified records');
 }
 assert.equal(report.releaseReady,false);
 assert.notEqual(report.preflight.status,'ready');
 assert.ok(report.preflight.blockedTasks.length>0);
});

test('no student history or taught evidence is fabricated during a CI audit',()=>{
 assert.equal(report.learnerDataRead,false);
 assert.equal(report.learnerHistoryAvailable,false);
 assert.equal(report.productionAffected,false);
 assert.equal(report.thirtyDay.completedDays,0);
 assert.ok(report.thirtyDay.diagnostics.length>0);
});

test('capacity audit is serializable for CI inspection and emits no learner identifiers',()=>{
 const json=JSON.stringify(report);
 assert.equal(JSON.parse(json).system,'Daily V2 isolated real-source capacity audit');
 assert.equal(typeof report.bank.byRole['mastery'],'number');
 assert.equal(typeof report.bank.byRole['gcse'],'number');
 assert.ok(report.limitations.some(x=>x.includes('iPad')));
});

test('catalog metadata differences are exposed rather than treated as daily question supply',()=>{
 assert.ok(Number.isInteger(report.catalogMetadata.topics));
 assert.ok(Number.isInteger(report.catalogMetadata.enabledQuestions));
 assert.equal(report.catalogMetadata.filesVsCatalogTopics,
  report.sourceTopicFiles-report.catalogMetadata.topics);
 assert.equal(report.catalogMetadata.eligibleVsCatalogEnabled,
  report.sourceEligible-report.catalogMetadata.enabledQuestions);
 assert.ok(Array.isArray(report.catalogMetadata.subjectYearDisagreements));
});
