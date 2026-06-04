(function () {
  if (document.body.dataset.page !== "courses") {
    return;
  }

  const app = window.DesignoraApp;
  if (!app) return;

  let currentFilter = "all";
  let stateCache = null;

  function filterCourses(courses) {
    if (currentFilter === "all") return courses;
    if (currentFilter === "active") return courses.filter((course) => Number(course.progress || 0) < 100);
    if (currentFilter === "completed") return courses.filter((course) => Number(course.progress || 0) >= 100);
    return courses.filter((course) => course.category === currentFilter);
  }

  function render() {
    const grid = document.getElementById("coursesGrid");
    const count = document.getElementById("coursesCount");
    if (!grid || !stateCache) return;

    const courses = filterCourses(stateCache.stats.courses);
    if (count) count.textContent = `${courses.length} ta yo'nalish`;

    if (!courses.length) {
      grid.innerHTML = `
        <article class="empty-card">
          <i data-lucide="book-open"></i>
          <strong>Bu filtrda hozircha kurs yo'q.</strong>
          <p>Filtrni almashtiring yoki katalogdan yangi yo'nalish boshlang.</p>
          <a class="btn btn-primary" href="/catalog">Katalogni ko'rish</a>
        </article>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.innerHTML = courses
      .map((course, index) => {
        const courseLink = stateCache.source === "live" && course.id && !course.__demo ? `/course/${course.id}` : "/catalog";
        return `
          <article class="listing-card reveal is-visible lift-hover">
            <div class="listing-cover ${index % 3 === 1 ? "listing-cover--cyan" : index % 3 === 2 ? "listing-cover--orange" : ""}">
              <div class="course-cover-top">
                <span class="course-tag">${Number(course.progress || 0) >= 100 ? "Yakunlangan" : "Jarayonda"}</span>
                <i data-lucide="${app.iconForCategory(course.category)}"></i>
              </div>
              <div class="course-cover-bottom">
                <div>
                  <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${course.category || "Kurs"}</div>
                  <div style="margin-top:8px;font-family:'Poppins',sans-serif;font-size:30px;line-height:1;">${course.progress}%</div>
                </div>
                <div class="course-lesson-stack">
                  <span>${Math.max(3, Math.round((course.hours_spent || 5) * 2))}</span>
                  <span>XP</span>
                </div>
              </div>
            </div>
            <div class="listing-body">
              <div>
                <h3 class="listing-title">${course.title}</h3>
                <p class="listing-desc">${Number(course.progress || 0) >= 100 ? "Bu yo'nalishni yakunladingiz va istalgan payt qayta ko'rishingiz mumkin." : "Faol yo'nalishda amaliy checkpoint va mentor tayyor natija bilan davom eting."}</p>
              </div>
              <div class="listing-stats">
                <span>${course.hours_spent || 0} soat o'rganildi</span>
                <span>Oxirgi faollik ${app.formatDate(course.last_activity || Date.now())}</span>
              </div>
              <div>
                <div class="progress-track">
                  <div class="progress-fill" data-course-progress="${course.progress}"></div>
                </div>
                <div class="course-progress-row">
                  <span>${course.progress}% bajarildi</span>
                  <span>${Math.max(0, 100 - Number(course.progress || 0))}% qoldi</span>
                </div>
              </div>
              <div class="listing-footer">
                <span class="chip"><strong>${Number(course.progress || 0) >= 100 ? "Sertifikat" : "Faol streak"}</strong></span>
                <a class="btn btn-secondary" href="${courseLink}">${Number(course.progress || 0) >= 100 ? "Ko'rish" : "Davom ettirish"}</a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    document.querySelectorAll("[data-course-progress]").forEach((element) => {
      app.animateProgress(element, element.dataset.courseProgress);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      stateCache = await app.getAppState();
      render();
    } catch (error) {
      if (error.code !== "auth") {
        app.showToast("Kurslar bo'yicha demo ma'lumot ko'rsatilyapti.", "info", "Demo rejim");
      }
    }

    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
        render();
      });
    });
  });
})();
