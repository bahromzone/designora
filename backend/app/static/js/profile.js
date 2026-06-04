(function () {
  if (document.body.dataset.page !== "profile") {
    return;
  }

  const app = window.DesignoraApp;
  if (!app) return;

  function setProfileStatus(message, tone) {
    const node = document.getElementById("profileLoadState");
    if (!node) return;
    node.textContent = message;
    node.dataset.tone = tone || "default";
  }

  function averageProgress(courses) {
    if (!courses.length) return 0;
    return Math.round(courses.reduce((sum, course) => sum + Number(course.progress || 0), 0) / courses.length);
  }

  function buildSkills(stats) {
    const weeklyMinutes = stats.activity.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    return [
      { name: "Tizimli fikrlash", value: Math.min(100, stats.level * 12 + 10) },
      { name: "Ijro ritmi", value: Math.min(100, Math.round(weeklyMinutes / 6)) },
      { name: "Loyiha sifati", value: Math.min(100, averageProgress(stats.courses) + 12) },
      { name: "Feedback sikli", value: Math.min(100, 58 + stats.certificates * 12) },
    ];
  }

  function buildCircles(stats) {
    return [
      {
        title: "Yakunlanish",
        value: Math.min(100, averageProgress(stats.courses)),
        note: "Faol yo'nalishlar bo'yicha o'rtacha progress.",
      },
      {
        title: "Barqarorlik",
        value: Math.min(100, (stats.streak_days || 0) * 7),
        note: "Haftalik odatingiz qanchalik kuchli ekanini ko'rsatadi.",
      },
    ];
  }

  function renderTimeline(stats) {
    const target = document.getElementById("profileTimeline");
    if (!target) return;
    const rows = stats.courses
      .slice()
      .sort((left, right) => new Date(right.last_activity || 0) - new Date(left.last_activity || 0))
      .slice(0, 5);

    target.innerHTML = rows
      .map(
        (item) => `
          <article class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <strong>${item.title}</strong>
              <p>${item.is_completed ? "Yakunlangan va qayta ko'rishga tayyor." : `Siz bu yo'nalishda ${item.progress}% bosqichdasiz va sur'atni davom ettiryapsiz.`}</p>
              <span>${app.formatDate(item.last_activity || Date.now(), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderSkills(stats) {
    const target = document.getElementById("profileSkills");
    if (!target) return;
    const skills = buildSkills(stats);
    target.innerHTML = skills
      .map(
        (skill) => `
          <div class="skill-row">
            <div class="skill-head">
              <strong>${skill.name}</strong>
              <span>${skill.value}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" data-skill-progress="${skill.value}"></div>
            </div>
          </div>
        `
      )
      .join("");

    document.querySelectorAll("[data-skill-progress]").forEach((element) => {
      app.animateProgress(element, element.dataset.skillProgress);
    });
  }

  function renderCircles(stats) {
    const target = document.getElementById("profileCircles");
    if (!target) return;
    target.innerHTML = buildCircles(stats)
      .map(
        (item) => `
          <article class="circle-card">
            <div class="circle-card-copy">
              <strong>${item.title}</strong>
              <span>${item.note}</span>
            </div>
            <div class="circle-meter" data-value="${item.value}%" style="--value:${item.value};"></div>
          </article>
        `
      )
      .join("");
  }

  function hydrate(state) {
    const profile = state.profile;
    const stats = state.stats;
    const completion = averageProgress(stats.courses);
    const isAdmin = app.isAdminRole(profile.role);

    const mapText = {
      profileHeroName: profile.name,
      profileHeroEmail: profile.email,
      profileHeroBio: profile.bio || "Har hafta kuchayib borayotgan ijodiy va amaliy portfolio yo'nalishi.",
      profileStatCourses: stats.courses_enrolled,
      profileStatHours: stats.hours_learned,
      profileStatPoints: stats.points,
      profileStatCertificates: stats.certificates,
      profileJoined: app.formatDate(profile.created_at || Date.now(), { year: "numeric", month: "long", day: "numeric" }),
      profileProvider: profile.provider === "google" ? "Google hisobi" : "Email hisobi",
      insightCompletion: `${completion}%`,
      insightStreak: `${stats.streak_days} days`,
      insightLevel: `Level ${stats.level}`,
      profileViewRole: isAdmin ? "Admin profili" : "Foydalanuvchi profili",
    };

    Object.keys(mapText).forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = mapText[id];
    });

    const avatarNodes = document.querySelectorAll("[data-profile-avatar]");
    avatarNodes.forEach((node) => {
      app.setAvatar(node, profile);
    });

    const backLinks = document.querySelectorAll("[data-dashboard-link]");
    backLinks.forEach((link) => {
      link.setAttribute("href", app.dashboardPath(profile.role));
    });

    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
      profileForm.elements.namedItem("name").value = profile.name || "";
      profileForm.elements.namedItem("bio").value = profile.bio || "";
      profileForm.elements.namedItem("phone").value = profile.phone || "";
      profileForm.elements.namedItem("location").value = profile.location || "";
      profileForm.elements.namedItem("website").value = profile.website || "";
    }

    renderTimeline(stats);
    renderSkills(stats);
    renderCircles(stats);
    setProfileStatus(state.source === "live" ? "Profil muvaffaqiyatli sinxronlandi" : "Demo ma'lumot yuklandi", state.source);
  }

  async function saveProfile(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const elements = form.elements;
    const payload = {
      name: elements.namedItem("name").value.trim(),
      bio: elements.namedItem("bio").value.trim(),
      phone: elements.namedItem("phone").value.trim(),
      location: elements.namedItem("location").value.trim(),
      website: elements.namedItem("website").value.trim(),
    };

    if (!payload.name || payload.name.length < 2) {
      app.showToast("Ism kamida ikki belgidan iborat bo'lishi kerak.", "error", "Profil");
      return;
    }

    try {
      await app.fetchJson("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const state = await app.getAppState(true);
      hydrate(state);
      app.showToast("Profil muvaffaqiyatli yangilandi.", "success", "Saqlandi");
    } catch (error) {
      app.showToast(error.message || "Profilni saqlab bo'lmadi.", "error", "Profil");
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const elements = form.elements;
    const currentPassword = elements.namedItem("current_password").value;
    const newPassword = elements.namedItem("new_password").value;
    const confirmPassword = elements.namedItem("confirm_password").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      app.showToast("Saqlashdan oldin barcha parol maydonlarini to'ldiring.", "error", "Xavfsizlik");
      return;
    }
    if (newPassword !== confirmPassword) {
      app.showToast("Yangi parol va tasdiq bir xil emas.", "error", "Xavfsizlik");
      return;
    }

    try {
      await app.fetchJson("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      form.reset();
      app.showToast("Parol muvaffaqiyatli yangilandi.", "success", "Xavfsizlik");
    } catch (error) {
      app.showToast(error.message || "Parolni yangilab bo'lmadi.", "error", "Xavfsizlik");
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    setProfileStatus("Profil yuklanmoqda...", "loading");
    try {
      const state = await app.getAppState();
      hydrate(state);

      const providerNotice = document.getElementById("passwordProviderNotice");
      const securityForm = document.getElementById("securityForm");
      if (state.profile.provider !== "local" && providerNotice && securityForm) {
        providerNotice.textContent = "Parol o'zgarishlari Google hisobingiz orqali boshqariladi.";
        securityForm.querySelectorAll("input, button").forEach((node) => {
          node.disabled = true;
        });
      }
    } catch (error) {
      setProfileStatus(error.code === "auth" ? "Sessiya tugagan" : "Demo rejim", error.code === "auth" ? "error" : "info");
      if (error.code !== "auth") {
        app.showToast("Profil ma'lumotlari hozircha demo qiymatlar bilan ko'rsatilmoqda.", "info", "Demo rejim");
      }
    }

    const profileForm = document.getElementById("profileForm");
    const securityForm = document.getElementById("securityForm");
    if (profileForm) profileForm.addEventListener("submit", saveProfile);
    if (securityForm) securityForm.addEventListener("submit", changePassword);
  });
})();
