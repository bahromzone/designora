(function () {
  const root = document.body;
  if (root.dataset.appShell !== "true") {
    return;
  }

  const cache = {
    state: null,
  };
  const TOKEN_KEYS = ["designora_access_token", "access_token", "token"];

  const demoProfile = {
    id: 0,
    name: "Dilnoza Karimova",
    email: "dilnoza@designora.uz",
    role: "user",
    provider: "local",
    bio: "Moda, vizual tizim va premium taqdimotga yo'naltirilgan dizayner.",
    phone: "+998 90 555 01 42",
    location: "Toshkent, O'zbekiston",
    website: "https://designora.uz",
    created_at: "2025-02-14T10:00:00Z",
  };

  const demoStats = {
    courses_enrolled: 6,
    courses_completed: 2,
    hours_learned: 46,
    certificates: 3,
    pending_assignments: 4,
    points: 1280,
    streak_days: 12,
    level: 7,
    courses: [
      {
        id: 501,
        title: "Product Design Sprint",
        category: "uiux",
        progress: 84,
        is_completed: false,
        hours_spent: 11.5,
        last_activity: "2026-04-09T08:00:00Z",
      },
      {
        id: 502,
        title: "Design Systems Lab",
        category: "system",
        progress: 62,
        is_completed: false,
        hours_spent: 9.2,
        last_activity: "2026-04-08T12:00:00Z",
      },
      {
        id: 503,
        title: "Framer Launch Studio",
        category: "motion",
        progress: 41,
        is_completed: false,
        hours_spent: 6.8,
        last_activity: "2026-04-07T14:00:00Z",
      },
      {
        id: 504,
        title: "Frontend for Designers",
        category: "frontend",
        progress: 100,
        is_completed: true,
        hours_spent: 18,
        last_activity: "2026-04-02T09:00:00Z",
      },
    ],
    activity: [
      { date: "2026-04-04", minutes: 32 },
      { date: "2026-04-05", minutes: 54 },
      { date: "2026-04-06", minutes: 74 },
      { date: "2026-04-07", minutes: 46 },
      { date: "2026-04-08", minutes: 96 },
      { date: "2026-04-09", minutes: 82 },
      { date: "2026-04-10", minutes: 68 },
    ],
  };

  function initials(value) {
    return (value || "Designora")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function isAdminRole(role) {
    return ["admin", "superadmin"].includes(String(role || "").toLowerCase());
  }

  function dashboardPath(role) {
    return isAdminRole(role) ? "/manage/courses" : "/dashboard";
  }

  function profilePath(role) {
    return isAdminRole(role) ? "/admin/profile" : "/user/profile";
  }

  function getStoredToken() {
    try {
      for (const key of TOKEN_KEYS) {
        const value = window.localStorage.getItem(key);
        if (value) return value;
      }
    } catch (error) {
      return "";
    }
    return "";
  }

  function withAuthHeaders(options) {
    const next = Object.assign({}, options || {});
    const headers = Object.assign({}, next.headers || {});
    const storedToken = getStoredToken();

    if (storedToken && !headers.Authorization && !headers["X-Access-Token"]) {
      headers.Authorization = storedToken.startsWith("Bearer ") ? storedToken : `Bearer ${storedToken}`;
    }

    next.headers = headers;
    return next;
  }

  function setAvatar(node, profile) {
    if (!node) return;
    const label = initials(profile.name || profile.email);
    const imageUrl = profile.avatar_url || "";

    node.classList.toggle("has-image", Boolean(imageUrl));
    node.textContent = imageUrl ? "" : label;
    node.style.backgroundImage = imageUrl ? `url("${imageUrl}")` : "";
    node.setAttribute("aria-label", `${profile.name || profile.email || "Designora user"} avatar`);
  }

  function showToast(message, type, title) {
    const rootNode = document.getElementById("toastRoot");
    if (!rootNode) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type || "info"}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i data-lucide="${type === "error" ? "alert-circle" : type === "success" ? "check" : "sparkles"}"></i>
      </div>
      <div class="toast-copy">
        <strong>${title || "Designora"}</strong>
        <span>${message}</span>
      </div>
    `;
    rootNode.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    requestAnimationFrame(() => toast.classList.add("show"));
    window.setTimeout(() => {
      toast.classList.remove("show");
      window.setTimeout(() => toast.remove(), 280);
    }, 3600);
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, Object.assign({ credentials: "include" }, withAuthHeaders(options)));
    if (response.status === 401 || response.status === 403) {
      const error = new Error("auth");
      error.code = "auth";
      throw error;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.detail || "Request failed");
      error.code = "request";
      throw error;
    }
    return data;
  }

  function demoState() {
    return {
      source: "demo",
      profile: Object.assign({}, demoProfile),
      stats: Object.assign({}, demoStats, {
        courses: demoStats.courses.map((course) => Object.assign({}, course, { __demo: true })),
      }),
    };
  }

  function enrichState(profile, stats) {
    const mergedProfile = Object.assign({}, demoProfile, profile || {});
    const mergedStats = Object.assign({}, demoStats, stats || {});
    if (!Array.isArray(mergedStats.courses) || !mergedStats.courses.length) {
      mergedStats.courses = demoStats.courses.map((course) => Object.assign({}, course, { __demo: true }));
    }
    if (!Array.isArray(mergedStats.activity) || !mergedStats.activity.length) {
      mergedStats.activity = demoStats.activity.slice();
    }
    return {
      source: profile && stats ? "live" : "demo",
      profile: mergedProfile,
      stats: mergedStats,
    };
  }

  async function getAppState(force) {
    if (cache.state && !force) return cache.state;
    try {
      const [profile, stats] = await Promise.all([
        fetchJson("/api/profile/me"),
        fetchJson("/api/profile/stats"),
      ]);
      cache.state = enrichState(profile, stats);
    } catch (error) {
      if (error.code === "auth") {
        window.location.href = "/login";
        throw error;
      }
      cache.state = demoState();
    }
    return cache.state;
  }

  function formatDate(value, options) {
    try {
      return new Date(value).toLocaleDateString("uz-UZ", options || { month: "short", day: "numeric" });
    } catch (error) {
      return value || "Today";
    }
  }

  function formatDay(value) {
    try {
      return new Date(value).toLocaleDateString("uz-UZ", { weekday: "short" });
    } catch (error) {
      return "";
    }
  }

  function animateProgress(element, value) {
    if (!element) return;
    const amount = Math.max(0, Math.min(100, Number(value || 0)));
    requestAnimationFrame(() => {
      element.style.width = `${amount}%`;
    });
  }

  function setRing(element, value) {
    if (!element) return;
    const amount = Math.max(0, Math.min(100, Number(value || 0)));
    element.style.setProperty("--value", amount);
  }

  function iconForCategory(category) {
    const map = {
      uiux: "pen-tool",
      system: "layout-grid",
      motion: "sparkles",
      frontend: "code-2",
      fashion: "sparkles",
      pattern: "ruler",
      textile: "scissors",
      branding: "briefcase",
      general: "book-open",
    };
    return map[category] || "book-open";
  }

  function coverClass(index) {
    if (index % 3 === 1) return "course-panel-cover--green";
    if (index % 3 === 2) return "course-panel-cover--orange";
    return "";
  }

  function applySidebarState() {
    const collapsed = localStorage.getItem("designora-sidebar") === "collapsed";
    if (window.innerWidth > 1024) {
      root.classList.toggle("sidebar-collapsed", collapsed);
    } else {
      root.classList.remove("sidebar-collapsed");
    }
  }

  function toggleSidebarCollapse() {
    const next = !(localStorage.getItem("designora-sidebar") === "collapsed");
    localStorage.setItem("designora-sidebar", next ? "collapsed" : "expanded");
    applySidebarState();
  }

  function openSidebar() {
    root.classList.add("sidebar-open");
  }

  function closeSidebar() {
    root.classList.remove("sidebar-open");
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", withAuthHeaders({ method: "POST", credentials: "include" }));
    } finally {
      TOKEN_KEYS.forEach((key) => {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          // Ignore storage cleanup failures.
        }
      });
      window.location.href = "/";
    }
  }

  async function hydrateShell() {
    const state = await getAppState();
    const profile = state.profile;

    const nameNodes = document.querySelectorAll("[data-shell-name]");
    nameNodes.forEach((node) => {
      node.textContent = profile.name || initials(profile.email);
    });

    const roleNodes = document.querySelectorAll("[data-shell-role]");
    roleNodes.forEach((node) => {
      node.textContent = isAdminRole(profile.role) ? "Admin maydoni" : "Foydalanuvchi profili";
    });

    const avatarNodes = document.querySelectorAll("[data-shell-avatar]");
    avatarNodes.forEach((node) => {
      setAvatar(node, profile);
    });

    document.querySelectorAll("[data-dashboard-link]").forEach((link) => {
      link.setAttribute("href", dashboardPath(profile.role));
    });
    document.querySelectorAll("[data-profile-link]").forEach((link) => {
      link.setAttribute("href", profilePath(profile.role));
    });

    const active = root.dataset.nav || root.dataset.page;
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.navLink === active);
    });

    if (window.lucide) window.lucide.createIcons();
    return state;
  }

  function attachShellEvents() {
    const sidebarToggle = document.getElementById("sidebarToggle");
    const mobileToggle = document.getElementById("mobileSidebarToggle");
    const overlay = document.getElementById("sidebarOverlay");
    const logoutButtons = document.querySelectorAll("[data-logout]");

    if (sidebarToggle) sidebarToggle.addEventListener("click", toggleSidebarCollapse);
    if (mobileToggle) mobileToggle.addEventListener("click", openSidebar);
    if (overlay) overlay.addEventListener("click", closeSidebar);
    logoutButtons.forEach((button) => button.addEventListener("click", logout));

    window.addEventListener("resize", applySidebarState);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSidebar();
    });
  }

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    items.forEach((item) => observer.observe(item));
  }

  window.DesignoraApp = {
    coverClass,
    iconForCategory,
    showToast,
    fetchJson,
    getAppState,
    formatDate,
    formatDay,
    animateProgress,
    setRing,
    initials,
    setAvatar,
    isAdminRole,
    dashboardPath,
    profilePath,
    logout,
  };

  document.addEventListener("DOMContentLoaded", async () => {
    applySidebarState();
    attachShellEvents();
    initReveal();
    if (window.lucide) window.lucide.createIcons();
    await hydrateShell();
  });
})();
