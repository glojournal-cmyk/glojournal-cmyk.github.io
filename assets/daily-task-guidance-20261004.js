const topicOf = task => task.assignedTopic || task.reviewTopic || task.focusTopic || null;
const subjectOf = task => task.assignedSubject || task.reviewSubject || task.focusSubject || null;
const formal = task => ['study-session','adaptive-focus','y8-practise','y8-mastery','year8-long-review'].includes(task.id);
export function dailyTaskGuidance(task, daily = []) {
  const remaining = Math.max(0, Number(task.target) - Number(task.progress));
  const topic = topicOf(task), subject = subjectOf(task);
  let rule;
  switch (task.id) {
    case 'study-session': rule = '10 formal answers across today’s study. The linked topic is your suggested starting point.'; break;
    case 'adaptive-focus': rule = topic ? '4 formal answers on the assigned priority topic.' : '4 formal answers in the assigned priority subject.'; break;
    case 'y8-practise': rule = `10 formal answers on this assigned Year ${task.assignedYear || 8} topic. Earlier topics must be mastered before the path advances.`; break;
    case 'y8-mastery': case 'year8-long-review': rule = '10 foundation questions, then 15 mastery questions. Completing this task is separate from earning formal topic mastery.'; break;
    case 'french-vocab': case 'latin-vocab': rule = '30 different Year 7–8 words answered correctly. Wrong answers do not increase this counter.'; break;
    case 'mistake-review': rule = task.target === 1 && task.progress >= task.target && /clear/i.test(task.title) ? 'No previous mistakes are due today. This task is already clear.' : 'Review the assigned previous mistakes; complete each required repair.'; break;
    default: rule = task.detail || 'Complete the assigned activity.';
  }
  const related = formal(task) && task.id !== 'study-session' ? daily.filter(other => {
    if (other.id === task.id || !formal(other)) return false;
    if (other.id === 'study-session') return true;
    const otherTopic = topicOf(other);
    if (topic && otherTopic) return topic === otherTopic;
    return other.id === 'adaptive-focus' && subject && subjectOf(other) === subject;
  }) : [];
  return {rule, remaining, unit: /-vocab$/.test(task.id) ? 'correct words' : formal(task) ? 'answers' : 'steps',
    shared: related.map(other => other.id === 'study-session' ? 'Daily study total' : other.title)};
}
