import { useId, useRef } from "react";
function Tabs({ tabs = [], value, onChange, className = "" }) {
  const baseId = useId(); const refs = useRef([]);
  const onKeyDown = (event, index) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    let next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : event.key === "ArrowRight" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
    onChange?.(tabs[next].value); refs.current[next]?.focus();
  };
  return <div role="tablist" className={className}>{tabs.map((tab,index) => { const active = tab.value === value; return <button key={tab.value} ref={node => refs.current[index] = node} id={`${baseId}-tab-${index}`} role="tab" type="button" aria-selected={active} aria-controls={`${baseId}-panel-${index}`} tabIndex={active ? 0 : -1} onKeyDown={event => onKeyDown(event,index)} onClick={() => onChange?.(tab.value)}>{tab.label}</button>; })}</div>;
}
export default Tabs;
