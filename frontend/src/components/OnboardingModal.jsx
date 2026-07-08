import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button, Modal } from "./ui";

const ONBOARDED_KEY = "designora-onboarded";
const INTERESTS_KEY = "designora-interests";

const INTERESTS = [
  "UI/UX dizayn",
  "Grafik dizayn",
  "Moda va liboslar",
  "Brending",
  "Motion / animatsiya",
  "3D",
  "Tipografika",
  "Frontend",
];

function alreadyOnboarded() {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return true;
  }
}

/**
 * Yangi (tizimga kirgan) foydalanuvchiga bir marta ko'rsatiladigan
 * qiziqishlarni tanlash oynasi. Tanlov localStorage'ga saqlanadi.
 */
export default function OnboardingModal() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(() => !alreadyOnboarded());
  const [selected, setSelected] = useState([]);

  // Faqat tizimga kirgan va hali onboarding ko'rmagan foydalanuvchiga.
  if (!isAuthenticated || !open) return null;

  function toggle(item) {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  function finish() {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
      localStorage.setItem(INTERESTS_KEY, JSON.stringify(selected));
    } catch {
      // localStorage mavjud emas — e'tiborsiz qoldiramiz.
    }
    setOpen(false);
    if (selected.length > 0) {
      toast.success("Qiziqishlaringiz saqlandi!");
    }
  }

  return (
    <Modal open={open} onClose={finish} title="Xush kelibsiz! 🎨">
      <p className="text-sm text-muted">
        Nimalarni o'rganmoqchisiz? Tanlovlaringiz bo'yicha sizga kurslar tavsiya
        qilamiz.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {INTERESTS.map((item) => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              aria-pressed={active}
              className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                borderColor: active ? "var(--brand)" : "var(--border)",
                background: active ? "var(--amber-10)" : "transparent",
                color: active ? "var(--brand)" : "var(--ink)",
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={finish}>
          Keyinroq
        </Button>
        <Button onClick={finish}>Davom etish</Button>
      </div>
    </Modal>
  );
}
