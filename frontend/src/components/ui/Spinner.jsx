function Spinner({ className = "" }) {
  return (
    <span
      role="status"
      aria-label="Yuklanmoqda"
      className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600 ${className}`}
    />
  );
}

export default Spinner;
