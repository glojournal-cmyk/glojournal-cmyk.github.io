import {assignment, dailyAnswer, dailyScore, schoolDay} from '/assets/math-study/higher-daily-20261125.js';
import {readMarkedAnswers, saveFirstMathsAnswer} from '/assets/durable-study-evidence-20261018.js?maths=20261125';

function openPractice(reserved) {
  const prefix = 'lux-maths-higher-practice:';
  const cards = [...document.querySelectorAll('[data-question]')];
  const jump = document.getElementById('jump');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const progress = document.getElementById('progress');
  const temporary = new Map();
  let index = 0;

  function read(key) {
    try { return temporary.get(key) ?? localStorage.getItem(prefix + key); }
    catch { return temporary.get(key); }
  }
  function save(key, value) {
    try { localStorage.setItem(prefix + key, value); temporary.delete(key); }
    catch {
      temporary.set(key, value);
      document.getElementById('save-warning').hidden = false;
    }
  }
  function render(target, moveFocus = false) {
    cards[index].hidden = true;
    index = target;
    const card = cards[index];
    card.hidden = false;
    const id = card.dataset.question;
    const held = reserved.has(id) && schoolDay()===day;
    document.getElementById('reserved').hidden = !held;
    const selected = held ? null : read(id);
    const answered = /^[A-F]$/.test(selected || '');
    const correct = card.dataset.correct;
    jump.value = id;
    prev.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    for (const button of card.querySelectorAll('[data-choice]')) {
      button.disabled = answered || held;
      button.classList.toggle('picked', answered && button.dataset.choice === selected);
      button.classList.toggle('correct', answered && button.dataset.choice === correct);
    }
    card.querySelector('.solution').hidden = !answered;
    if (answered) card.querySelector('.result').textContent = selected === correct
      ? 'Correct. You chose ' + selected + '.'
      : 'You chose ' + selected + '. The correct answer is ' + correct + '.';
    const done = cards.filter(c => /^[A-F]$/.test(read(c.dataset.question) || '')).length;
    progress.textContent = 'Question ' + (index + 1) + ' of ' + cards.length + ' · ' + done + ' answered';
    if (moveFocus) {
      const stem = card.querySelector('h2');
      stem.tabIndex = -1;
      stem.focus();
    }
  }
  function go(target) {
    if (target < 0 || target >= cards.length) return;
    save('place', cards[target].dataset.question);
    render(target, true);
  }
  document.getElementById('questions').addEventListener('click', event => {
    const button = event.target.closest('[data-choice]');
    const card = cards[index];
    if (!button || !card.contains(button) || button.disabled) return;
    const id = card.dataset.question;
    if (!/^[A-F]$/.test(read(id) || '')) save(id, button.dataset.choice);
    render(index);
  });
  jump.addEventListener('change', () => go(jump.selectedIndex));
  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));
  window.addEventListener('storage', event => {
    if (event.key?.startsWith(prefix) && event.key !== prefix + 'place') render(index);
  });
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  const topicIndex = requestedTopic ? cards.findIndex(c => c.dataset.topic === requestedTopic) : -1;
  const savedIndex = cards.findIndex(c => c.dataset.question === read('place'));
  render(topicIndex >= 0 ? topicIndex : Math.max(0, savedIndex));
}

const day = schoolDay();
const plan = assignment(day);
const params = new URLSearchParams(location.search);
const formal = params.size === 1 && params.get('daily') === '1';

async function openDaily() {
  document.title = 'Maths Daily · Scholar’s Garden';
  document.querySelector('h1').textContent = 'Year 9 Maths Daily';
  document.getElementById('intro').textContent = 'Answer all 10 independently. Score 9/10 or 10/10 to earn one completed Daily task. Only the first answer counts.';
  const switcher = document.getElementById('switch-mode');
  switcher.href = './'; switcher.textContent = 'Back to practice';
  document.querySelector('label[for="jump"]').hidden = true;
  document.getElementById('jump').hidden = true;
  document.getElementById('prev').hidden = true;
  const next = document.getElementById('next');
  const progress = document.getElementById('progress');
  const panel = document.getElementById('questions');
  const all = new Map([...panel.querySelectorAll('article')].map(card => [card.dataset.question,card]));
  const cards = plan.map(([id,key]) => {
    const card = all.get(id);
    if (!card || card.dataset.correct!==key) throw Error('The question bank has changed. Reload before answering.');
    return card;
  });
  if (cards.length!==10) throw Error('Today’s question set could not be loaded.');
  let active;
  let busy=false;
  let score;
  async function show() {
    next.hidden=true;
    if (active) active.hidden=true;
    score=dailyScore(await readMarkedAnswers(),day);
    if (schoolDay()!==day) throw Error('A new day has started. Reopen Maths Daily.');
    active=cards.find(card => !score.choices.has(card.dataset.question));
    if (!active) {
      panel.hidden=true;
      progress.textContent=score.correct+'/10 correct · '+(score.passed?'Counted into today’s Daily Tasks.':'Finished. The Daily target is 9/10.');
      switcher.href='/';switcher.textContent='Back to Daily Tasks';
      return;
    }
    active.hidden=false;
    progress.textContent='Question '+(score.submitted+1)+' of 10 · '+score.correct+' correct';
  }
  panel.addEventListener('click',async event => {
    const button=event.target.closest('[data-choice]');
    if (!active||!button||!active.contains(button)||busy||button.disabled) return;
    busy=true;
    const card=active, buttons=[...card.querySelectorAll('[data-choice]')];
    buttons.forEach(b=>b.disabled=true);
    try {
      const answer=dailyAnswer(day,card.dataset.question,button.dataset.choice);
      const first=await saveFirstMathsAnswer(answer);
      if (!dailyScore([first],day).choices.has(card.dataset.question)) throw Error('The saved answer could not be verified.');
      for(const b of buttons){
        b.classList.toggle('picked',b.dataset.choice===first.selectedOptionId);
        b.classList.toggle('correct',b.dataset.choice===card.dataset.correct);
      }
      card.querySelector('.result').textContent=first.correct?'Correct. First answer saved.':
        'Your first choice was '+first.selectedOptionId+'. The correct answer is '+card.dataset.correct+'.';
      card.querySelector('.solution').hidden=false;
      next.textContent=score.submitted===9?'See Daily result':'Next question';
      next.hidden=false;
    } catch(e) {
      progress.textContent='Could not confirm your Daily answer. '+e.message;
      buttons.forEach(b=>b.disabled=false);
    } finally {busy=false;}
  });
  next.addEventListener('click',()=>show().catch(fail));
  await show();
}
function fail(error) {
  document.getElementById('progress').textContent=error.message||'Could not load the saved answers. Please reopen the page.';
  document.getElementById('questions').hidden=true;
}
async function start() {
  if (formal) return openDaily();
  const score=dailyScore(await readMarkedAnswers(),day);
  openPractice(new Set(plan.map(([id])=>id).filter(id=>!score.choices.has(id))));
}
start().catch(fail);
