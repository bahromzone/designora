/**
 * Umumiy tanlov (select). options: [{value, label}] yoki children.
 */
function Select({
  label,
  error,
  id,
  options,
  className = "",
  children,
  ...rest
}) {
  const selectId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-field cursor-pointer ${error ? "border-rose-400" : ""} ${className}`}
        {...rest}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

export default Select;
