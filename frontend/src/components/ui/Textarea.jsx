function Textarea({ label, error, id, className = "", rows = 4, ...rest }) {
  const areaId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={areaId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        className={`input-field resize-y ${error ? "border-rose-400" : ""} ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...rest}
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

export default Textarea;
