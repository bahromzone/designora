import { useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./OnboardingFlow.css";

export const ONBOARDING_KEYS = {
  completed: "designora-onboarded",
  profile: "designora-learning-profile",
  interests: "designora-interests",
};

const STEPS = ["Maqsad", "Yo‘nalish", "Tajriba", "Reja"];
const GOALS = [
  { id: "career", title: "Ishga tayyorlanish", note: "Kuchli portfolio va real loyihalar" },
  { id: "freelance", title: "Freelance boshlash", note: "Mijozlar uchun amaliy ko‘nikmalar" },
  { id: "portfolio", title: "Portfolio kuchaytirish", note: "Eng yaxshi ishlarni tizimli yig‘ish" },
  { id: "hobby", title: "O‘zim uchun o‘rganish", note: "Erkin tempda ijodiy rivojlanish" },
];
const INTERESTS = [
  "UI/UX dizayn", "Grafik dizayn", "Moda va liboslar", "Brending",
  "Motion dizayn", "3D", "Tipografika", "Frontend",
];
const LEVELS = [
  { id: "beginner", title: "Yangi boshlayapman", note: "Asoslardan boshlab, izchil yo‘l kerak" },
  { id: "intermediate", title: "Asoslarni bilaman", note: "Ko‘proq amaliyot va feedback kerak" },
  { id: "advanced", title: "Tajribam bor", note: "Murakkab loyihalar bilan o‘smoqchiman" },
];
const HOURS = [2, 4, 6, 8];

function readCompleted() {
  try { return localStorage.getItem(ONBOARDING_KEYS.completed) === "1"; }
  catch { return true; }
}

function readDraft() {
  try {
    return JSON.parse(localStorage.getItem(ONBOARDING_KEYS.profile) || "null") || {};
  } catch { return {}; }
}

export function getLearningProfile() {
  return readDraft();
}

function Icon({ name }) {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    back: <><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    spark: <><path d="m12 3-1.2 4.1L7 9l3.8 1.9L12 15l1.2-4.1L17 9l-3.8-1.9Z"/><path d="m5 15-.7 2.3L2 18.5l2.3 1.2L5 22l.7-2.3L8 18.5l-2.3-1.2Z"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function OnboardingModal() {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const initial = useMemo(readDraft, []);
  const [open, setOpen] = useState(() => !readCompleted());
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    goal: initial.goal || "",
    interests: initial.interests || [],
    level: initial.level || "",
    weeklyHours: initial.weeklyHours || 4,
    reminder: initial.reminder ?? true,
  });

  if (!isAuthenticated || !open) return null;

  const valid = [profile.goal, profile.interests.length > 0, profile.level, profile.weeklyHours][step];
  const weeklySessions = Math.max(2, Math.min(5, Math.round(profile.weeklyHours / 1.5)));
  const sessionMinutes = Math.round((profile.weeklyHours * 60) / weeklySessions / 5) * 5;

  function update(key, value) {
    setProfile((previous) => ({ ...previous, [key]: value }));
  }

  function toggleInterest(item) {
    setProfile((previous) => ({
      ...previous,
      interests: previous.interests.includes(item)
        ? previous.interests.filter((value) => value !== item)
        : previous.interests.length < 3
          ? [...previous.interests, item]
          : previous.interests,
    }));
  }

  function save(completed = false) {
    try {
      localStorage.setItem(ONBOARDING_KEYS.profile, JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }));
      localStorage.setItem(ONBOARDING_KEYS.interests, JSON.stringify(profile.interests));
      if (completed) localStorage.setItem(ONBOARDING_KEYS.completed, "1");
    } catch { /* private mode: continue without persistence */ }
  }

  function closeForNow() {
    save(false);
    setOpen(false);
    toast.info("Tanlovlaringiz qoralama sifatida saqlandi.");
  }

  function next() {
    if (!valid) return;
    save(false);
    if (step < STEPS.length - 1) setStep((value) => value + 1);
    else {
      save(true);
      setOpen(false);
      toast.success("Shaxsiy o‘qish rejangiz tayyor!");
    }
  }

  return (
    <div className="onboarding-layer" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="onboarding-shell">
        <header className="onboarding-topbar">
          <div className="onboarding-brand"><span>D</span><strong>DESIGNORA</strong></div>
          <button type="button" className="onboarding-close" onClick={closeForNow} aria-label="Keyinroq davom etish"><Icon name="close" /></button>
        </header>

        <div className="onboarding-layout">
          <aside className="onboarding-aside">
            <div>
              <p className="onboarding-kicker">Shaxsiy yo‘l</p>
              <h2>Har dars maqsadingizga xizmat qilsin.</h2>
              <p>Javoblaringiz asosida kurs tavsiyalari va haftalik rejangiz moslanadi.</p>
            </div>
            <ol>
              {STEPS.map((label, index) => (
                <li key={label} className={index === step ? "is-current" : index < step ? "is-done" : ""}>
                  <span>{index < step ? <Icon name="check" /> : index + 1}</span>{label}
                </li>
              ))}
            </ol>
            <small>Barcha tanlovlarni keyin profil orqali o‘zgartirish mumkin.</small>
          </aside>

          <main className="onboarding-main">
            <div className="onboarding-progress"><i style={{ transform: `scaleX(${(step + 1) / STEPS.length})` }} /></div>
            <div className="onboarding-step" key={step}>
              {step === 0 && <>
                <p className="onboarding-kicker">1 / 4</p>
                <h1 id="onboarding-title">Design sizni qayerga olib borishi kerak?</h1>
                <p className="onboarding-lead">Eng muhim maqsadni tanlang. Tavsiya yo‘lingiz shunga qarab tuziladi.</p>
                <div className="onboarding-options">
                  {GOALS.map((option) => <button key={option.id} type="button" className={profile.goal === option.id ? "is-selected" : ""} onClick={() => update("goal", option.id)}><span><strong>{option.title}</strong><small>{option.note}</small></span><i>{profile.goal === option.id && <Icon name="check" />}</i></button>)}
                </div>
              </>}

              {step === 1 && <>
                <p className="onboarding-kicker">2 / 4</p>
                <h1 id="onboarding-title">Qaysi yo‘nalishlar sizniki?</h1>
                <p className="onboarding-lead">Uchtagacha tanlang. Fokusni yo‘qotmaymiz.</p>
                <div className="interest-cloud">
                  {INTERESTS.map((item) => <button key={item} type="button" aria-pressed={profile.interests.includes(item)} className={profile.interests.includes(item) ? "is-selected" : ""} onClick={() => toggleInterest(item)}>{item}{profile.interests.includes(item) && <Icon name="check" />}</button>)}
                </div>
                <p className="selection-count">{profile.interests.length}/3 tanlandi</p>
              </>}

              {step === 2 && <>
                <p className="onboarding-kicker">3 / 4</p>
                <h1 id="onboarding-title">Hozir qaysi bosqichdasiz?</h1>
                <p className="onboarding-lead">Darajangiz kontent murakkabligi va boshlash nuqtasini belgilaydi.</p>
                <div className="onboarding-options level-options">
                  {LEVELS.map((option) => <button key={option.id} type="button" className={profile.level === option.id ? "is-selected" : ""} onClick={() => update("level", option.id)}><span><strong>{option.title}</strong><small>{option.note}</small></span><i>{profile.level === option.id && <Icon name="check" />}</i></button>)}
                </div>
              </>}

              {step === 3 && <>
                <p className="onboarding-kicker">4 / 4</p>
                <h1 id="onboarding-title">Real tempni tanlaymiz.</h1>
                <p className="onboarding-lead">Katta va’da emas, bajariladigan reja. Haftasiga qancha vaqt ajratasiz?</p>
                <div className="hours-row">
                  {HOURS.map((hours) => <button key={hours} type="button" className={profile.weeklyHours === hours ? "is-selected" : ""} onClick={() => update("weeklyHours", hours)}><strong>{hours}</strong><small>soat</small></button>)}
                </div>
                <div className="plan-preview">
                  <span><Icon name="spark" /></span>
                  <div><small>Sizning boshlang‘ich rejangiz</small><strong>Haftasiga {weeklySessions} marta, taxminan {sessionMinutes} daqiqadan</strong><p>{profile.interests[0] || "Tanlangan yo‘nalish"} bo‘yicha izchil progress uchun yetarli temp.</p></div>
                </div>
                <label className="reminder-toggle"><span><Icon name="clock" /><i><strong>O‘qish reminderi</strong><small>Rejadan ortda qolsangiz eslatamiz</small></i></span><input type="checkbox" checked={profile.reminder} onChange={(event) => update("reminder", event.target.checked)} /><b /></label>
              </>}
            </div>

            <footer className="onboarding-actions">
              <button type="button" className="onboarding-back" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><Icon name="back" /> Orqaga</button>
              <button type="button" className="onboarding-next" onClick={next} disabled={!valid}>{step === STEPS.length - 1 ? "Rejani yaratish" : "Davom etish"}<Icon name="arrow" /></button>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
