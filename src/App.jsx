import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

const STORAGE_KEY = "hotel-onboarding-v1";
function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}
function loadData() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : null;
  } catch { return null; }
}

const INIT = {
  identity: {
    nomJuridique:"", enseigne:"", siret:"", tva:"", adresse:"", lat:"", lng:"",
    mailContact:"", mailFacturation:"", tel:"", horaires:"", iban:"", bic:"",
    typeEtablissement:"Hôtel", logiciels:"PMS",
    bookingId:"", expediaId:"", airbnbId:"", lienDrive:""
  },
  chambres: [], tarifs: [], extras: [], pricing365: {}
};

const TYPE_ETABLISSEMENT = ["Hôtel","Appart-hôtel","Gîte","Chambre d'hôtes","Autre"];
const LOGICIELS = ["PMS","Channel Manager","PMS + CM","Aucun"];
const CONFIG_LITS = ["Double","Twin","King Size","Simple","Modulable"];
const SALLE_EAU = ["Baignoire","Douche","Les deux","Cabine de douche italienne"];
const TYPE_TARIF = ["Base","Dérivé","Promotion","Early Bird","Last Minute","Groupe"];
const REPAS = ["Aucun","Petit-déjeuner","Demi-pension","Pension complète","All Inclusive"];
const ANNULATION = ["Non-remboursable","Flexible J-1","Flexible J-3","Flexible J-7","Flexible J-14"];
const MAPPING = ["Direct uniquement","OTA uniquement","Tous canaux","Sélection manuelle"];
const RESTRICTIONS = ["Aucune","Min Stay 2 nuits","Min Stay 3 nuits","CTA","CTD","Max Stay 7 nuits"];
const TVA = ["20%","10%","5.5%","2.1%","0%"];
const VENTILATION = ["Par Pax/Nuit","Par Pax/Séjour","Par Chambre/Nuit","Par Chambre/Séjour","Forfait unique"];
const SAISONS = ["Basse saison","Moyenne saison","Haute saison","Très haute saison","Événement","Week-end","Jours fériés"];
const SAISON_COLORS = {
  "Basse saison":"#dbeafe","Moyenne saison":"#d1fae5","Haute saison":"#fef3c7",
  "Très haute saison":"#fee2e2","Événement":"#ede9fe","Week-end":"#fce7f3","Jours fériés":"#ffedd5",
};
const SAISON_TEXT = {
  "Basse saison":"#1e40af","Moyenne saison":"#065f46","Haute saison":"#92400e",
  "Très haute saison":"#991b1b","Événement":"#5b21b6","Week-end":"#9d174d","Jours fériés":"#9a3412",
};
const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MONTH_DAYS = [31,28,31,30,31,30,31,31,30,31,30,31];
const STEPS = [
  { id:"identity", icon:"🏢", label:"Identité" },
  { id:"chambres", icon:"🛏️", label:"Chambres" },
  { id:"tarifs",   icon:"💶", label:"Tarification" },
  { id:"extras",   icon:"🧾", label:"Extras & Taxes" },
  { id:"pricing365",icon:"📅",label:"Cale Tarifaire" },
];

const Field = ({ label, children, required }) => (
  <div style={{display:"flex",flexDirection:"column",gap:4}}>
    <label style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94877a"}}>
      {label}{required&&<span style={{color:"#c0392b",marginLeft:3}}>*</span>}
    </label>
    {children}
  </div>
);
const Input = ({ value, onChange, placeholder, type="text" }) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{background:"#faf8f6",border:"1.5px solid #e8e0d8",borderRadius:8,padding:"9px 12px",
      fontSize:13,color:"#2c2520",outline:"none",fontFamily:"inherit",transition:"border-color .15s"}}
    onFocus={e=>e.target.style.borderColor="#8b7355"}
    onBlur={e=>e.target.style.borderColor="#e8e0d8"} />
);
const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={e=>onChange(e.target.value)}
    style={{background:"#faf8f6",border:"1.5px solid #e8e0d8",borderRadius:8,padding:"9px 12px",
      fontSize:13,color:"#2c2520",outline:"none",fontFamily:"inherit",appearance:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%238b7355' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",cursor:"pointer"}}
    onFocus={e=>e.target.style.borderColor="#8b7355"}
    onBlur={e=>e.target.style.borderColor="#e8e0d8"}>
    {options.map(o=><option key={o} value={o}>{o}</option>)}
  </select>
);
const Toggle = ({ value, onChange }) => (
  <div style={{display:"flex",gap:6}}>
    {["OUI","NON"].map(v=>(
      <button key={v} onClick={()=>onChange(v)}
        style={{padding:"6px 14px",borderRadius:6,border:"1.5px solid",fontSize:12,fontWeight:600,
          cursor:"pointer",transition:"all .15s",fontFamily:"inherit",
          background:value===v?(v==="OUI"?"#2d6a4f":"#c0392b"):"#faf8f6",
          borderColor:value===v?(v==="OUI"?"#2d6a4f":"#c0392b"):"#e8e0d8",
          color:value===v?"#fff":"#94877a"}}>{v}</button>
    ))}
  </div>
);
const Btn = ({ onClick, children, variant="primary", small }) => {
  const styles = {
    primary:{background:"#8b7355",color:"#fff",border:"none"},
    secondary:{background:"transparent",color:"#8b7355",border:"1.5px solid #8b7355"},
    danger:{background:"transparent",color:"#c0392b",border:"1.5px solid #e8e0d8"},
  };
  return (
    <button onClick={onClick}
      style={{...styles[variant],borderRadius:8,padding:small?"6px 14px":"10px 22px",
        fontSize:small?12:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"opacity .15s"}}
      onMouseEnter={e=>e.target.style.opacity=".8"}
      onMouseLeave={e=>e.target.style.opacity="1"}>{children}</button>
  );
};
const Grid2 = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{children}</div>;
const Card = ({children}) => <div style={{background:"#faf8f6",border:"1px solid #e8e0d8",borderRadius:12,padding:16}}>{children}</div>;
const Divider = ({label}) => (
  <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
    <div style={{flex:1,height:1,background:"#e8e0d8"}}/>
    <span style={{fontSize:11,fontWeight:700,color:"#b0a090",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</span>
    <div style={{flex:1,height:1,background:"#e8e0d8"}}/>
  </div>
);
const SectionTitle = ({icon,title,subtitle}) => (
  <div>
    <h2 style={{fontSize:20,fontWeight:800,color:"#2c2520",margin:0,display:"flex",alignItems:"center",gap:8}}>
      <span>{icon}</span>{title}
    </h2>
    {subtitle&&<p style={{fontSize:13,color:"#94877a",margin:"4px 0 0"}}>{subtitle}</p>}
  </div>
);

function SectionIdentity({ data, setData }) {
  const u = (k,v) => setData(p=>({...p,identity:{...p.identity,[k]:v}}));
  const d = data.identity;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <SectionTitle icon="🏢" title="Identité juridique & commerciale" />
      <Grid2>
        <Field label="Nom juridique" required><Input value={d.nomJuridique} onChange={v=>u("nomJuridique",v)} placeholder="SAS HOTEL LE RIVAGE"/></Field>
        <Field label="Enseigne commerciale" required><Input value={d.enseigne} onChange={v=>u("enseigne",v)} placeholder="Hôtel Le Rivage"/></Field>
        <Field label="SIRET / KBIS"><Input value={d.siret} onChange={v=>u("siret",v)} placeholder="12345678900012"/></Field>
        <Field label="N° TVA"><Input value={d.tva} onChange={v=>u("tva",v)} placeholder="FR12345678900"/></Field>
        <Field label="Type d'établissement"><Select value={d.typeEtablissement} onChange={v=>u("typeEtablissement",v)} options={TYPE_ETABLISSEMENT}/></Field>
        <Field label="Logiciels possédés"><Select value={d.logiciels} onChange={v=>u("logiciels",v)} options={LOGICIELS}/></Field>
      </Grid2>
      <Divider label="Coordonnées" />
      <Grid2>
        <Field label="Adresse complète" required><Input value={d.adresse} onChange={v=>u("adresse",v)} placeholder="12 Rue du Port, 75001 Paris"/></Field>
        <Field label="Téléphone"><Input value={d.tel} onChange={v=>u("tel",v)} placeholder="+33 1 23 45 67 89"/></Field>
        <Field label="Mail contact" required><Input value={d.mailContact} onChange={v=>u("mailContact",v)} placeholder="contact@hotel.fr"/></Field>
        <Field label="Mail facturation"><Input value={d.mailFacturation} onChange={v=>u("mailFacturation",v)} placeholder="facturation@hotel.fr"/></Field>
        <Field label="Latitude"><Input value={d.lat} onChange={v=>u("lat",v)} placeholder="48.8566"/></Field>
        <Field label="Longitude"><Input value={d.lng} onChange={v=>u("lng",v)} placeholder="2.3522"/></Field>
        <Field label="Horaires réception"><Input value={d.horaires} onChange={v=>u("horaires",v)} placeholder="7h–23h"/></Field>
      </Grid2>
      <Divider label="Bancaire & OTA" />
      <Grid2>
        <Field label="IBAN"><Input value={d.iban} onChange={v=>u("iban",v)} placeholder="FR76 3000 1007 9412 3456 7890 185"/></Field>
        <Field label="BIC / SWIFT"><Input value={d.bic} onChange={v=>u("bic",v)} placeholder="BNPAFRPP"/></Field>
        <Field label="Booking.com ID"><Input value={d.bookingId} onChange={v=>u("bookingId",v)} placeholder="123456789"/></Field>
        <Field label="Expedia ID"><Input value={d.expediaId} onChange={v=>u("expediaId",v)} placeholder="987654321"/></Field>
        <Field label="Airbnb ID"><Input value={d.airbnbId} onChange={v=>u("airbnbId",v)} placeholder="98765.XYZ"/></Field>
        <Field label="Lien Drive"><Input value={d.lienDrive} onChange={v=>u("lienDrive",v)} placeholder="https://drive.google.com/..."/></Field>
      </Grid2>
    </div>
  );
}

function SectionChambres({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const empty = {nom:"",code:"",nbUnites:1,capaStd:2,capaMax:3,adultesMax:2,enfantsMax:1,surface:20,configLits:"Double",salleEau:"Douche",descriptif:"",clim:"NON",coffreFort:"NON",minibar:"NON",wifi:"OUI",bureau:"NON",balcon:"NON"};
  const [form, setForm] = useState(empty);
  const u = (k,v) => setForm(p=>({...p,[k]:v}));
  const save = () => {
    if (!form.nom.trim()) return;
    const list = [...data.chambres];
    if (editing!==null) list[editing]=form; else list.push({...form});
    setData(p=>({...p,chambres:list}));
    setForm(empty); setEditing(null);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <SectionTitle icon="🛏️" title="Inventaire des chambres" />
      {data.chambres.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {data.chambres.map((c,i)=>(
            <Card key={i}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:700,color:"#2c2520",fontSize:14}}>{c.nom}</span>
                  <span style={{marginLeft:10,background:"#f0ebe4",color:"#8b7355",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{c.code}</span>
                  <span style={{marginLeft:8,color:"#94877a",fontSize:12}}>{c.nbUnites} unité{c.nbUnites>1?"s":""} · {c.surface}m² · {c.configLits}</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Btn onClick={()=>{setForm(data.chambres[i]);setEditing(i);}} variant="secondary" small>Modifier</Btn>
                  <Btn onClick={()=>setData(p=>({...p,chambres:p.chambres.filter((_,idx)=>idx!==i)}))} variant="danger" small>✕</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <p style={{fontSize:12,fontWeight:700,color:"#8b7355",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>
          {editing!==null?"✏️ Modifier la catégorie":"+ Nouvelle catégorie"}
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Grid2>
            <Field label="Nom catégorie" required><Input value={form.nom} onChange={v=>u("nom",v)} placeholder="Chambre Double Standard"/></Field>
            <Field label="Code court"><Input value={form.code} onChange={v=>u("code",v.toUpperCase())} placeholder="DBL"/></Field>
            <Field label="Nb unités"><Input type="number" value={form.nbUnites} onChange={v=>u("nbUnites",+v)}/></Field>
            <Field label="Surface (m²)"><Input type="number" value={form.surface} onChange={v=>u("surface",+v)}/></Field>
            <Field label="Config. lits"><Select value={form.configLits} onChange={v=>u("configLits",v)} options={CONFIG_LITS}/></Field>
            <Field label="Salle d'eau"><Select value={form.salleEau} onChange={v=>u("salleEau",v)} options={SALLE_EAU}/></Field>
            <Field label="Capa. standard"><Input type="number" value={form.capaStd} onChange={v=>u("capaStd",+v)}/></Field>
            <Field label="Capa. max"><Input type="number" value={form.capaMax} onChange={v=>u("capaMax",+v)}/></Field>
            <Field label="Adultes max"><Input type="number" value={form.adultesMax} onChange={v=>u("adultesMax",+v)}/></Field>
            <Field label="Enfants max"><Input type="number" value={form.enfantsMax} onChange={v=>u("enfantsMax",+v)}/></Field>
          </Grid2>
          <Field label="Descriptif commercial">
            <textarea value={form.descriptif} onChange={e=>u("descriptif",e.target.value)} placeholder="Chambre élégante avec vue sur le jardin..."
              style={{background:"#faf8f6",border:"1.5px solid #e8e0d8",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#2c2520",resize:"vertical",minHeight:70,fontFamily:"inherit",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#8b7355"} onBlur={e=>e.target.style.borderColor="#e8e0d8"}/>
          </Field>
          <div>
            <label style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94877a",display:"block",marginBottom:10}}>Équipements</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[["clim","Clim"],["coffreFort","Coffre-fort"],["minibar","Minibar"],["wifi","Wifi"],["bureau","Bureau"],["balcon","Balcon/Terrasse"]].map(([k,l])=>(
                <div key={k}>
                  <label style={{fontSize:11,color:"#94877a",display:"block",marginBottom:4}}>{l}</label>
                  <Toggle value={form[k]} onChange={v=>u(k,v)}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={save}>{editing!==null?"Enregistrer":"Ajouter la catégorie"}</Btn>
            {editing!==null&&<Btn onClick={()=>{setForm(empty);setEditing(null);}} variant="secondary">Annuler</Btn>}
          </div>
        </div>
      </Card>
    </div>
  );
}

function SectionTarifs({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const empty = {nom:"",type:"Base",descriptif:"",baseCalc:"",prixBase:"",repas:"Aucun",annulation:"Flexible J-3",mapping:"Tous canaux",restrictions:"Aucune",codesComptables:""};
  const [form, setForm] = useState(empty);
  const u = (k,v) => setForm(p=>({...p,[k]:v}));
  const save = () => {
    if (!form.nom.trim()) return;
    const list = [...data.tarifs];
    if (editing!==null) list[editing]=form; else list.push({...form});
    setData(p=>({...p,tarifs:list}));
    setForm(empty); setEditing(null);
  };
  const TC = {"Base":"#dbeafe","Dérivé":"#d1fae5","Promotion":"#fee2e2","Early Bird":"#ede9fe","Last Minute":"#fce7f3","Groupe":"#fef3c7"};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <SectionTitle icon="💶" title="Stratégie tarifaire" />
      {data.tarifs.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {data.tarifs.map((t,i)=>(
            <Card key={i}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,color:"#2c2520",fontSize:14}}>{t.nom}</span>
                  <span style={{background:TC[t.type]||"#f0ebe4",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,color:"#555"}}>{t.type}</span>
                  {t.prixBase&&<span style={{color:"#2d6a4f",fontWeight:700,fontSize:13}}>{t.prixBase}€</span>}
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Btn onClick={()=>{setForm(data.tarifs[i]);setEditing(i);}} variant="secondary" small>Modifier</Btn>
                  <Btn onClick={()=>setData(p=>({...p,tarifs:p.tarifs.filter((_,idx)=>idx!==i)}))} variant="danger" small>✕</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <p style={{fontSize:12,fontWeight:700,color:"#8b7355",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>
          {editing!==null?"✏️ Modifier le tarif":"+ Nouveau tarif"}
        </p>
        <Grid2>
          <Field label="Nom du tarif" required><Input value={form.nom} onChange={v=>u("nom",v)} placeholder="BAR Standard"/></Field>
          <Field label="Type de tarif"><Select value={form.type} onChange={v=>u("type",v)} options={TYPE_TARIF}/></Field>
          <Field label="Prix de base (€)"><Input type="number" value={form.prixBase} onChange={v=>u("prixBase",v)} placeholder="110"/></Field>
          <Field label="Base de calcul"><Input value={form.baseCalc} onChange={v=>u("baseCalc",v)} placeholder="ex: BAR -10%"/></Field>
          <Field label="Repas inclus"><Select value={form.repas} onChange={v=>u("repas",v)} options={REPAS}/></Field>
          <Field label="Conditions d'annulation"><Select value={form.annulation} onChange={v=>u("annulation",v)} options={ANNULATION}/></Field>
          <Field label="Mapping canal"><Select value={form.mapping} onChange={v=>u("mapping",v)} options={MAPPING}/></Field>
          <Field label="Restrictions"><Select value={form.restrictions} onChange={v=>u("restrictions",v)} options={RESTRICTIONS}/></Field>
          <Field label="Codes comptables"><Input value={form.codesComptables} onChange={v=>u("codesComptables",v)} placeholder="701000"/></Field>
        </Grid2>
        <div style={{marginTop:14}}>
          <Field label="Descriptif">
            <textarea value={form.descriptif} onChange={e=>u("descriptif",e.target.value)} placeholder="Tarif public affiché sur tous les canaux..."
              style={{background:"#faf8f6",border:"1.5px solid #e8e0d8",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#2c2520",resize:"vertical",minHeight:60,fontFamily:"inherit",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#8b7355"} onBlur={e=>e.target.style.borderColor="#e8e0d8"}/>
          </Field>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <Btn onClick={save}>{editing!==null?"Enregistrer":"Ajouter le tarif"}</Btn>
          {editing!==null&&<Btn onClick={()=>{setForm(empty);setEditing(null);}} variant="secondary">Annuler</Btn>}
        </div>
      </Card>
    </div>
  );
}

function SectionExtras({ data, setData }) {
  const [editing, setEditing] = useState(null);
  const empty = {nom:"",prixTTC:"",tva:"10%",taxeSejour:"",ventilation:"Par Pax/Nuit",codeComptable:"",notes:""};
  const [form, setForm] = useState(empty);
  const u = (k,v) => setForm(p=>({...p,[k]:v}));
  const save = () => {
    if (!form.nom.trim()) return;
    const list = [...data.extras];
    if (editing!==null) list[editing]=form; else list.push({...form});
    setData(p=>({...p,extras:list}));
    setForm(empty); setEditing(null);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <SectionTitle icon="🧾" title="Extras, taxes & comptabilité" />
      {data.extras.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {data.extras.map((e,i)=>(
            <Card key={i}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontWeight:700,color:"#2c2520",fontSize:14}}>{e.nom}</span>
                  <span style={{color:"#2d6a4f",fontWeight:700,fontSize:13}}>{e.prixTTC}€ TTC</span>
                  <span style={{background:"#f0ebe4",color:"#8b7355",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>TVA {e.tva}</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <Btn onClick={()=>{setForm(data.extras[i]);setEditing(i);}} variant="secondary" small>Modifier</Btn>
                  <Btn onClick={()=>setData(p=>({...p,extras:p.extras.filter((_,idx)=>idx!==i)}))} variant="danger" small>✕</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card>
        <p style={{fontSize:12,fontWeight:700,color:"#8b7355",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>
          {editing!==null?"✏️ Modifier l'extra":"+ Nouvel extra / service"}
        </p>
        <Grid2>
          <Field label="Nom du service" required><Input value={form.nom} onChange={v=>u("nom",v)} placeholder="Petit-déjeuner continental"/></Field>
          <Field label="Prix TTC (€)"><Input type="number" value={form.prixTTC} onChange={v=>u("prixTTC",v)} placeholder="18"/></Field>
          <Field label="Taux TVA"><Select value={form.tva} onChange={v=>u("tva",v)} options={TVA}/></Field>
          <Field label="Taxe de séjour (€/pers/nuit)"><Input type="number" value={form.taxeSejour} onChange={v=>u("taxeSejour",v)} placeholder="1.50"/></Field>
          <Field label="Ventilation taxe"><Select value={form.ventilation} onChange={v=>u("ventilation",v)} options={VENTILATION}/></Field>
          <Field label="Code comptable"><Input value={form.codeComptable} onChange={v=>u("codeComptable",v)} placeholder="707010"/></Field>
        </Grid2>
        <div style={{marginTop:14}}>
          <Field label="Notes">
            <textarea value={form.notes} onChange={e=>u("notes",e.target.value)} placeholder="Remarques, conditions d'application..."
              style={{background:"#faf8f6",border:"1.5px solid #e8e0d8",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#2c2520",resize:"vertical",minHeight:60,fontFamily:"inherit",outline:"none"}}
              onFocus={e=>e.target.style.borderColor="#8b7355"} onBlur={e=>e.target.style.borderColor="#e8e0d8"}/>
          </Field>
        </div>
        <div style={{display:"flex",gap:8,marginTop:14}}>
          <Btn onClick={save}>{editing!==null?"Enregistrer":"Ajouter l'extra"}</Btn>
          {editing!==null&&<Btn onClick={()=>{setForm(empty);setEditing(null);}} variant="secondary">Annuler</Btn>}
        </div>
      </Card>
    </div>
  );
}

function SectionPricing365({ data, setData }) {
  const [activeSaison, setActiveSaison] = useState(SAISONS[0]);
  const [activeTarif, setActiveTarif] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const year = 2025;
  const getDay = (mi,d) => `${year}-${String(mi+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const assignDay = (mi,d) => {
    const key = getDay(mi,d);
    setData(p=>{
      const p365={...p.pricing365};
      if (p365[key]?.saison===activeSaison) delete p365[key];
      else p365[key]={saison:activeSaison,prix:activeTarif||""};
      return {...p,pricing365:p365};
    });
  };
  const counts = {};
  SAISONS.forEach(s=>counts[s]=0);
  Object.values(data.pricing365).forEach(v=>{if(counts[v.saison]!==undefined)counts[v.saison]++;});
  const total = Object.keys(data.pricing365).length;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}} onMouseUp={()=>setSelecting(false)}>
      <SectionTitle icon="📅" title="Cale tarifaire 365 jours" subtitle="Cliquez ou glissez pour affecter une saison à chaque journée"/>
      <Card>
        <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div>
            <label style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94877a",display:"block",marginBottom:8}}>Saison à appliquer</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {SAISONS.map(s=>(
                <button key={s} onClick={()=>setActiveSaison(s)}
                  style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
                    border:`2px solid ${activeSaison===s?"#8b7355":"transparent"}`,
                    background:SAISON_COLORS[s],color:SAISON_TEXT[s],fontFamily:"inherit"}}>
                  {s} <span style={{opacity:.6,fontSize:10}}>({counts[s]}j)</span>
                </button>
              ))}
            </div>
          </div>
          {data.tarifs.length>0&&(
            <div>
              <label style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94877a",display:"block",marginBottom:8}}>Tarif associé</label>
              <select value={activeTarif||""} onChange={e=>setActiveTarif(e.target.value||null)}
                style={{background:"#faf8f6",border:"1.5px solid #e8e0d8",borderRadius:8,padding:"6px 12px",fontSize:12,fontFamily:"inherit",outline:"none",color:"#2c2520"}}>
                <option value="">— Aucun —</option>
                {data.tarifs.map(t=><option key={t.nom} value={t.nom}>{t.nom}</option>)}
              </select>
            </div>
          )}
          <div style={{marginLeft:"auto",textAlign:"right"}}>
            <div style={{fontSize:28,fontWeight:800,color:"#8b7355"}}>{total}</div>
            <div style={{fontSize:11,color:"#94877a"}}>jours assignés</div>
            <div style={{fontSize:10,color:"#b0a090"}}>{365-total} restants</div>
          </div>
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {MONTHS.map((month,mi)=>(
          <div key={mi} style={{background:"#fff",border:"1px solid #e8e0d8",borderRadius:12,padding:12,userSelect:"none"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#8b7355",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8,textAlign:"center"}}>{month}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {Array.from({length:MONTH_DAYS[mi]},(_,di)=>{
                const key=getDay(mi,di+1);
                const assigned=data.pricing365[key];
                return (
                  <div key={di}
                    onMouseDown={()=>{setSelecting(true);assignDay(mi,di+1);}}
                    onMouseEnter={()=>{if(selecting)assignDay(mi,di+1);}}
                    title={assigned?`${di+1} ${month}: ${assigned.saison}`:`${di+1} ${month}`}
                    style={{width:"100%",aspectRatio:"1",borderRadius:3,cursor:"crosshair",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:9,fontWeight:assigned?700:400,
                      background:assigned?SAISON_COLORS[assigned.saison]:"#f9f6f2",
                      color:assigned?SAISON_TEXT[assigned.saison]:"#c4b8ac"}}>
                    {di+1}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
        {SAISONS.map(s=>(
          <div key={s} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:12,height:12,borderRadius:3,background:SAISON_COLORS[s]}}/>
            <span style={{fontSize:11,color:"#94877a"}}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function exportExcel(data) {
  const wb = XLSX.utils.book_new();
  const HF = {bold:true,color:{rgb:"FFFFFF"},sz:11,name:"Arial"};
  const HFill = {patternType:"solid",fgColor:{rgb:"1F4E79"}};
  const BD = {top:{style:"thin",color:{rgb:"BFBFBF"}},bottom:{style:"thin",color:{rgb:"BFBFBF"}},left:{style:"thin",color:{rgb:"BFBFBF"}},right:{style:"thin",color:{rgb:"BFBFBF"}}};
  const hs = (h) => ({font:h?HF:{sz:10,name:"Arial"},fill:h?HFill:undefined,border:BD,alignment:{horizontal:h?"center":"left",vertical:"center",wrapText:true}});
  const addSheet = (name,headers,rows,widths) => {
    const ws={};
    headers.forEach((v,i)=>{ws[XLSX.utils.encode_cell({r:0,c:i})]={v,t:"s",s:hs(true)};});
    rows.forEach((row,ri)=>{row.forEach((v,ci)=>{ws[XLSX.utils.encode_cell({r:ri+1,c:ci})]={v:v??"",t:typeof v==="number"?"n":"s",s:hs(false)};});});
    ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(rows.length,1),c:headers.length-1}});
    ws["!cols"]=widths.map(w=>({wch:w}));
    ws["!rows"]=[{hpt:40},...Array(rows.length).fill({hpt:25})];
    XLSX.utils.book_append_sheet(wb,ws,name);
  };
  const d=data.identity;
  addSheet("1 - Identité",["Nom Juridique","Enseigne","SIRET","N° TVA","Adresse","Lat","Lng","Mail Contact","Mail Fact.","Tél","Horaires","IBAN","BIC","Type","Logiciels","Booking ID","Expedia ID","Airbnb ID","Lien Drive"],[[d.nomJuridique,d.enseigne,d.siret,d.tva,d.adresse,d.lat,d.lng,d.mailContact,d.mailFacturation,d.tel,d.horaires,d.iban,d.bic,d.typeEtablissement,d.logiciels,d.bookingId,d.expediaId,d.airbnbId,d.lienDrive]],[22,20,18,18,28,10,10,22,22,16,14,28,12,16,10,14,14,14,28]);
  addSheet("2 - Chambres",["Nom","Code","Nb","Capa Std","Capa Max","Adultes","Enfants","Surface m²","Config Lits","Salle d'eau","Descriptif","Clim","Coffre","Minibar","Wifi","Bureau","Balcon"],data.chambres.map(c=>[c.nom,c.code,c.nbUnites,c.capaStd,c.capaMax,c.adultesMax,c.enfantsMax,c.surface,c.configLits,c.salleEau,c.descriptif,c.clim,c.coffreFort,c.minibar,c.wifi,c.bureau,c.balcon]),[24,8,6,8,8,8,8,8,14,14,34,6,8,8,6,8,14]);
  addSheet("3 - Tarification",["Nom Tarif","Type","Descriptif","Base Calcul","Prix Base €","Repas","Annulation","Mapping","Restrictions","Codes Compta"],data.tarifs.map(t=>[t.nom,t.type,t.descriptif,t.baseCalc,t.prixBase?+t.prixBase:null,t.repas,t.annulation,t.mapping,t.restrictions,t.codesComptables]),[22,12,30,14,12,14,16,16,18,14]);
  addSheet("4 - Extras & Taxes",["Nom Service","Prix TTC €","Taux TVA","Taxe Séjour €","Ventilation","Code Compta","Notes"],data.extras.map(e=>[e.nom,e.prixTTC?+e.prixTTC:null,e.tva,e.taxeSejour?+e.taxeSejour:null,e.ventilation,e.codeComptable,e.notes]),[26,12,10,14,20,14,34]);
  const entries=Object.entries(data.pricing365).sort(([a],[b])=>a.localeCompare(b));
  const ws5={};
  ["Date","Mois","Jour","Saison","Tarif"].forEach((v,i)=>{ws5[XLSX.utils.encode_cell({r:0,c:i})]={v,t:"s",s:hs(true)};});
  entries.forEach(([date,info],ri)=>{
    const [,mo,dy]=date.split("-");
    [date,MONTHS[+mo-1],+dy,info.saison,info.prix||""].forEach((v,ci)=>{ws5[XLSX.utils.encode_cell({r:ri+1,c:ci})]={v:v??"",t:typeof v==="number"?"n":"s",s:hs(false)};});
  });
  ws5["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(entries.length,1),c:4}});
  ws5["!cols"]=[14,8,6,18,20].map(w=>({wch:w}));
  ws5["!rows"]=[{hpt:40},...Array(entries.length).fill({hpt:22})];
  XLSX.utils.book_append_sheet(wb,ws5,"5 - Cale Tarifaire 365j");
  XLSX.writeFile(wb,"Onboarding_Hotel.xlsx");
}

function calcProgress(data) {
  const d=data.identity;
  const fields=[d.nomJuridique,d.enseigne,d.siret,d.mailContact,d.tel,d.adresse];
  return Math.round(((fields.filter(Boolean).length/fields.length+(data.chambres.length>0?1:0)+(data.tarifs.length>0?1:0)+(data.extras.length>0?1:0)+Math.min(Object.keys(data.pricing365).length/100,1))/5)*100);
}

export default function App() {
  const [step,setStep]=useState(0);
  const [data,setData]=useState(INIT);
  const [saved,setSaved]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const saveTimerRef=useRef(null);

  useEffect(()=>{
    const d=loadData();
    if(d)setData(d);
    setLoaded(true);
  },[]);

  useEffect(()=>{
    if(!loaded)return;
    if(saveTimerRef.current)clearTimeout(saveTimerRef.current);
    saveTimerRef.current=setTimeout(()=>{
      saveData(data);
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
    },800);
  },[data,loaded]);

  const progress=calcProgress(data);
  const SECTIONS=[
    <SectionIdentity data={data} setData={setData}/>,
    <SectionChambres data={data} setData={setData}/>,
    <SectionTarifs data={data} setData={setData}/>,
    <SectionExtras data={data} setData={setData}/>,
    <SectionPricing365 data={data} setData={setData}/>,
  ];

  return (
    <div style={{minHeight:"100vh",background:"#f4f0eb",fontFamily:"'Georgia','Times New Roman',serif"}}>
      <div style={{background:"#2c2520",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 12px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <span style={{fontSize:20}}>🏨</span>
          <div>
            <div style={{color:"#f0ebe4",fontWeight:700,fontSize:15}}>Onboarding Hôtel</div>
            <div style={{color:"#8b7355",fontSize:11,letterSpacing:"0.06em",textTransform:"uppercase"}}>{data.identity.enseigne||"Mon établissement"}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:120,height:4,background:"#4a3f36",borderRadius:2}}>
              <div style={{width:`${progress}%`,height:"100%",background:"#c9a96e",borderRadius:2,transition:"width .4s"}}/>
            </div>
            <span style={{color:"#c9a96e",fontSize:12,fontWeight:700}}>{progress}%</span>
          </div>
          {saved&&<span style={{color:"#6bba75",fontSize:12}}>✓ Sauvegardé</span>}
          <button onClick={()=>exportExcel(data)}
            style={{background:"#c9a96e",color:"#2c2520",border:"none",borderRadius:8,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}
            onMouseEnter={e=>e.target.style.opacity=".8"} onMouseLeave={e=>e.target.style.opacity="1"}>
            ⬇ Export Excel
          </button>
        </div>
      </div>
      <div style={{display:"flex",maxWidth:1100,margin:"0 auto",minHeight:"calc(100vh - 60px)"}}>
        <div style={{width:200,flexShrink:0,padding:"32px 16px",position:"sticky",top:60,height:"calc(100vh - 60px)",overflowY:"auto"}}>
          {STEPS.map((s,i)=>{
            const isActive=step===i;
            const isDone=[
              !!(data.identity.nomJuridique&&data.identity.mailContact),
              data.chambres.length>0,data.tarifs.length>0,data.extras.length>0,
              Object.keys(data.pricing365).length>0
            ][i];
            return (
              <button key={s.id} onClick={()=>setStep(i)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,border:"none",cursor:"pointer",marginBottom:4,fontFamily:"inherit",transition:"all .15s",textAlign:"left",
                  background:isActive?"#2c2520":"transparent",color:isActive?"#f0ebe4":"#8b7355"}}>
                <span style={{fontSize:16}}>{s.icon}</span>
                <div style={{flex:1,fontSize:13,fontWeight:isActive?700:500}}>{s.label}</div>
                {isDone&&!isActive&&<span style={{color:"#6bba75",fontSize:12}}>✓</span>}
                {isActive&&<div style={{width:3,height:20,background:"#c9a96e",borderRadius:2}}/>}
              </button>
            );
          })}
          {step===4&&(
            <div style={{marginTop:24,padding:12,background:"rgba(44,37,32,.06)",borderRadius:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#94877a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Légende</div>
              {SAISONS.map(s=>(
                <div key={s} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <div style={{width:10,height:10,borderRadius:2,background:SAISON_COLORS[s],flexShrink:0}}/>
                  <span style={{fontSize:10,color:"#8b7355"}}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{flex:1,padding:"32px 24px 80px",minWidth:0}}>
          {SECTIONS[step]}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:32,paddingTop:20,borderTop:"1px solid #e8e0d8"}}>
            <div>{step>0&&<Btn onClick={()=>setStep(s=>s-1)} variant="secondary">← Précédent</Btn>}</div>
            <div>
              {step<STEPS.length-1&&<Btn onClick={()=>setStep(s=>s+1)}>Suivant →</Btn>}
              {step===STEPS.length-1&&(
                <button onClick={()=>exportExcel(data)}
                  style={{background:"#c9a96e",color:"#2c2520",border:"none",borderRadius:8,padding:"10px 24px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  ⬇ Exporter en Excel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
