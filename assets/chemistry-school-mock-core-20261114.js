// Chemistry Assessment 2: verified 20-mark papers; isolated from Daily/Mastery scores.
import {categoryOf,scorePaper} from './chemistry-exam-revision-core-20261113.js';
export const MOCK_STORAGE_KEY='lux-chemistry-school-mock-20261116-v1';
export const MOCK_DURATION_SECONDS=20*60;
export const MOCK_CATEGORY_MARKS=Object.freeze({history:4,atomic:5,formula:5,balance:6});
const diagrams=new Set([
  '/content/diagrams/chem-nov16-alpha-scattering-20261114.svg',
  '/content/diagrams/chem-nov16-atomic-models-20261114.svg',
  '/content/diagrams/chem-nov16-atom-x-20261114.svg'
]);
export function validateMockBank(source){
  if(!source||source.schoolDate!=='2026-11-16'||source.durationMinutes!==20||
     source.marksPerPaper!==20||!Array.isArray(source.papers)||source.papers.length!==3)
    throw Error('The 16 November Chemistry school mock manifest is incomplete.');
  const ids=new Set(),paperIds=new Set(),questions=[];
  for(const paper of source.papers){
    if(!['A','B','C'].includes(paper?.id)||paperIds.has(paper.id)||
       !Array.isArray(paper.questions)||paper.questions.length!==13)
      throw Error('A school mock paper is missing or incorrectly sized.');
    paperIds.add(paper.id);
    const categoryMarks={history:0,atomic:0,formula:0,balance:0};
    let diagramsInPaper=0;
    for(const question of paper.questions){
      if(!question||ids.has(question.id)||!question.id.includes('-schoolmock-'+paper.id.toLowerCase()+'-')||
         question.subject!=='chemistry'||question.year!==9||question.status!=='enabled'||
         !question.prompt||!question.answer?.accepted?.length||!question.feedback?.steps?.length||
         !Number.isInteger(question.marks)||question.marks<1||question.marks>3)
        throw Error('Malformed or duplicate mock question: '+String(question?.id));
      ids.add(question.id);
      const group=categoryOf(question);
      if(!group||!(group in categoryMarks))throw Error('Out-of-scope mock question '+question.id);
      categoryMarks[group]+=question.marks;
      if(question.format==='rubric_response'){
        if(!Array.isArray(question.markScheme)||question.markScheme.length!==question.marks||
           new Set(question.markScheme).size!==question.marks||question.markScheme.some(s=>!s.trim()))
          throw Error('Rubric mark points incomplete: '+question.id);
      }else{
        if(question.marks!==1||!['typed_short','mc_single'].includes(question.format))
          throw Error('Objective marks unsupported: '+question.id);
        if(question.format==='mc_single'&&
           (!Array.isArray(question.options)||question.options.length!==4||
            new Set(question.options).size!==4||
            question.options.filter(opt=>opt===question.answer.accepted[0]).length!==1))
          throw Error('Multiple-choice key ambiguous: '+question.id);
      }
      if(question.figure){
        if(!diagrams.has(question.figure.src)||!question.figure.alt)throw Error('Untrusted image in '+question.id);
        diagramsInPaper++;
      }
      questions.push({...question,examEligible:false});
    }
    if(diagramsInPaper<2||Object.entries(MOCK_CATEGORY_MARKS).some(([key,n])=>categoryMarks[key]!==n))
      throw Error('The mock is not exactly 20 marks across all four school topics: '+paper.id);
  }
  return {papers:source.papers,questions};
}
export function mockQuestions(verified,id){
  const paper=verified?.papers?.find(p=>p.id===id);
  if(!paper)throw Error('Unknown Chemistry mock version.');
  const byId=new Map(verified.questions.map(q=>[q.id,q]));
  return paper.questions.map(q=>byId.get(q.id));
}
export function validateMockState(value,verified){
  if(!value||value.version!==1||!Array.isArray(value.history)||value.history.length>20)
    throw Error('Saved mock data has an invalid version or history.');
  const questionIds=new Set(verified.questions.map(q=>q.id));
  const validateSession=session=>{
    if(!session)return;
    const paper=verified.papers.find(p=>p.id===session.paperId);
    const expected=paper?.questions?.map(q=>q.id)||[];
    if(!paper||!Array.isArray(session.questionIds)||session.questionIds.length!==expected.length||
       session.questionIds.some((id,i)=>id!==expected[i])||
       !Number.isInteger(session.index)||session.index<0||session.index>=expected.length||
       typeof session.startedAt!=='string'||!Number.isFinite(Date.parse(session.startedAt))||
       !session.answers||typeof session.answers!=='object'||Array.isArray(session.answers))
      throw Error('Invalid saved Chemistry mock session.');
    for(const [id,answer] of Object.entries(session.answers))
      if(!questionIds.has(id)||!expected.includes(id)||typeof answer!=='string'||answer.length>2000)
        throw Error('Invalid saved mock answer.');
    if(session.reviewMarks!==undefined){
      if(!session.reviewMarks||typeof session.reviewMarks!=='object'||Array.isArray(session.reviewMarks))
        throw Error('Invalid saved self-review marks.');
      for(const [id,award] of Object.entries(session.reviewMarks)){
        const q=verified.questions.find(q=>q.id===id);
        if(!q||q.format!=='rubric_response'||!expected.includes(id)||
           !Number.isInteger(award)||award<0||award>q.marks)
          throw Error('Invalid self-reviewed Chemistry mark.');
      }
    }
  };
  validateSession(value.active);validateSession(value.latest);
  for(const session of value.history)validateSession(session);
  return value;
}
export function getMockScore(verified,session){
  if(!session)throw Error('Cannot score an empty paper.');
  return scorePaper(verified.questions,session);
}
export function remainingSeconds(startedAt,now=Date.now()){
  const start=Date.parse(startedAt);
  if(!Number.isFinite(start))throw Error('Invalid mock start time.');
  return Math.max(0,MOCK_DURATION_SECONDS-Math.max(0,Math.floor((now-start)/1000)));
}
