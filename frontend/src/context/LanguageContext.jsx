import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const SUPPORTED = ["uz", "ru", "en"];
const DEFAULT_LANG = "uz";
const STORAGE_KEY = "designora-lang";

// Interfeys kalitlari uchun tarjimalar — backend i18n katalogiga mos.
const CATALOG = {
  uz: {
    welcome: "Xush kelibsiz",
    courses: "Kurslar",
    my_courses: "Mening kurslarim",
    sign_in: "Kirish",
    sign_up: "Ro'yxatdan o'tish",
    search: "Qidirish",
    certificate: "Sertifikat",
    enroll: "Ro'yxatdan o'tish",
    price_free: "Bepul",
    leaderboard: "Reyting",
    reviews: "Sharhlar",
    blog: "Blog",
    forum: "Forum",
    home: "Bosh sahifa",
    profile: "Profil",
  },
  ru: {
    welcome: "Добро пожаловать",
    courses: "Курсы",
    my_courses: "Мои курсы",
    sign_in: "Вход",
    sign_up: "Регистрация",
    search: "Поиск",
    certificate: "Сертификат",
    enroll: "Записаться",
    price_free: "Бесплатно",
    leaderboard: "Рейтинг",
    reviews: "Отзывы",
    blog: "Блог",
    forum: "Форум",
    home: "Главная",
    profile: "Профиль",
  },
  en: {
    welcome: "Welcome",
    courses: "Courses",
    my_courses: "My courses",
    sign_in: "Sign in",
    sign_up: "Sign up",
    search: "Search",
    certificate: "Certificate",
    enroll: "Enroll",
    price_free: "Free",
    leaderboard: "Leaderboard",
    reviews: "Reviews",
    blog: "Blog",
    forum: "Forum",
    home: "Home",
    profile: "Profile",
  },
};

function normalize(lang) {
  if (!lang) return DEFAULT_LANG;
  const code = String(lang).trim().toLowerCase().slice(0, 2);
  return SUPPORTED.includes(code) ? code : DEFAULT_LANG;
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return normalize(localStorage.getItem(STORAGE_KEY) || navigator.language);
    } catch {
      return DEFAULT_LANG;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // localStorage mavjud emas — e'tiborsiz qoldiramiz.
    }
  }, [lang]);

  const setLang = useCallback((next) => setLangState(normalize(next)), []);

  const t = useCallback(
    (key) => {
      const table = CATALOG[lang] || {};
      if (key in table) return table[key];
      return CATALOG[DEFAULT_LANG][key] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, t, supported: SUPPORTED }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage LanguageProvider ichida ishlatilishi kerak");
  }
  return ctx;
}
