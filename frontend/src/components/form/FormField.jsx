export function FormField({ label, description, error, required, children }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-1 text-sm font-medium text-slate-800">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      {children}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </label>
  );
}
