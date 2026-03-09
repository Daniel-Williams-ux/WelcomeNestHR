export function calcProgress(steps: { completed: boolean }[]) {
  const total = steps.length;
  const completed = steps.filter((s) => s.completed).length;

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  let milestone = 'preboarding';

  if (percent >= 80) milestone = 'beyond';
  else if (percent >= 60) milestone = '30days';
  else if (percent >= 40) milestone = 'week1';
  else if (percent >= 20) milestone = 'day1';

  return {
    percent,
    completed,
    total,
    milestone,
  };
}