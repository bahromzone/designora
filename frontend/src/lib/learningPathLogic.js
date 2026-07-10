export function nextLearningStep(path) {
  return path?.steps?.find((step) => !step.completed && !step.locked) || null;
}

export function pathStatus(path) {
  if (!path?.started) return "not-started";
  if (path.progress_percent >= 100) return "completed";
  return "in-progress";
}
