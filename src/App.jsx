const STORAGE_KEY = "hotel-onboarding-v2";
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { } }
function loadData() { try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : null; } catch { return null; } }

// ─── INIT STATE ───────────────────────────────────────────────
const INIT = {
  identity: { nomJuridique: "", enseigne: "", siret: "", tva: "", adresse: "", lat: "", lng: "", mailContact: "", mailFacturation: "", tel: "", horaires: "", iban: "", bic: "", typeEtablissement: "Hôtel", logiciels: "PMS", bookingId: "", expediaId: "", airbnbId: "", lienDrive: "" },
  chambres: [], tarifs: [], extras: [], cales: [], calendar: {}
};

// ─── CONSTANTS ────────────────────────────────────────────────
const TYPE_ETABLISSEMENT = ["Hôtel", "Appart-hôtel", "Gîte", "Chambre d'hôtes", "Autre"];
const LOGICIELS = ["PMS", "Channel Manager", "PMS + CM", "Aucun"];
const CONFIG_LITS = ["Double", "Twin", "King Size", "Simple", "Modulable"];
const SALLE_EAU = ["Baignoire", "Douche", "Les deux", "Cabine de douche italienne"];
const TYPE_TARIF = ["Base", "Dérivé", "Promotion", "Early Bird", "Last Minute", "Groupe"];
const REPAS = ["Aucun", "Petit-déjeuner", "Demi-pension", "Pension complète", "All Inclusive"];
const ANNULATION = ["Non-remboursable", "Flexible J-1", "Flexible J-3", "Flexible J-7", "Flexible J-14"];
const MAPPING = ["Direct uniquement", "OTA uniquement", "Tous canaux", "Sélection manuelle"];
const RESTRICTIONS = ["Aucune", "Min Stay 2 nuits", "Min Stay 3 nuits", "CTA", "CTD", "Max Stay 7 nuits"];
const TVA = ["20%", "10%", "5.5%", "2.1%", "0%"];
const VENTILATION = ["Par Pax/Nuit", "Par Pax/Séjour", "Par Chambre/Nuit", "Par Chambre/Séjour", "Forfait unique"];
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const STEPS = [
  { id: "identity", icon: "🏢", label: "Identité", desc: "Infos légales & contacts" },
  { id: "chambres", icon: "🛏️", label: "Chambres", desc: "Catégories & équipements" },
  { id: "tarifs", icon: "💶", label: "Tarification", desc: "Stratégie & conditions" },
  { id: "extras", icon: "🧾", label: "Extras & Taxes", desc: "Services & comptabilité" },
  { id: "pricing365", icon: "📅", label: "Cale Tarifaire", desc: "Calendrier annuel" },
];

const PALETTE_BG = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1", "#14b8a6", "#f97316"];
const PALETTE_TEXT = ["#fff", "#fff", "#1a2332", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff"];

// ─── DESIGN TOKENS (charte Océane Habonneau) ──────────────────
const T = {
  // backgrounds
  bg: "#0f1623",
  bgCard: "#1a2332",
  bgCardHov: "#1e2a3d",
  bgInput: "#0f1623",
  bgNav: "#ffffff",
  // borders
  border: "rgba(255,255,255,0.08)",
  borderFoc: "#10b981",
  // text
  textPrim: "#f1f5f9",
  textSec: "#94a3b8",
  textMuted: "#64748b",
  // accents
  green: "#10b981",
  greenDim: "rgba(16,185,129,0.15)",
  amber: "#f59e0b",
  amberDim: "rgba(245,158,11,0.15)",
  blue: "#3b82f6",
  blueDim: "rgba(59,130,246,0.15)",
  red: "#ef4444",
  // font
  font: "'Inter', 'Segoe UI', system-ui, sans-serif",
};

// ─── BASE UI COMPONENTS ───────────────────────────────────────
const Label = ({ children, required }) => (
  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textSec, display: "block", marginBottom: 5 }}>
    {children}{required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}
  </label>
);

const Input = ({ value, onChange, placeholder, type = "text", min }) => (
  <input type={type} value={value} min={min}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: T.textPrim, outline: "none", fontFamily: T.font, width: "100%", boxSizing: "border-box", transition: "border-color .15s" }}
    onFocus={e => e.target.style.borderColor = T.borderFoc}
    onBlur={e => e.target.style.borderColor = T.border}
  />
);

const Sel = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{
      background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: T.textPrim, outline: "none", fontFamily: T.font, width: "100%", boxSizing: "border-box", cursor: "pointer", appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2394a3b8' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center"
    }}
    onFocus={e => e.target.style.borderColor = T.borderFoc}
    onBlur={e => e.target.style.borderColor = T.border}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} rows={rows}
    style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: T.textPrim, outline: "none", fontFamily: T.font, width: "100%", boxSizing: "border-box", resize: "vertical", transition: "border-color .15s" }}
    onFocus={e => e.target.style.borderColor = T.borderFoc}
    onBlur={e => e.target.style.borderColor = T.border}
  />
);

const Field = ({ label, required, children, span2 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 0, gridColumn: span2 ? "1/-1" : undefined }}>
    <Label required={required}>{label}</Label>
    {children}
  </div>
);

const Grid2 = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
);

// Toggle OUI/NON
const Toggle = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {["OUI", "NON"].map(v => (
      <button key={v} type="button" onClick={() => onChange(v)} style={{
        padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font, transition: "all .15s",
        background: value === v ? (v === "OUI" ? T.green : T.red) : "rgba(255,255,255,0.04)",
        border: `1px solid ${value === v ? (v === "OUI" ? T.green : T.red) : T.border}`,
        color: value === v ? "#fff" : T.textSec
      }}>{v}</button>
    ))}
  </div>
);

// Boutons principaux
const Btn = ({ onClick, children, variant = "primary", small, icon }) => {
  const variants = {
    primary: { background: T.green, color: "#fff", border: "none" },
    secondary: { background: "transparent", color: T.green, border: `1px solid ${T.green}` },
    amber: { background: T.amber, color: "#1a2332", border: "none" },
    ghost: { background: "rgba(255,255,255,0.04)", color: T.textSec, border: `1px solid ${T.border}` },
    danger: { background: "transparent", color: T.red, border: `1px solid rgba(239,68,68,.3)` },
  };
  return (
    <button type="button" onClick={onClick} style={{
      ...variants[variant], borderRadius: 8,
      padding: small ? "5px 12px" : "9px 20px",
      fontSize: small ? 12 : 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
      display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap"
    }}>
      {icon && <span>{icon}</span>}{children}
    </button>
  );
};

// Card conteneur
const Card = ({ children, style, accent }) => (
  <div style={{
    background: T.bgCard,
    border: `1px solid ${accent ? accent + "33" : T.border}`,
    borderRadius: 12,
    padding: 20,
    ...style
  }}>{children}</div>
);

// Séparateur avec label
const Divider = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0" }}>
    <div style={{ flex: 1, height: 1, background: T.border }} />
    <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: T.border }} />
  </div>
);

// Titre de section
const SectionTitle = ({ icon, title, subtitle, badge }) => (
  <div style={{ marginBottom: 4 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: T.greenDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.textPrim, margin: 0, fontFamily: T.font }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: T.textSec, margin: "2px 0 0", fontFamily: T.font }}>{subtitle}</p>}
      </div>
      {badge && <span style={{ marginLeft: "auto", background: T.greenDim, color: T.green, border: `1px solid ${T.green}33`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>{badge}</span>}
    </div>
  </div>
);

// Chip / badge inline
const Chip = ({ children, color = "#10b981" }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{children}</span>
);

// ─── SECTION 1 : IDENTITÉ ─────────────────────────────────────
function SectionIdentity({ data, setData }) {
  const u = (k, v) => setData(p => ({ ...p, identity: { ...p.identity, [k]: v } }));
  const d = data.identity;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle icon="🏢" title="Identité juridique & commerciale" subtitle="Informations légales, coordonnées et identifiants OTA" badge={d.enseigne || "Mon établissement"} />
      <Card>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>Entité légale</p>
        <Grid2>
          <Field label="Nom juridique" required><Input value={d.nomJuridique} onChange={v => u("nomJuridique", v)} placeholder="SAS HOTEL LE RIVAGE" /></Field>
          <Field label="Enseigne commerciale" required><Input value={d.enseigne} onChange={v => u("enseigne", v)} placeholder="Hôtel Le Rivage" /></Field>
          <Field label="SIRET / KBIS"><Input value={d.siret} onChange={v => u("siret", v)} placeholder="12345678900012" /></Field>
          <Field label="N° TVA intracommunautaire"><Input value={d.tva} onChange={v => u("tva", v)} placeholder="FR12345678900" /></Field>
          <Field label="Type d'établissement"><Sel value={d.typeEtablissement} onChange={v => u("typeEtablissement", v)} options={TYPE_ETABLISSEMENT} /></Field>
          <Field label="Logiciels possédés"><Sel value={d.logiciels} onChange={v => u("logiciels", v)} options={LOGICIELS} /></Field>
        </Grid2>
      </Card>
      <Card>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>Coordonnées</p>
        <Grid2>
          <Field label="Adresse complète" required span2><Input value={d.adresse} onChange={v => u("adresse", v)} placeholder="12 Rue du Port, 75001 Paris" /></Field>
          <Field label="Latitude"><Input value={d.lat} onChange={v => u("lat", v)} placeholder="48.8566" /></Field>
          <Field label="Longitude"><Input value={d.lng} onChange={v => u("lng", v)} placeholder="2.3522" /></Field>
          <Field label="Téléphone"><Input value={d.tel} onChange={v => u("tel", v)} placeholder="+33 1 23 45 67 89" /></Field>
          <Field label="Horaires réception"><Input value={d.horaires} onChange={v => u("horaires", v)} placeholder="7h–23h" /></Field>
          <Field label="Mail contact" required><Input value={d.mailContact} onChange={v => u("mailContact", v)} placeholder="contact@hotel.fr" /></Field>
          <Field label="Mail facturation"><Input value={d.mailFacturation} onChange={v => u("mailFacturation", v)} placeholder="facturation@hotel.fr" /></Field>
        </Grid2>
      </Card>
      <Card>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>Bancaire & Distribution</p>
        <Grid2>
          <Field label="IBAN"><Input value={d.iban} onChange={v => u("iban", v)} placeholder="FR76 3000 1007 9412 3456 7890 185" /></Field>
          <Field label="BIC / SWIFT"><Input value={d.bic} onChange={v => u("bic", v)} placeholder="BNPAFRPP" /></Field>
          <Field label="Booking.com ID"><Input value={d.bookingId} onChange={v => u("bookingId", v)} placeholder="123456789" /></Field>
          <Field label="Expedia ID"><Input value={d.expediaId} onChange={v => u("expediaId", v)} placeholder="987654321" /></Field>
          <Field label="Airbnb ID"><Input value={d.airbnbId} onChange={v => u("airbnbId", v)} placeholder="98765.XYZ" /></Field>
          <Field label="Lien Drive (photos/logos)"><Input value={d.lienDrive} onChange={v => u("lienDrive", v)} placeholder="https://drive.google.com/..." /></Field>
        </Grid2>
      </Card>
    </div>
  );
}

// ─── SECTION 2 : CHAMBRES ─────────────────────────────────────
function SectionChambres({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const E = { nom: "", code: "", nbUnites: 1, capaStd: 2, capaMax: 3, adultesMax: 2, enfantsMax: 1, surface: 20, configLits: "Double", salleEau: "Douche", descriptif: "", clim: "NON", coffreFort: "NON", minibar: "NON", wifi: "OUI", bureau: "NON", balcon: "NON" };
  const [form, setForm] = useState(E);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!form.nom.trim()) return;
    const list = [...data.chambres];
    if (editing !== null) list[editing] = { ...form }; else list.push({ ...form });
    setData(p => ({ ...p, chambres: list }));
    setForm(E); setEditing(null);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionTitle icon="🛏️" title="Inventaire des chambres" subtitle="Catégories, capacités et équipements" badge={`${data.chambres.length} catégorie${data.chambres.length !== 1 ? "s" : ""}`} />
      {data.chambres.map((c, i) => (
        <Card key={i} style={{ borderLeft: `3px solid ${T.green}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: T.textPrim, fontSize: 14, fontFamily: T.font }}>{c.nom}</span>
              <Chip color={T.green}>{c.code}</Chip>
              <span style={{ color: T.textSec, fontSize: 12 }}>{c.nbUnites} unité{c.nbUnites > 1 ? "s" : ""} · {c.surface}m² · {c.configLits}</span>
              {["clim", "wifi", "minibar", "balcon"].filter(k => c[k] === "OUI").map(k => (
                <Chip key={k} color={T.blue}>{{ clim: "❄️ Clim", wifi: "📶 Wifi", minibar: "🍾 Minibar", balcon: "🌿 Balcon" }[k]}</Chip>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn onClick={() => { setForm({ ...data.chambres[i] }); setEditing(i); }} variant="ghost" small>Modifier</Btn>
              <Btn onClick={() => setData(p => ({ ...p, chambres: p.chambres.filter((_, idx) => idx !== i) }))} variant="danger" small>✕</Btn>
            </div>
          </div>
        </Card>
      ))}
      <Card accent={T.green}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
          {editing !== null ? "✏️ Modifier la catégorie" : "+ Nouvelle catégorie de chambre"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Grid2>
            <Field label="Nom catégorie" required><Input value={form.nom} onChange={v => u("nom", v)} placeholder="Chambre Double Standard" /></Field>
            <Field label="Code court"><Input value={form.code} onChange={v => u("code", v.toUpperCase())} placeholder="DBL" /></Field>
            <Field label="Nb unités"><Input type="number" min="1" value={form.nbUnites} onChange={v => u("nbUnites", +v)} /></Field>
            <Field label="Surface (m²)"><Input type="number" min="1" value={form.surface} onChange={v => u("surface", +v)} /></Field>
            <Field label="Config. lits"><Sel value={form.configLits} onChange={v => u("configLits", v)} options={CONFIG_LITS} /></Field>
            <Field label="Salle d'eau"><Sel value={form.salleEau} onChange={v => u("salleEau", v)} options={SALLE_EAU} /></Field>
            <Field label="Capa. standard"><Input type="number" min="1" value={form.capaStd} onChange={v => u("capaStd", +v)} /></Field>
            <Field label="Capa. max"><Input type="number" min="1" value={form.capaMax} onChange={v => u("capaMax", +v)} /></Field>
            <Field label="Adultes max"><Input type="number" min="0" value={form.adultesMax} onChange={v => u("adultesMax", +v)} /></Field>
            <Field label="Enfants max"><Input type="number" min="0" value={form.enfantsMax} onChange={v => u("enfantsMax", +v)} /></Field>
          </Grid2>
          <Field label="Descriptif commercial" span2>
            <Textarea value={form.descriptif} onChange={v => u("descriptif", v)} placeholder="Chambre élégante avec vue sur le jardin..." rows={2} />
          </Field>
          <div>
            <Label>Équipements</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 4 }}>
              {[["clim", "❄️ Clim"], ["coffreFort", "🔒 Coffre-fort"], ["minibar", "🍾 Minibar"], ["wifi", "📶 Wifi"], ["bureau", "💼 Bureau"], ["balcon", "🌿 Balcon"]].map(([k, l]) => (
                <div key={k}>
                  <label style={{ fontSize: 11, color: T.textSec, display: "block", marginBottom: 4, fontFamily: T.font }}>{l}</label>
                  <Toggle value={form[k]} onChange={v => u(k, v)} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <Btn onClick={save} icon={editing !== null ? "✓" : "+"}>{editing !== null ? "Enregistrer" : "Ajouter la catégorie"}</Btn>
            {editing !== null && <Btn onClick={() => { setForm(E); setEditing(null); }} variant="ghost">Annuler</Btn>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── SECTION 3 : TARIFS ───────────────────────────────────────
function SectionTarifs({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const E = { nom: "", type: "Base", descriptif: "", baseCalc: "", prixBase: "", repas: "Aucun", annulation: "Flexible J-3", mapping: "Tous canaux", restrictions: "Aucune", codesComptables: "" };
  const [form, setForm] = useState(E);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!form.nom.trim()) return;
    const list = [...data.tarifs];
    if (editing !== null) list[editing] = { ...form }; else list.push({ ...form });
    setData(p => ({ ...p, tarifs: list }));
    setForm(E); setEditing(null);
  };
  const TC = { "Base": T.green, "Dérivé": T.blue, "Promotion": T.red, "Early Bird": "#8b5cf6", "Last Minute": T.amber, "Groupe": "#06b6d4" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionTitle icon="💶" title="Stratégie tarifaire" subtitle="Plans tarifaires, conditions & mapping canaux" badge={`${data.tarifs.length} tarif${data.tarifs.length !== 1 ? "s" : ""}`} />
      {data.tarifs.map((t, i) => (
        <Card key={i} style={{ borderLeft: `3px solid ${TC[t.type] || T.green}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: T.textPrim, fontSize: 14, fontFamily: T.font }}>{t.nom}</span>
              <Chip color={TC[t.type] || T.green}>{t.type}</Chip>
              {t.prixBase && <Chip color={T.amber}>{t.prixBase}€</Chip>}
              <Chip color={T.textSec}>{t.mapping}</Chip>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn onClick={() => { setForm({ ...data.tarifs[i] }); setEditing(i); }} variant="ghost" small>Modifier</Btn>
              <Btn onClick={() => setData(p => ({ ...p, tarifs: p.tarifs.filter((_, idx) => idx !== i) }))} variant="danger" small>✕</Btn>
            </div>
          </div>
        </Card>
      ))}
      <Card accent={T.blue}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
          {editing !== null ? "✏️ Modifier le tarif" : "+ Nouveau plan tarifaire"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Grid2>
            <Field label="Nom du tarif" required><Input value={form.nom} onChange={v => u("nom", v)} placeholder="BAR Standard" /></Field>
            <Field label="Type de tarif"><Sel value={form.type} onChange={v => u("type", v)} options={TYPE_TARIF} /></Field>
            <Field label="Prix de base (€)"><Input type="number" min="0" value={form.prixBase} onChange={v => u("prixBase", v)} placeholder="110" /></Field>
            <Field label="Base de calcul"><Input value={form.baseCalc} onChange={v => u("baseCalc", v)} placeholder="ex: BAR -10%" /></Field>
            <Field label="Repas inclus"><Sel value={form.repas} onChange={v => u("repas", v)} options={REPAS} /></Field>
            <Field label="Conditions d'annulation"><Sel value={form.annulation} onChange={v => u("annulation", v)} options={ANNULATION} /></Field>
            <Field label="Mapping canal"><Sel value={form.mapping} onChange={v => u("mapping", v)} options={MAPPING} /></Field>
            <Field label="Restrictions"><Sel value={form.restrictions} onChange={v => u("restrictions", v)} options={RESTRICTIONS} /></Field>
            <Field label="Codes comptables"><Input value={form.codesComptables} onChange={v => u("codesComptables", v)} placeholder="701000" /></Field>
          </Grid2>
          <Field label="Descriptif">
            <Textarea value={form.descriptif} onChange={v => u("descriptif", v)} placeholder="Tarif public affiché sur tous les canaux..." rows={2} />
          </Field>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <Btn onClick={save} icon={editing !== null ? "✓" : "+"} variant="primary">{editing !== null ? "Enregistrer" : "Ajouter le tarif"}</Btn>
            {editing !== null && <Btn onClick={() => { setForm(E); setEditing(null); }} variant="ghost">Annuler</Btn>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── SECTION 4 : EXTRAS ───────────────────────────────────────
function SectionExtras({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const E = { nom: "", prixTTC: "", tva: "10%", taxeSejour: "", ventilation: "Par Pax/Nuit", codeComptable: "", notes: "" };
  const [form, setForm] = useState(E);
  const u = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    if (!form.nom.trim()) return;
    const list = [...data.extras];
    if (editing !== null) list[editing] = { ...form }; else list.push({ ...form });
    setData(p => ({ ...p, extras: list }));
    setForm(E); setEditing(null);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionTitle icon="🧾" title="Extras, taxes & comptabilité" subtitle="Services additionnels, TVA et codes comptables" badge={`${data.extras.length} service${data.extras.length !== 1 ? "s" : ""}`} />
      {data.extras.map((e, i) => (
        <Card key={i} style={{ borderLeft: `3px solid ${T.amber}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: T.textPrim, fontSize: 14, fontFamily: T.font }}>{e.nom}</span>
              <Chip color={T.amber}>{e.prixTTC}€ TTC</Chip>
              <Chip color={T.textSec}>TVA {e.tva}</Chip>
              <Chip color={T.blue}>{e.ventilation}</Chip>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn onClick={() => { setForm({ ...data.extras[i] }); setEditing(i); }} variant="ghost" small>Modifier</Btn>
              <Btn onClick={() => setData(p => ({ ...p, extras: p.extras.filter((_, idx) => idx !== i) }))} variant="danger" small>✕</Btn>
            </div>
          </div>
        </Card>
      ))}
      <Card accent={T.amber}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
          {editing !== null ? "✏️ Modifier l'extra" : "+ Nouvel extra / service"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Grid2>
            <Field label="Nom du service" required><Input value={form.nom} onChange={v => u("nom", v)} placeholder="Petit-déjeuner continental" /></Field>
            <Field label="Prix TTC (€)"><Input type="number" min="0" value={form.prixTTC} onChange={v => u("prixTTC", v)} placeholder="18" /></Field>
            <Field label="Taux TVA"><Sel value={form.tva} onChange={v => u("tva", v)} options={TVA} /></Field>
            <Field label="Taxe de séjour (€/pers/nuit)"><Input type="number" min="0" value={form.taxeSejour} onChange={v => u("taxeSejour", v)} placeholder="1.50" /></Field>
            <Field label="Ventilation taxe"><Sel value={form.ventilation} onChange={v => u("ventilation", v)} options={VENTILATION} /></Field>
            <Field label="Code comptable"><Input value={form.codeComptable} onChange={v => u("codeComptable", v)} placeholder="707010" /></Field>
          </Grid2>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={v => u("notes", v)} placeholder="Remarques, conditions d'application..." rows={2} />
          </Field>
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <Btn onClick={save} icon={editing !== null ? "✓" : "+"} variant="amber">{editing !== null ? "Enregistrer" : "Ajouter l'extra"}</Btn>
            {editing !== null && <Btn onClick={() => { setForm(E); setEditing(null); }} variant="ghost">Annuler</Btn>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── SECTION 5 : CALE TARIFAIRE ───────────────────────────────
function SectionPricing365({ data, setData }) {
  const [activeCaleId, setActiveCaleId] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const EC = { nom: "", couleur: PALETTE_BG[0], tarifStandalone: "", tarifReference: "", prix: {} };
  const [cf, setCf] = useState(EC);
  const uc = (k, v) => setCf(p => ({ ...p, [k]: v }));
  const tarifsNoms = data.tarifs.map(t => t.nom);

  const saveCale = () => {
    if (!cf.nom.trim()) return;
    const idx = editingIdx !== null ? editingIdx : data.cales.length;
    const colorIdx = idx % PALETTE_BG.length;
    const cale = { ...cf, id: editingIdx !== null ? data.cales[editingIdx].id : Date.now().toString(), couleur: cf.couleur || PALETTE_BG[colorIdx] };
    const list = [...data.cales];
    if (editingIdx !== null) list[editingIdx] = cale; else list.push(cale);
    setData(p => ({ ...p, cales: list }));
    setActiveCaleId(cale.id); setCf(EC); setShowForm(false); setEditingIdx(null);
  };

  const delCale = (i) => {
    const id = data.cales[i].id;
    const cal = { ...data.calendar };
    Object.keys(cal).forEach(k => { if (cal[k] === id) delete cal[k]; });
    setData(p => ({ ...p, cales: p.cales.filter((_, idx) => idx !== i), calendar: cal }));
    if (activeCaleId === id) setActiveCaleId(null);
  };

  const getDay = (mi, d) => `2025-${String(mi + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const assignDay = (mi, d) => {
    if (!activeCaleId) return;
    const key = getDay(mi, d);
    setData(p => {
      const cal = { ...p.calendar };
      if (cal[key] === activeCaleId) delete cal[key]; else cal[key] = activeCaleId;
      return { ...p, calendar: cal };
    });
  };

  const getCale = id => data.cales.find(c => c.id === id);
  const stats = {};
  data.cales.forEach(c => { stats[c.id] = 0; });
  Object.values(data.calendar).forEach(id => { if (stats[id] !== undefined) stats[id]++; });
  const total = Object.keys(data.calendar).length;
  const pct = Math.round(total / 365 * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} onMouseUp={() => setSelecting(false)}>
      <SectionTitle icon="📅" title="Cale tarifaire 365 jours" subtitle="Créez vos cales, configurez-les, puis peignez-les sur le calendrier"
        badge={`${total}/365 jours`} />

      {/* Progress bar */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: T.textSec, fontFamily: T.font }}>Avancement du calendrier</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.green, fontFamily: T.font }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: T.green, borderRadius: 3, transition: "width .4s" }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          {data.cales.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c.couleur }} />
              <span style={{ fontSize: 11, color: T.textSec, fontFamily: T.font }}>{c.nom} <span style={{ color: T.textMuted }}>({stats[c.id] || 0}j)</span></span>
            </div>
          ))}
        </div>
      </Card>

      {/* Liste des cales */}
      {data.cales.map((c, i) => (
        <Card key={c.id} style={{ borderLeft: `3px solid ${c.couleur}`, background: activeCaleId === c.id ? T.bgCardHov : T.bgCard, cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }} onClick={() => setActiveCaleId(activeCaleId === c.id ? null : c.id)}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: c.couleur, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: T.textPrim, fontSize: 14, fontFamily: T.font }}>{c.nom}</span>
              {c.tarifStandalone && <Chip color={T.green}>📌 {c.tarifStandalone}</Chip>}
              {c.tarifReference && <Chip color={T.textSec}>↗ réf: {c.tarifReference}</Chip>}
              <span style={{ marginLeft: 4, background: "rgba(255,255,255,0.05)", color: T.textSec, padding: "1px 8px", borderRadius: 20, fontSize: 11, fontFamily: T.font }}>{stats[c.id] || 0}j</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {activeCaleId === c.id && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✏️ Peinture active</span>}
              <Btn onClick={() => { setCf({ ...c }); setEditingIdx(i); setShowForm(true); }} variant="ghost" small>Modifier</Btn>
              <Btn onClick={() => delCale(i)} variant="danger" small>✕</Btn>
            </div>
          </div>
          {c.prix && Object.keys(c.prix).length > 0 && (
            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(c.prix).filter(([, v]) => v).map(([cat, prix]) => (
                <span key={cat} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 6, padding: "2px 10px", fontSize: 12, color: T.textPrim, fontFamily: T.font }}>{cat}: <strong style={{ color: T.amber }}>{prix}€</strong></span>
              ))}
            </div>
          )}
        </Card>
      ))}

      {/* Bouton / Formulaire cale */}
      {!showForm ? (
        <Btn onClick={() => { setCf(EC); setEditingIdx(null); setShowForm(true); }} icon="+" variant="secondary">Créer une cale tarifaire</Btn>
      ) : (
        <Card accent={T.green}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>
            {editingIdx !== null ? "✏️ Modifier la cale" : "✨ Nouvelle cale tarifaire"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Grid2>
              <Field label="Nom de la cale" required><Input value={cf.nom} onChange={v => uc("nom", v)} placeholder="Ex: Haute saison été" /></Field>
              <div>
                <Label>Couleur</Label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {PALETTE_BG.map((c, i) => (
                    <div key={i} onClick={() => uc("couleur", c)} style={{ width: 24, height: 24, borderRadius: 6, background: c, cursor: "pointer", outline: cf.couleur === c ? `2px solid #fff` : "2px solid transparent", outlineOffset: 1 }} />
                  ))}
                </div>
              </div>
            </Grid2>
            {tarifsNoms.length > 0 && (
              <Grid2>
                <Field label="Tarif standalone (par défaut)">
                  <Sel value={cf.tarifStandalone} onChange={v => uc("tarifStandalone", v)} options={tarifsNoms} placeholder="— Aucun —" />
                </Field>
                <Field label="Tarif de référence (dérivés)">
                  <Sel value={cf.tarifReference} onChange={v => uc("tarifReference", v)} options={tarifsNoms} placeholder="— Aucun —" />
                </Field>
              </Grid2>
            )}
            {data.chambres.length > 0 && (
              <div>
                <Label>Prix par catégorie de chambre (€/nuit)</Label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 4 }}>
                  {data.chambres.map(ch => (
                    <Field key={ch.code} label={`${ch.nom} (${ch.code})`}>
                      <Input type="number" min="0" value={cf.prix?.[ch.code] || ""} onChange={v => uc("prix", { ...(cf.prix || {}), [ch.code]: v })} placeholder="Ex: 120" />
                    </Field>
                  ))}
                </div>
              </div>
            )}
            {tarifsNoms.length === 0 && data.chambres.length === 0 && (
              <div style={{ background: T.amberDim, border: `1px solid ${T.amber}33`, borderRadius: 8, padding: 12, fontSize: 13, color: T.amber, fontFamily: T.font }}>
                💡 Créez d'abord vos chambres et tarifs pour les associer à cette cale.
              </div>
            )}
            <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
              <Btn onClick={saveCale} icon={editingIdx !== null ? "✓" : "+"} variant="primary">{editingIdx !== null ? "Enregistrer" : "Créer la cale"}</Btn>
              <Btn onClick={() => { setShowForm(false); setEditingIdx(null); setCf(EC); }} variant="ghost">Annuler</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Calendrier */}
      {data.cales.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
            <span style={{ fontSize: 12, color: activeCaleId ? T.green : T.textSec, fontFamily: T.font, fontWeight: activeCaleId ? 600 : 400 }}>
              {activeCaleId ? `✏️ Peinture : ${getCale(activeCaleId)?.nom} — cliquez/glissez sur les jours` : "👆 Sélectionnez une cale pour peindre"}
            </span>
            <Btn onClick={() => setData(p => ({ ...p, calendar: {} }))} variant="danger" small>Réinitialiser</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {MONTHS.map((month, mi) => (
              <div key={mi} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: 10, userSelect: "none" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, textAlign: "center", fontFamily: T.font }}>{month}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1.5 }}>
                  {Array.from({ length: MONTH_DAYS[mi] }, (_, di) => {
                    const key = getDay(mi, di + 1);
                    const caleId = data.calendar[key];
                    const cale = caleId ? getCale(caleId) : null;
                    return (
                      <div key={di}
                        onMouseDown={() => { setSelecting(true); assignDay(mi, di + 1); }}
                        onMouseEnter={() => { if (selecting) assignDay(mi, di + 1); }}
                        title={cale ? `${di + 1} ${month} : ${cale.nom}` : `${di + 1} ${month}`}
                        style={{ width: "100%", aspectRatio: "1", borderRadius: 2, cursor: activeCaleId ? "crosshair" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: cale ? 700 : 400, background: cale ? cale.couleur : "rgba(255,255,255,0.04)", color: cale ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.2)", transition: "transform .05s" }}>
                        {di + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── EXPORT EXCEL ─────────────────────────────────────────────
function exportExcel(data) {
  const wb = XLSX.utils.book_new();
  const HF = { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: "Inter" };
  const HFill = { patternType: "solid", fgColor: { rgb: "0F1623" } };
  const BD = { top: { style: "thin", color: { rgb: "334155" } }, bottom: { style: "thin", color: { rgb: "334155" } }, left: { style: "thin", color: { rgb: "334155" } }, right: { style: "thin", color: { rgb: "334155" } } };
  const hs = h => ({ font: h ? HF : { sz: 10, name: "Inter" }, fill: h ? HFill : undefined, border: BD, alignment: { horizontal: h ? "center" : "left", vertical: "center", wrapText: true } });
  const addSheet = (name, headers, rows, widths) => {
    const ws = {};
    headers.forEach((v, i) => { ws[XLSX.utils.encode_cell({ r: 0, c: i })] = { v, t: "s", s: hs(true) }; });
    rows.forEach((row, ri) => { row.forEach((v, ci) => { ws[XLSX.utils.encode_cell({ r: ri + 1, c: ci })] = { v: v ?? "", t: typeof v === "number" ? "n" : "s", s: hs(false) }; }); });
    ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(rows.length, 1), c: headers.length - 1 } });
    ws["!cols"] = widths.map(w => ({ wch: w }));
    ws["!rows"] = [{ hpt: 40 }, ...Array(rows.length).fill({ hpt: 25 })];
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  const d = data.identity;
  addSheet("1 - Identité", ["Nom Juridique", "Enseigne", "SIRET", "N° TVA", "Adresse", "Lat", "Lng", "Mail Contact", "Mail Fact.", "Tél", "Horaires", "IBAN", "BIC", "Type", "Logiciels", "Booking ID", "Expedia ID", "Airbnb ID", "Lien Drive"], [[d.nomJuridique, d.enseigne, d.siret, d.tva, d.adresse, d.lat, d.lng, d.mailContact, d.mailFacturation, d.tel, d.horaires, d.iban, d.bic, d.typeEtablissement, d.logiciels, d.bookingId, d.expediaId, d.airbnbId, d.lienDrive]], [22, 20, 18, 18, 28, 10, 10, 22, 22, 16, 14, 28, 12, 16, 10, 14, 14, 14, 28]);
  addSheet("2 - Chambres", ["Nom", "Code", "Nb", "Capa Std", "Capa Max", "Adultes", "Enfants", "Surface m²", "Config Lits", "Salle d'eau", "Descriptif", "Clim", "Coffre", "Minibar", "Wifi", "Bureau", "Balcon"], data.chambres.map(c => [c.nom, c.code, +c.nbUnites, +c.capaStd, +c.capaMax, +c.adultesMax, +c.enfantsMax, +c.surface, c.configLits, c.salleEau, c.descriptif, c.clim, c.coffreFort, c.minibar, c.wifi, c.bureau, c.balcon]), [24, 8, 6, 8, 8, 8, 8, 8, 14, 14, 34, 6, 8, 8, 6, 8, 14]);
  addSheet("3 - Tarification", ["Nom Tarif", "Type", "Descriptif", "Base Calcul", "Prix Base €", "Repas", "Annulation", "Mapping", "Restrictions", "Codes Compta"], data.tarifs.map(t => [t.nom, t.type, t.descriptif, t.baseCalc, t.prixBase ? +t.prixBase : null, t.repas, t.annulation, t.mapping, t.restrictions, t.codesComptables]), [22, 12, 30, 14, 12, 14, 16, 16, 18, 14]);
  addSheet("4 - Extras & Taxes", ["Nom Service", "Prix TTC €", "Taux TVA", "Taxe Séjour €", "Ventilation", "Code Compta", "Notes"], data.extras.map(e => [e.nom, e.prixTTC ? +e.prixTTC : null, e.tva, e.taxeSejour ? +e.taxeSejour : null, e.ventilation, e.codeComptable, e.notes]), [26, 12, 10, 14, 20, 14, 34]);
  const calRows = Object.entries(data.calendar).sort(([a], [b]) => a.localeCompare(b)).map(([date, caleId]) => {
    const [, mo, dy] = date.split("-");
    const cale = data.cales.find(c => c.id === caleId);
    const prixStr = cale ? Object.entries(cale.prix || {}).filter(([, v]) => v).map(([k, v]) => `${k}:${v}€`).join(" | ") : "";
    return [date, MONTHS[+mo - 1], +dy, cale?.nom || "", cale?.tarifStandalone || "", cale?.tarifReference || "", prixStr];
  });
  addSheet("5 - Cale Tarifaire 365j", ["Date", "Mois", "Jour", "Cale", "Tarif Standalone", "Tarif Référence", "Prix par catégorie"], calRows, [14, 8, 6, 20, 20, 20, 40]);
  XLSX.writeFile(wb, "Onboarding_Hotel.xlsx");
}

// ─── PROGRESS ─────────────────────────────────────────────────
function calcProgress(data) {
  const d = data.identity;
  const fields = [d.nomJuridique, d.enseigne, d.siret, d.mailContact, d.tel, d.adresse];
  return Math.round(((fields.filter(Boolean).length / fields.length) + (data.chambres.length > 0 ? 1 : 0) + (data.tarifs.length > 0 ? 1 : 0) + (data.extras.length > 0 ? 1 : 0) + (data.cales.length > 0 ? Math.min(Object.keys(data.calendar).length / 100, 1) : 0)) / 5 * 100);
}

function calcStepDone(data) {
  return [
    !!(data.identity.nomJuridique && data.identity.mailContact),
    data.chambres.length > 0,
    data.tarifs.length > 0,
    data.extras.length > 0,
    data.cales.length > 0
  ];
}

// ─── APP ──────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INIT);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => { const d = loadData(); if (d) setData(d); setLoaded(true); }, []);
  useEffect(() => {
    if (!loaded) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveData(data); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }, [data, loaded]);

  const progress = calcProgress(data);
  const done = calcStepDone(data);

  const SECTIONS = [
    <SectionIdentity data={data} setData={setData} />,
    <SectionChambres data={data} setData={setData} />,
    <SectionTarifs data={data} setData={setData} />,
    <SectionExtras data={data} setData={setData} />,
    <SectionPricing365 data={data} setData={setData} />,
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.textPrim }}>

      {/* ── NAVBAR (style Océane Habonneau) ── */}
      <nav style={{ background: T.bgNav, borderBottom: "1px solid #e5e7eb", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🏨</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1a2332", fontFamily: T.font }}>Océane Habonneau</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8", fontFamily: T.font }}>Flux & Automatisations</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontSize: 13, color: "#64748b", fontFamily: T.font }}>🔗 Écosystème</span>
          <span style={{ fontSize: 13, color: "#64748b", fontFamily: T.font }}>🔧 Services</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2332", borderBottom: "2px solid #f59e0b", paddingBottom: 2, fontFamily: T.font }}>📋 Onboarding</span>
          {saved && <span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>✓ Sauvegardé</span>}
          <button type="button" onClick={() => exportExcel(data)} style={{ background: T.amber, color: "#1a2332", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: T.font, display: "flex", alignItems: "center", gap: 5 }}>
            ⬇ Export Excel
          </button>
        </div>
      </nav>

      {/* ── HERO HEADER ── */}
      <div style={{ background: "linear-gradient(135deg, #0f1623 0%, #1a2332 100%)", borderBottom: `1px solid ${T.border}`, padding: "28px 32px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: T.textPrim, margin: "0 0 4px", fontFamily: T.font }}>
                Onboarding Hôtelier
              </h1>
              <p style={{ fontSize: 14, color: T.textSec, margin: 0, fontFamily: T.font }}>
                {data.identity.enseigne || "Mon établissement"} — Renseignez les informations de votre établissement
              </p>
            </div>
            {/* Score / progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: progress === 100 ? T.green : T.amber, fontFamily: T.font, lineHeight: 1 }}>{progress}%</div>
                <div style={{ fontSize: 11, color: T.textSec, fontFamily: T.font }}>complété</div>
              </div>
              <div style={{ width: 100, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ width: `${progress}%`, height: "100%", background: progress === 100 ? T.green : T.amber, borderRadius: 3, transition: "width .4s" }} />
              </div>
            </div>
          </div>

          {/* Steps indicator */}
          <div style={{ display: "flex", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
            {STEPS.map((s, i) => {
              const isActive = step === i;
              const isDone = done[i];
              return (
                <button key={s.id} type="button" onClick={() => setStep(i)} style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8,
                  border: `1px solid ${isActive ? T.green : isDone ? T.green + "44" : T.border}`,
                  background: isActive ? T.greenDim : isDone ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)",
                  color: isActive ? T.green : isDone ? T.green + "cc" : T.textSec,
                  cursor: "pointer", fontFamily: T.font, fontSize: 13, fontWeight: isActive ? 700 : 500, transition: "all .15s"
                }}>
                  <span style={{ fontSize: 15 }}>{s.icon}</span>
                  <span>{s.label}</span>
                  {isDone && !isActive && <span style={{ color: T.green, fontSize: 11 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 32px 80px", display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>

        {/* Sidebar */}
        <div>
          <div style={{ position: "sticky", top: 88 }}>
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              {STEPS.map((s, i) => {
                const isActive = step === i;
                const isDone = done[i];
                return (
                  <button key={s.id} type="button" onClick={() => setStep(i)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                    border: "none", borderBottom: `1px solid ${T.border}`,
                    background: isActive ? T.greenDim : "transparent",
                    color: isActive ? T.green : isDone ? T.textPrim : T.textSec,
                    cursor: "pointer", fontFamily: T.font, textAlign: "left", transition: "all .15s",
                    borderLeft: isActive ? `3px solid ${T.green}` : "3px solid transparent"
                  }}>
                    <span style={{ fontSize: 16 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{s.desc}</div>
                    </div>
                    {isDone && <span style={{ color: T.green, fontSize: 11, background: T.greenDim, borderRadius: 10, padding: "1px 6px" }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Mini stats */}
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Résumé</p>
              {[
                ["🛏️", `${data.chambres.length} catégorie${data.chambres.length !== 1 ? "s" : ""}`],
                ["💶", `${data.tarifs.length} tarif${data.tarifs.length !== 1 ? "s" : ""}`],
                ["🧾", `${data.extras.length} extra${data.extras.length !== 1 ? "s" : ""}`],
                ["📅", `${data.cales.length} cale${data.cales.length !== 1 ? "s" : ""}`],
              ].map(([icon, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: T.textSec, fontFamily: T.font }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {SECTIONS[step]}

          {/* Nav prev/next */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            <div>
              {step > 0 && <Btn onClick={() => setStep(s => s - 1)} variant="ghost" icon="←">Précédent</Btn>}
            </div>
            <div>
              {step < STEPS.length - 1 && <Btn onClick={() => setStep(s => s + 1)} variant="primary" icon="→">Suivant</Btn>}
              {step === STEPS.length - 1 && <Btn onClick={() => exportExcel(data)} variant="amber" icon="⬇">Exporter en Excel</Btn>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
