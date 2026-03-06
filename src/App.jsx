import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

const STORAGE_KEY = "hotel-onboarding-v4";
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function loadData() { try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : null; } catch { return null; } }

const INIT_ENTITY = () => ({
  nomJuridique:"", enseigne:"", siret:"", tva:"", typeEtablissement:"Hôtel", logiciels:[],
  adresse:"", lat:"", lng:"", mailContact:"", mailFacturation:"", tel:"", horaires:"",
  iban:"", bic:"", lienDrive:"", partenaires:[]
});

const INIT = {
  entites: [INIT_ENTITY()],
  chambres:[], tarifs:[], extras:[], cales:[], calendar:{},
  restaurant:{ moments:[], options:[], salles:[], tables:[], cartes:[], articles:[] }
};

const TYPE_ETABLISSEMENT = ["Hôtel","Appart-hôtel","Gîte","Chambre d'hôtes","Autre"];
const LOGICIELS_LIST     = ["PMS","Channel Manager","Moteur de réservation","CRM","Revenue Manager","Booking Engine","Conciergerie digitale","Autre"];
const CONFIG_LITS        = ["Double","Twin","King Size","Simple","Modulable"];
const SALLE_EAU          = ["Baignoire","Douche","Les deux","Cabine de douche italienne"];
const TYPE_TARIF         = ["Base","Dérivé","Promotion","Early Bird","Last Minute","Groupe"];
const REPAS              = ["Aucun","Petit-déjeuner","Demi-pension","Pension complète","All Inclusive"];
const ANNULATION         = ["Non-remboursable","Flexible J-1","Flexible J-3","Flexible J-7","Flexible J-14"];
const MAPPING            = ["Direct uniquement","OTA uniquement","Tous canaux","Sélection manuelle"];
const RESTRICTIONS       = ["Aucune","Min Stay 2 nuits","Min Stay 3 nuits","CTA","CTD","Max Stay 7 nuits"];
const TVA                = ["20%","10%","5.5%","2.1%","0%"];
const VENTILATION        = ["Par Pax/Nuit","Par Pax/Séjour","Par Chambre/Nuit","Par Chambre/Séjour","Forfait unique"];
const MONTHS             = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MONTH_DAYS         = [31,28,31,30,31,30,31,31,30,31,30,31];
const STEPS = [
  { id:"identity",   icon:"🏢", label:"Identité",       desc:"Infos légales & contacts" },
  { id:"chambres",   icon:"🛏️", label:"Chambres",       desc:"Catégories & équipements" },
  { id:"tarifs",     icon:"💶", label:"Tarification",   desc:"Stratégie & conditions"   },
  { id:"extras",     icon:"🧾", label:"Extras & Taxes", desc:"Services & comptabilité"  },
  { id:"pricing365", icon:"📅", label:"Cale Tarifaire", desc:"Calendrier annuel"         },
  { id:"restaurant", icon:"🍽️", label:"Restaurant",     desc:"Salles, cartes & articles" },
];
const MOMENTS_LIST = ["Petit-déjeuner","Déjeuner","Dîner","Brunch","Apéritif","Entrée","Plat","Dessert","Fromage","Digestif","Soft / Boisson","Vin / Carte des vins"];
const OPTIONS_LIST = ["Saignant","Bleu","À point","Bien cuit","Végétarien","Vegan","Sans gluten","Sans lactose","Sans œufs","Sirop menthe","Sirop grenadine","Sirop fraise","Avec glaçons","Sans sucre","Épicé","Extra sauce"];
const TVA_RESTO    = ["10%","5.5%","20%","0%"];
const SALLE_COLORS = ["#10b981","#3b82f6","#f59e0b","#8b5cf6","#ef4444","#ec4899","#06b6d4","#f97316"];
const PALETTE_BG = ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#6366f1","#14b8a6","#f97316"];

const T = {
  bg:"#0f1623", bgCard:"#1a2332", bgCardHov:"#1e2a3d",
  bgInput:"#ffffff", bgMain:"#ffffff", bgNav:"#ffffff",
  border:"rgba(255,255,255,0.08)", borderInput:"#e2e8f0", borderFoc:"#10b981",
  textPrim:"#f1f5f9", textInput:"#1a2332", textSec:"#94a3b8", textMuted:"#64748b",
  green:"#10b981", greenDim:"rgba(16,185,129,0.15)",
  amber:"#f59e0b", amberDim:"rgba(245,158,11,0.15)",
  blue:"#3b82f6", blueDim:"rgba(59,130,246,0.15)",
  red:"#ef4444",
  font:"'Inter','Segoe UI',system-ui,sans-serif",
};

// ─── BASE UI ──────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label style={{ fontSize:11, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:T.textSec, display:"block", marginBottom:5, fontFamily:T.font }}>
    {children}{required && <span style={{ color:T.red, marginLeft:3 }}>*</span>}
  </label>
);
const Input = ({ value, onChange, placeholder, type="text", min }) => (
  <input type={type} value={value} min={min} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{ background:T.bgInput, border:`1px solid ${T.borderInput}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:T.textInput, outline:"none", fontFamily:T.font, width:"100%", boxSizing:"border-box", transition:"border-color .15s" }}
    onFocus={e=>e.target.style.borderColor=T.borderFoc} onBlur={e=>e.target.style.borderColor=T.borderInput}/>
);
const Sel = ({ value, onChange, options, placeholder }) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{ background:T.bgInput, border:`1px solid ${T.borderInput}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:T.textInput, outline:"none", fontFamily:T.font, width:"100%", boxSizing:"border-box", cursor:"pointer", appearance:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2394a3b8' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center" }}
    onFocus={e=>e.target.style.borderColor=T.borderFoc} onBlur={e=>e.target.style.borderColor=T.borderInput}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
);
const Textarea = ({ value, onChange, placeholder, rows=3 }) => (
  <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ background:T.bgInput, border:`1px solid ${T.borderInput}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:T.textInput, outline:"none", fontFamily:T.font, width:"100%", boxSizing:"border-box", resize:"vertical", transition:"border-color .15s" }}
    onFocus={e=>e.target.style.borderColor=T.borderFoc} onBlur={e=>e.target.style.borderColor=T.borderInput}/>
);
const Field = ({ label, required, children, span2 }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:0, gridColumn:span2?"1/-1":undefined }}>
    <Label required={required}>{label}</Label>{children}
  </div>
);
const Grid2 = ({ children }) => (
  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>{children}</div>
);
const Toggle = ({ value, onChange }) => (
  <div style={{ display:"flex", gap:4 }}>
    {["OUI","NON"].map(v=>(
      <button key={v} type="button" onClick={()=>onChange(v)} style={{
        padding:"5px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font, transition:"all .15s",
        background:value===v?(v==="OUI"?T.green:T.red):"rgba(255,255,255,0.04)",
        border:`1px solid ${value===v?(v==="OUI"?T.green:T.red):T.border}`,
        color:value===v?"#fff":T.textSec
      }}>{v}</button>
    ))}
  </div>
);
const Btn = ({ onClick, children, variant="primary", small, icon }) => {
  const V = {
    primary:   { background:T.green,  color:"#fff",     border:"none" },
    secondary: { background:"transparent", color:T.green, border:`1px solid ${T.green}` },
    amber:     { background:T.amber,  color:"#1a2332",  border:"none" },
    ghost:     { background:"rgba(255,255,255,0.04)", color:T.textSec, border:`1px solid ${T.border}` },
    danger:    { background:"transparent", color:T.red, border:`1px solid rgba(239,68,68,.3)` },
    blue:      { background:T.blue,   color:"#fff",     border:"none" },
  };
  return (
    <button type="button" onClick={onClick} style={{
      ...V[variant], borderRadius:8,
      padding:small?"5px 12px":"9px 20px",
      fontSize:small?12:13, fontWeight:600, cursor:"pointer", fontFamily:T.font,
      display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap"
    }}>
      {icon&&<span>{icon}</span>}{children}
    </button>
  );
};
const Card = ({ children, style, accent, form }) => (
  <div style={{ background:form?"#1e2a3d":T.bgCard, border:`1px solid ${accent?accent+"33":T.border}`, borderRadius:12, padding:20, ...style }}>
    {children}
  </div>
);
const SectionTitle = ({ icon, title, subtitle, badge }) => (
  <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 20px", marginBottom:4 }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
      <div style={{ width:36, height:36, borderRadius:10, background:T.greenDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
      <div>
        <h2 style={{ fontSize:18, fontWeight:700, color:T.textPrim, margin:0, fontFamily:T.font }}>{title}</h2>
        {subtitle&&<p style={{ fontSize:13, color:T.textSec, margin:"2px 0 0", fontFamily:T.font }}>{subtitle}</p>}
      </div>
      {badge&&<span style={{ marginLeft:"auto", background:T.greenDim, color:T.green, border:`1px solid ${T.green}33`, borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:600 }}>{badge}</span>}
    </div>
  </div>
);
const Chip = ({ children, color="#10b981" }) => (
  <span style={{ background:color+"22", color, border:`1px solid ${color}44`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{children}</span>
);

// ─── LOGICIELS MULTI-SELECT (dropdown + checkboxes) ──────────
function LogicielsSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const ref = useRef(null);
  const selected = Array.isArray(value) ? value : (value ? [value] : []);
  const toggle = (item) => {
    const next = selected.includes(item) ? selected.filter(x=>x!==item) : [...selected, item];
    onChange(next);
  };
  const addCustom = () => {
    const t = customInput.trim();
    if (t && !selected.includes(t)) { onChange([...selected, t]); }
    setCustomInput("");
  };
  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const label = selected.length === 0 ? "Sélectionner les logiciels…" : selected.length === 1 ? selected[0] : `${selected.length} logiciels sélectionnés`;
  return (
    <div ref={ref} style={{ position:"relative" }}>
      {/* Trigger */}
      <div onClick={()=>setOpen(o=>!o)} style={{
        background:T.bgInput, border:`1px solid ${open?T.borderFoc:T.borderInput}`, borderRadius:8,
        padding:"9px 36px 9px 12px", fontSize:13, color: selected.length===0?"#94a3b8":T.textInput,
        cursor:"pointer", fontFamily:T.font, userSelect:"none", position:"relative",
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2394a3b8' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
        backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center"
      }}>{label}</div>
      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:100,
          background:"#ffffff", border:`1px solid ${T.borderInput}`, borderRadius:10,
          boxShadow:"0 8px 24px rgba(0,0,0,0.15)", overflow:"hidden"
        }}>
          {/* Checkboxes list */}
          {LOGICIELS_LIST.map(l => (
            <label key={l} onClick={()=>toggle(l)} style={{
              display:"flex", alignItems:"center", gap:10, padding:"9px 14px", cursor:"pointer",
              background:selected.includes(l)?"rgba(16,185,129,0.06)":"transparent",
              borderBottom:`1px solid #f1f5f9`, fontFamily:T.font
            }}>
              <div style={{
                width:16, height:16, borderRadius:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                background:selected.includes(l)?T.green:"#fff",
                border:`2px solid ${selected.includes(l)?T.green:"#cbd5e1"}`
              }}>
                {selected.includes(l)&&<span style={{ color:"#fff", fontSize:11, lineHeight:1 }}>✓</span>}
              </div>
              <span style={{ fontSize:13, color:"#1a2332", fontWeight:selected.includes(l)?600:400 }}>{l}</span>
            </label>
          ))}
          {/* Custom input */}
          <div style={{ padding:"10px 14px", borderTop:`1px solid #e2e8f0`, display:"flex", gap:6 }}>
            <input value={customInput} onChange={e=>setCustomInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom();}}}
              placeholder="Autre logiciel…"
              style={{ flex:1, background:"#f8fafc", border:`1px solid #e2e8f0`, borderRadius:6, padding:"6px 10px", fontSize:12, color:"#1a2332", outline:"none", fontFamily:T.font }}
              onFocus={e=>e.target.style.borderColor=T.borderFoc} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            <button type="button" onClick={addCustom} style={{ background:T.greenDim, color:T.green, border:`1px solid ${T.green}44`, borderRadius:6, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font }}>+ Ajouter</button>
          </div>
        </div>
      )}
      {/* Selected tags below */}
      {selected.length>0&&(
        <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:4 }}>
          {selected.map(s=>(
            <span key={s} style={{ background:T.greenDim, color:T.green, border:`1px solid ${T.green}33`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:4, fontFamily:T.font }}>
              {s}<span onClick={()=>toggle(s)} style={{ cursor:"pointer", opacity:.7, fontSize:14 }}>×</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SECTION 1 : IDENTITÉ ─────────────────────────────────────
function EntityForm({ entity, onChange, prevEntity, isFirst }) {
  const u = (k,v) => onChange({ ...entity, [k]:v });
  const [newPart, setNewPart] = useState({ nom:"", id:"", mdp:"" });
  const [showMdp, setShowMdp] = useState(false);
  const [revealIdx, setRevealIdx] = useState(null);
  const [copyCoords, setCopyCoords] = useState(false);
  const [copyBanc, setCopyBanc] = useState(false);

  const addPartenaire = () => {
    if (!newPart.nom.trim()) return;
    onChange({ ...entity, partenaires:[...(entity.partenaires||[]), {...newPart}] });
    setNewPart({ nom:"", id:"", mdp:"" }); setShowMdp(false);
  };
  const delPartenaire = (i) => {
    onChange({ ...entity, partenaires:(entity.partenaires||[]).filter((_,idx)=>idx!==i) });
    if (revealIdx===i) setRevealIdx(null);
  };
  const handleCopyCoords = (checked) => {
    setCopyCoords(checked);
    if (checked && prevEntity) onChange({ ...entity,
      adresse:prevEntity.adresse, lat:prevEntity.lat, lng:prevEntity.lng,
      tel:prevEntity.tel, horaires:prevEntity.horaires,
      mailContact:prevEntity.mailContact, mailFacturation:prevEntity.mailFacturation
    });
  };
  const handleCopyBanc = (checked) => {
    setCopyBanc(checked);
    if (checked && prevEntity) onChange({ ...entity, iban:prevEntity.iban, bic:prevEntity.bic });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Entité légale */}
      <Card form>
        <p style={{ fontSize:11, fontWeight:700, color:T.green, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 14px" }}>Entité légale</p>
        <Grid2>
          <Field label="Nom juridique" required><Input value={entity.nomJuridique} onChange={v=>u("nomJuridique",v)} placeholder="SAS HOTEL LE RIVAGE"/></Field>
          <Field label="Enseigne commerciale" required><Input value={entity.enseigne} onChange={v=>u("enseigne",v)} placeholder="Hôtel Le Rivage"/></Field>
          <Field label="SIRET / KBIS"><Input value={entity.siret} onChange={v=>u("siret",v)} placeholder="12345678900012"/></Field>
          <Field label="N° TVA intracommunautaire"><Input value={entity.tva} onChange={v=>u("tva",v)} placeholder="FR12345678900"/></Field>
          <Field label="Type d'établissement"><Sel value={entity.typeEtablissement} onChange={v=>u("typeEtablissement",v)} options={TYPE_ETABLISSEMENT}/></Field>
        </Grid2>
        <div style={{ marginTop:14 }}>
          <Field label="Logiciels possédés"><LogicielsSelect value={entity.logiciels} onChange={v=>u("logiciels",v)}/></Field>
        </div>
      </Card>

      {/* Coordonnées */}
      <Card form>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
          <p style={{ fontSize:11, fontWeight:700, color:T.blue, textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>Coordonnées</p>
          {!isFirst && prevEntity && (
            <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:T.blue, fontFamily:T.font, background:"rgba(59,130,246,0.08)", border:`1px solid ${T.blue}33`, borderRadius:6, padding:"4px 10px" }}>
              <input type="checkbox" checked={copyCoords} onChange={e=>handleCopyCoords(e.target.checked)} style={{ accentColor:T.blue, width:14, height:14 }}/>
              📋 Copier depuis « {prevEntity.enseigne||"entité précédente"} »
            </label>
          )}
        </div>
        <Grid2>
          <Field label="Adresse complète" required span2><Input value={entity.adresse} onChange={v=>u("adresse",v)} placeholder="12 Rue du Port, 75001 Paris"/></Field>
          <Field label="Latitude"><Input value={entity.lat} onChange={v=>u("lat",v)} placeholder="48.8566"/></Field>
          <Field label="Longitude"><Input value={entity.lng} onChange={v=>u("lng",v)} placeholder="2.3522"/></Field>
          <Field label="Téléphone"><Input value={entity.tel} onChange={v=>u("tel",v)} placeholder="+33 1 23 45 67 89"/></Field>
          <Field label="Horaires réception"><Input value={entity.horaires} onChange={v=>u("horaires",v)} placeholder="7h–23h"/></Field>
          <Field label="Mail contact" required><Input value={entity.mailContact} onChange={v=>u("mailContact",v)} placeholder="contact@hotel.fr"/></Field>
          <Field label="Mail facturation"><Input value={entity.mailFacturation} onChange={v=>u("mailFacturation",v)} placeholder="facturation@hotel.fr"/></Field>
        </Grid2>
      </Card>

      {/* Bancaire */}
      <Card form>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
          <p style={{ fontSize:11, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>Coordonnées bancaires</p>
          {!isFirst && prevEntity && (
            <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:12, color:T.amber, fontFamily:T.font, background:"rgba(245,158,11,0.08)", border:`1px solid ${T.amber}33`, borderRadius:6, padding:"4px 10px" }}>
              <input type="checkbox" checked={copyBanc} onChange={e=>handleCopyBanc(e.target.checked)} style={{ accentColor:T.amber, width:14, height:14 }}/>
              📋 Copier depuis « {prevEntity.enseigne||"entité précédente"} »
            </label>
          )}
        </div>
        <Grid2>
          <Field label="IBAN"><Input value={entity.iban} onChange={v=>u("iban",v)} placeholder="FR76 3000 1007 9412 3456 7890 185"/></Field>
          <Field label="BIC / SWIFT"><Input value={entity.bic} onChange={v=>u("bic",v)} placeholder="BNPAFRPP"/></Field>
        </Grid2>
      </Card>

      {/* Distribution */}
      <Card form>
        <p style={{ fontSize:11, fontWeight:700, color:"#8b5cf6", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 14px" }}>Distribution & Partenaires</p>
        <div style={{ display:"flex", alignItems:"flex-start", gap:8, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p style={{ fontSize:12, color:"#92400e", margin:0, fontFamily:T.font, lineHeight:1.5 }}>
            <strong style={{ color:"#f59e0b" }}>Conseil de sécurité — </strong>
            Mots de passe masqués mais stockés localement. Utilisez un gestionnaire dédié (Bitwarden, 1Password) pour une sécurité maximale.
          </p>
        </div>
        <div style={{ marginBottom:14 }}>
          <Label>Lien Drive (photos / logos)</Label>
          <Input value={entity.lienDrive} onChange={v=>u("lienDrive",v)} placeholder="https://drive.google.com/..."/>
        </div>
        {(entity.partenaires||[]).length>0&&(
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
            {(entity.partenaires||[]).map((p,i)=>(
              <div key={i} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, color:T.textPrim, fontSize:13, fontFamily:T.font }}>{p.nom}</span>
                  {p.id&&<Chip color={T.blue}>ID : {p.id}</Chip>}
                  {p.mdp&&(
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:12, color:T.textMuted, fontFamily:T.font, letterSpacing:"0.15em" }}>{revealIdx===i?p.mdp:"••••••••"}</span>
                      <button type="button" onClick={()=>setRevealIdx(revealIdx===i?null:i)} style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px", color:T.textMuted, display:"flex", alignItems:"center" }}>
                        {revealIdx===i
                          ?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          :<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                  )}
                </div>
                <Btn onClick={()=>delPartenaire(i)} variant="danger" small>✕</Btn>
              </div>
            ))}
          </div>
        )}
        <div style={{ background:"rgba(139,92,246,0.06)", border:`1px solid rgba(139,92,246,0.2)`, borderRadius:10, padding:14 }}>
          <p style={{ fontSize:11, fontWeight:700, color:"#8b5cf6", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px" }}>+ Ajouter un partenaire (OTA / logiciel)</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:6 }}>
            <Field label="Nom du partenaire"><Input value={newPart.nom} onChange={v=>setNewPart(p=>({...p,nom:v}))} placeholder="Booking.com, Expedia…"/></Field>
            <Field label="Identifiant / ID"><Input value={newPart.id} onChange={v=>setNewPart(p=>({...p,id:v}))} placeholder="123456789"/></Field>
            <Field label="Mot de passe">
              <div style={{ position:"relative" }}>
                <input type={showMdp?"text":"password"} value={newPart.mdp} onChange={e=>setNewPart(p=>({...p,mdp:e.target.value}))} placeholder="••••••••"
                  style={{ background:T.bgInput, border:`1px solid ${T.borderInput}`, borderRadius:8, padding:"9px 40px 9px 12px", fontSize:13, color:T.textInput, outline:"none", fontFamily:T.font, width:"100%", boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor=T.borderFoc} onBlur={e=>e.target.style.borderColor=T.borderInput}/>
                <button type="button" onClick={()=>setShowMdp(v=>!v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94a3b8", padding:2, display:"flex", alignItems:"center" }}>
                  {showMdp
                    ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </Field>
          </div>
          <p style={{ fontSize:11, color:"#f59e0b", fontFamily:T.font, margin:"0 0 10px", display:"flex", alignItems:"center", gap:4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Le mot de passe sera masqué après enregistrement. Cliquez sur 👁 pour le révéler.
          </p>
          <Btn onClick={addPartenaire} icon="+" variant="secondary" small>Enregistrer le partenaire</Btn>
        </div>
      </Card>
    </div>
  );
}

function SectionIdentity({ data, setData }) {
  const entites = data.entites || [INIT_ENTITY()];
  const [activeTab, setActiveTab] = useState(0);

  const updateEntity = (i, val) => {
    const next = [...entites]; next[i] = val;
    setData(p=>({ ...p, entites:next }));
  };
  const addEntity = () => {
    setData(p=>({ ...p, entites:[...entites, INIT_ENTITY()] }));
    setActiveTab(entites.length);
  };
  const delEntity = (i) => {
    if (entites.length===1) return;
    const next = entites.filter((_,idx)=>idx!==i);
    setData(p=>({ ...p, entites:next }));
    setActiveTab(Math.min(activeTab, next.length-1));
  };

  const current = entites[activeTab] || INIT_ENTITY();
  const prev    = activeTab > 0 ? entites[activeTab-1] : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <SectionTitle icon="🏢" title="Identité juridique & commerciale" subtitle="Gérez une ou plusieurs entités juridiques" badge={`${entites.length} entité${entites.length>1?"s":""}`}/>

      {/* Onglets entités */}
      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        {entites.map((e,i)=>(
          <button key={i} type="button" onClick={()=>setActiveTab(i)} style={{
            display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8,
            cursor:"pointer", fontFamily:T.font, fontSize:13, fontWeight:activeTab===i?700:500, transition:"all .15s",
            background:activeTab===i?T.green:"rgba(255,255,255,0.04)",
            color:activeTab===i?"#fff":T.textSec,
            border:`1px solid ${activeTab===i?T.green:T.border}`
          }}>
            🏢 {e.enseigne||`Entité ${i+1}`}
            {entites.length>1&&(
              <span onClick={ev=>{ev.stopPropagation();delEntity(i);}}
                style={{ marginLeft:4, opacity:.65, fontSize:15, lineHeight:1, color:activeTab===i?"#fff":T.textMuted }}>×</span>
            )}
          </button>
        ))}
        <button type="button" onClick={addEntity} style={{
          display:"flex", alignItems:"center", gap:5, padding:"8px 14px", borderRadius:8,
          cursor:"pointer", fontFamily:T.font, fontSize:13, fontWeight:600,
          background:"transparent", color:T.green, border:`1px dashed ${T.green}`, transition:"all .15s"
        }}>+ Ajouter une entité</button>
      </div>

      {/* Formulaire entité active */}
      <EntityForm key={activeTab} entity={current} onChange={val=>updateEntity(activeTab,val)} prevEntity={prev} isFirst={activeTab===0}/>
    </div>
  );
}

// ─── SECTION 2 : CHAMBRES ─────────────────────────────────────
function SectionChambres({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const newE = () => ({ nom:"",code:"",nbUnites:1,capaStd:2,capaMax:3,adultesMax:2,enfantsMax:1,surface:20,configLits:"Double",salleEau:"Douche",descriptif:"",clim:"NON",coffreFort:"NON",minibar:"NON",wifi:"OUI",bureau:"NON",balcon:"NON",autresEquipements:[],ecartSigne:"+",ecartMontant:"",ecartRef:"" });
  const [form, setForm] = useState(newE);
  const [autreInput, setAutreInput] = useState("");
  const u = (k,v) => setForm(p=>({...p,[k]:v}));
  const addAutre = () => {
    const t = autreInput.trim();
    if (t) { u("autresEquipements",[...(form.autresEquipements||[]),t]); setAutreInput(""); }
  };
  const delAutre = (i) => u("autresEquipements",(form.autresEquipements||[]).filter((_,idx)=>idx!==i));
  const save = () => {
    if (!form.nom.trim()) return;
    const list = [...data.chambres];
    if (editing!==null) list[editing]={...form}; else list.push({...form});
    setData(p=>({...p,chambres:list}));
    setForm(newE()); setEditing(null); setAutreInput("");
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <SectionTitle icon="🛏️" title="Inventaire des chambres" subtitle="Catégories, capacités et équipements" badge={`${data.chambres.length} catégorie${data.chambres.length!==1?"s":""}`}/>
      {data.chambres.map((c,i)=>(
        <Card key={i} style={{ borderLeft:`3px solid ${T.green}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, color:T.textPrim, fontSize:14, fontFamily:T.font }}>{c.nom}</span>
              <Chip color={T.green}>{c.code}</Chip>
              <span style={{ color:T.textSec, fontSize:12 }}>{c.nbUnites} unité{c.nbUnites>1?"s":""} · {c.surface}m² · {c.configLits}</span>
              {c.ecartMontant&&c.ecartRef&&<Chip color={c.ecartSigne==="-"?T.red:T.green}>{c.ecartSigne}{c.ecartMontant}€ vs {c.ecartRef}</Chip>}
              {["clim","wifi","minibar","balcon"].filter(k=>c[k]==="OUI").map(k=>(
                <Chip key={k} color={T.blue}>{{clim:"❄️ Clim",wifi:"📶 Wifi",minibar:"🍾 Minibar",balcon:"🌿 Balcon"}[k]}</Chip>
              ))}
              {(c.autresEquipements||[]).map(e=><Chip key={e} color={T.amber}>{e}</Chip>)}
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn onClick={()=>{setForm({...data.chambres[i],autresEquipements:data.chambres[i].autresEquipements||[]});setEditing(i);}} variant="ghost" small>Modifier</Btn>
              <Btn onClick={()=>setData(p=>({...p,chambres:p.chambres.filter((_,idx)=>idx!==i)}))} variant="danger" small>✕</Btn>
            </div>
          </div>
        </Card>
      ))}
      <Card accent={T.green} form>
        <p style={{ fontSize:11, fontWeight:700, color:T.green, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>
          {editing!==null?"✏️ Modifier la catégorie":"+ Nouvelle catégorie de chambre"}
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Grid2>
            <Field label="Nom catégorie" required><Input value={form.nom} onChange={v=>u("nom",v)} placeholder="Chambre Double Standard"/></Field>
            <Field label="Code court"><Input value={form.code} onChange={v=>u("code",v.toUpperCase())} placeholder="DBL"/></Field>
            <Field label="Nb unités"><Input type="number" min="1" value={form.nbUnites} onChange={v=>u("nbUnites",+v)}/></Field>
            <Field label="Surface (m²)"><Input type="number" min="1" value={form.surface} onChange={v=>u("surface",+v)}/></Field>
            <Field label="Config. lits"><Sel value={form.configLits} onChange={v=>u("configLits",v)} options={CONFIG_LITS}/></Field>
            <Field label="Salle d'eau"><Sel value={form.salleEau} onChange={v=>u("salleEau",v)} options={SALLE_EAU}/></Field>
            <Field label="Capa. standard"><Input type="number" min="1" value={form.capaStd} onChange={v=>u("capaStd",+v)}/></Field>
            <Field label="Capa. max"><Input type="number" min="1" value={form.capaMax} onChange={v=>u("capaMax",+v)}/></Field>
            <Field label="Adultes max"><Input type="number" min="0" value={form.adultesMax} onChange={v=>u("adultesMax",+v)}/></Field>
            <Field label="Enfants max"><Input type="number" min="0" value={form.enfantsMax} onChange={v=>u("enfantsMax",+v)}/></Field>
          </Grid2>
          {/* Écart de prix relatif */}
          {data.chambres.filter((_,idx)=>idx!==editing).length>0&&(
            <div>
              <Label>Écart de prix par rapport à une autre catégorie</Label>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4, flexWrap:"wrap" }}>
                <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:`1px solid ${T.borderInput}` }}>
                  {["+","-"].map(s=>(
                    <button key={s} type="button" onClick={()=>u("ecartSigne",s)} style={{
                      padding:"9px 18px", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:T.font, border:"none",
                      background:form.ecartSigne===s?(s==="+"?T.green:T.red):"#fff",
                      color:form.ecartSigne===s?"#fff":(s==="+"?T.green:T.red),
                      transition:"all .15s"
                    }}>{s}</button>
                  ))}
                </div>
                <div style={{ position:"relative", width:120 }}>
                  <Input type="number" min="0" value={form.ecartMontant} onChange={v=>u("ecartMontant",v)} placeholder="0"/>
                  <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:T.textMuted, fontFamily:T.font, pointerEvents:"none" }}>€</span>
                </div>
                <span style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>vs</span>
                <div style={{ minWidth:200, flex:1 }}>
                  <Sel
                    value={form.ecartRef||""}
                    onChange={v=>u("ecartRef",v)}
                    options={data.chambres.filter((_,idx)=>idx!==editing).map(c=>c.nom)}
                    placeholder="— Choisir la catégorie de référence —"
                  />
                </div>
              </div>
              {form.ecartMontant&&form.ecartRef&&(
                <p style={{ fontSize:12, color:form.ecartSigne==="+"?T.green:T.red, fontFamily:T.font, margin:"6px 0 0", fontStyle:"italic" }}>
                  {form.nom||"Cette catégorie"} est {form.ecartSigne}{form.ecartMontant}€ par rapport à {form.ecartRef}
                </p>
              )}
              {!form.ecartMontant&&!form.ecartRef&&(
                <p style={{ fontSize:11, color:T.textMuted, fontFamily:T.font, margin:"6px 0 0", fontStyle:"italic" }}>Optionnel — ex: Chambre Supérieure est +30€ vs Chambre Double</p>
              )}
            </div>
          )}
          <Field label="Descriptif commercial" span2>
            <Textarea value={form.descriptif} onChange={v=>u("descriptif",v)} placeholder="Chambre élégante avec vue sur le jardin..." rows={2}/>
          </Field>
          <div>
            <Label>Équipements standards</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:4 }}>
              {[["clim","❄️ Clim"],["coffreFort","🔒 Coffre-fort"],["minibar","🍾 Minibar"],["wifi","📶 Wifi"],["bureau","💼 Bureau"],["balcon","🌿 Balcon"]].map(([k,l])=>(
                <div key={k}>
                  <label style={{ fontSize:11, color:T.textSec, display:"block", marginBottom:4, fontFamily:T.font }}>{l}</label>
                  <Toggle value={form[k]} onChange={v=>u(k,v)}/>
                </div>
              ))}
            </div>
          </div>
          {/* Autres équipements custom */}
          <div>
            <Label>Autres équipements</Label>
            <div style={{ display:"flex", gap:6, marginTop:4 }}>
              <input value={autreInput} onChange={e=>setAutreInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addAutre();}}}
                placeholder="Ex: Jacuzzi, Vue mer, Terrasse privée… (Entrée)"
                style={{ background:T.bgInput, border:`1px solid ${T.borderInput}`, borderRadius:8, padding:"8px 12px", fontSize:12, color:T.textInput, outline:"none", fontFamily:T.font, flex:1 }}
                onFocus={e=>e.target.style.borderColor=T.borderFoc} onBlur={e=>e.target.style.borderColor=T.borderInput}/>
              <button type="button" onClick={addAutre} style={{ background:T.amberDim, color:T.amber, border:`1px solid ${T.amber}44`, borderRadius:8, padding:"8px 12px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font }}>+ Ajouter</button>
            </div>
            {(form.autresEquipements||[]).length>0&&(
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                {(form.autresEquipements||[]).map((e,i)=>(
                  <span key={i} style={{ background:T.amberDim, color:T.amber, border:`1px solid ${T.amber}44`, borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4, fontFamily:T.font }}>
                    {e}<span onClick={()=>delAutre(i)} style={{ cursor:"pointer", opacity:.7, fontSize:14 }}>×</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex", gap:8, paddingTop:4 }}>
            <Btn onClick={save} icon={editing!==null?"✓":"+"}>{editing!==null?"Enregistrer":"Ajouter la catégorie"}</Btn>
            {editing!==null&&<Btn onClick={()=>{setForm(newE());setEditing(null);setAutreInput("");}} variant="ghost">Annuler</Btn>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── SECTION 3 : TARIFS ───────────────────────────────────────
function SectionTarifs({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const newE = () => ({ nom:"",type:"Base",descriptif:"",baseCalc:"",prixBase:"",repas:"Aucun",annulation:"Flexible J-3",mapping:"Tous canaux",restrictions:"Aucune",codesComptables:"" });
  const [form, setForm] = useState(newE);
  const u = (k,v) => setForm(p=>({...p,[k]:v}));
  const save = () => {
    if (!form.nom.trim()) return;
    const list=[...data.tarifs];
    if(editing!==null) list[editing]={...form}; else list.push({...form});
    setData(p=>({...p,tarifs:list})); setForm(newE()); setEditing(null);
  };
  const TC={"Base":T.green,"Dérivé":T.blue,"Promotion":T.red,"Early Bird":"#8b5cf6","Last Minute":T.amber,"Groupe":"#06b6d4"};
  const allPartenaires = (data.entites||[]).flatMap(e=>(e.partenaires||[]).map(p=>p.nom)).filter(Boolean);
  const mappingOptions = ["Direct uniquement","OTA uniquement","Tous les canaux", ...allPartenaires];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <SectionTitle icon="💶" title="Stratégie tarifaire" subtitle="Plans tarifaires, conditions & mapping canaux" badge={`${data.tarifs.length} tarif${data.tarifs.length!==1?"s":""}`}/>
      {data.tarifs.map((t,i)=>(
        <Card key={i} style={{ borderLeft:`3px solid ${TC[t.type]||T.green}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, color:T.textPrim, fontSize:14, fontFamily:T.font }}>{t.nom}</span>
              <Chip color={TC[t.type]||T.green}>{t.type}</Chip>
              {t.prixBase&&<Chip color={T.amber}>{t.prixBase}€</Chip>}
              <Chip color={T.textSec}>{t.mapping}</Chip>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn onClick={()=>{setForm({...data.tarifs[i]});setEditing(i);}} variant="ghost" small>Modifier</Btn>
              <Btn onClick={()=>setData(p=>({...p,tarifs:p.tarifs.filter((_,idx)=>idx!==i)}))} variant="danger" small>✕</Btn>
            </div>
          </div>
        </Card>
      ))}
      <Card accent={T.blue} form>
        <p style={{ fontSize:11, fontWeight:700, color:T.blue, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>
          {editing!==null?"✏️ Modifier le tarif":"+ Nouveau plan tarifaire"}
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Grid2>
            <Field label="Nom du tarif" required><Input value={form.nom} onChange={v=>u("nom",v)} placeholder="BAR Standard"/></Field>
            <Field label="Type de tarif"><Sel value={form.type} onChange={v=>u("type",v)} options={TYPE_TARIF}/></Field>
            <Field label="Prix de base (€)"><Input type="number" min="0" value={form.prixBase} onChange={v=>u("prixBase",v)} placeholder="110"/></Field>
            <Field label="Base de calcul"><Input value={form.baseCalc} onChange={v=>u("baseCalc",v)} placeholder="ex: BAR -10%"/></Field>
            <Field label="Repas inclus"><Sel value={form.repas} onChange={v=>u("repas",v)} options={REPAS}/></Field>
            <Field label="Conditions d'annulation"><Sel value={form.annulation} onChange={v=>u("annulation",v)} options={ANNULATION}/></Field>
            <Field label="Mapping canal"><Sel value={form.mapping} onChange={v=>u("mapping",v)} options={mappingOptions}/></Field>
            <Field label="Restrictions"><Sel value={form.restrictions} onChange={v=>u("restrictions",v)} options={RESTRICTIONS}/></Field>
            <Field label="Codes comptables"><Input value={form.codesComptables} onChange={v=>u("codesComptables",v)} placeholder="701000"/></Field>
          </Grid2>
          <Field label="Descriptif">
            <Textarea value={form.descriptif} onChange={v=>u("descriptif",v)} placeholder="Tarif public affiché sur tous les canaux..." rows={2}/>
          </Field>
          <div style={{ display:"flex", gap:8, paddingTop:4 }}>
            <Btn onClick={save} icon={editing!==null?"✓":"+"} variant="primary">{editing!==null?"Enregistrer":"Ajouter le tarif"}</Btn>
            {editing!==null&&<Btn onClick={()=>{setForm(newE());setEditing(null);}} variant="ghost">Annuler</Btn>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── SECTION 4 : EXTRAS ───────────────────────────────────────
function SectionExtras({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const newE = () => ({ nom:"",prixTTC:"",tva:"10%",taxeSejour:"",ventilation:"Par Pax/Nuit",codeComptable:"",notes:"" });
  const [form, setForm] = useState(newE);
  const u = (k,v) => setForm(p=>({...p,[k]:v}));
  const save = () => {
    if (!form.nom.trim()) return;
    const list=[...data.extras];
    if(editing!==null) list[editing]={...form}; else list.push({...form});
    setData(p=>({...p,extras:list})); setForm(newE()); setEditing(null);
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <SectionTitle icon="🧾" title="Extras, taxes & comptabilité" subtitle="Services additionnels, TVA et codes comptables" badge={`${data.extras.length} service${data.extras.length!==1?"s":""}`}/>
      {data.extras.map((e,i)=>(
        <Card key={i} style={{ borderLeft:`3px solid ${T.amber}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontWeight:700, color:T.textPrim, fontSize:14, fontFamily:T.font }}>{e.nom}</span>
              <Chip color={T.amber}>{e.prixTTC}€ TTC</Chip>
              <Chip color={T.textSec}>TVA {e.tva}</Chip>
              <Chip color={T.blue}>{e.ventilation}</Chip>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <Btn onClick={()=>{setForm({...data.extras[i]});setEditing(i);}} variant="ghost" small>Modifier</Btn>
              <Btn onClick={()=>setData(p=>({...p,extras:p.extras.filter((_,idx)=>idx!==i)}))} variant="danger" small>✕</Btn>
            </div>
          </div>
        </Card>
      ))}
      <Card accent={T.amber} form>
        <p style={{ fontSize:11, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>
          {editing!==null?"✏️ Modifier l'extra":"+ Nouvel extra / service"}
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Grid2>
            <Field label="Nom du service" required><Input value={form.nom} onChange={v=>u("nom",v)} placeholder="Petit-déjeuner continental"/></Field>
            <Field label="Prix TTC (€)"><Input type="number" min="0" value={form.prixTTC} onChange={v=>u("prixTTC",v)} placeholder="18"/></Field>
            <Field label="Taux TVA"><Sel value={form.tva} onChange={v=>u("tva",v)} options={TVA}/></Field>
            <Field label="Taxe de séjour (€/pers/nuit)"><Input type="number" min="0" value={form.taxeSejour} onChange={v=>u("taxeSejour",v)} placeholder="1.50"/></Field>
            <Field label="Ventilation taxe"><Sel value={form.ventilation} onChange={v=>u("ventilation",v)} options={VENTILATION}/></Field>
            <Field label="Code comptable"><Input value={form.codeComptable} onChange={v=>u("codeComptable",v)} placeholder="707010"/></Field>
          </Grid2>
          <Field label="Notes">
            <Textarea value={form.notes} onChange={v=>u("notes",v)} placeholder="Remarques, conditions d'application..." rows={2}/>
          </Field>
          <div style={{ display:"flex", gap:8, paddingTop:4 }}>
            <Btn onClick={save} icon={editing!==null?"✓":"+"} variant="amber">{editing!==null?"Enregistrer":"Ajouter l'extra"}</Btn>
            {editing!==null&&<Btn onClick={()=>{setForm(newE());setEditing(null);}} variant="ghost">Annuler</Btn>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── SECTION 5 : CALE TARIFAIRE ───────────────────────────────
function SectionPricing365({ data, setData }) {
  const [activeCaleId, setActiveCaleId] = useState(null);
  const [selecting, setSelecting]       = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [editingIdx, setEditingIdx]     = useState(null);
  const EC = { nom:"", couleur:PALETTE_BG[0], tarifStandalone:"", tarifReference:"", prix:{} };
  const [cf, setCf] = useState(EC);
  const uc = (k,v) => setCf(p=>({...p,[k]:v}));
  const tarifsNoms = data.tarifs.map(t=>t.nom);
  const saveCale = () => {
    if (!cf.nom.trim()) return;
    const idx = editingIdx!==null ? editingIdx : data.cales.length;
    const cale = { ...cf, id: editingIdx!==null ? data.cales[editingIdx].id : Date.now().toString(), couleur: cf.couleur||PALETTE_BG[idx%PALETTE_BG.length] };
    const list = [...data.cales];
    if (editingIdx!==null) list[editingIdx]=cale; else list.push(cale);
    setData(p=>({...p,cales:list}));
    setActiveCaleId(cale.id); setCf(EC); setShowForm(false); setEditingIdx(null);
  };
  const delCale = (i) => {
    const id = data.cales[i].id;
    const cal = {...data.calendar};
    Object.keys(cal).forEach(k=>{ if(cal[k]===id) delete cal[k]; });
    setData(p=>({...p,cales:p.cales.filter((_,idx)=>idx!==i),calendar:cal}));
    if(activeCaleId===id) setActiveCaleId(null);
  };
  const getDay = (mi,d) => `2025-${String(mi+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const assignDay = (mi,d) => {
    if(!activeCaleId) return;
    const key=getDay(mi,d);
    setData(p=>{ const cal={...p.calendar}; if(cal[key]===activeCaleId) delete cal[key]; else cal[key]=activeCaleId; return {...p,calendar:cal}; });
  };
  const getCale = id => data.cales.find(c=>c.id===id);
  const stats={};
  data.cales.forEach(c=>{stats[c.id]=0;});
  Object.values(data.calendar).forEach(id=>{if(stats[id]!==undefined)stats[id]++;});
  const total=Object.keys(data.calendar).length;
  const pct=Math.round(total/365*100);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }} onMouseUp={()=>setSelecting(false)}>
      <SectionTitle icon="📅" title="Cale tarifaire 365 jours" subtitle="Créez vos cales, configurez-les, puis peignez-les sur le calendrier" badge={`${total}/365 jours`}/>
      <Card style={{ padding:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ fontSize:13, color:T.textSec, fontFamily:T.font }}>Avancement du calendrier</span>
          <span style={{ fontSize:13, fontWeight:700, color:T.green, fontFamily:T.font }}>{pct}%</span>
        </div>
        <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3 }}>
          <div style={{ width:`${pct}%`, height:"100%", background:T.green, borderRadius:3, transition:"width .4s" }}/>
        </div>
        <div style={{ display:"flex", gap:16, marginTop:10, flexWrap:"wrap" }}>
          {data.cales.map(c=>(
            <div key={c.id} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:c.couleur }}/>
              <span style={{ fontSize:11, color:T.textSec, fontFamily:T.font }}>{c.nom} <span style={{ color:T.textMuted }}>({stats[c.id]||0}j)</span></span>
            </div>
          ))}
        </div>
      </Card>
      {data.cales.map((c,i)=>(
        <Card key={c.id} style={{ borderLeft:`3px solid ${c.couleur}`, background:activeCaleId===c.id?T.bgCardHov:T.bgCard, cursor:"pointer" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }} onClick={()=>setActiveCaleId(activeCaleId===c.id?null:c.id)}>
              <div style={{ width:12, height:12, borderRadius:3, background:c.couleur, flexShrink:0 }}/>
              <span style={{ fontWeight:700, color:T.textPrim, fontSize:14, fontFamily:T.font }}>{c.nom}</span>
              {c.tarifStandalone&&<Chip color={T.green}>📌 {c.tarifStandalone}</Chip>}
              {c.tarifReference&&<Chip color={T.textSec}>↗ réf: {c.tarifReference}</Chip>}
              <span style={{ marginLeft:4, background:"rgba(255,255,255,0.05)", color:T.textSec, padding:"1px 8px", borderRadius:20, fontSize:11 }}>{stats[c.id]||0}j</span>
            </div>
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              {activeCaleId===c.id&&<span style={{ fontSize:11, color:T.green, fontWeight:600 }}>✏️ Peinture active</span>}
              <Btn onClick={()=>{setCf({...c});setEditingIdx(i);setShowForm(true);}} variant="ghost" small>Modifier</Btn>
              <Btn onClick={()=>delCale(i)} variant="danger" small>✕</Btn>
            </div>
          </div>
          {c.prix&&Object.keys(c.prix).length>0&&(
            <div style={{ marginTop:10, display:"flex", gap:6, flexWrap:"wrap" }}>
              {Object.entries(c.prix).filter(([,v])=>v).map(([cat,prix])=>(
                <span key={cat} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:6, padding:"2px 10px", fontSize:12, color:T.textPrim, fontFamily:T.font }}>{cat}: <strong style={{ color:T.amber }}>{prix}€</strong></span>
              ))}
            </div>
          )}
        </Card>
      ))}
      {!showForm?(
        <Btn onClick={()=>{setCf(EC);setEditingIdx(null);setShowForm(true);}} icon="+" variant="secondary">Créer une cale tarifaire</Btn>
      ):(
        <Card accent={T.green} form>
          <p style={{ fontSize:11, fontWeight:700, color:T.green, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>
            {editingIdx!==null?"✏️ Modifier la cale":"✨ Nouvelle cale tarifaire"}
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <Grid2>
              <Field label="Nom de la cale" required><Input value={cf.nom} onChange={v=>uc("nom",v)} placeholder="Ex: Haute saison été"/></Field>
              <div>
                <Label>Couleur</Label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
                  {PALETTE_BG.map((c,i)=>(
                    <div key={i} onClick={()=>uc("couleur",c)} style={{ width:24, height:24, borderRadius:6, background:c, cursor:"pointer", outline:cf.couleur===c?"2px solid #fff":"2px solid transparent", outlineOffset:1 }}/>
                  ))}
                </div>
              </div>
            </Grid2>
            {tarifsNoms.length>0&&(
              <Grid2>
                <Field label="Tarif standalone (par défaut)"><Sel value={cf.tarifStandalone} onChange={v=>uc("tarifStandalone",v)} options={tarifsNoms} placeholder="— Aucun —"/></Field>
                <Field label="Tarif de référence (dérivés)"><Sel value={cf.tarifReference} onChange={v=>uc("tarifReference",v)} options={tarifsNoms} placeholder="— Aucun —"/></Field>
              </Grid2>
            )}
            {data.chambres.length>0&&(
              <div>
                <Label>Prix par catégorie de chambre (€/nuit)</Label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginTop:4 }}>
                  {data.chambres.map(ch=>(
                    <Field key={ch.code} label={`${ch.nom} (${ch.code})`}>
                      <Input type="number" min="0" value={cf.prix?.[ch.code]||""} onChange={v=>uc("prix",{...(cf.prix||{}),[ch.code]:v})} placeholder="Ex: 120"/>
                    </Field>
                  ))}
                </div>
              </div>
            )}
            {tarifsNoms.length===0&&data.chambres.length===0&&(
              <div style={{ background:T.amberDim, border:`1px solid ${T.amber}33`, borderRadius:8, padding:12, fontSize:13, color:T.amber, fontFamily:T.font }}>
                💡 Créez d'abord vos chambres et tarifs pour les associer à cette cale.
              </div>
            )}
            <div style={{ display:"flex", gap:8, paddingTop:4 }}>
              <Btn onClick={saveCale} icon={editingIdx!==null?"✓":"+"} variant="primary">{editingIdx!==null?"Enregistrer":"Créer la cale"}</Btn>
              <Btn onClick={()=>{setShowForm(false);setEditingIdx(null);setCf(EC);}} variant="ghost">Annuler</Btn>
            </div>
          </div>
        </Card>
      )}
      {data.cales.length>0&&(
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0" }}>
            <span style={{ fontSize:12, color:activeCaleId?T.green:T.textSec, fontFamily:T.font, fontWeight:activeCaleId?600:400 }}>
              {activeCaleId?`✏️ Peinture : ${getCale(activeCaleId)?.nom} — cliquez/glissez sur les jours`:"👆 Sélectionnez une cale pour peindre"}
            </span>
            <Btn onClick={()=>setData(p=>({...p,calendar:{}}))} variant="danger" small>Réinitialiser</Btn>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {MONTHS.map((month,mi)=>(
              <div key={mi} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:10, padding:10, userSelect:"none" }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textSec, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, textAlign:"center", fontFamily:T.font }}>{month}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1.5 }}>
                  {Array.from({length:MONTH_DAYS[mi]},(_,di)=>{
                    const key=getDay(mi,di+1);
                    const caleId=data.calendar[key];
                    const cale=caleId?getCale(caleId):null;
                    return (
                      <div key={di}
                        onMouseDown={()=>{setSelecting(true);assignDay(mi,di+1);}}
                        onMouseEnter={()=>{if(selecting)assignDay(mi,di+1);}}
                        title={cale?`${di+1} ${month} : ${cale.nom}`:`${di+1} ${month}`}
                        style={{ width:"100%", aspectRatio:"1", borderRadius:2, cursor:activeCaleId?"crosshair":"default", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:cale?700:400, background:cale?cale.couleur:"rgba(255,255,255,0.04)", color:cale?"rgba(0,0,0,0.7)":"rgba(255,255,255,0.2)", transition:"transform .05s" }}>
                        {di+1}
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

// ─── SECTION 6 : RESTAURANT ───────────────────────────────────

// Composant réutilisable multi-select avec dropdown + cases à cocher
function MultiSelectDropdown({ value, onChange, options, placeholder, customAllowed=true }) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const ref = useRef(null);
  const selected = Array.isArray(value) ? value : [];
  const toggle = (item) => onChange(selected.includes(item) ? selected.filter(x=>x!==item) : [...selected, item]);
  const addCustom = () => { const t=customInput.trim(); if(t&&!selected.includes(t)) onChange([...selected,t]); setCustomInput(""); };
  useEffect(()=>{ const h=(e)=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h); },[]);
  const label = selected.length===0 ? placeholder : selected.length===1 ? selected[0] : `${selected.length} sélectionnés`;
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ background:T.bgInput, border:`1px solid ${open?T.borderFoc:T.borderInput}`, borderRadius:8, padding:"9px 36px 9px 12px", fontSize:13, color:selected.length===0?"#94a3b8":T.textInput, cursor:"pointer", fontFamily:T.font, userSelect:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2394a3b8' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center" }}>{label}</div>
      {open&&(
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:200, background:"#ffffff", border:`1px solid ${T.borderInput}`, borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.15)", overflow:"hidden", maxHeight:280, overflowY:"auto" }}>
          {options.map(o=>(
            <label key={o} onClick={()=>toggle(o)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", cursor:"pointer", background:selected.includes(o)?"rgba(16,185,129,0.06)":"transparent", borderBottom:"1px solid #f1f5f9", fontFamily:T.font }}>
              <div style={{ width:16, height:16, borderRadius:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:selected.includes(o)?T.green:"#fff", border:`2px solid ${selected.includes(o)?T.green:"#cbd5e1"}` }}>
                {selected.includes(o)&&<span style={{ color:"#fff", fontSize:11, lineHeight:1 }}>✓</span>}
              </div>
              <span style={{ fontSize:13, color:"#1a2332", fontWeight:selected.includes(o)?600:400 }}>{o}</span>
            </label>
          ))}
          {customAllowed&&(
            <div style={{ padding:"10px 14px", borderTop:"1px solid #e2e8f0", display:"flex", gap:6 }}>
              <input value={customInput} onChange={e=>setCustomInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCustom();}}} placeholder="Ajouter personnalisé…" style={{ flex:1, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, padding:"6px 10px", fontSize:12, color:"#1a2332", outline:"none", fontFamily:T.font }} onFocus={e=>e.target.style.borderColor=T.borderFoc} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              <button type="button" onClick={addCustom} style={{ background:T.greenDim, color:T.green, border:`1px solid ${T.green}44`, borderRadius:6, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.font }}>+</button>
            </div>
          )}
        </div>
      )}
      {selected.length>0&&(
        <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:4 }}>
          {selected.map(s=>(
            <span key={s} style={{ background:T.greenDim, color:T.green, border:`1px solid ${T.green}33`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:4, fontFamily:T.font }}>
              {s}<span onClick={()=>toggle(s)} style={{ cursor:"pointer", opacity:.7, fontSize:14 }}>×</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionRestaurant({ data, setData }) {
  const r = data.restaurant || { moments:[], options:[], salles:[], tables:[], cartes:[], articles:[] };
  const ur = (k,v) => setData(p=>({ ...p, restaurant:{ ...p.restaurant, [k]:v } }));

  // ── Salles ──
  const [newSalle, setNewSalle] = useState({ nom:"", couleur:SALLE_COLORS[0] });
  const addSalle = () => {
    if (!newSalle.nom.trim()) return;
    ur("salles", [...(r.salles||[]), { ...newSalle, id:Date.now().toString() }]);
    setNewSalle({ nom:"", couleur:SALLE_COLORS[(r.salles||[]).length % SALLE_COLORS.length] });
  };
  const delSalle = (id) => {
    ur("salles", (r.salles||[]).filter(s=>s.id!==id));
    ur("tables", (r.tables||[]).filter(t=>t.salleId!==id));
  };

  // ── Tables ──
  const [newTable, setNewTable] = useState({ numero:"", couverts:2, salleId:"" });
  const addTable = () => {
    if (!newTable.numero.trim() || !newTable.salleId) return;
    ur("tables", [...(r.tables||[]), { ...newTable, id:Date.now().toString() }]);
    setNewTable({ numero:"", couverts:2, salleId:newTable.salleId });
  };
  const delTable = (id) => ur("tables", (r.tables||[]).filter(t=>t.id!==id));

  // ── Cartes ──
  const [newCarte, setNewCarte] = useState("");
  const addCarte = () => {
    if (!newCarte.trim()) return;
    ur("cartes", [...(r.cartes||[]), { nom:newCarte.trim(), id:Date.now().toString() }]);
    setNewCarte("");
  };
  const delCarte = (id) => ur("cartes", (r.cartes||[]).filter(c=>c.id!==id));

  // ── Articles ──
  const newArt = () => ({ nom:"", moments:[], carte:"", prix:"", tva:"10%", options:[] });
  const [artForm, setArtForm] = useState(newArt);
  const [artEditing, setArtEditing] = useState(null);
  const ua = (k,v) => setArtForm(p=>({...p,[k]:v}));
  const saveArticle = () => {
    if (!artForm.nom.trim()) return;
    const list = [...(r.articles||[])];
    if (artEditing!==null) list[artEditing]={...artForm}; else list.push({...artForm});
    ur("articles", list); setArtForm(newArt()); setArtEditing(null);
  };
  const delArticle = (i) => ur("articles", (r.articles||[]).filter((_,idx)=>idx!==i));

  // Options disponibles par moment sélectionné dans l'article
  const optionsByMoment = (r.options||[]);

  const getSalleCouleur = (id) => (r.salles||[]).find(s=>s.id===id)?.couleur || T.textMuted;
  const getSalleNom = (id) => (r.salles||[]).find(s=>s.id===id)?.nom || "—";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <SectionTitle icon="🍽️" title="Configuration Restaurant" subtitle="Moments, salles, cartes et articles du menu" badge={`${(r.articles||[]).length} article${(r.articles||[]).length!==1?"s":""}`}/>

      {/* ── 1. MOMENTS & OPTIONS ── */}
      <Card form>
        <p style={{ fontSize:11, fontWeight:700, color:T.green, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>① Moments & Options de service</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Field label="Moments de service">
            <MultiSelectDropdown value={r.moments||[]} onChange={v=>ur("moments",v)} options={MOMENTS_LIST} placeholder="Sélectionner les moments…"/>
          </Field>
          <Field label="Options disponibles (cuisson, régime…)">
            <MultiSelectDropdown value={r.options||[]} onChange={v=>ur("options",v)} options={OPTIONS_LIST} placeholder="Sélectionner les options…"/>
          </Field>
        </div>
        {(r.moments||[]).length>0&&(
          <div style={{ marginTop:16 }}>
            <Label>Associer des options par moment</Label>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:6 }}>
              {(r.moments||[]).map(m=>{
                const key = `optsMoment_${m}`;
                const val = r[key]||[];
                return (
                  <div key={m} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 14px", display:"flex", alignItems:"flex-start", gap:14 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:T.textPrim, fontFamily:T.font, minWidth:120, paddingTop:2 }}>{m}</span>
                    <div style={{ flex:1 }}>
                      <MultiSelectDropdown value={val} onChange={v=>ur(key,v)} options={r.options||[]} placeholder="Options pour ce moment…" customAllowed={false}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── 2. SALLES & TABLES ── */}
      <Card form>
        <p style={{ fontSize:11, fontWeight:700, color:T.blue, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>② Salles & Plan de tables</p>

        {/* Ajouter une salle */}
        <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:16 }}>
          <Field label="Nom de la salle" style={{ flex:1 }}>
            <Input value={newSalle.nom} onChange={v=>setNewSalle(p=>({...p,nom:v}))} placeholder="Ex: Salle principale, Terrasse, Bar…"/>
          </Field>
          <div>
            <Label>Couleur</Label>
            <div style={{ display:"flex", gap:5, marginTop:4 }}>
              {SALLE_COLORS.map(c=>(
                <div key={c} onClick={()=>setNewSalle(p=>({...p,couleur:c}))} style={{ width:22, height:22, borderRadius:5, background:c, cursor:"pointer", outline:newSalle.couleur===c?"2px solid #fff":"2px solid transparent", outlineOffset:1 }}/>
              ))}
            </div>
          </div>
          <Btn onClick={addSalle} variant="blue" icon="+">Ajouter la salle</Btn>
        </div>

        {/* Plan de salle */}
        {(r.salles||[]).length>0 ? (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {(r.salles||[]).map(salle=>{
              const tables = (r.tables||[]).filter(t=>t.salleId===salle.id);
              return (
                <div key={salle.id} style={{ border:`2px solid ${salle.couleur}22`, borderRadius:10, overflow:"hidden" }}>
                  {/* Header salle */}
                  <div style={{ background:`${salle.couleur}18`, borderBottom:`1px solid ${salle.couleur}33`, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:salle.couleur }}/>
                      <span style={{ fontWeight:700, color:T.textPrim, fontSize:14, fontFamily:T.font }}>{salle.nom}</span>
                      <span style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>{tables.length} table{tables.length!==1?"s":""} · {tables.reduce((a,t)=>a+(+t.couverts||0),0)} couverts</span>
                    </div>
                    <Btn onClick={()=>delSalle(salle.id)} variant="danger" small>✕ Supprimer la salle</Btn>
                  </div>
                  {/* Grille tables */}
                  <div style={{ padding:14 }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                      {tables.map(t=>(
                        <div key={t.id} style={{ background:`${salle.couleur}22`, border:`2px solid ${salle.couleur}66`, borderRadius:8, padding:"10px 14px", minWidth:70, textAlign:"center", position:"relative" }}>
                          <div style={{ fontSize:16, fontWeight:800, color:salle.couleur, fontFamily:T.font }}>T{t.numero}</div>
                          <div style={{ fontSize:11, color:T.textSec, fontFamily:T.font }}>{t.couverts} cvts</div>
                          <div onClick={()=>delTable(t.id)} style={{ position:"absolute", top:4, right:6, cursor:"pointer", color:T.textMuted, fontSize:13, fontWeight:700 }}>×</div>
                        </div>
                      ))}
                      {tables.length===0&&<span style={{ fontSize:12, color:T.textMuted, fontFamily:T.font, fontStyle:"italic" }}>Aucune table — ajoutez-en ci-dessous</span>}
                    </div>
                    {/* Ajouter une table dans cette salle */}
                    <div style={{ display:"flex", gap:8, alignItems:"flex-end", background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"10px 12px" }}>
                      <Field label="N° table" style={{ width:90 }}>
                        <Input value={newTable.salleId===salle.id?newTable.numero:""} onChange={v=>setNewTable({numero:v,couverts:newTable.salleId===salle.id?newTable.couverts:2,salleId:salle.id})} placeholder="1"/>
                      </Field>
                      <Field label="Couverts" style={{ width:80 }}>
                        <Input type="number" min="1" value={newTable.salleId===salle.id?newTable.couverts:2} onChange={v=>setNewTable(p=>({...p,couverts:+v,salleId:salle.id}))} />
                      </Field>
                      <Btn onClick={()=>{ if(newTable.salleId===salle.id) addTable(); else setNewTable({numero:"",couverts:2,salleId:salle.id}); }} variant="secondary" small icon="+">Ajouter table</Btn>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ):(
          <div style={{ background:T.amberDim, border:`1px solid ${T.amber}33`, borderRadius:8, padding:12, fontSize:13, color:T.amber, fontFamily:T.font }}>
            💡 Créez d'abord une salle pour y ajouter des tables.
          </div>
        )}
      </Card>

      {/* ── 3. CARTES ── */}
      <Card form>
        <p style={{ fontSize:11, fontWeight:700, color:T.amber, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>③ Cartes (menus)</p>
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <Input value={newCarte} onChange={v=>setNewCarte(v)} placeholder="Ex: Carte Été, Menu Déjeuner, Carte des vins, Menu Enfant…"/>
          <Btn onClick={addCarte} variant="amber" icon="+">Ajouter</Btn>
        </div>
        {(r.cartes||[]).length>0 ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {(r.cartes||[]).map(c=>(
              <div key={c.id} style={{ background:T.amberDim, border:`1px solid ${T.amber}44`, borderRadius:8, padding:"8px 14px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color:T.amber, fontFamily:T.font }}>🗂 {c.nom}</span>
                <span onClick={()=>delCarte(c.id)} style={{ cursor:"pointer", color:T.textMuted, fontSize:14 }}>×</span>
              </div>
            ))}
          </div>
        ):(
          <span style={{ fontSize:12, color:T.textMuted, fontFamily:T.font, fontStyle:"italic" }}>Aucune carte créée</span>
        )}
      </Card>

      {/* ── 4. ARTICLES ── */}
      <Card form>
        <p style={{ fontSize:11, fontWeight:700, color:"#8b5cf6", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>④ Articles (mets & boissons)</p>

        {/* Liste articles existants */}
        {(r.articles||[]).length>0&&(
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
            {(r.articles||[]).map((a,i)=>(
              <div key={i} style={{ background:T.bgCard, border:`1px solid rgba(139,92,246,0.2)`, borderLeft:`3px solid #8b5cf6`, borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ fontWeight:700, color:T.textPrim, fontSize:13, fontFamily:T.font }}>{a.nom}</span>
                  {a.prix&&<Chip color={T.green}>{a.prix}€</Chip>}
                  {a.tva&&<Chip color={T.textSec}>TVA {a.tva}</Chip>}
                  {(a.moments||[]).map(m=><Chip key={m} color={T.blue}>{m}</Chip>)}
                  {a.carte&&<Chip color={T.amber}>🗂 {a.carte}</Chip>}
                  {(a.options||[]).length>0&&<Chip color={"#8b5cf6"}>{a.options.length} option{a.options.length>1?"s":""}</Chip>}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <Btn onClick={()=>{setArtForm({...a});setArtEditing(i);}} variant="ghost" small>Modifier</Btn>
                  <Btn onClick={()=>delArticle(i)} variant="danger" small>✕</Btn>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire article */}
        <div style={{ background:"rgba(139,92,246,0.06)", border:`1px solid rgba(139,92,246,0.2)`, borderRadius:10, padding:16 }}>
          <p style={{ fontSize:11, fontWeight:700, color:"#8b5cf6", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 14px" }}>
            {artEditing!==null?"✏️ Modifier l'article":"+ Nouvel article"}
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:12 }}>
              <Field label="Nom de l'article" required>
                <Input value={artForm.nom} onChange={v=>ua("nom",v)} placeholder="Ex: Entrecôte, Saumon fumé, Kir Royal…"/>
              </Field>
              <Field label="Prix (€)">
                <Input type="number" min="0" value={artForm.prix} onChange={v=>ua("prix",v)} placeholder="12.50"/>
              </Field>
              <Field label="TVA">
                <Sel value={artForm.tva} onChange={v=>ua("tva",v)} options={TVA_RESTO}/>
              </Field>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Moments associés">
                <MultiSelectDropdown value={artForm.moments||[]} onChange={v=>ua("moments",v)} options={r.moments||[]} placeholder={r.moments?.length?"Choisir les moments…":"Créez d'abord des moments"} customAllowed={false}/>
              </Field>
              <Field label="Carte">
                <Sel value={artForm.carte||""} onChange={v=>ua("carte",v)} options={(r.cartes||[]).map(c=>c.nom)} placeholder={r.cartes?.length?"— Choisir une carte —":"Créez d'abord une carte"}/>
              </Field>
            </div>
            {/* Options : globales par moment + spécifiques */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Options spécifiques à cet article">
                <MultiSelectDropdown value={artForm.options||[]} onChange={v=>ua("options",v)} options={r.options||[]} placeholder={r.options?.length?"Options spécifiques…":"Créez d'abord des options"} customAllowed={false}/>
              </Field>
              {(artForm.moments||[]).length>0&&(
                <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px" }}>
                  <Label>Options héritées des moments</Label>
                  <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:4 }}>
                    {[...new Set((artForm.moments||[]).flatMap(m=>r[`optsMoment_${m}`]||[]))].map(o=>(
                      <span key={o} style={{ background:"rgba(59,130,246,0.1)", color:T.blue, border:`1px solid ${T.blue}33`, borderRadius:20, padding:"2px 8px", fontSize:11, fontFamily:T.font }}>{o}</span>
                    ))}
                    {[...new Set((artForm.moments||[]).flatMap(m=>r[`optsMoment_${m}`]||[]))].length===0&&(
                      <span style={{ fontSize:11, color:T.textMuted, fontStyle:"italic", fontFamily:T.font }}>Aucune option héritée</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:8, paddingTop:4 }}>
              <Btn onClick={saveArticle} icon={artEditing!==null?"✓":"+"} variant="primary">{artEditing!==null?"Enregistrer":"Ajouter l'article"}</Btn>
              {artEditing!==null&&<Btn onClick={()=>{setArtForm(newArt());setArtEditing(null);}} variant="ghost">Annuler</Btn>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── EXPORT EXCEL ─────────────────────────────────────────────
function buildExcel(data) {
  const wb = XLSX.utils.book_new();
  const HF={bold:true,color:{rgb:"FFFFFF"},sz:11,name:"Inter"};
  const HFill={patternType:"solid",fgColor:{rgb:"0F1623"}};
  const BD={top:{style:"thin",color:{rgb:"334155"}},bottom:{style:"thin",color:{rgb:"334155"}},left:{style:"thin",color:{rgb:"334155"}},right:{style:"thin",color:{rgb:"334155"}}};
  const hs=h=>({font:h?HF:{sz:10,name:"Inter"},fill:h?HFill:undefined,border:BD,alignment:{horizontal:h?"center":"left",vertical:"center",wrapText:true}});
  const addSheet=(name,headers,rows,widths)=>{
    const ws={};
    headers.forEach((v,i)=>{ws[XLSX.utils.encode_cell({r:0,c:i})]={v,t:"s",s:hs(true)};});
    rows.forEach((row,ri)=>{row.forEach((v,ci)=>{ws[XLSX.utils.encode_cell({r:ri+1,c:ci})]={v:v??"",t:typeof v==="number"?"n":"s",s:hs(false)};});});
    ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(rows.length,1),c:headers.length-1}});
    ws["!cols"]=widths.map(w=>({wch:w}));
    ws["!rows"]=[{hpt:40},...Array(rows.length).fill({hpt:25})];
    XLSX.utils.book_append_sheet(wb,ws,name);
  };
  const entites = data.entites || [INIT_ENTITY()];
  addSheet("1 - Identité",
    ["Entité","Nom Juridique","Enseigne","SIRET","N° TVA","Type","Logiciels","Adresse","Lat","Lng","Mail Contact","Mail Fact.","Tél","Horaires","IBAN","BIC","Partenaires","Lien Drive"],
    entites.map((d,i)=>{
      const logStr=Array.isArray(d.logiciels)?d.logiciels.join(", "):d.logiciels||"";
      const partStr=(d.partenaires||[]).map(p=>`${p.nom}${p.id?" (ID:"+p.id+")":""}`).join(" | ");
      return [`Entité ${i+1}`,d.nomJuridique,d.enseigne,d.siret,d.tva,d.typeEtablissement,logStr,d.adresse,d.lat,d.lng,d.mailContact,d.mailFacturation,d.tel,d.horaires,d.iban,d.bic,partStr,d.lienDrive];
    }),
    [10,22,20,18,18,16,28,28,10,10,22,22,16,14,28,12,40,28]);
  addSheet("2 - Chambres",
    ["Nom","Code","Nb","Capa Std","Capa Max","Adultes","Enfants","Surface m²","Config Lits","Salle d'eau","Descriptif","Clim","Coffre","Minibar","Wifi","Bureau","Balcon","Autres équipements"],
    data.chambres.map(c=>[c.nom,c.code,+c.nbUnites,+c.capaStd,+c.capaMax,+c.adultesMax,+c.enfantsMax,+c.surface,c.configLits,c.salleEau,c.descriptif,c.clim,c.coffreFort,c.minibar,c.wifi,c.bureau,c.balcon,(c.autresEquipements||[]).join(", ")]),
    [24,8,6,8,8,8,8,8,14,14,34,6,8,8,6,8,14,30]);
  addSheet("3 - Tarification",
    ["Nom Tarif","Type","Descriptif","Base Calcul","Prix Base €","Repas","Annulation","Mapping","Restrictions","Codes Compta"],
    data.tarifs.map(t=>[t.nom,t.type,t.descriptif,t.baseCalc,t.prixBase?+t.prixBase:null,t.repas,t.annulation,t.mapping,t.restrictions,t.codesComptables]),
    [22,12,30,14,12,14,16,16,18,14]);
  addSheet("4 - Extras & Taxes",
    ["Nom Service","Prix TTC €","Taux TVA","Taxe Séjour €","Ventilation","Code Compta","Notes"],
    data.extras.map(e=>[e.nom,e.prixTTC?+e.prixTTC:null,e.tva,e.taxeSejour?+e.taxeSejour:null,e.ventilation,e.codeComptable,e.notes]),
    [26,12,10,14,20,14,34]);
  const MONTHS_=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const calRows=Object.entries(data.calendar).sort(([a],[b])=>a.localeCompare(b)).map(([date,caleId])=>{
    const [,mo,dy]=date.split("-");
    const cale=data.cales.find(c=>c.id===caleId);
    const prixStr=cale?Object.entries(cale.prix||{}).filter(([,v])=>v).map(([k,v])=>`${k}:${v}€`).join(" | "):"";
    return [date,MONTHS_[+mo-1],+dy,cale?.nom||"",cale?.tarifStandalone||"",cale?.tarifReference||"",prixStr];
  });
  addSheet("5 - Cale Tarifaire 365j",["Date","Mois","Jour","Cale","Tarif Standalone","Tarif Référence","Prix par catégorie"],calRows,[14,8,6,20,20,20,40]);
  return wb;
}
function exportExcel(data) { XLSX.writeFile(buildExcel(data),"Onboarding_Hotel.xlsx"); }

// ─── PROGRESS ─────────────────────────────────────────────────
function calcProgress(data) {
  const d=(data.entites||[INIT_ENTITY()])[0];
  const fields=[d.nomJuridique,d.enseigne,d.siret,d.mailContact,d.tel,d.adresse];
  const r=data.restaurant||{};
  return Math.round(((fields.filter(Boolean).length/fields.length)+(data.chambres.length>0?1:0)+(data.tarifs.length>0?1:0)+(data.extras.length>0?1:0)+(data.cales.length>0?Math.min(Object.keys(data.calendar).length/100,1):0)+((r.articles||[]).length>0?1:0))/6*100);
}
function calcStepDone(data) {
  const d=(data.entites||[INIT_ENTITY()])[0];
  const r=data.restaurant||{};
  return [
    !!(d.nomJuridique&&d.mailContact),
    data.chambres.length>0,
    data.tarifs.length>0,
    data.extras.length>0,
    data.cales.length>0,
    (r.articles||[]).length>0
  ];
}

// ─── APP ──────────────────────────────────────────────────────
export default function App() {
  const [step,    setStep]    = useState(0);
  const [data,    setData]    = useState(INIT);
  const [saved,   setSaved]   = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [mailSent,setMailSent]= useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const timerRef = useRef(null);

  useEffect(()=>{
    const d = loadData();
    if(d) setData(d);
    // Affiche le bandeau uniquement à la première visite (jamais vu)
    const seen = localStorage.getItem("hotel-onboarding-banner-seen");
    if(!seen) setShowBanner(true);
    setLoaded(true);
  },[]);

  const dismissBanner = () => {
    localStorage.setItem("hotel-onboarding-banner-seen","1");
    setShowBanner(false);
  };

  useEffect(()=>{
    if(!loaded) return;
    if(timerRef.current) clearTimeout(timerRef.current);
    timerRef.current=setTimeout(()=>{ saveData(data); setSaved(true); setTimeout(()=>setSaved(false),2000); },800);
  },[data,loaded]);

  const handleSendMail = () => {
    // 1. Télécharge le fichier Excel
    exportExcel(data);
    // 2. Ouvre le client mail avec le contexte
    setTimeout(()=>{
      const ens = (data.entites||[{}])[0].enseigne || "Nouvel établissement";
      const subject = encodeURIComponent(`Onboarding Hôtelier — ${ens}`);
      const body = encodeURIComponent(
        `Bonjour Océane,\n\nVeuillez trouver en pièce jointe le fichier Excel d'onboarding de l'établissement : ${ens}\n\n⚠️ Le fichier "Onboarding_Hotel.xlsx" vient d'être téléchargé sur votre appareil — pensez à l'attacher à cet email.\n\nCordialement`
      );
      window.open(`mailto:oceane.habonneau@gmail.com?subject=${subject}&body=${body}`,"_self");
      setMailSent(true);
      setTimeout(()=>setMailSent(false),4000);
    },300);
  };

  const progress = calcProgress(data);
  const done     = calcStepDone(data);
  const SECTIONS = [
    <SectionIdentity   data={data} setData={setData}/>,
    <SectionChambres   data={data} setData={setData}/>,
    <SectionTarifs     data={data} setData={setData}/>,
    <SectionExtras     data={data} setData={setData}/>,
    <SectionPricing365 data={data} setData={setData}/>,
    <SectionRestaurant data={data} setData={setData}/>,
  ];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:T.font, color:T.textPrim }}>

      {/* NAVBAR */}
      <nav style={{ background:T.bgNav, borderBottom:"1px solid #e5e7eb", padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:200, boxShadow:"0 1px 3px rgba(0,0,0,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>🏨</span>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:"#1a2332", fontFamily:T.font }}>Océane Habonneau</div>
            <div style={{ fontSize:11, color:"#94a3b8", fontFamily:T.font }}>Une Tech invisible pour une exploitation fluide.</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <a href="https://oceane-habonneau.github.io/EcosT-v2/#ecosystem" target="_blank" rel="noreferrer"
            style={{ fontSize:13, color:"#64748b", fontFamily:T.font, textDecoration:"none" }}>🔗 Écosystème</a>
          <a href="https://oceane-habonneau.github.io/EcosT-v2/#services" target="_blank" rel="noreferrer"
            style={{ fontSize:13, color:"#64748b", fontFamily:T.font, textDecoration:"none" }}>🔧 Services</a>
          <span style={{ fontSize:13, fontWeight:600, color:"#1a2332", borderBottom:"2px solid #f59e0b", paddingBottom:2, fontFamily:T.font }}>📋 Onboarding</span>
          {saved&&<span style={{ fontSize:12, color:T.green, fontWeight:600 }}>✓ Sauvegardé</span>}
          {mailSent&&(
            <span style={{ fontSize:12, color:T.blue, fontWeight:600, background:T.blueDim, border:`1px solid ${T.blue}44`, borderRadius:6, padding:"3px 10px" }}>
              📎 Fichier téléchargé — attachez-le à l'email !
            </span>
          )}
          <button type="button" onClick={handleSendMail} style={{ background:T.blue, color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:T.font, display:"flex", alignItems:"center", gap:5 }}>
            ✉️ Envoyer par mail
          </button>
          <button type="button" onClick={()=>exportExcel(data)} style={{ background:T.amber, color:"#1a2332", border:"none", borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:T.font, display:"flex", alignItems:"center", gap:5 }}>
            ⬇ Export Excel
          </button>
        </div>
      </nav>

      {/* BANDEAU PREMIÈRE VISITE */}
      {showBanner&&(
        <div style={{ background:"linear-gradient(135deg,#1e3a5f,#1a2332)", borderBottom:`1px solid ${T.blue}44`, padding:"14px 32px" }}>
          <div style={{ maxWidth:1140, margin:"0 auto", display:"flex", alignItems:"flex-start", gap:14 }}>
            <div style={{ fontSize:22, flexShrink:0 }}>💾</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:700, color:T.textPrim, margin:"0 0 4px", fontFamily:T.font }}>
                Vos données sont sauvegardées automatiquement sur cet appareil
              </p>
              <p style={{ fontSize:12, color:T.textSec, margin:0, fontFamily:T.font, lineHeight:1.6 }}>
                Vous pouvez fermer cet onglet ou votre navigateur et reprendre plus tard — votre progression sera intégralement restaurée.
                <strong style={{ color:T.amber }}> Important :</strong> utilisez toujours le même navigateur sur le même appareil, et n'effacez pas le cache avant d'avoir exporté votre fichier Excel.
                La navigation privée ne permet pas la sauvegarde.
              </p>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
              <span style={{ fontSize:11, color:T.textMuted, fontFamily:T.font }}>Ce message ne s'affichera plus</span>
              <button type="button" onClick={dismissBanner} style={{ background:T.green, color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:T.font, whiteSpace:"nowrap" }}>
                J'ai compris ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO HEADER */}
      <div style={{ background:"linear-gradient(135deg, #0f1623 0%, #1a2332 100%)", borderBottom:`1px solid ${T.border}`, padding:"28px 32px" }}>
        <div style={{ maxWidth:1140, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, color:T.textPrim, margin:"0 0 4px", fontFamily:T.font }}>Onboarding Hôtelier</h1>
              <p style={{ fontSize:14, color:T.textSec, margin:0, fontFamily:T.font }}>
                {(data.entites||[{}])[0].enseigne||"Mon établissement"} — Renseignez les informations de votre établissement
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:28, fontWeight:800, color:progress===100?T.green:T.amber, fontFamily:T.font, lineHeight:1 }}>{progress}%</div>
                <div style={{ fontSize:11, color:T.textSec, fontFamily:T.font }}>complété</div>
              </div>
              <div style={{ width:100, height:6, background:"rgba(255,255,255,0.06)", borderRadius:3 }}>
                <div style={{ width:`${progress}%`, height:"100%", background:progress===100?T.green:T.amber, borderRadius:3, transition:"width .4s" }}/>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, marginTop:20, flexWrap:"wrap" }}>
            {STEPS.map((s,i)=>{
              const isActive=step===i, isDone=done[i];
              return (
                <button key={s.id} type="button" onClick={()=>setStep(i)} style={{
                  display:"flex", alignItems:"center", gap:7, padding:"7px 14px", borderRadius:8,
                  border:`1px solid ${isActive?T.green:isDone?T.green+"44":T.border}`,
                  background:isActive?T.greenDim:isDone?"rgba(16,185,129,0.06)":"rgba(255,255,255,0.03)",
                  color:isActive?T.green:isDone?T.green+"cc":T.textSec,
                  cursor:"pointer", fontFamily:T.font, fontSize:13, fontWeight:isActive?700:500, transition:"all .15s"
                }}>
                  <span style={{ fontSize:15 }}>{s.icon}</span>
                  <span>{s.label}</span>
                  {isDone&&!isActive&&<span style={{ color:T.green, fontSize:11 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div style={{ background:"#f8fafc" }}>
        <div style={{ maxWidth:1140, margin:"0 auto", padding:"28px 32px 80px", display:"grid", gridTemplateColumns:"220px 1fr", gap:24 }}>

          {/* Sidebar */}
          <div>
            <div style={{ position:"sticky", top:88 }}>
              <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
                {STEPS.map((s,i)=>{
                  const isActive=step===i, isDone=done[i];
                  return (
                    <button key={s.id} type="button" onClick={()=>setStep(i)} style={{
                      width:"100%", display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
                      border:"none", borderBottom:`1px solid ${T.border}`,
                      background:isActive?T.greenDim:"transparent",
                      color:isActive?T.green:isDone?T.textPrim:T.textSec,
                      cursor:"pointer", fontFamily:T.font, textAlign:"left", transition:"all .15s",
                      borderLeft:isActive?`3px solid ${T.green}`:"3px solid transparent"
                    }}>
                      <span style={{ fontSize:16 }}>{s.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:isActive?700:500 }}>{s.label}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{s.desc}</div>
                      </div>
                      {isDone&&<span style={{ color:T.green, fontSize:11, background:T.greenDim, borderRadius:10, padding:"1px 6px" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:12, padding:14, marginTop:12 }}>
                <p style={{ fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px" }}>Résumé</p>
                {[
                  ["🛏️",`${data.chambres.length} catégorie${data.chambres.length!==1?"s":""}`],
                  ["💶",`${data.tarifs.length} tarif${data.tarifs.length!==1?"s":""}`],
                  ["🧾",`${data.extras.length} extra${data.extras.length!==1?"s":""}`],
                  ["📅",`${data.cales.length} cale${data.cales.length!==1?"s":""}`],
                  ["🍽️",`${(data.restaurant?.articles||[]).length} article${(data.restaurant?.articles||[]).length!==1?"s":""}`],
                ].map(([icon,label])=>(
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0" }}>
                    <span style={{ fontSize:13 }}>{icon}</span>
                    <span style={{ fontSize:12, color:T.textSec, fontFamily:T.font }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            {SECTIONS[step]}
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:28, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
              <div>{step>0&&<Btn onClick={()=>setStep(s=>s-1)} variant="ghost" icon="←">Précédent</Btn>}</div>
              <div>
                {step<STEPS.length-1&&<Btn onClick={()=>setStep(s=>s+1)} variant="primary" icon="→">Suivant</Btn>}
                {step===STEPS.length-1&&<Btn onClick={()=>exportExcel(data)} variant="amber" icon="⬇">Exporter en Excel</Btn>}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background:"#f8fafc", borderTop:"1px solid #e2e8f0", padding:"32px 32px 28px" }}>
        <div style={{ maxWidth:1140, margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
            <a href="https://www.linkedin.com/in/oc%C3%A9ane-habonneau-5a908212a/" target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#0077b5,#005885)", color:"#fff", borderRadius:50, padding:"11px 22px", fontSize:13, fontWeight:700, textDecoration:"none", fontFamily:T.font, boxShadow:"0 2px 8px rgba(0,119,181,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
            <a href="mailto:oceane.habonneau@gmail.com" style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#7c3aed,#a855f7)", color:"#fff", borderRadius:50, padding:"11px 22px", fontSize:13, fontWeight:700, textDecoration:"none", fontFamily:T.font, boxShadow:"0 2px 8px rgba(124,58,237,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
              Me contacter
            </a>
            <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1apBv9IYJGniaFq5RU2bMFfhTuMFvXT94HeLgx9EZZthTtyGl4NARzqYB9SfiTb4hB-Q-cIqWW" target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#fff", borderRadius:50, padding:"11px 22px", fontSize:13, fontWeight:700, textDecoration:"none", fontFamily:T.font, boxShadow:"0 2px 8px rgba(245,158,11,0.3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Prendre RDV
            </a>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8, padding:"8px 16px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ fontSize:12, color:"#10b981", fontFamily:T.font, fontWeight:600 }}>Données 100% privées — stockées uniquement sur votre appareil, jamais transmises à un serveur.</span>
          </div>
          <p style={{ fontSize:12, color:"#94a3b8", margin:0, fontFamily:T.font, textAlign:"center" }}>
            © 2026 Océane Habonneau – Architecte HotelTech – Tous droits réservés
          </p>
        </div>
      </footer>

    </div>
  );
}
