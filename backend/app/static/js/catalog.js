(function () {
  if (document.body.dataset.page !== "catalog") {
    return;
  }

  const app = window.DesignoraApp;
  if (!app) return;

  const sampleCourses = [
    { id: 101, title: "Design Systems Mastery", category: "system", description: "Create scalable UI systems, tokens, and documentation flows for fast-moving products.", price: 249, thumbnail_url: "", __demo: true },
    { id: 102, title: "Framer Launch Studio", category: "motion", description: "Build polished marketing experiences with motion, CMS content, and conversion thinking.", price: 189, thumbnail_url: "", __demo: true },
    { id: 103, title: "Frontend for Product Designers", category: "frontend", description: "Learn semantic HTML, adaptive CSS, and interaction patterns that make design handoff disappear.", price: 219, thumbnail_url: "", __demo: true },
    { id: 104, title: "UX Research Sprint", category: "uiux", description: "Run interviews, synthesize insights, and shape better products with lightweight research systems.", price: 159, thumbnail_url: "", __demo: true },
    { id: 105, title: "Visual Brand Lab", category: "branding", description: "Craft a coherent brand voice, motion language, and launch-ready identity kit.", price: 179, thumbnail_url: "", __demo: true },
    { id: 106, title: "Creative Automation Toolkit", category: "system", description: "Use AI-assisted workflows, templates, and content systems to ship higher quality work faster.", price: 129, thumbnail_url: "", __demo: true },
  ];

  let category = "all";
  let query = "";

  function getCourses() {
    const fromWindow = Array.isArray(window.catalogCourses) && window.catalogCourses.length
      ? window.catalogCourses
      : sampleCourses;
    return fromWindow;
  }

  function formatPrice(value) {
    if (!value) return "Free";
    return `$${Number(value).toLocaleString()}`;
  }

  function matches(course) {
    const categoryMatch = category === "all" || course.category === category;
    const queryText = `${course.title} ${course.description}`.toLowerCase();
    const queryMatch = !query || queryText.includes(query);
    return categoryMatch && queryMatch;
  }

  function render() {
    const grid = document.getElementById("catalogGrid");
    const count = document.getElementById("catalogCount");
    if (!grid) return;

    const courses = getCourses().filter(matches);
    if (count) count.textContent = `${courses.length} results`;

    if (!courses.length) {
      grid.innerHTML = `
        <article class="empty-card">
          <i data-lucide="search"></i>
          <strong>No courses matched that search.</strong>
          <p>Try another keyword or explore a different category.</p>
        </article>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.innerHTML = courses
      .map((course, index) => {
        const coverClass = index % 3 === 1 ? "listing-cover--cyan" : index % 3 === 2 ? "listing-cover--orange" : "";
        const href = course.__demo ? "/dashboard" : `/course/${course.id}`;
        const label = course.__demo ? "Open Dashboard" : "View Course";
        return `
          <article class="listing-card reveal is-visible lift-hover">
            <div class="listing-cover ${coverClass}">
              <div class="course-cover-top">
                <span class="course-tag">${course.category || "Course"}</span>
                <i data-lucide="${app.iconForCategory(course.category)}"></i>
              </div>
              <div class="course-cover-bottom">
                <div>
                  <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Premium track</div>
                  <div style="margin-top:8px;font-family:'Poppins',sans-serif;font-size:28px;line-height:1;">${formatPrice(course.price)}</div>
                </div>
                <div class="course-lesson-stack">
                  <span>${10 + index}</span>
                  <span>LAB</span>
                </div>
              </div>
            </div>
            <div class="listing-body">
              <div>
                <h3 class="listing-title">${course.title}</h3>
                <p class="listing-desc">${course.description || "Structured lessons, mentor prompts, and portfolio-ready outputs."}</p>
              </div>
              <div class="listing-stats">
                <span>${course.category || "General"}</span>
                <span>Self-paced</span>
                <span>Certificate</span>
              </div>
              <div class="listing-footer">
                <span class="chip"><strong>Popular</strong></span>
                <a class="btn btn-secondary" href="${href}">${label}</a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const search = document.getElementById("catalogSearch");
    if (search) {
      search.addEventListener("input", () => {
        query = search.value.trim().toLowerCase();
        render();
      });
    }

    document.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        category = button.dataset.category;
        document.querySelectorAll("[data-category]").forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
        render();
      });
    });

    render();
  });
})();
