import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";

// ── Storage helpers (localStorage) ───────────────────────────────────────────
const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};
const load = (key, def) => {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : def;
  } catch { return def; }
};

// ── Default categories ────────────────────────────────────────────────────────
const DEFAULT_CATS = {
  expense: ["Queijo","Insumos","Farinha/Massas","Embalagens","Salários","Aluguel","Energia","Água","Gás","Manutenção","Marketing","Sistema/App","Outros"],
  income: ["Delivery","Balcão","iFood/Rappi","PIX","Cartão Débito","Cartão Crédito","Dinheiro","Outros"]
};

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTH_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split("T")[0];
const nowStr = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const parseWhatsAppMsg = (msg, categories) => {
  const lower = msg.toLowerCase();
  const isExpense = /saída|gasto|despesa|paguei|comprei|pago/.test(lower);
  const isIncome  = /entrada|venda|recebi|faturei|vendi/.test(lower);
  const type = isExpense ? "expense" : isIncome ? "income" : null;
  if (!type) return null;
  const valMatch = msg.match(/R?\$?\s*(\d{1,6}[.,]\d{2}|\d{1,6})/);
  const value = valMatch ? parseFloat(valMatch[1].replace(",", ".")) : null;
  if (!value) return null;
  const cats = categories[type] || [];
  let category = cats[cats.length - 1];
  for (const c of cats) {
    if (lower.includes(c.toLowerCase())) { category = c; break; }
  }
  const desc = msg.replace(/R?\$?\s*\d+[.,]?\d*/g, "").replace(/saída|gasto|despesa|entrada|venda|recebi|paguei|comprei/gi, "").trim() || category;
  return { type, value, category, description: desc };
};

// ══════════════════════════════════════════════════════════════════════════════
export default function PizzariaFinanceiro() {
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATS);

  useEffect(() => {
    setTransactions(load("pz:transactions", []));
    setCategories(load("pz:categories", DEFAULT_CATS));
  }, []);

  const saveTx = useCallback((tx) => {
    setTransactions(tx);
    save("pz:transactions", tx);
  }, []);

  const saveCat = useCallback((cat) => {
    setCategories(cat);
    save("pz:categories", cat);
  }, []);

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:"#0f0f0f", minHeight:"100vh", color:"#f0e6d3" }}>
      <style>{`
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#1a1a1a; }
        ::-webkit-scrollbar-thumb { background:#e05c1e; border-radius:3px; }
        .nav-btn { background:none; border:none; cursor:pointer; font-family:'Georgia',serif;
          font-size:.85rem; padding:.6rem 1rem; border-radius:6px; transition:all .2s;
          color:#8a7a6a; letter-spacing:.05em; text-transform:uppercase; }
        .nav-btn:hover { color:#f0e6d3; background:rgba(224,92,30,.15); }
        .nav-btn.active { color:#e05c1e; background:rgba(224,92,30,.12); border-left:3px solid #e05c1e; }
        .card { background:#1a1a1a; border:1px solid #2a2a2a; border-radius:12px; padding:1.25rem; }
        .kpi { background:linear-gradient(135deg,#1e1e1e,#141414); border:1px solid #2a2a2a;
          border-radius:14px; padding:1.5rem; position:relative; overflow:hidden; }
        .kpi::before { content:''; position:absolute; top:-30px; right:-30px; width:100px; height:100px;
          background:radial-gradient(circle,rgba(224,92,30,.15),transparent); border-radius:50%; }
        input, select, textarea { background:#1a1a1a; border:1px solid #2a2a2a; border-radius:8px;
          color:#f0e6d3; padding:.6rem .9rem; font-family:'Georgia',serif; font-size:.9rem;
          outline:none; transition:border .2s; width:100%; }
        input:focus, select:focus, textarea:focus { border-color:#e05c1e; }
        select option { background:#1a1a1a; }
        .btn { padding:.65rem 1.4rem; border-radius:8px; border:none; cursor:pointer;
          font-family:'Georgia',serif; font-size:.9rem; font-weight:bold; transition:all .2s; }
        .btn-primary { background:#e05c1e; color:#fff; }
        .btn-primary:hover { background:#c94d14; transform:translateY(-1px); }
        .btn-ghost { background:transparent; color:#8a7a6a; border:1px solid #2a2a2a; }
        .btn-ghost:hover { border-color:#e05c1e; color:#e05c1e; }
        .badge { display:inline-block; padding:.15rem .55rem; border-radius:20px; font-size:.72rem; font-weight:bold; }
        .badge-income { background:rgba(52,199,89,.15); color:#34c759; }
        .badge-expense { background:rgba(255,69,58,.15); color:#ff453a; }
        .tag { display:inline-block; padding:.2rem .5rem; border-radius:4px; font-size:.72rem;
          background:rgba(224,92,30,.15); color:#e05c1e; }
        .wz-msg { background:#1a2d1a; border:1px solid #2a3d2a; border-radius:10px; padding:.8rem 1rem;
          margin:.4rem 0; font-size:.85rem; position:relative; }
        .wz-msg::before { content:''; position:absolute; left:-8px; top:10px; width:0; height:0;
          border-top:6px solid transparent; border-bottom:6px solid transparent;
          border-right:8px solid #1a2d1a; }
        .section-title { font-size:1.4rem; color:#f0e6d3; margin-bottom:1.5rem;
          border-bottom:1px solid #2a2a2a; padding-bottom:.75rem; letter-spacing:.05em; }
        .table-row { border-bottom:1px solid #1e1e1e; padding:.7rem 0; display:grid;
          grid-template-columns:90px 1fr 120px 110px 90px 60px; gap:.5rem; align-items:center;
          font-size:.82rem; transition:background .15s; }
        .table-row:hover { background:rgba(255,255,255,.02); }
        .pill { padding:.2rem .6rem; border-radius:20px; font-size:.72rem; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background:"#111", borderBottom:"1px solid #1e1e1e", padding:".75rem 1.5rem",
        display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:".75rem" }}>
          <span style={{ fontSize:"1.6rem" }}>🍕</span>
          <div>
            <div style={{ fontSize:"1.05rem", fontWeight:"bold", color:"#e05c1e", letterSpacing:".08em" }}>PIZZARIA FINANÇAS</div>
            <div style={{ fontSize:".7rem", color:"#555", letterSpacing:".1em", textTransform:"uppercase" }}>Gestão Financeira Completa</div>
          </div>
        </div>
        <div style={{ fontSize:".8rem", color:"#555" }}>
          {new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        </div>
      </div>

      <div style={{ display:"flex", minHeight:"calc(100vh - 58px)" }}>
        {/* SIDEBAR */}
        <nav style={{ width:"190px", background:"#0f0f0f", borderRight:"1px solid #1a1a1a",
          padding:"1.25rem .75rem", display:"flex", flexDirection:"column", gap:".2rem",
          position:"sticky", top:"58px", height:"calc(100vh - 58px)", overflowY:"auto" }}>
          {[
            ["dashboard","📊","Dashboard"],
            ["lancamento","➕","Lançamentos"],
            ["relatorios","📈","Relatórios"],
            ["planilha","📋","Planilha"],
            ["categorias","🏷️","Categorias"],
            ["whatsapp","💬","WhatsApp Bot"],
          ].map(([id,icon,label]) => (
            <button key={id} className={`nav-btn ${tab===id?"active":""}`} onClick={() => setTab(id)}>
              {icon} {label}
            </button>
          ))}
        </nav>

        {/* CONTENT */}
        <main style={{ flex:1, padding:"1.75rem", overflowY:"auto" }}>
          {tab === "dashboard" && <Dashboard transactions={transactions} />}
          {tab === "lancamento" && <Lancamento transactions={transactions} categories={categories} onSave={saveTx} />}
          {tab === "relatorios" && <Relatorios transactions={transactions} />}
          {tab === "planilha" && <Planilha transactions={transactions} onDelete={saveTx} />}
          {tab === "categorias" && <Categorias categories={categories} onSave={saveCat} />}
          {tab === "whatsapp" && <WhatsAppBot transactions={transactions} categories={categories} onSave={saveTx} />}
        </main>
      </div>
    </div>
  );
}

// ══ DASHBOARD ════════════════════════════════════════════════════════════════
function Dashboard({ transactions }) {
  const now = new Date();
  const todayStr = today();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const todayTx = transactions.filter(t => t.date === todayStr);
  const monthTx = transactions.filter(t => { const d=new Date(t.date); return d.getMonth()===thisMonth && d.getFullYear()===thisYear; });
  const yearTx  = transactions.filter(t => new Date(t.date).getFullYear()===thisYear);

  const sum = (arr, type) => arr.filter(t=>t.type===type).reduce((a,t)=>a+t.value,0);

  const todayIn  = sum(todayTx,"income");
  const todayOut = sum(todayTx,"expense");
  const monthIn  = sum(monthTx,"income");
  const monthOut = sum(monthTx,"expense");
  const yearIn   = sum(yearTx,"income");
  const yearOut  = sum(yearTx,"expense");

  const last7 = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const ds = d.toISOString().split("T")[0];
    const txDay = transactions.filter(t=>t.date===ds);
    return { name: d.toLocaleDateString("pt-BR",{weekday:"short"}), Entradas:sum(txDay,"income"), Saídas:sum(txDay,"expense") };
  });

  const expCats = {};
  monthTx.filter(t=>t.type==="expense").forEach(t=>{ expCats[t.category]=(expCats[t.category]||0)+t.value; });
  const pieData = Object.entries(expCats).map(([name,value])=>({name,value}));
  const PIE_COLORS = ["#e05c1e","#f4a261","#e76f51","#c94d14","#fca02f","#d62828","#a8200d","#ff8c42"];

  return (
    <div>
      <div className="section-title">📊 Visão Geral</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        <KPI icon="🗓️" label="Faturamento Hoje" income={todayIn} expense={todayOut} color="#34c759" />
        <KPI icon="📅" label={`Faturamento — ${MONTH_FULL[thisMonth]}`} income={monthIn} expense={monthOut} color="#e05c1e" />
        <KPI icon="📆" label={`Faturamento — ${thisYear}`} income={yearIn} expense={yearOut} color="#f4a261" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:"1rem" }}>
        <div className="card">
          <div style={{ fontSize:".8rem", color:"#8a7a6a", marginBottom:"1rem", textTransform:"uppercase", letterSpacing:".08em" }}>Últimos 7 dias</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis dataKey="name" tick={{fill:"#666",fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"#666",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`} />
              <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:8,color:"#f0e6d3"}} formatter={v=>fmt(v)} />
              <Legend wrapperStyle={{fontSize:11,color:"#8a7a6a"}} />
              <Bar dataKey="Entradas" fill="#34c759" radius={[4,4,0,0]} />
              <Bar dataKey="Saídas"   fill="#ff453a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ fontSize:".8rem", color:"#8a7a6a", marginBottom:"1rem", textTransform:"uppercase", letterSpacing:".08em" }}>Despesas do Mês</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                  dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}
                  labelLine={false} style={{fontSize:9,fill:"#8a7a6a"}}>
                  {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:8,color:"#f0e6d3"}} formatter={v=>fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:220, display:"flex", alignItems:"center", justifyContent:"center", color:"#333", fontSize:".85rem" }}>
              Nenhuma despesa lançada este mês
            </div>
          )}
        </div>
      </div>
      <div className="card" style={{ marginTop:"1rem" }}>
        <div style={{ fontSize:".8rem", color:"#8a7a6a", marginBottom:"1rem", textTransform:"uppercase", letterSpacing:".08em" }}>Últimos Lançamentos</div>
        {transactions.length === 0 && <div style={{color:"#333",fontSize:".85rem"}}>Nenhum lançamento ainda.</div>}
        {[...transactions].reverse().slice(0,8).map((t,i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:".55rem 0", borderBottom:"1px solid #1e1e1e", fontSize:".82rem" }}>
            <span style={{color:"#8a7a6a",width:90}}>{new Date(t.date+"T12:00").toLocaleDateString("pt-BR")}</span>
            <span style={{flex:1}}>{t.description || t.category}</span>
            <span className="tag" style={{marginRight:"1rem"}}>{t.category}</span>
            <span style={{fontWeight:"bold", color: t.type==="income"?"#34c759":"#ff453a", minWidth:110, textAlign:"right"}}>
              {t.type==="income"?"+":"-"}{fmt(t.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPI({ icon, label, income, expense, color }) {
  const lucro = income - expense;
  return (
    <div className="kpi">
      <div style={{ fontSize:".75rem", color:"#555", textTransform:"uppercase", letterSpacing:".1em", marginBottom:".5rem" }}>{icon} {label}</div>
      <div style={{ fontSize:"1.55rem", fontWeight:"bold", color, marginBottom:".75rem" }}>{fmt(income)}</div>
      <div style={{ display:"flex", gap:"1rem", fontSize:".75rem" }}>
        <span style={{color:"#34c759"}}>↑ {fmt(income)}</span>
        <span style={{color:"#ff453a"}}>↓ {fmt(expense)}</span>
        <span style={{color: lucro>=0?"#f4a261":"#ff453a", fontWeight:"bold"}}>= {fmt(lucro)}</span>
      </div>
    </div>
  );
}

// ══ LANÇAMENTO ════════════════════════════════════════════════════════════════
function Lancamento({ transactions, categories, onSave }) {
  const [form, setForm] = useState({ type:"income", date:today(), category:"", value:"", description:"" });
  const [saved, setSaved] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = () => {
    if (!form.value || !form.category) return;
    const tx = { ...form, value: parseFloat(form.value.replace(",",".")), id: Date.now(), via:"manual" };
    onSave([...transactions, tx]);
    setSaved(true);
    setForm({ type:form.type, date:today(), category:"", value:"", description:"" });
    setTimeout(()=>setSaved(false), 2500);
  };
  return (
    <div style={{ maxWidth:560 }}>
      <div className="section-title">➕ Novo Lançamento</div>
      <div className="card">
        <div style={{ display:"flex", gap:".75rem", marginBottom:"1.25rem" }}>
          {["income","expense"].map(t => (
            <button key={t} className="btn" onClick={()=>set("type",t)}
              style={{ flex:1, background: form.type===t ? (t==="income"?"#1a3d1a":"#3d1a1a") : "#111",
                color: form.type===t ? (t==="income"?"#34c759":"#ff453a") : "#555",
                border: `1px solid ${form.type===t ? (t==="income"?"#34c759":"#ff453a") : "#2a2a2a"}` }}>
              {t==="income" ? "💰 Entrada" : "📤 Saída"}
            </button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
          <div>
            <label style={{fontSize:".75rem",color:"#555",display:"block",marginBottom:".3rem",textTransform:"uppercase",letterSpacing:".08em"}}>Data</label>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} />
          </div>
          <div>
            <label style={{fontSize:".75rem",color:"#555",display:"block",marginBottom:".3rem",textTransform:"uppercase",letterSpacing:".08em"}}>Valor (R$)</label>
            <input placeholder="0,00" value={form.value} onChange={e=>set("value",e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom:"1rem" }}>
          <label style={{fontSize:".75rem",color:"#555",display:"block",marginBottom:".3rem",textTransform:"uppercase",letterSpacing:".08em"}}>Categoria</label>
          <select value={form.category} onChange={e=>set("category",e.target.value)}>
            <option value="">Selecione...</option>
            {(categories[form.type]||[]).map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginBottom:"1.25rem" }}>
          <label style={{fontSize:".75rem",color:"#555",display:"block",marginBottom:".3rem",textTransform:"uppercase",letterSpacing:".08em"}}>Descrição (opcional)</label>
          <input placeholder="Ex: Compra de queijo mussarela..." value={form.description} onChange={e=>set("description",e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} style={{width:"100%",fontSize:"1rem",padding:".8rem"}}>
          {saved ? "✅ Lançado com sucesso!" : "Lançar"}
        </button>
      </div>
    </div>
  );
}

// ══ RELATÓRIOS ════════════════════════════════════════════════════════════════
function Relatorios({ transactions }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const monthlyData = MONTHS.map((m,i) => {
    const tx = transactions.filter(t => { const d=new Date(t.date); return d.getMonth()===i && d.getFullYear()===year; });
    const income  = tx.filter(t=>t.type==="income").reduce((a,t)=>a+t.value,0);
    const expense = tx.filter(t=>t.type==="expense").reduce((a,t)=>a+t.value,0);
    return { name:m, Entradas:income, Saídas:expense, Lucro:income-expense };
  });
  const years = [...new Set(transactions.map(t=>new Date(t.date).getFullYear()))].sort().reverse();
  if (!years.includes(now.getFullYear())) years.unshift(now.getFullYear());
  const totalIn  = monthlyData.reduce((a,m)=>a+m.Entradas,0);
  const totalOut = monthlyData.reduce((a,m)=>a+m.Saídas,0);
  const prevMonthly = MONTHS.map((_,i) => {
    const tx = transactions.filter(t => { const d=new Date(t.date); return d.getMonth()===i && d.getFullYear()===year-1; });
    return tx.filter(t=>t.type==="income").reduce((a,t)=>a+t.value,0);
  });
  const compData = MONTHS.map((m,i) => ({ name:m, [`${year}`]:monthlyData[i].Entradas, [`${year-1}`]:prevMonthly[i] }));
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div className="section-title" style={{marginBottom:0}}>📈 Relatórios & Comparativos</div>
        <select value={year} onChange={e=>setYear(+e.target.value)} style={{width:100}}>
          {years.map(y=><option key={y}>{y}</option>)}
        </select>
      </div>
      <div style={{marginBottom:"1.5rem"}}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {[
          {label:`Total Entradas ${year}`, value:totalIn, color:"#34c759"},
          {label:`Total Saídas ${year}`, value:totalOut, color:"#ff453a"},
          {label:`Lucro Líquido ${year}`, value:totalIn-totalOut, color:"#f4a261"},
        ].map(({label,value,color})=>(
          <div key={label} className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:".75rem",color:"#555",marginBottom:".4rem",textTransform:"uppercase",letterSpacing:".08em"}}>{label}</div>
            <div style={{fontSize:"1.4rem",fontWeight:"bold",color}}>{fmt(value)}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{marginBottom:"1rem"}}>
        <div style={{fontSize:".8rem",color:"#8a7a6a",marginBottom:"1rem",textTransform:"uppercase",letterSpacing:".08em"}}>Faturamento Mensal {year}</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis dataKey="name" tick={{fill:"#666",fontSize:11}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:"#666",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`} />
            <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:8,color:"#f0e6d3"}} formatter={v=>fmt(v)} />
            <Legend wrapperStyle={{fontSize:11,color:"#8a7a6a"}} />
            <Bar dataKey="Entradas" fill="#34c759" radius={[4,4,0,0]} />
            <Bar dataKey="Saídas"   fill="#ff453a" radius={[4,4,0,0]} />
            <Bar dataKey="Lucro"    fill="#e05c1e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div style={{fontSize:".8rem",color:"#8a7a6a",marginBottom:"1rem",textTransform:"uppercase",letterSpacing:".08em"}}>Comparação {year} vs {year-1} — Entradas</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={compData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
            <XAxis dataKey="name" tick={{fill:"#666",fontSize:11}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill:"#666",fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`} />
            <Tooltip contentStyle={{background:"#1a1a1a",border:"1px solid #2a2a2a",borderRadius:8,color:"#f0e6d3"}} formatter={v=>fmt(v)} />
            <Legend wrapperStyle={{fontSize:11,color:"#8a7a6a"}} />
            <Line type="monotone" dataKey={`${year}`}   stroke="#e05c1e" strokeWidth={2} dot={{r:3}} />
            <Line type="monotone" dataKey={`${year-1}`} stroke="#555"    strokeWidth={2} dot={{r:3}} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ══ PLANILHA ══════════════════════════════════════════════════════════════════
function Planilha({ transactions, onDelete }) {
  const [filter, setFilter] = useState({ type:"all", month:"all", search:"" });
  const months = [...new Set(transactions.map(t=>t.date.slice(0,7)))].sort().reverse();
  let filtered = transactions.filter(t => {
    if (filter.type !== "all" && t.type !== filter.type) return false;
    if (filter.month !== "all" && !t.date.startsWith(filter.month)) return false;
    if (filter.search && !`${t.description}${t.category}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });
  filtered = [...filtered].reverse();
  const del = (id) => onDelete(transactions.filter(t=>t.id!==id));
  return (
    <div>
      <div className="section-title">📋 Planilha de Lançamentos</div>
      <div style={{ display:"flex", gap:".75rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <select value={filter.type} onChange={e=>setFilter(f=>({...f,type:e.target.value}))} style={{width:130}}>
          <option value="all">Todos</option>
          <option value="income">Entradas</option>
          <option value="expense">Saídas</option>
        </select>
        <select value={filter.month} onChange={e=>setFilter(f=>({...f,month:e.target.value}))} style={{width:150}}>
          <option value="all">Todos os meses</option>
          {months.map(m=>{ const [y,mo]=m.split("-"); return <option key={m} value={m}>{MONTH_FULL[+mo-1]} {y}</option>; })}
        </select>
        <input placeholder="🔍 Buscar..." value={filter.search}
          onChange={e=>setFilter(f=>({...f,search:e.target.value}))} style={{width:200}} />
        <div style={{marginLeft:"auto",color:"#555",fontSize:".8rem",alignSelf:"center"}}>{filtered.length} registros</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"90px 1fr 120px 110px 90px 60px",gap:".5rem",
        padding:".5rem 0",borderBottom:"1px solid #2a2a2a",fontSize:".7rem",color:"#555",textTransform:"uppercase",letterSpacing:".08em"}}>
        <span>Data</span><span>Descrição</span><span>Categoria</span><span>Valor</span><span>Tipo</span><span></span>
      </div>
      {filtered.length === 0 && <div style={{color:"#333",fontSize:".85rem",padding:"2rem 0",textAlign:"center"}}>Nenhum lançamento encontrado.</div>}
      {filtered.map(t => (
        <div key={t.id} className="table-row">
          <span style={{color:"#555"}}>{new Date(t.date+"T12:00").toLocaleDateString("pt-BR")}</span>
          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description||"—"}</span>
          <span><span className="tag" style={{fontSize:".68rem"}}>{t.category}</span></span>
          <span style={{fontWeight:"bold",color:t.type==="income"?"#34c759":"#ff453a"}}>
            {t.type==="income"?"+":"-"}{fmt(t.value)}
          </span>
          <span>
            <span className={`badge badge-${t.type}`}>{t.type==="income"?"Entrada":"Saída"}</span>
            {t.via==="whatsapp" && <span style={{marginLeft:4,fontSize:".65rem",color:"#25d366"}}>WZ</span>}
          </span>
          <span>
            <button onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer",
              color:"#333",fontSize:".9rem",padding:".2rem .4rem",borderRadius:4}} title="Excluir">✕</button>
          </span>
        </div>
      ))}
      {filtered.length > 0 && (
        <div style={{display:"flex",gap:"2rem",marginTop:"1rem",padding:"1rem",background:"#1a1a1a",borderRadius:8,fontSize:".82rem"}}>
          <span style={{color:"#34c759"}}>Entradas: {fmt(filtered.filter(t=>t.type==="income").reduce((a,t)=>a+t.value,0))}</span>
          <span style={{color:"#ff453a"}}>Saídas: {fmt(filtered.filter(t=>t.type==="expense").reduce((a,t)=>a+t.value,0))}</span>
          <span style={{color:"#e05c1e",fontWeight:"bold"}}>
            Saldo: {fmt(filtered.filter(t=>t.type==="income").reduce((a,t)=>a+t.value,0) -
              filtered.filter(t=>t.type==="expense").reduce((a,t)=>a+t.value,0))}
          </span>
        </div>
      )}
    </div>
  );
}

// ══ CATEGORIAS ════════════════════════════════════════════════════════════════
function Categorias({ categories, onSave }) {
  const [newCat, setNewCat] = useState({income:"", expense:""});
  const [saved, setSaved] = useState(false);
  const add = (type) => {
    const val = newCat[type].trim();
    if (!val || categories[type].includes(val)) return;
    onSave({...categories, [type]:[...categories[type],val]});
    setNewCat(n=>({...n,[type]:""}));
    setSaved(true); setTimeout(()=>setSaved(false),1800);
  };
  const remove = (type,cat) => onSave({...categories, [type]:categories[type].filter(c=>c!==cat)});
  return (
    <div style={{maxWidth:700}}>
      <div className="section-title">🏷️ Categorias</div>
      {saved && <div style={{background:"#1a3d1a",border:"1px solid #34c759",borderRadius:8,
        padding:".6rem 1rem",marginBottom:"1rem",color:"#34c759",fontSize:".85rem"}}>✅ Categorias salvas!</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem"}}>
        {[["income","💰 Entradas"],["expense","📤 Saídas"]].map(([type,label])=>(
          <div key={type} className="card">
            <div style={{fontSize:".8rem",color:"#8a7a6a",marginBottom:"1rem",textTransform:"uppercase",letterSpacing:".08em"}}>{label}</div>
            <div style={{display:"flex",gap:".5rem",marginBottom:"1rem"}}>
              <input placeholder="Nova categoria..." value={newCat[type]}
                onChange={e=>setNewCat(n=>({...n,[type]:e.target.value}))}
                onKeyDown={e=>e.key==="Enter"&&add(type)} />
              <button className="btn btn-primary" onClick={()=>add(type)} style={{whiteSpace:"nowrap"}}>+ Add</button>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:".5rem"}}>
              {categories[type].map(cat=>(
                <div key={cat} style={{display:"flex",alignItems:"center",gap:".3rem",
                  background:"rgba(224,92,30,.1)",border:"1px solid rgba(224,92,30,.2)",
                  borderRadius:20,padding:".2rem .5rem .2rem .75rem",fontSize:".78rem"}}>
                  <span style={{color:"#e05c1e"}}>{cat}</span>
                  <button onClick={()=>remove(type,cat)}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#555",fontSize:".75rem",padding:"0 .1rem",lineHeight:1}}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══ WHATSAPP BOT ══════════════════════════════════════════════════════════════
function WhatsAppBot({ transactions, categories, onSave }) {
  const [msgs, setMsgs] = useState([
    { from:"bot", text:"Olá! Eu sou o Bot da Pizzaria 🍕\n\nMe envie seus lançamentos em texto simples:\n\n• Entrada de R$ 350 balcão\n• Saída de R$ 120 queijo\n• Recebi R$ 500 iFood\n• Paguei R$ 850 aluguel" }
  ]);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState("simulator");
  const [wabiz, setWabiz] = useState({ number:"", token:"", webhook:"" });

  const send = () => {
    const txt = input.trim();
    if (!txt) return;
    const userMsg = { from:"user", text:txt };
    const parsed = parseWhatsAppMsg(txt, categories);
    let botReply;
    if (parsed) {
      const tx = { ...parsed, date:today(), id:Date.now(), via:"whatsapp", description:parsed.description };
      onSave([...transactions, tx]);
      botReply = { from:"bot", text:`✅ Lançado com sucesso!\n\n📌 Tipo: ${parsed.type==="income"?"Entrada":"Saída"}\n💰 Valor: ${fmt(parsed.value)}\n🏷️ Categoria: ${parsed.category}\n🗓️ Data: ${new Date().toLocaleDateString("pt-BR")}` };
    } else {
      botReply = { from:"bot", text:`❌ Não entendi o lançamento.\n\nTente algo como:\n• "Entrada de R$ 200 balcão"\n• "Paguei R$ 500 salários"\n• "Recebi R$ 150 delivery"` };
    }
    setMsgs(m=>[...m,userMsg,botReply]);
    setInput("");
  };

  return (
    <div>
      <div className="section-title">💬 WhatsApp Bot</div>
      <div style={{display:"flex",gap:".5rem",marginBottom:"1.5rem"}}>
        {[["simulator","📱 Simulador"],["setup","⚙️ Configuração"],["guia","📖 Como Usar"]].map(([id,label])=>(
          <button key={id} className={`btn ${tab===id?"btn-primary":"btn-ghost"}`} onClick={()=>setTab(id)} style={{fontSize:".8rem"}}>{label}</button>
        ))}
      </div>
      {tab === "simulator" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem"}}>
          <div>
            <div style={{fontSize:".75rem",color:"#8a7a6a",marginBottom:".75rem",textTransform:"uppercase",letterSpacing:".08em"}}>📱 Chat WhatsApp (Simulador)</div>
            <div style={{background:"#111",border:"1px solid #1e1e1e",borderRadius:12,overflow:"hidden"}}>
              <div style={{background:"#075e54",padding:".75rem 1rem",display:"flex",alignItems:"center",gap:".75rem"}}>
                <div style={{width:36,height:36,background:"#128c7e",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.1rem"}}>🍕</div>
                <div>
                  <div style={{color:"#fff",fontWeight:"bold",fontSize:".9rem"}}>Bot Pizzaria</div>
                  <div style={{color:"rgba(255,255,255,.6)",fontSize:".72rem"}}>online</div>
                </div>
              </div>
              <div style={{height:320,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:".5rem",
                background:"#0d1117",backgroundImage:"radial-gradient(circle,#1a1a1a 1px,transparent 1px)",backgroundSize:"20px 20px"}}>
                {msgs.map((m,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"80%",padding:".6rem .9rem",borderRadius:m.from==="user"?"12px 12px 0 12px":"12px 12px 12px 0",
                      background:m.from==="user"?"#005c4b":"#202c33",color:"#e9edef",fontSize:".82rem",whiteSpace:"pre-line",lineHeight:1.5}}>
                      {m.text}
                      <div style={{fontSize:".65rem",color:"rgba(255,255,255,.35)",textAlign:"right",marginTop:".3rem"}}>{nowStr()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:"#202c33",padding:".6rem",display:"flex",gap:".5rem"}}>
                <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
                  placeholder="Digite um lançamento..."
                  style={{flex:1,background:"#2a3942",border:"none",borderRadius:8,color:"#e9edef",padding:".5rem .8rem",fontSize:".85rem"}} />
                <button onClick={send} style={{background:"#00a884",border:"none",borderRadius:8,cursor:"pointer",padding:".5rem .8rem",color:"#fff",fontSize:"1rem"}}>➤</button>
              </div>
            </div>
          </div>
          <div>
            <div style={{fontSize:".75rem",color:"#8a7a6a",marginBottom:".75rem",textTransform:"uppercase",letterSpacing:".08em"}}>💡 Exemplos de Comandos</div>
            <div className="card">
              {[
                ["💰 Entradas","Recebi R$ 350 balcão","Entrada de R$ 500 iFood","Faturei R$ 200 delivery"],
                ["📤 Saídas","Paguei R$ 120 queijo","Saída R$ 850 aluguel","Gasto R$ 300 insumos","Comprei R$ 200 embalagens"],
              ].map(([title,...cmds])=>(
                <div key={title} style={{marginBottom:"1.25rem"}}>
                  <div style={{fontSize:".75rem",color:"#e05c1e",marginBottom:".5rem",fontWeight:"bold"}}>{title}</div>
                  {cmds.map(cmd=>(
                    <div key={cmd} className="wz-msg" onClick={()=>setInput(cmd)} style={{cursor:"pointer"}} title="Clique para testar">
                      <span style={{color:"#e9edef"}}>{cmd}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{fontSize:".72rem",color:"#555",marginTop:".5rem"}}>👆 Clique nos exemplos para testar</div>
            </div>
          </div>
        </div>
      )}
      {tab === "setup" && (
        <div style={{maxWidth:520}}>
          <div className="card" style={{marginBottom:"1rem"}}>
            <div style={{fontSize:".85rem",color:"#e05c1e",marginBottom:"1rem",fontWeight:"bold"}}>⚙️ Integração WaBiz / Z-API</div>
            <div style={{fontSize:".8rem",color:"#8a7a6a",marginBottom:"1.25rem",lineHeight:1.6}}>
              Para conectar seu WhatsApp real, use um provedor como <strong style={{color:"#f0e6d3"}}>WaBiz</strong> ou <strong style={{color:"#f0e6d3"}}>Z-API</strong>. Configure abaixo:
            </div>
            {[["Número WhatsApp","number","Ex: 5511999999999"],["Token / API Key","token","Cole seu token aqui"],["Webhook URL","webhook","https://seu-site.com/webhook"]].map(([label,key,ph])=>(
              <div key={key} style={{marginBottom:"1rem"}}>
                <label style={{fontSize:".75rem",color:"#555",display:"block",marginBottom:".3rem",textTransform:"uppercase",letterSpacing:".08em"}}>{label}</label>
                <input placeholder={ph} value={wabiz[key]} onChange={e=>setWabiz(w=>({...w,[key]:e.target.value}))} />
              </div>
            ))}
            <button className="btn btn-primary" style={{width:"100%"}}>💾 Salvar Configuração</button>
          </div>
        </div>
      )}
      {tab === "guia" && (
        <div style={{maxWidth:580}} className="card">
          <div style={{fontSize:".85rem",color:"#e05c1e",marginBottom:"1.25rem",fontWeight:"bold"}}>📖 Como usar o Bot</div>
          {[
            ["1️⃣","Simulador","Use a aba 'Simulador' para testar. Clique nos exemplos ou escreva suas mensagens."],
            ["2️⃣","Palavras de Entrada","Use: recebi, entrada, faturei, vendi, venda"],
            ["3️⃣","Palavras de Saída","Use: paguei, saída, gasto, despesa, comprei"],
            ["4️⃣","Formato do Valor","Inclua o valor: R$ 150 ou 150,00 ou 150"],
            ["5️⃣","Categorias Auto","O bot detecta pelo nome: 'queijo', 'aluguel', 'salários', etc."],
            ["6️⃣","WhatsApp Real","Configure na aba ⚙️ usando WaBiz ou Z-API para conectar seu número."],
          ].map(([n,title,desc])=>(
            <div key={n} style={{display:"flex",gap:"1rem",marginBottom:"1.25rem",borderBottom:"1px solid #1e1e1e",paddingBottom:"1.25rem"}}>
              <div style={{fontSize:"1.3rem",minWidth:32}}>{n}</div>
              <div>
                <div style={{fontWeight:"bold",color:"#f0e6d3",marginBottom:".3rem",fontSize:".9rem"}}>{title}</div>
                <div style={{color:"#8a7a6a",fontSize:".82rem",lineHeight:1.5}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}