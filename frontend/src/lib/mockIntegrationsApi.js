const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const memoryStore = new Map();

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const storage = {
  read(key, fallback) {
    if (typeof window === 'undefined') {
      return memoryStore.has(key) ? memoryStore.get(key) : fallback;
    }

    try {
      const rawValue = window.localStorage.getItem(key);
      return safeJsonParse(rawValue, fallback);
    } catch {
      return memoryStore.has(key) ? memoryStore.get(key) : fallback;
    }
  },
  write(key, value) {
    if (typeof window === 'undefined') {
      memoryStore.set(key, value);
      return value;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      memoryStore.set(key, value);
    }

    return value;
  },
};

const createId = (prefix) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
};

const defaults = {
  instructorAnalytics: {
    revenueSeries: [
      { label: 'Mon', revenue: 240, enrollments: 6 },
      { label: 'Tue', revenue: 320, enrollments: 8 },
      { label: 'Wed', revenue: 280, enrollments: 7 },
      { label: 'Thu', revenue: 430, enrollments: 11 },
      { label: 'Fri', revenue: 470, enrollments: 13 },
      { label: 'Sat', revenue: 390, enrollments: 10 },
      { label: 'Sun', revenue: 360, enrollments: 9 },
    ],
    coursePerformance: [
      { name: 'UI Design', completionRate: 88, satisfaction: 94 },
      { name: 'Motion Basics', completionRate: 81, satisfaction: 90 },
      { name: 'Brand Systems', completionRate: 76, satisfaction: 87 },
    ],
    summary: {
      revenue: '$2,490',
      enrollments: 64,
      completionRate: '82%',
      averageRating: '4.8/5',
    },
  },
  adminDashboard: {
    growthSeries: [
      { label: 'Jan', revenue: 4200, activeUsers: 540 },
      { label: 'Feb', revenue: 5100, activeUsers: 610 },
      { label: 'Mar', revenue: 6400, activeUsers: 740 },
      { label: 'Apr', revenue: 7200, activeUsers: 830 },
      { label: 'May', revenue: 8600, activeUsers: 970 },
    ],
    userDistribution: [
      { name: 'Students', value: 72 },
      { name: 'Instructors', value: 18 },
      { name: 'Admins', value: 10 },
    ],
    summary: {
      monthlyRevenue: '$8,600',
      conversionRate: '5.6%',
      activeUsers: '970',
      churn: '1.8%',
    },
  },
  dashboardInsights: [
    { label: 'Week 1', impressions: 380, clicks: 110, conversions: 18 },
    { label: 'Week 2', impressions: 420, clicks: 138, conversions: 25 },
    { label: 'Week 3', impressions: 510, clicks: 160, conversions: 31 },
    { label: 'Week 4', impressions: 590, clicks: 194, conversions: 36 },
  ],
  studentDashboard: {
    radial: [
      { name: 'Progress', value: 78, fill: '#6366f1' },
      { name: 'Remaining', value: 22, fill: '#e5e7eb' },
    ],
    modules: [
      { name: 'Foundation', progress: 100 },
      { name: 'Design Systems', progress: 84 },
      { name: 'Interaction', progress: 72 },
      { name: 'Portfolio', progress: 55 },
    ],
    summary: {
      completion: 78,
      streak: 12,
      certificates: 4,
      studyHours: 38,
    },
  },
  profile: {
    firstName: 'Designora',
    lastName: 'Student',
    email: 'student@designora.app',
    headline: 'Product designer in progress',
    bio: 'Building stronger UI, motion, and portfolio skills.',
  },
  courseDraft: {
    title: 'Advanced Interface Systems',
    level: 'intermediate',
    durationWeeks: 6,
    price: 149,
    summary: 'Learn to build scalable interface systems for modern products.',
    outcomes: 'Design tokens, documentation, scalable components, review workflows.',
  },
  forumThreads: [
    {
      id: 'thread-1',
      title: 'How do you structure design critique notes?',
      category: 'community',
      body: 'I want a repeatable system for critique takeaways and action items.',
      replies: 6,
      author: 'Community team',
      createdAt: 'Today',
    },
    {
      id: 'thread-2',
      title: 'Best way to package portfolio case studies?',
      category: 'portfolio',
      body: 'Looking for a good pattern to balance visuals, process, and outcomes.',
      replies: 3,
      author: 'Mentor group',
      createdAt: 'Yesterday',
    },
  ],
  quizSummary: {
    averageScore: 84,
    completionRate: 79,
    lastAttempt: '2 days ago',
  },
};

const STORAGE_KEYS = {
  profile: 'designora.integration.profile',
  courseDraft: 'designora.integration.courseDraft',
  forumThreads: 'designora.integration.forumThreads',
  instructorApplication: 'designora.integration.instructorApplication',
  checkout: 'designora.integration.checkout',
};

export async function fetchInstructorAnalytics() {
  await delay();
  return defaults.instructorAnalytics;
}

export async function fetchAdminDashboard() {
  await delay();
  return defaults.adminDashboard;
}

export async function fetchDashboardInsights() {
  await delay();
  return defaults.dashboardInsights;
}

export async function fetchStudentDashboard() {
  await delay();
  return defaults.studentDashboard;
}

export async function fetchProfile() {
  await delay();
  return storage.read(STORAGE_KEYS.profile, defaults.profile);
}

export async function updateProfile(nextProfile) {
  await delay();
  return storage.write(STORAGE_KEYS.profile, {
    ...defaults.profile,
    ...storage.read(STORAGE_KEYS.profile, defaults.profile),
    ...nextProfile,
  });
}

export async function fetchCourseDraft() {
  await delay();
  return storage.read(STORAGE_KEYS.courseDraft, defaults.courseDraft);
}

export async function saveCourseDraft(nextDraft) {
  await delay();
  return storage.write(STORAGE_KEYS.courseDraft, {
    ...defaults.courseDraft,
    ...storage.read(STORAGE_KEYS.courseDraft, defaults.courseDraft),
    ...nextDraft,
  });
}

export async function fetchForumThreads() {
  await delay();
  return storage.read(STORAGE_KEYS.forumThreads, defaults.forumThreads);
}

export async function createForumThread(input) {
  await delay();

  const nextThread = {
    id: createId('thread'),
    replies: 0,
    author: 'You',
    createdAt: 'Just now',
    ...input,
  };

  const currentThreads = storage.read(STORAGE_KEYS.forumThreads, defaults.forumThreads);
  storage.write(STORAGE_KEYS.forumThreads, [nextThread, ...currentThreads]);

  return nextThread;
}

export async function submitInstructorApplication(payload) {
  await delay(450);
  storage.write(STORAGE_KEYS.instructorApplication, {
    ...payload,
    submittedAt: new Date().toISOString(),
  });

  return {
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };
}

export async function submitCheckout(payload) {
  await delay(500);
  const invoice = {
    id: createId('checkout'),
    ...payload,
    submittedAt: new Date().toISOString(),
  };

  storage.write(STORAGE_KEYS.checkout, invoice);
  return invoice;
}

export async function fetchQuizSummary() {
  await delay();
  return defaults.quizSummary;
}
