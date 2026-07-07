/**
 * Foydalanuvchi avatari. Rasm bo'lsa ko'rsatadi, aks holda ism bosh
 * harflarini brend binafsha gradient fon ustida chiqaradi.
 */
const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ src, name = "", size = "md", className = "" }) {
  const dim = SIZES[size] ?? SIZES.md;
  return (
    <span
      className={`inline-flex select-none items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-card ${dim} ${className}`}
      style={
        src
          ? undefined
          : {
              backgroundImage:
                "linear-gradient(135deg,#ec4899 0%,#a855f7 50%,#4f46e5 100%)",
            }
      }
      title={name || undefined}
    >
      {src ? (
        <img
          src={src}
          alt={name || "avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export default Avatar;
