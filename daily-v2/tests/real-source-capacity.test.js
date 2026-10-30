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

test('missing catalog lesson sources are reported by exact topic identity',()=>{
 const c=report.catalogMetadata;
 assert.ok(Array.isArray(c.missingSources));
 assert.ok(Array.isArray(c.unlistedSources));
 assert.ok(Array.isArray(c.duplicateSourceTopics));
 assert.ok(Array.isArray(c.duplicateCatalogTopics));
 assert.ok(c.missingSources.every(x=>x.topicId&&x.subject&&Number.isInteger(x.year)));
 assert.equal(c.missingSources.length-c.unlistedSources.length,
  c.uniqueCatalogTopicKeys-c.uniqueSourceTopicKeys);
 assert.ok(c.uniqueCatalogTopicKeys<=c.topics);
 assert.ok(c.uniqueSourceTopicKeys<=report.sourceTopicFiles);
 assert.equal(c.duplicateCatalogTopics.reduce((n,x)=>n+x.count-1,0),
  c.topics-c.uniqueCatalogTopicKeys);
 assert.equal(c.duplicateSourceTopics.reduce((n,x)=>n+x.count-1,0),
  report.sourceTopicFiles-c.uniqueSourceTopicKeys);
 assert.ok(c.missingSources.length>0,'known source gap must not disappear into aggregate totals');
});
test('read-only capacity audit distinguishes unsupported subject rows from V2 subject supply',()=>{
 const c=report.catalogMetadata;
 assert.ok(c.unsupportedSubjectEligible>=0);
 assert.ok(c.supportedV2SubjectEligible>=0);
 assert.equal(c.supportedV2SubjectEligible+c.unsupportedSubjectEligible,report.sourceEligible);
 assert.ok(c.unsupportedSubjectEligible>0,'existing English sources are not eligible for five-subject V2');
});
