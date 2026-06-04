(function () {
  if (document.body.dataset.page !== "dashboard") {
    return;
  }

  const app = window.DesignoraApp;
  if (!app) return;

  function averageProgress(courses) {
    if (!courses.length) return 0;
    return Math.round(courses.reduce((total, course) => total + Number(course.progress || 0), 0) / courses.length);
  }

  function buildSchedule(courses) {
    const focus = courses.slice(0, 3);
    const defaults = [
      {
        time: "09:30 AM",
        label: "Jonli sessiya",
        title: "Dizayn ko'rigi uchrashuvi",
        note: "Oxirgi modulni sayqallang va mentor izohlarini oling.",
        tags: ["Mentor", "Feedback"],
      },
      {
        time: "01:00 PM",
        label: "Amaliy blok",
        title: "Fokuslangan ish sprinti",
        note: "Bugungi darsni portfolio uchun tayyor topshiriqda qo'llang.",
        tags: ["Amaliyot", "Topshiriq"],
      },
      {
        time: "06:45 PM",
        label: "Hamjamiyat",
        title: "Reyting yakuni",
        note: "Progressni accountability guruhi bilan solishtirib, xulosalarni yozing.",
        tags: ["Reyting", "Tahlil"],
      },
    ];

    return defaults.map((item, index) => {
      const course = focus[index];
      if (!course) return item;
      return {
        time: item.time,
        label: item.label,
        title: course.title,
        note: `Ushbu yo'nalishdagi qolgan ${Math.max(1, 100 - Number(course.progress || 0))}% qismni davom ettiring.`,
        tags: [course.category || "Kurs", index === 0 ? "Yuqori fokus" : "Sur'at"],
      };
    });
  }

  function buildTasks(courses) {
    const active = courses.filter((course) => Number(course.progress || 0) < 100).slice(0, 3);
    if (!active.length) {
      return [
        {
          title: "Keyingi o'quv maqsadini belgilang",
          note: "Streakni saqlash uchun katalogdan yangi yo'nalish tanlang.",
          percent: 100,
          status: "Tayyor",
        },
      ];
    }
    return active.map((course, index) => ({
      title: index === 0 ? "Bugungi modulni yakunlang" : index === 1 ? "Amaliy topshiriqni yuboring" : "Mentor izohlarini ko'ring",
      note: `${course.title} hozir ${course.progress}% bajarilgan.`,
      percent: Math.min(100, Number(course.progress || 0) + (index === 0 ? 8 : index === 1 ? 14 : 6)),
      status: index === 0 ? "Today" : index === 1 ? "Tomorrow" : "This week",
    }));
  }

  function buildLeaderboard(profile, stats) {
    const entries = [
      { name: "Ariana Bloom", role: "Visual Design", score: 1560 },
      { name: "Theo Walker", role: "Frontend Lab", score: 1440 },
      { name: profile.name || "Siz", role: "Siz", score: Number(stats.points || 0) || 1280, isUser: true },
      { name: "Naomi Reed", role: "Motion Club", score: 1180 },
      { name: "Jordan Cole", role: "Systems Pod", score: 1075 },
    ];
    return entries
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => Object.assign({}, entry, { rank: index + 1 }));
  }

  function renderCourses(state) {
    const target = document.getElementById("dashboardCourses");
    if (!target) return;
    const activeCourses = state.stats.courses.filter((course) => Number(course.progress || 0) < 100).slice(0, 3);
    const list = activeCourses.length ? activeCourses : state.stats.courses.slice(0, 3);

    target.innerHTML = list
      .map((course, index) => {
        const courseLink = state.source === "live" && course.id && !course.__demo ? `/course/${course.id}` : "/catalog";
        return `
          <article class="course-panel-card reveal is-visible lift-hover">
            <div class="course-panel-cover ${app.coverClass(index)}">
              <div class="course-panel-cover-top">
                <span class="chip">${index === 0 ? "Ustuvor" : index === 1 ? "Jarayonda" : "Sur'at"}</span>
                <i data-lucide="${app.iconForCategory(course.category)}"></i>
              </div>
              <div class="course-panel-cover-bottom">
                <div>
                  <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${course.category || "Course"}</div>
                  <div style="margin-top:8px;font-family:'Poppins',sans-serif;font-size:32px;line-height:1;">${course.progress}%</div>
                </div>
                <div class="course-lesson-stack">
                  <span>${Math.max(4, Math.round((course.hours_spent || 6) * 2))}</span>
                  <span>XP</span>
                </div>
              </div>
            </div>
            <div class="course-panel-body">
              <div>
                <h3 class="course-panel-title">${course.title}</h3>
                <p class="course-panel-text">${course.is_completed ? "Yakunlangan va qayta ko'rishga tayyor." : "To'xtagan joyingizdan mentor yo'nalishi va tez feedback bilan davom eting."}</p>
              </div>
              <div class="course-panel-meta">
                <span>${course.hours_spent || 0} hrs logged</span>
                <span>${course.is_completed ? "Sertifikat tayyor" : "Haftalik sprint faol"}</span>
              </div>
              <div>
                <div class="progress-track">
                  <div class="progress-fill" data-course-progress="${course.progress}"></div>
                </div>
                <div class="course-progress-row">
                  <span>${course.progress}% bajarilgan</span>
                  <span>${course.is_completed ? "Tayyor" : `${Math.max(1, 100 - Number(course.progress || 0))}% qoldi`}</span>
                </div>
              </div>
              <div class="course-panel-foot">
                <div class="mentor-line">
                  <div class="avatar">${index === 0 ? "AN" : index === 1 ? "JW" : "LC"}</div>
                  <span>${index === 0 ? "Mentor Ariana" : index === 1 ? "Mentor Jordan" : "Mentor Lena"}</span>
                </div>
                <a class="btn btn-secondary" href="${courseLink}">${course.is_completed ? "Ko'rish" : "Davom ettirish"}</a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    document.querySelectorAll("[data-course-progress]").forEach((element) => {
      app.animateProgress(element, element.dataset.courseProgress);
    });
  }

  function renderActivity(state) {
    const target = document.getElementById("dashboardActivity");
    const totalNode = document.getElementById("activityTotal");
    const peakNode = document.getElementById("activityPeak");
    if (!target) return;

    const activity = state.stats.activity;
    const peak = Math.max(...activity.map((item) => Number(item.minutes || 0)), 1);
    const total = activity.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const best = activity.reduce((winner, current) =>
      Number(current.minutes || 0) > Number(winner.minutes || 0) ? current : winner,
    activity[0]);

    target.innerHTML = activity
      .map((item) => {
        const height = Math.max(16, Math.round((Number(item.minutes || 0) / peak) * 100));
        return `
          <div class="chart-bar-item">
            <div class="chart-bar-track">
              <div class="chart-bar-fill" data-bar-height="${height}" style="height:18px;"></div>
            </div>
            <strong>${item.minutes}</strong>
            <span>${app.formatDay(item.date)}</span>
          </div>
        `;
      })
      .join("");

    document.querySelectorAll("[data-bar-height]").forEach((element) => {
      requestAnimationFrame(() => {
        element.style.height = `${element.dataset.barHeight}%`;
      });
    });

    if (totalNode) totalNode.textContent = `${Math.round(total / 60)}h ${total % 60}m`;
    if (peakNode) peakNode.textContent = `${app.formatDay(best.date)} eng faol kun`;
  }

  function renderSchedule(state) {
    const target = document.getElementById("scheduleList");
    if (!target) return;
    const schedule = buildSchedule(state.stats.courses);
    target.innerHTML = schedule
      .map(
        (item) => `
          <article class="schedule-item">
            <div class="schedule-time">${item.time}<span>${item.label}</span></div>
            <div class="schedule-content">
              <strong>${item.title}</strong>
              <p>${item.note}</p>
              <div class="schedule-tags">
                ${item.tags.map((tag) => `<span class="schedule-tag">${tag}</span>`).join("")}
              </div>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderTasks(state) {
    const target = document.getElementById("taskList");
    if (!target) return;
    const tasks = buildTasks(state.stats.courses);
    target.innerHTML = tasks
      .map(
        (task) => `
          <article class="task-item">
            <div class="task-item-head">
              <strong>${task.title}</strong>
              <span class="status-pill ${task.percent >= 90 ? "success" : "warning"}">${task.status}</span>
            </div>
            <p>${task.note}</p>
            <div class="progress-track">
              <div class="progress-fill" data-task-progress="${task.percent}"></div>
            </div>
            <div class="task-meta">
              <span>${task.percent}% bajarilgan</span>
              <span>${task.percent >= 90 ? "Yaxshi holat" : "Ko'proq fokus kerak"}</span>
            </div>
          </article>
        `
      )
      .join("");

    document.querySelectorAll("[data-task-progress]").forEach((element) => {
      app.animateProgress(element, element.dataset.taskProgress);
    });
  }

  function renderLeaderboard(state) {
    const target = document.getElementById("leaderboardList");
    if (!target) return;
    const rows = buildLeaderboard(state.profile, state.stats);
    target.innerHTML = rows
      .map(
        (item) => `
          <article class="leaderboard-item">
            <div class="leaderboard-rank">${item.rank}</div>
            <div class="leaderboard-user">
              <div class="avatar ${item.isUser ? "" : "avatar--soft"}">${app.initials(item.name)}</div>
              <div>
                <strong>${item.name}</strong>
                <span>${item.role}</span>
              </div>
            </div>
            <div class="leaderboard-score">
              <strong>${item.score}</strong>
              <span>${item.isUser ? "Sizning balingiz" : "XP"}</span>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderSnapshot(state) {
    const progress = averageProgress(state.stats.courses);
    const nameNode = document.getElementById("snapshotName");
    const copyNode = document.getElementById("snapshotCopy");
    const levelNode = document.getElementById("snapshotLevel");
    const streakNode = document.getElementById("snapshotStreak");
    const projectsNode = document.getElementById("snapshotProjects");
    const certificatesNode = document.getElementById("snapshotCertificates");
    const ring = document.getElementById("snapshotRing");
    const ringValue = document.getElementById("snapshotRingValue");

    if (nameNode) nameNode.textContent = state.profile.name;
    if (copyNode) copyNode.textContent = state.profile.bio || "Tizim, motion va tayyor natijaga yo'naltirilgan mahsulot yondashuvi.";
    if (levelNode) levelNode.textContent = state.stats.level;
    if (streakNode) streakNode.textContent = state.stats.streak_days;
    if (projectsNode) projectsNode.textContent = Math.max(3, state.stats.courses_completed + 2);
    if (certificatesNode) certificatesNode.textContent = state.stats.certificates;
    if (ringValue) ringValue.textContent = `${progress}%`;
    app.setRing(ring, progress);
  }

  function renderHero(state) {
    const nameNode = document.getElementById("dashboardName");
    const subtitleNode = document.getElementById("dashboardSubtitle");
    const focusNode = document.getElementById("heroFocusValue");
    const weekNode = document.getElementById("heroWeekValue");
    const activityTotal = state.stats.activity.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const activeCourses = state.stats.courses.filter((course) => Number(course.progress || 0) < 100).length;

    if (nameNode) nameNode.textContent = state.profile.name.split(" ")[0];
    if (subtitleNode) {
      subtitleNode.textContent = activeCourses
        ? `Sizda ${activeCourses} ta faol yo'nalish, ${state.stats.pending_assignments} ta vazifa va ${state.stats.streak_days} kunlik streak bor.`
        : "Keyingi o'sish sprinti tayyor. Kurs tanlab, shu haftaning o'zida natijani boshlang.";
    }
    if (focusNode) focusNode.textContent = `${Math.round(activityTotal / 60)}h`;
    if (weekNode) weekNode.textContent = `${state.stats.points} XP`;
  }

  function renderMetrics(state) {
    const map = {
      metricCourses: state.stats.courses_enrolled,
      metricHours: state.stats.hours_learned,
      metricCertificates: state.stats.certificates,
      metricPoints: state.stats.points,
    };
    Object.keys(map).forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = map[id];
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const state = await app.getAppState();
      renderHero(state);
      renderMetrics(state);
      renderCourses(state);
      renderActivity(state);
      renderSchedule(state);
      renderTasks(state);
      renderLeaderboard(state);
      renderSnapshot(state);
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      if (error.code !== "auth") {
        app.showToast("Jonli ma'lumot vaqtincha mavjud bo'lmagani uchun demo ko'rinish yuklandi.", "info", "Demo rejim");
      }
    }
  });
})();
