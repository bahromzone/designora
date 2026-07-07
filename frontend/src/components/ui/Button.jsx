const VARIANTS = {
  primary: "btn-primary",
  dark: "btn-dark",
  outline: "btn-outline",
};

/**
 * Umumiy tugma — dizayn tizimidagi uslublardan foydalanadi.
 * variant: "primary" | "dark" | "outline"
 */
function Button({
  variant = "primary",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) {
  const base = VARIANTS[variant] ?? VARIANTS.primary;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

export default Button;
