import { useEffect, useState } from "react";

export default function LiveAnnouncer() {
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("polite");
  useEffect(() => {
    const handler = (event) => {
      setMessage("");
      window.setTimeout(() => {
        setPriority(event.detail?.priority || "polite");
        setMessage(event.detail?.message || "");
      }, 20);
    };
    window.addEventListener("designora:announce", handler);
    return () => window.removeEventListener("designora:announce", handler);
  }, []);
  return <div className="sr-only" role={priority === "assertive" ? "alert" : "status"} aria-live={priority} aria-atomic="true">{message}</div>;
}
