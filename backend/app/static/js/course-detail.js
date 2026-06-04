(function () {
  if (document.body.dataset.page !== "course-detail") {
    return;
  }

  const app = window.DesignoraApp;
  if (!app) return;

  async function startCourse() {
    const button = document.getElementById("courseStartButton");
    if (!button) return;
    const courseId = button.dataset.courseId;
    if (!courseId) {
      window.location.href = "/courses";
      return;
    }

    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Saving progress...";

    try {
      await app.fetchJson(`/api/profile/progress/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percent: 1, minutes_spent: 15 }),
      });
      app.showToast("Your course was added to My Courses.", "success", "Ready to learn");
      window.setTimeout(() => {
        window.location.href = "/courses";
      }, 700);
    } catch (error) {
      button.disabled = false;
      button.textContent = originalLabel;
      app.showToast(error.message || "Unable to update course progress.", "error", "Course start");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const progressFill = document.getElementById("detailProgressFill");
    if (progressFill) {
      app.animateProgress(progressFill, progressFill.dataset.progressValue);
    }

    const ring = document.getElementById("detailRing");
    if (ring) app.setRing(ring, ring.dataset.value);

    const button = document.getElementById("courseStartButton");
    if (button) button.addEventListener("click", startCourse);
  });
})();
