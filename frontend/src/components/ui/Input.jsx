/**
 * Umumiy matn maydoni + ixtiyoriy yorliq va xato.
 */
function Input({ label, error, id, className = "", ...rest }) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field ${error ? "border-rose-400" : ""} ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...rest}
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

export default Input;
