import { GOOGLE_AUTH_URL } from "../lib/authExtra";

// Login modali (Navbar) va boshqa joylarda qayta ishlatiladigan
// "Google orqali kirish" tugmasi. Modal uslubiga mos (rounded-full).
// Pastida ixtiyoriy "yoki" ajratgichi bor — forma tepasiga qo'yish uchun.
export default function GoogleAuthButton({ label = "Google orqali kirish", showDivider = true }) {
  return (
    <>
      <a
        href={GOOGLE_AUTH_URL}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-white md:bg-white py-3 text-[14px] font-semibold text-gray-700 shadow-[0_8px_30px_-5px_rgba(110,120,180,0.15)] border border-gray-200 hover:border-violet-200 hover:shadow-[0_8px_30px_-5px_rgba(129,59,255,0.25)] transition-all duration-300"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.82-.07-1.6-.2-2.36H12v4.46h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.75z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.12A12 12 0 0 0 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.26a7.2 7.2 0 0 1 0-4.52V6.62H1.26a12 12 0 0 0 0 10.76z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.26 6.62l4.01 3.12C6.22 6.86 8.87 4.75 12 4.75z"
          />
        </svg>
        {label}
      </a>

      {showDivider && (
        <div className="my-4 flex items-center gap-4">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-[#A0A6B5]">yoki</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
      )}
    </>
  );
}
