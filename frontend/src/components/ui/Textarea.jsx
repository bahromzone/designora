import { useId } from "react";
function Textarea({ label, error, hint, id, className = "", rows = 4, required, ...rest }) {
  const generated = useId(); const areaId = id ?? rest.name ?? generated; const errorId = `${areaId}-error`; const hintId = `${areaId}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return <div className={`field ${className}`}>{label && <label htmlFor={areaId}>{label}{required && <span aria-hidden="true"> *</span>}</label>}{hint && <p id={hintId} className="field-hint">{hint}</p>}<textarea {...rest} id={areaId} rows={rows} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} className="input-field" />{error && <p id={errorId} className="field-error" role="alert">{error}</p>}</div>;
}
export default Textarea;
