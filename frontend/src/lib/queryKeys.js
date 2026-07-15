export const queryKeys = {
  auth: {
    all: ['auth'],
    profile: ['auth', 'profile'],
  },
  instructor: {
    all: ['instructor'],
    analytics: ['instructor', 'analytics'],
    application: ['instructor', 'application'],
  },
  admin: {
    all: ['admin'],
    dashboard: ['admin', 'dashboard'],
  },
  learning: {
    all: ['learning'],
    insights: ['learning', 'insights'],
    studentDashboard: ['learning', 'student-dashboard'],
    quizSummary: ['learning', 'quiz-summary'],
  },
  forum: {
    all: ['forum'],
    threads: ['forum', 'threads'],
  },
  payments: {
    all: ['payments'],
    checkout: ['payments', 'checkout'],
  },
  courses: {
    all: ['courses'],
    draft: (courseId = 'draft') => ['courses', 'draft', courseId],
  },
  notifications: {
    all: ['notifications'],
    inbox: ['notifications', 'inbox'],
  },
  gamification: {
    all: ['gamification'],
    stats: ['gamification', 'stats'],
  },
};
