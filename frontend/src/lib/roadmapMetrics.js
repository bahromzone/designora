export function buildDashboardMetrics(courses, assignments, now = new Date()) {
  const open = assignments.filter((item) => item.my_submission?.status !== "graded");
  const overdue = open.filter(
    (item) => item.due_date && new Date(item.due_date).getTime() < now.getTime(),
  );
  const dueSoon = open.filter((item) => {
    if (!item.due_date) return false;
    const distance = new Date(item.due_date).getTime() - now.getTime();
    return distance >= 0 && distance <= 3 * 86400000;
  });
  const feedback = assignments.filter((item) => item.my_submission?.status === "graded");
  const average = courses.length
    ? Math.round(
        courses.reduce((sum, item) => sum + Number(item.progress_percent || 0), 0) /
          courses.length,
      )
    : 0;
  return { open, overdue, dueSoon, feedback, average };
}

export function normalizeTimestamp(value) {
  const parts = String(value || "0").split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function createImageAnnotation(event, note) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10,
    y: Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10,
    note: note.trim(),
    color: "#ef4444",
  };
}
