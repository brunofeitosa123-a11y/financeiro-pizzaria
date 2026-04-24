import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { supabase } from "./supabase";

const DEFAULT_CATS = {
  expense: ["Queijo","Insumos","Farinha/Massas","Embalagens","Salários","Aluguel","Energia","Água","Gás","Manutenção","Marketing","Sistema/App","Outros"],
  income: ["Delivery","Balcão","iFood/Rappi","PIX","Cartão Débito","Cartão Crédito","Dinheiro","Outros"]
};

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTH_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

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

export default function PizzariaFinanceiro() {
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [loading, setLoading] = useState(true);

  // ── Carrega dados do Supabase ──────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: txData } = await supabase.from("transactions").select("*").order("id", { ascending: true });
      if (txData) setTransactions(txData);
      const { data: settData } = await supabase.from("settings").select("*").eq("key", "categories").single();
      if (settData?.value) setCategories(settData.value);
      setLoading(false);
    }
    loadData();
  }, []);

  // ── Salva transações no Supabase ───────────────────────────────────────────
  const saveTx = useCallback(async (tx) => {
    setTransactions(tx);
    await supabase.from("transactions").delete().neq("id", 0);
    if (tx.length > 0) await supabase.from("transactions").insert(tx);
  }, []);

  // ── Salva categorias no Supabase ───────────────────────────────────────────
  const saveCat = useCallback(async (cat) => {
    setCategories(cat);
    await supabase.from("settings").upsert({ key: "categories", value: cat });
  }, []);

  if (loading) return (
    <div style={{ background:"#0f0f0f", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#e05c1e", fontFamily:"Georgia,serif", fontSize:"1.2rem" }}>
      🍕 Carregando dados...
    </div>
  );

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

        <main style={{ flex:1, padding:"1.75rem", overflowY:"auto" }}>
          {tab === "dashboard"   && <Dashboard transactions={transactions} />}
          {tab === "lancamento"  && <Lancamento transactions={transactions} categories={categories} onSave={saveTx} />}
          {tab === "relatorios"  && <Relatorios transactions={transactions} />}
          {tab === "planilha"    && <Planilha transactions={transactions} onDelete={saveTx} />}
          {tab === "categorias"  && <Categorias categories={categories} onSave={saveCat} />}
          {tab === "whatsapp"    && <WhatsAppBot transactions={transactions} categories={categories} onSave={saveTx} />}
        </main>
      </div>
    </div>
  );
}
