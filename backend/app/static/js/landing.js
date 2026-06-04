(function () {
  if (document.body.dataset.page !== "landing") {
    return;
  }

  const SITE_KEY = "6LdP_0wsAAAAACAwMCxW1GdhT6NaTnW3vVmVqEak";
  const TOKEN_KEYS = ["designora_access_token", "access_token", "token"];

  const state = {
    session: null,
    registerWidget: null,
    loginWidget: null,
    carouselIndex: 0,
    carouselTimer: null,
  };

  const modal = document.getElementById("authModal");
  const toastRoot = document.getElementById("toastRoot");
  const mobilePanel = document.getElementById("mobilePanel");
  const header = document.getElementById("siteHeader");
  const hero = document.getElementById("home");
  const testimonialTrack = document.getElementById("testimonialTrack");

  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.from((scope || document).querySelectorAll(selector));
  }

  function initials(name) {
    return (name || "Designora")
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

  // Preserve cookie-based auth while also tolerating legacy localStorage token flows.
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

  function applyAvatar(node, user) {
    if (!node) return;
    const imageUrl = user.avatar_url || "";
    node.classList.toggle("has-image", Boolean(imageUrl));
    node.textContent = imageUrl ? "" : initials(user.name || user.email);
    node.style.backgroundImage = imageUrl ? `url("${imageUrl}")` : "";
  }

  function showToast(message, type, title) {
    if (!toastRoot) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type || "info"}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i data-lucide="${type === "error" ? "alert-circle" : type === "success" ? "check" : "sparkles"}"></i>
      </div>
      <div class="toast-copy">
        <strong>${title || (type === "error" ? "Xatolik yuz berdi" : "Designora")}</strong>
        <span>${message}</span>
      </div>
    `;
    toastRoot.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    requestAnimationFrame(() => toast.classList.add("show"));
    window.setTimeout(() => {
      toast.classList.remove("show");
      window.setTimeout(() => toast.remove(), 280);
    }, 3600);
  }

  function updateHeaderScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 18);
  }

  function toggleMobilePanel(force) {
    if (!mobilePanel) return;
    const open = typeof force === "boolean" ? force : !mobilePanel.classList.contains("open");
    mobilePanel.classList.toggle("open", open);
    const toggle = document.getElementById("mobileToggle");
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
  }

  function setAuthTab(mode) {
    qsa("[data-auth-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authTab === mode);
    });
    qsa("[data-auth-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.authPanel === mode);
    });
  }

  function openAuth(mode) {
    if (state.session) {
      window.location.href = dashboardPath(state.session.role);
      return;
    }
    if (!modal) return;
    setAuthTab(mode || "login");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    resetRecaptcha();
  }

  function closeAuth() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }

  function resetRecaptcha() {
    if (!window.grecaptcha) return;
    if (state.registerWidget !== null) window.grecaptcha.reset(state.registerWidget);
    if (state.loginWidget !== null) window.grecaptcha.reset(state.loginWidget);
  }

  function renderRecaptcha() {
    if (!window.grecaptcha || typeof window.grecaptcha.render !== "function") return;
    const registerNode = document.getElementById("registerRecaptcha");
    const loginNode = document.getElementById("loginRecaptcha");
    if (registerNode && state.registerWidget === null) {
      state.registerWidget = window.grecaptcha.render(registerNode, { sitekey: SITE_KEY });
    }
    if (loginNode && state.loginWidget === null) {
      state.loginWidget = window.grecaptcha.render(loginNode, { sitekey: SITE_KEY });
    }
  }

  function readRecaptcha(widgetId) {
    try {
      return window.grecaptcha ? window.grecaptcha.getResponse(widgetId) : "";
    } catch (error) {
      return "";
    }
  }

  function attachPasswordToggles() {
    qsa("[data-password-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.passwordToggle);
        if (!target) return;
        const isPassword = target.type === "password";
        target.type = isPassword ? "text" : "password";
        button.innerHTML = `<i data-lucide="${isPassword ? "eye-off" : "eye"}"></i>`;
        if (window.lucide) window.lucide.createIcons();
      });
    });
  }

  function initReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    qsa(".reveal").forEach((item) => observer.observe(item));
  }

  function initCounters() {
    const counters = qsa("[data-counter]");
    if (!counters.length) return;

    const animate = (node) => {
      const target = Number(node.dataset.counter || 0);
      const suffix = node.dataset.suffix || "";
      const duration = 1400;
      const start = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        node.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.42 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  async function getCsrfToken() {
    const response = await fetch("/api/auth/csrf-token", { credentials: "include" });
    if (!response.ok) throw new Error("Unable to get CSRF token");
    return response.json();
  }

  async function handleRegister(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const token = readRecaptcha(state.registerWidget);
    const payload = {
      username: qs("[name='name']", form).value.trim(),
      email: qs("[name='email']", form).value.trim(),
      password: qs("[name='password']", form).value,
      recaptcha_token: token,
    };

    if (!payload.username || !payload.email || !payload.password) {
      showToast("Davom etishdan oldin barcha maydonlarni to'ldiring.", "error", "Ma'lumot yetarli emas");
      return;
    }
    const status = qs(".auth-status", form);
    if (status) {
      status.textContent = "Designora maydoni yaratilmoqda...";
      status.className = "auth-status";
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Ro'yxatdan o'tish amalga oshmadi");

      showToast("Hisob tayyor. Maydon ochilmoqda...", "success", "Designora'ga xush kelibsiz");
      if (status) {
        status.textContent = "Muvaffaqiyatli! Yo'naltirilmoqda...";
        status.className = "auth-status success";
      }
      window.setTimeout(() => {
        window.location.href = data.redirect || "/dashboard";
      }, 800);
    } catch (error) {
      if (status) {
        status.textContent = String(error.message || error);
        status.className = "auth-status error";
      }
      showToast(String(error.message || error), "error", "Hisob yaratilmadi");
      resetRecaptcha();
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const token = readRecaptcha(state.loginWidget);
    const payload = {
      email: qs("[name='email']", form).value.trim(),
      password: qs("[name='password']", form).value,
      recaptcha_token: token,
    };

    if (!payload.email || !payload.password) {
      showToast("Email va parolni kiriting.", "error", "Ma'lumot yetarli emas");
      return;
    }
    const status = qs(".auth-status", form);
    if (status) {
      status.textContent = "Kirish amalga oshirilmoqda...";
      status.className = "auth-status";
    }

    try {
      const csrfData = await getCsrfToken();
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfData.csrf_token,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Kirish amalga oshmadi");

      showToast("Qaytganingizdan xursandmiz. Maydon ochilmoqda...", "success", "Kirish bajarildi");
      if (status) {
        status.textContent = "Muvaffaqiyatli! Yo'naltirilmoqda...";
        status.className = "auth-status success";
      }
      window.setTimeout(() => {
        window.location.href = data.redirect || "/dashboard";
      }, 700);
    } catch (error) {
      if (status) {
        status.textContent = String(error.message || error);
        status.className = "auth-status error";
      }
      showToast(String(error.message || error), "error", "Kirish bajarilmadi");
      resetRecaptcha();
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = qs("[name='reset-email']", form).value.trim();
    const status = qs(".auth-status", form);

    if (!email) {
      showToast("Hisobga biriktirilgan emailni kiriting.", "error", "Email kerak");
      return;
    }

    if (status) {
      status.textContent = "Tiklash ko'rsatmalari yuborilmoqda...";
      status.className = "auth-status";
    }

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (status) {
        status.textContent = "Agar bu email mavjud bo'lsa, tiklash ko'rsatmasi yuborildi.";
        status.className = "auth-status success";
      }
      showToast("Tiklash havolasi uchun emailingizni tekshiring.", "success", "Email yuborildi");
    } catch (error) {
      if (status) {
        status.textContent = "Hozir server bilan bog'lanib bo'lmadi.";
        status.className = "auth-status error";
      }
      showToast("Birozdan keyin qayta urinib ko'ring.", "error", "So'rov bajarilmadi");
    }
  }

  async function loadSession() {
    try {
      const response = await fetch("/api/profile/me", Object.assign({ credentials: "include" }, withAuthHeaders()));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          TOKEN_KEYS.forEach((key) => {
            try {
              window.localStorage.removeItem(key);
            } catch (error) {
              // Ignore storage cleanup failures.
            }
          });
        }
        return;
      }

      const user = await response.json();
      state.session = user;

      qsa("[data-auth-swap='hide']").forEach((button) => button.classList.add("hidden"));
      qsa("[data-dashboard-link]").forEach((link) => {
        link.classList.remove("hidden");
        link.href = dashboardPath(user.role);
      });
      qsa("[data-profile-link]").forEach((link) => {
        link.href = profilePath(user.role);
      });
      qsa("[data-session-card]").forEach((item) => {
        item.classList.remove("hidden");
        item.classList.add("is-visible");
      });
      qsa("[data-session-name]").forEach((node) => {
        node.textContent = user.name || initials(user.email);
      });
      qsa("[data-session-email]").forEach((node) => {
        node.textContent = user.email || "Profilni ochish";
      });
      qsa("[data-session-avatar]").forEach((node) => applyAvatar(node, user));

      const heroPrimary = document.getElementById("heroPrimaryCta");
      if (heroPrimary) {
        heroPrimary.textContent = isAdminRole(user.role) ? "Admin maydonini ochish" : "Maydonni ochish";
      }
    } catch (error) {
      state.session = null;
    }
  }

  function readQueryState() {
    const params = new URLSearchParams(window.location.search);
    const modalName = params.get("modal");
    const error = params.get("error");

    if (modalName === "login" || modalName === "register") {
      openAuth(modalName === "register" ? "register" : "login");
    }
    if (error === "oauth_failed") {
      showToast("Google orqali kirish yakunlanmadi. Qayta urinib ko'ring.", "error", "Google kirishi");
    }
    if (error === "email_not_verified") {
      showToast("Davom etishdan oldin Google emailingiz tasdiqlangan bo'lishi kerak.", "error", "Email tasdiqlanishi");
    }
    if (modalName || error) {
      history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function createParticles() {
    const field = document.getElementById("particleField");
    if (!field) return;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 28; i += 1) {
      const dot = document.createElement("span");
      const size = (Math.random() * 5 + 1).toFixed(1);
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${Math.random() * 100}%`;
      dot.style.animationDuration = `${Math.random() * 10 + 10}s`;
      dot.style.animationDelay = `${Math.random() * -12}s`;
      fragment.appendChild(dot);
    }
    field.appendChild(fragment);
  }

  function initCursor() {
    if (!window.matchMedia("(hover: hover)").matches) return;

    const glow = document.getElementById("pointerGlow");
    const cursor = document.getElementById("customCursor");
    const ring = document.getElementById("customCursorRing");

    window.addEventListener("mousemove", (event) => {
      const { clientX, clientY } = event;
      if (glow) {
        glow.style.left = `${clientX}px`;
        glow.style.top = `${clientY}px`;
      }
      if (cursor) {
        cursor.style.left = `${clientX}px`;
        cursor.style.top = `${clientY}px`;
      }
      if (ring) {
        ring.style.left = `${clientX}px`;
        ring.style.top = `${clientY}px`;
      }
    });

    qsa("a, button, [data-tilt]").forEach((node) => {
      node.addEventListener("mouseenter", () => {
        if (!ring) return;
        ring.style.width = "54px";
        ring.style.height = "54px";
        ring.style.borderColor = "rgba(140, 160, 255, 0.65)";
      });
      node.addEventListener("mouseleave", () => {
        if (!ring) return;
        ring.style.width = "38px";
        ring.style.height = "38px";
        ring.style.borderColor = "rgba(255, 255, 255, 0.4)";
      });
    });
  }

  function initParallax() {
    if (!hero || !window.matchMedia("(hover: hover)").matches) return;

    const items = qsa("[data-depth]", hero);
    hero.addEventListener("mousemove", (event) => {
      const rect = hero.getBoundingClientRect();
      const offsetX = event.clientX - rect.left - rect.width / 2;
      const offsetY = event.clientY - rect.top - rect.height / 2;

      items.forEach((item) => {
        const depth = Number(item.dataset.depth || 0.16);
        item.style.setProperty("--mx", `${offsetX * depth * 0.08}px`);
        item.style.setProperty("--my", `${offsetY * depth * 0.08}px`);
      });
    });

    hero.addEventListener("mouseleave", () => {
      items.forEach((item) => {
        item.style.setProperty("--mx", "0px");
        item.style.setProperty("--my", "0px");
      });
    });
  }

  function initTilt() {
    if (!window.matchMedia("(hover: hover)").matches) return;

    qsa("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateX = (0.5 - y) * 10;
        const rotateY = (x - 0.5) * 12;
        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  function initTyping() {
    const target = document.getElementById("typedText");
    if (!target) return;

    const phrases = [
      "mentor feedback bilan ishni oldinga siljitish",
      "premium natijaga olib boradigan amaliy darslar",
      "progressni ravshan ko'rsatadigan boshqaruv maydoni",
      "foydalanuvchi va admin uchun moslashgan ish oqimi",
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const phrase = phrases[phraseIndex];
      target.textContent = deleting
        ? phrase.slice(0, charIndex - 1)
        : phrase.slice(0, charIndex + 1);

      charIndex += deleting ? -1 : 1;

      if (!deleting && charIndex === phrase.length) {
        deleting = true;
        window.setTimeout(tick, 1200);
        return;
      }
      if (deleting && charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }

      window.setTimeout(tick, deleting ? 36 : 68);
    }

    tick();
  }

  function updateCarousel() {
    if (!testimonialTrack) return;
    const cards = qsa(".testimonial-card", testimonialTrack);
    if (!cards.length) return;

    const perView = window.innerWidth < 760 ? 1 : window.innerWidth < 1200 ? 2 : 3;
    const maxIndex = Math.max(0, cards.length - perView);
    if (state.carouselIndex > maxIndex) state.carouselIndex = 0;

    const gap = 20;
    const cardWidth = cards[0].getBoundingClientRect().width + gap;
    testimonialTrack.style.transform = `translateX(-${state.carouselIndex * cardWidth}px)`;
  }

  function shiftCarousel(step) {
    if (!testimonialTrack) return;
    const cards = qsa(".testimonial-card", testimonialTrack);
    const perView = window.innerWidth < 760 ? 1 : window.innerWidth < 1200 ? 2 : 3;
    const maxIndex = Math.max(0, cards.length - perView);

    state.carouselIndex += step;
    if (state.carouselIndex > maxIndex) state.carouselIndex = 0;
    if (state.carouselIndex < 0) state.carouselIndex = maxIndex;
    updateCarousel();
  }

  function startCarousel() {
    if (state.carouselTimer) window.clearInterval(state.carouselTimer);
    state.carouselTimer = window.setInterval(() => shiftCarousel(1), 4800);
  }

  // Track which section is dominant so the sticky nav stays context-aware while scrolling.
  function initNavSpy() {
    const sections = qsa("[data-section]");
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!active) return;
        const current = active.target.dataset.section;
        qsa("[data-scroll-link]").forEach((link) => {
          link.classList.toggle("is-active", link.dataset.scrollLink === current);
        });
      },
      { threshold: [0.22, 0.4, 0.65] }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function attachEvents() {
    const mobileToggle = document.getElementById("mobileToggle");
    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => toggleMobilePanel());
    }

    qsa("[data-mobile-link]").forEach((link) => {
      link.addEventListener("click", () => toggleMobilePanel(false));
    });

    qsa("[data-scroll-link], [data-mobile-link]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    qsa("[data-auth-open]").forEach((button) => {
      button.addEventListener("click", () => openAuth(button.dataset.authOpen));
    });

    qsa("[data-auth-close]").forEach((button) => {
      button.addEventListener("click", closeAuth);
    });

    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeAuth();
      });
    }

    qsa("[data-auth-tab]").forEach((button) => {
      button.addEventListener("click", () => setAuthTab(button.dataset.authTab));
    });

    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const forgotForm = document.getElementById("forgotForm");
    if (registerForm) registerForm.addEventListener("submit", handleRegister);
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (forgotForm) forgotForm.addEventListener("submit", handleForgotPassword);

    qsa("[data-open-forgot]").forEach((button) => {
      button.addEventListener("click", () => setAuthTab("forgot"));
    });

    qsa("[data-back-login]").forEach((button) => {
      button.addEventListener("click", () => setAuthTab("login"));
    });

    const heroPrimary = document.getElementById("heroPrimaryCta");
    if (heroPrimary) {
      heroPrimary.addEventListener("click", () => {
        if (state.session) {
          window.location.href = dashboardPath(state.session.role);
        }
      });
    }

    const storyPrev = document.getElementById("storyPrev");
    const storyNext = document.getElementById("storyNext");
    if (storyPrev) storyPrev.addEventListener("click", () => shiftCarousel(-1));
    if (storyNext) storyNext.addEventListener("click", () => shiftCarousel(1));

    window.addEventListener("resize", updateCarousel);
    window.addEventListener("scroll", updateHeaderScroll);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAuth();
    });
  }

  function initLucide() {
    if (window.lucide) window.lucide.createIcons();
  }

  window.onRecaptchaLoad = renderRecaptcha;

  document.addEventListener("DOMContentLoaded", async () => {
    initLucide();
    createParticles();
    initReveal();
    initCounters();
    initCursor();
    initParallax();
    initTilt();
    initTyping();
    attachPasswordToggles();
    attachEvents();
    updateHeaderScroll();
    renderRecaptcha();
    await loadSession();
    updateCarousel();
    startCarousel();
    initNavSpy();
    readQueryState();
  });
})();
