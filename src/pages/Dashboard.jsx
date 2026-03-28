import { useState, useEffect } from "react";
import {
  loadReminders,  saveReminders,
  loadCompletions, saveCompletions,
} from "../services/dataService";
import RemindersContainer  from "../components/reminders/RemindersContainer";
import ManageRemindersModal from "../components/reminders/ManageRemindersModal";

export default function Dashboard() {
  const [reminders,   setReminders]   = useState([]);
  const [completions, setCompletions] = useState([]);
  const [ready,       setReady]       = useState(false);
  const [managing,    setManaging]    = useState(false);

  // ── Load on mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setReminders(await loadReminders());
      setCompletions(await loadCompletions());
      setReady(true);
    })();
  }, []);

  // ── Persist on change ────────────────────────────────────────────────────────
  useEffect(() => { if (ready) saveReminders(reminders);     }, [reminders,   ready]);
  useEffect(() => { if (ready) saveCompletions(completions); }, [completions, ready]);

  // ── Toggle a completion for a specific reminder + date ───────────────────────
  const handleToggle = (reminderId, date) => {
    setCompletions(prev => {
      const exists = prev.some(c => c.reminderId === reminderId && c.date === date);
      return exists
        ? prev.filter(c => !(c.reminderId === reminderId && c.date === date))
        : [...prev, { reminderId, date }];
    });
  };

  return (
    <div style={{
      maxWidth:   "720px",
      margin:     "0 auto",
      padding:    "24px 20px",
      boxSizing:  "border-box",
      width:      "100%",
    }}>
      <RemindersContainer
        reminders={reminders}
        completions={completions}
        onToggle={handleToggle}
        onManage={() => setManaging(true)}
      />

      {managing && (
        <ManageRemindersModal
          reminders={reminders}
          onSave={setReminders}
          onClose={() => setManaging(false)}
        />
      )}
    </div>
  );
}
