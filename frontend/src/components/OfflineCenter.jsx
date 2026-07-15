import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { offlineStore } from "../lib/offlineStore";
import { registerOfflineSync } from "../lib/offlineSync";
import "./OfflineCenter.css";

export default function OfflineCenter() {
  const { token } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);
  const [result, setResult] = useState(null);
  const [install, setInstall] = useState(null);

  useEffect(() => {
    const refresh = () => offlineStore.pending().then((items) => setPending(items.length));
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onPrompt = (event) => {
      event.preventDefault();
      setInstall(event);
    };

    addEventListener("online", onOnline);
    addEventListener("offline", onOffline);
    addEventListener("beforeinstallprompt", onPrompt);
    refresh();
    const stop = token
      ? registerOfflineSync(token, (next) => {
          setResult(next);
          refresh();
        })
      : () => {};

    return () => {
      removeEventListener("online", onOnline);
      removeEventListener("offline", onOffline);
      removeEventListener("beforeinstallprompt", onPrompt);
      stop();
    };
  }, [token]);

  if (online && !pending && !install && !result) return null;

  const title = online ? (pending ? "Sinxronlanmoqda" : "Designora’ni o‘rnating") : "Offline rejim";
  const detail = online
    ? pending
      ? `${pending} o‘zgarish navbatda`
      : "Tezroq qaytish uchun"
    : "Notes va dars outline saqlanadi";

  return (
    <section role="status" aria-live="polite" aria-atomic="true">
      <strong>{title}</strong>
      <span>{detail}</span>
      {install && (
        <button type="button" onClick={() => install.prompt().then(() => setInstall(null))}>
          O‘rnatish
        </button>
      )}
      {result?.conflicts > 0 && (
        <span role="alert">{result.conflicts} conflict, server nusxasi saqlandi</span>
      )}
    </section>
  );
}
