// Practice-only storage. Separate keys preserve answers to different questions across tabs.
(() => {
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
    const selected = read(id);
    const answered = /^[A-F]$/.test(selected || '');
    const correct = card.dataset.correct;
    jump.value = id;
    prev.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    for (const button of card.querySelectorAll('[data-choice]')) {
      button.disabled = answered;
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
})();
