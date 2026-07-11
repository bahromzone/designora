import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { reminderApi } from "../lib/reminderApi";
import "./ReminderSettings.css";

const TOGGLES = [
  ["email_enabled", "Email"], ["in_app_enabled", "Ilova ichida"], ["push_enabled", "Browser push"],
  ["lesson_reminders", "Dars eslatmalari"], ["deadline_reminders", "Deadline eslatmalari"],
  ["review_reminders", "Review sanalari"], ["marketing_enabled", "Yangilik va takliflar"],
];

export default function ReminderSettings({ onClose }) {
  const { token } = useAuth();
  const [value, setValue] = useState(null);
  const [status, setStatus] = useState("");
  useEffect(() => { reminderApi.get(token).then(setValue).catch((error) => setStatus(error.message)); }, [token]);
  const save = async (patch) => {
    const optimistic = { ...value, ...patch };
    setValue(optimistic);
    try { setValue(await reminderApi.update(patch, token)); setStatus("Saqlandi"); }
    catch (error) { setStatus(error.message); reminderApi.get(token).then(setValue); }
  };
  if (!value) return <div className="reminder-settings"><p>{status || "Sozlamalar yuklanmoqda..."}</p></div>;
  return (
    <section className="reminder-settings" aria-labelledby="reminder-title">
      <header><div><small>Reminderlar</small><h2 id="reminder-title">Bildirishnoma sozlamalari</h2></div><button onClick={onClose} aria-label="Yopish">×</button></header>
      <div className="reminder-channels">{TOGGLES.map(([key,label]) => <label key={key}><span>{label}</span><input type="checkbox" checked={Boolean(value[key])} onChange={(event) => save({ [key]: event.target.checked })} /></label>)}</div>
      <div className="reminder-row"><label>Tez-tezlik<select value={value.frequency} onChange={(event) => save({ frequency: event.target.value })}><option value="instant">Darhol</option><option value="daily">Kunlik jamlama</option><option value="weekly">Haftalik jamlama</option></select></label><label>Timezone<select value={value.timezone} onChange={(event) => save({ timezone: event.target.value })}><option value="Asia/Tashkent">Toshkent</option><option value="UTC">UTC</option><option value="Europe/London">London</option><option value="America/New_York">New York</option></select></label></div>
      <div className="reminder-row"><label>Quiet hours boshlanishi<input type="time" value={value.quiet_start} onChange={(event) => save({ quiet_start: event.target.value })} /></label><label>Tugashi<input type="time" value={value.quiet_end} onChange={(event) => save({ quiet_end: event.target.value })} /></label></div>
      <footer><button onClick={() => reminderApi.test(token).then((result) => setStatus(result.quiet_hours ? "Quiet hours faol" : `${result.channels.join(", ")} orqali test yuborildi`))}>Test yuborish</button><span role="status">{status}</span></footer>
    </section>
  );
}
