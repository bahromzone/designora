import { useId } from "react";

/** Accessible text field with label, hint and assertive validation feedback. */
function Input({ label, hint, error, id, className = "", ...rest }) {
  const generatedId = useId();
  const inputId = id ?? rest.name ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : null;
  const errorId = error ? `${inputId}-error` : null;
  const describedBy = [rest["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      {label && <label htmlFor={inputId}>{label}</label>}
      {hint && <p id={hintId}>{hint}</p>}
      <input
        {...rest}
        id={inputId}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
      />
      {error && (
        <p id={errorId} role="alert" aria-live="assertive">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
