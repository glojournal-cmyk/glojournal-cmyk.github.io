/* UI-only selector for the Home Journey. Never writes XP, task credit or progress. */
(function (root) {
  const PET_COSTS = [50, 90, 140, 200];
  const finished = task => Number(task?.target) > 0 && Number(task.progress) >= Number(task.target);
  const validHref = (journey, value) => {
    try { return journey?.navigationHref(value) || null; }
    catch { return null; }
  };

  function nextReward(storage) {
    let pet = {};
    try { pet = JSON.parse(storage?.getItem("lux-pet-companion-v1") || "{}") || {}; }
    catch { pet = {}; }
    const species = String(pet.species || "moss-hornling");
    const level = Math.max(1, Math.min(5, Number(pet.petLevels?.[species] || pet.highestStage) || 1));
    const wallet = Math.max(0, Number(pet.masteryPoints) || 0);
    const goal = PET_COSTS[level - 1];
    return {
      level, wallet, goal: goal ?? null,
      remaining: goal == null ? 0 : Math.max(0, goal - wallet),
      label: goal == null ? "All five pet stages reached" : `Stage ${level + 1} · ${Math.max(0, goal - wallet)} MP still needed`
    };
  }

  function homeJourney(state, journey, storage, now) {
    const calendar = journey?.day?.(now);
    const tasks = Array.isArray(state?.daily) ? state.daily : [];
    // Never show the legacy six-task SSR count as today's actual workload.
    const ready = !!calendar && state?.today === calendar && tasks.length === 10;
    if (!ready) return { ready:false, count:0, total:10, rows:[], next:null,
      title:"Opening today's journey", subtitle:"Syncing your saved tasks…" };
    const rows = tasks.map(task => ({
      id:String(task.id || ""),title:String(task.title || task.id || "Daily task"),
      target:Math.max(1,Number(task.target)||1),
      progress:Math.max(0,Math.min(Math.max(1,Number(task.target)||1),Number(task.progress)||0)),
      done:finished(task),href:validHref(journey,task.href)
    }));
    const count = rows.filter(row => row.done).length;
    const remaining = rows.find(row => !row.done && row.href);
    let candidates=[];
    try { candidates=journey.resumeCandidates(state,now) || []; } catch {}
    // A paused current-day daily question outranks an unrelated older practice draft.
    const resume = candidates.find(item => item.daily && item.planDate === calendar) || candidates[0] || null;
    const resumeLink = resume && validHref(journey,resume.href);
    const resumeTask = resume?.dailyTaskId && rows.find(row => row.id === resume.dailyTaskId);
    let next;
    if (resume && resumeLink && (resumeTask ? !resumeTask.done : true)) {
      next = { title:resumeTask?.title || String(resume.title || "Saved practice"),
        subtitle:`Question ${Number(resume.index)+1} / ${Number(resume.total)} · saved place`,
        href:resumeLink, kind:"resume" };
    } else if (remaining) {
      next = {title:remaining.title,subtitle:`${remaining.progress} / ${remaining.target} completed`,
        href:remaining.href,kind:"task"};
    } else {
      next = {title:"Today's journey is complete",subtitle:"All 10 tasks are counted.",
        href:"/garden",kind:"complete"};
    }
    return {ready:true,count,total:rows.length,rows,next,reward:nextReward(storage)};
  }

  root.LuxHomeJourneyV2Logic={homeJourney,nextReward,finished};
})(globalThis);
