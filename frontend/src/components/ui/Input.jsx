import { useId } from "react";

function Input({ label, error, hint, id, className = "", required, ...rest }) {
  const generated = useId();
  const inputId = id ?? rest.name ?? generated;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null, rest["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return <div className={`field ${className}`}>
    {label && <label htmlFor={inputId}>{label}{required && <span aria-hidden="true"> *</span>}<span className="sr-only">{required ? " majburiy" : ""}</span></label>}
    {hint && <p id={hintId} className="field-hint">{hint}</p>}
    <input {...rest} id={inputId} required={required} aria-invalid={Boolean(error)} aria-describedby={describedBy} className="input-field" />
    {error && <p id={errorId} className="field-error" role="alert">{error}</p>}
  </div>;
}
export default Input;
