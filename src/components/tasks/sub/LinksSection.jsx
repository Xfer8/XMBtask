import { useState, useRef, useEffect } from "react";
import MutedBadge    from "../../ui/MutedBadge";
import ImagePasteZone from "./ImagePasteZone";

const LINK_TYPES       = ["Source", "Sherlock", "Jira", "Email", "Link"];
const LINK_TYPE_COLORS = { Source:"yellow", Sherlock:"orange", Jira:"blue", Email:"purple", Link:"gray", Other:"gray" };
const generateLinkId   = () => `LK${Date.now()}`;
const EMPTY_LINK       = { url:"", displayName:"", type:"", images:[] };

// Types that auto-save on paste without opening the full form.
// Email is excluded — user may want to add more images or a display name.
const AUTO_SAVE_TYPES  = new Set(["Sherlock", "Jira"]);

const inputStyle = {
  width:"100%", boxSizing:"border-box", background:"#1e1e1e",
  border:"1px solid #3a3a3a", borderRadius:"8px", color:"#f0f0f0",
  fontSize:"13px", padding:"8px 12px", fontFamily:"inherit", outline:"none",
};
const cancelBtnStyle = {
  background:"none", border:"1px solid #3a3a3a", borderRadius:"7px",
  cursor:"pointer", color:"#888890", fontSize:"12px", padding:"5px 12px", fontFamily:"inherit",
};
const saveBtnStyle = {
  background:"#0E3F24", border:"1px solid #1D7F48", borderRadius:"7px",
  cursor:"pointer", color:"#4ADE80", fontSize:"12px", fontWeight:600,
  padding:"5px 12px", fontFamily:"inherit",
};

const PencilIcon = ({ size=12 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 4l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const PasteIcon = ({ size=13 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="4" y="2" width="8" height="3" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

// ── type / name helpers ────────────────────────────────────────────────────────
const detectType = url => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("atlassian.net"))     return "Jira";
    if (host.includes("sherlock.epic.com")) return "Sherlock";
  } catch (_) {}
  return null;
};

const autoName = (type, url) => {
  if (type === "Sherlock") { const m = url.match(/[?&#]id=(\d+)/i); return m ? m[1] : null; }
  if (type === "Jira")     { const m = url.match(/\/([A-Z]+-\d+)/); return m ? m[1] : null; }
  return null;
};

const emailBadgeValue = l =>
  l.displayName ||
  (l.images?.length ? `${l.images.length} image${l.images.length !== 1 ? "s" : ""}` : "(none)");

// ── QuickPasteZone ────────────────────────────────────────────────────────────
// Focused zone that accepts Ctrl+V. Detects images → Email type, or text →
// auto-detected URL type, then calls onDetected({ type, url, displayName, images }).
function QuickPasteZone({ onDetected }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  // Auto-focus when mounted so the user can paste immediately
  useEffect(() => { ref.current?.focus(); }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const h = e => {
      const items = Array.from(e.clipboardData?.items ?? []);

      // ── Images → Email type ──────────────────────────────────────────────
      const imgItems = items.filter(i => i.type.startsWith("image/"));
      if (imgItems.length > 0) {
        e.preventDefault();
        Promise.all(
          imgItems.map(item => new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = evt => resolve(evt.target.result);
            reader.readAsDataURL(item.getAsFile());
          }))
        ).then(imgs => onDetected({ type: "Email", url: "", displayName: "", images: imgs }));
        return;
      }

      // ── Text / URL → auto-detect type ────────────────────────────────────
      const textItem = items.find(i => i.type === "text/plain");
      if (textItem) {
        e.preventDefault();
        textItem.getAsString(text => {
          const url         = text.trim();
          const detected    = detectType(url) ?? "Link";
          const displayName = autoName(detected, url) ?? "";
          onDetected({ type: detected, url, displayName, images: [] });
        });
      }
    };

    el.addEventListener("paste", h);
    return () => el.removeEventListener("paste", h);
  }, [onDetected]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        minHeight:  "52px",
        borderRadius: "8px",
        padding:    "0 14px",
        border:     `1.5px dashed ${focused ? "#4ADE80" : "#3a3a3a"}`,
        outline:    "none",
        cursor:     "default",
        display:    "flex",
        alignItems: "center",
        transition: "border-color 0.15s",
      }}
    >
      <span style={{ fontSize:"12px", color: focused ? "#888890" : "#55555e", display:"flex", alignItems:"center", gap:"7px", transition:"color 0.15s" }}>
        <PasteIcon />
        Quick add — paste an image or URL (Ctrl+V)
      </span>
    </div>
  );
}

// ── LinksSection ──────────────────────────────────────────────────────────────
export default function LinksSection({ links, onChange }) {
  const [adding,     setAdding]     = useState(false);
  const [quickMode,  setQuickMode]  = useState(false); // true = show paste zone first
  const [form,       setForm]       = useState(EMPTY_LINK);
  const [editingId,  setEditingId]  = useState(null);
  const [editForm,   setEditForm]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const startAdding  = () => { setAdding(true); setQuickMode(true); setForm(EMPTY_LINK); };
  const cancelAdding = () => { setAdding(false); setQuickMode(false); setForm(EMPTY_LINK); };

  // Called by QuickPasteZone with detected payload.
  // Known types (Sherlock, Jira, …) save immediately — no form needed.
  // Everything else (Email, Link, unknown) opens the full form pre-filled.
  const handleQuickDetected = detected => {
    if (AUTO_SAVE_TYPES.has(detected.type)) {
      onChange([...links, { ...EMPTY_LINK, ...detected, id: generateLinkId() }]);
      cancelAdding();
    } else {
      setForm(f => ({ ...f, ...detected }));
      setQuickMode(false);
    }
  };

  // Manual "skip quick paste" path
  const goManual = () => setQuickMode(false);

  // ── Add-form field updater ────────────────────────────────────────────────
  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === "type") next.images = [];
    if (k === "url") {
      const detected = detectType(next.url);
      if (detected && !next.type) next.type = detected;
      if (next.type && !next.displayName) {
        const name = autoName(next.type, next.url);
        if (name) next.displayName = name;
      }
    }
    return next;
  });

  const handleAdd = () => {
    if (!form.type) return;
    if (form.type !== "Email" && !form.url.trim()) return;
    onChange([...links, { ...form, id: generateLinkId() }]);
    cancelAdding();
  };

  const startEdit = l => { setEditingId(l.id); setEditForm({ ...l, images: l.images ?? [] }); setConfirmDel(null); };
  const saveEdit  = () => {
    onChange(links.map(l => l.id === editingId ? { ...l, ...editForm } : l));
    setEditingId(null); setEditForm(null);
  };

  const addDisabled = !form.type || (form.type !== "Email" && !form.url.trim());

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>

      {/* ── Existing link rows ──────────────────────────────────────────────── */}
      {links.map(l => {
        // ── Inline edit form ──────────────────────────────────────────────
        if (editingId === l.id) return (
          <div key={l.id} style={{ display:"flex", flexDirection:"column", gap:"8px", background:"#1E1E1E", borderRadius:"8px", padding:"12px" }}>
            <select
              value={editForm.type}
              onChange={e => setEditForm(f => ({ ...f, type: e.target.value, images: [] }))}
              style={{ ...inputStyle, cursor:"pointer" }}
            >
              <option value="">Select type…</option>
              {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {editForm.type === "Email" ? (
              <ImagePasteZone
                images={editForm.images ?? []}
                onChange={imgs => setEditForm(f => ({ ...f, images: imgs }))}
              />
            ) : (
              <input type="text" value={editForm.url} placeholder="URL"
                onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))}
                style={inputStyle}
              />
            )}

            <input type="text" value={editForm.displayName} placeholder="Display name (optional)"
              onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
              style={inputStyle}
            />

            <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
              <button onClick={() => { setEditingId(null); setEditForm(null); }} style={cancelBtnStyle}>Cancel</button>
              <button onClick={saveEdit} style={saveBtnStyle}>Save</button>
            </div>
          </div>
        );

        // ── Display row ───────────────────────────────────────────────────
        const colorKey = LINK_TYPE_COLORS[l.type] ?? "gray";
        const badgeVal = l.type === "Email" ? emailBadgeValue(l) : (l.displayName || l.url || "(none)");
        return (
          <div key={l.id} style={{ display:"flex", alignItems:"center", gap:"10px", background:"#1E1E1E", borderRadius:"8px", padding:"8px 12px" }}>
            <MutedBadge label={l.type} value={badgeVal} colorKey={colorKey} onClick={() => startEdit(l)} />
            <div style={{ flex:1 }} />

            {confirmDel === l.id ? (
              <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
                <span style={{ fontSize:"11px", color:"#888890" }}>Delete?</span>
                <button onClick={() => { onChange(links.filter(x => x.id !== l.id)); setConfirmDel(null); }} style={{ ...saveBtnStyle, background:"#4A1B1B", color:"#FF6B6B", border:"1px solid #943636" }}>Yes</button>
                <button onClick={() => setConfirmDel(null)} style={cancelBtnStyle}>No</button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:"2px", flexShrink:0 }}>
                <button onClick={() => startEdit(l)} style={{ background:"none", border:"none", cursor:"pointer", color:"#4ADE80", padding:"2px 4px", display:"flex", alignItems:"center" }}><PencilIcon/></button>
                <button onClick={() => setConfirmDel(l.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#55555e", fontSize:"14px", lineHeight:1, padding:"2px 4px" }}>✕</button>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Add form ─────────────────────────────────────────────────────────── */}
      {adding ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px", background:"#1E1E1E", borderRadius:"8px", padding:"12px" }}>

          {/* Quick-paste zone — shown first; disappears once something is pasted */}
          {quickMode ? (
            <>
              <QuickPasteZone onDetected={handleQuickDetected} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <button
                  onClick={goManual}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"#55555e", fontSize:"11px", fontFamily:"inherit", padding:"2px 0" }}
                >
                  Add manually →
                </button>
                <button onClick={cancelAdding} style={cancelBtnStyle}>Cancel</button>
              </div>
            </>
          ) : (
            /* Full form — pre-filled after paste, or blank after "Add manually" */
            <>
              <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
                <option value="">Select type…</option>
                {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              {form.type === "Email" ? (
                <ImagePasteZone
                  images={form.images ?? []}
                  onChange={imgs => setForm(f => ({ ...f, images: imgs }))}
                />
              ) : (
                form.type && (
                  <input type="text" value={form.url} placeholder="URL (required)"
                    onChange={e => set("url", e.target.value)}
                    style={inputStyle}
                  />
                )
              )}

              {form.type && (
                <input type="text" value={form.displayName} placeholder="Display name (optional)"
                  onChange={e => set("displayName", e.target.value)}
                  style={inputStyle}
                />
              )}

              <div style={{ display:"flex", gap:"8px", justifyContent:"flex-end" }}>
                <button onClick={cancelAdding} style={cancelBtnStyle}>Cancel</button>
                <button onClick={handleAdd} disabled={addDisabled} style={{ ...saveBtnStyle, opacity: addDisabled ? 0.45 : 1 }}>
                  Add Link
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={startAdding}
          style={{ background:"none", border:"1px dashed #3a3a3a", borderRadius:"8px", padding:"7px 12px", cursor:"pointer", fontSize:"12px", color:"#888890", textAlign:"left", fontFamily:"inherit" }}
        >
          + Add Link
        </button>
      )}
    </div>
  );
}
