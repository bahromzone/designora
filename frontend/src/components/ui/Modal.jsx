import { useEffect, useId, useRef } from "react";
function Modal({ open, onClose, title, children, footer }) {
  const dialogRef = useRef(null); const titleId = useId(); const previousFocus = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) { previousFocus.current = document.activeElement; dialog.showModal(); }
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const dialog = dialogRef.current; if (!dialog) return undefined;
    const close = () => { onClose?.(); previousFocus.current?.focus?.(); };
    const cancel = event => { event.preventDefault(); close(); };
    dialog.addEventListener("close", close); dialog.addEventListener("cancel", cancel);
    return () => { dialog.removeEventListener("close", close); dialog.removeEventListener("cancel", cancel); };
  }, [onClose]);
  return <dialog ref={dialogRef} className="a11y-dialog" aria-labelledby={title ? titleId : undefined} onClick={event => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
    <div className="a11y-dialog__surface">{title && <header><h2 id={titleId}>{title}</h2><button type="button" aria-label="Oynani yopish" onClick={() => dialogRef.current.close()}>×</button></header>}<div>{children}</div>{footer && <footer>{footer}</footer>}</div>
  </dialog>;
}
export default Modal;
