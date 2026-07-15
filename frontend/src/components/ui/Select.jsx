import { useId } from "react";
function Select({ label, error, hint, id, options, className = "", children, required, ...rest }) {
  const generated = useId(); const selectId = id ?? rest.name ?? generated; const errorId = `${selectId}-error`; const hintId = `${selectId}-hint`;
  return <div className={`field ${className}`}>{label && <label htmlFor={selectId}>{label}{required && <span aria-hidden="true"> *</span>}</label>}{hint && <p id={hintId} className="field-hint">{hint}</p>}<select {...rest} id={selectId} required={required} aria-invalid={Boolean(error)} aria-describedby={[hint && hintId,error && errorId].filter(Boolean).join(" ")||undefined} className="input-field">{options ? options.map(option => <option key={option.value} value={option.value}>{option.label}</option>) : children}</select>{error && <p id={errorId} className="field-error" role="alert">{error}</p>}</div>;
}
export default Select;
