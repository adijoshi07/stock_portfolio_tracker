import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API =  import.meta.env.VITE_API_URL;
const CLAUDE_API = "https://api.anthropic.com/v1/messages";

function getToken() { return localStorage.getItem("spt_token"); }
function getUser() { try { return JSON.parse(localStorage.getItem("spt_user")); } catch { return null; } }

async function api(path, options = {}) {
  const token = getToken();
  let r;
  try {
    r = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...options,
    });
  } catch {
    throw new Error("Can't reach the server. Make sure your backend is running on port 5000 and CORS is enabled.");
  }
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function askClaude(prompt) {
  const r = await fetch(CLAUDE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  return data.content?.[0]?.text || "No response received.";
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}

function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ padding: "12px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500, background: t.type === "error" ? "#FEE2E2" : "#DCFCE7", color: t.type === "error" ? "#991B1B" : "#166534", border: `1px solid ${t.type === "error" ? "#FECACA" : "#BBF7D0"}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function AuthPage({ onAuth, addToast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const body = mode === "login" ? { email: form.email, password: form.password } : { name: form.name, email: form.email, password: form.password };
      const data = await api(`/users/${mode}`, { method: "POST", body: JSON.stringify(body) });
      if (mode === "login") { localStorage.setItem("spt_token", data.token); localStorage.setItem("spt_user", JSON.stringify(data.user)); onAuth(data.user); }
      else { addToast("Account created — sign in to continue."); setMode("login"); }
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  const inp = { width: "100%", boxSizing: "border-box", background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 8, padding: "10px 14px", color: "white", fontSize: 14, outline: "none" };
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FF6B2C", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 22, color: "white", fontWeight: 700 }}>Q</span></div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "white", letterSpacing: -0.5 }}>QUANTUM</span>
          </div>
          <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>{mode === "login" ? "Sign in to your portfolio" : "Create your account"}</p>
        </div>
        <div style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 16, padding: "2rem" }}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && <div><label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 6, fontWeight: 500 }}>FULL NAME</label><input name="name" value={form.name} onChange={handle} placeholder="Your name" required style={inp} /></div>}
            <div><label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 6, fontWeight: 500 }}>EMAIL</label><input name="email" type="email" value={form.email} onChange={handle} placeholder="name@example.com" required style={inp} /></div>
            <div><label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 6, fontWeight: 500 }}>PASSWORD</label><input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required style={inp} /></div>
            <button type="submit" disabled={loading} style={{ marginTop: 4, background: "#FF6B2C", color: "white", border: "none", borderRadius: 8, padding: "12px", fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", margin: "1.25rem 0 0" }}>
            {mode === "login" ? "No account? " : "Already have one? "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: "#FF6B2C", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>{mode === "login" ? "Create one" : "Sign in"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Stock Modal ──────────────────────────────────────────────────────────────
function StockModal({ stock, onClose, onSave, addToast }) {
  const [form, setForm] = useState({ stockSymbol: stock?.stockSymbol || "", quantity: stock?.quantity || "", buyPrice: stock?.buyPrice || "" });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });
  const inp = { width: "100%", boxSizing: "border-box", background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 8, padding: "10px 14px", color: "white", fontSize: 14, outline: "none" };

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const body = { stockSymbol: form.stockSymbol.toUpperCase(), quantity: Number(form.quantity), buyPrice: Number(form.buyPrice) };
      if (stock) { const u = await api(`/portfolio/${stock._id}`, { method: "PUT", body: JSON.stringify(body) }); onSave(u, "edit"); addToast("Stock updated."); }
      else { const c = await api("/portfolio", { method: "POST", body: JSON.stringify(body) }); onSave(c.stock, "add"); addToast("Stock added."); }
      onClose();
    } catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 16, padding: "1.75rem", width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "white" }}>{stock ? "Edit position" : "Add position"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 22, padding: 0 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 6, fontWeight: 500 }}>TICKER SYMBOL</label><input name="stockSymbol" value={form.stockSymbol} onChange={handle} placeholder="e.g. AAPL" required style={{ ...inp, textTransform: "uppercase" }} /></div>
          <div><label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 6, fontWeight: 500 }}>QUANTITY</label><input name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={handle} placeholder="10" required style={inp} /></div>
          <div><label style={{ fontSize: 12, color: "#9CA3AF", display: "block", marginBottom: 6, fontWeight: 500 }}>BUY PRICE ($)</label><input name="buyPrice" type="number" min="0.01" step="0.01" value={form.buyPrice} onChange={handle} placeholder="150.00" required style={inp} /></div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px", background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 8, color: "#9CA3AF", fontWeight: 500, cursor: "pointer", fontSize: 14 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: "11px", background: "#FF6B2C", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontSize: 14 }}>{loading ? "Saving…" : stock ? "Save changes" : "Add position"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirm({ stock, onClose, onConfirm, loading }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 16, padding: "1.75rem", width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>🗑️</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 600, color: "white" }}>Remove {stock.stockSymbol}?</h2>
        <p style={{ margin: "0 0 1.5rem", fontSize: 14, color: "#6B7280" }}>This will delete the position from your portfolio.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 8, color: "#9CA3AF", fontWeight: 500, cursor: "pointer", fontSize: 14 }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "11px", background: "#EF4444", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontSize: 14 }}>{loading ? "Removing…" : "Remove"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, user, onLogout }) {
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "portfolio", label: "Portfolio", icon: "◈" },
    { id: "market", label: "Market", icon: "📈" },
    { id: "insights", label: "AI Insights", icon: "✦", badge: "AI" },
    { id: "watchlist", label: "Watchlist", icon: "☆" },
  ];
  return (
    <div style={{ width: 220, minHeight: "100vh", background: "#1a1d27", borderRight: "1px solid #2a2d3a", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid #2a2d3a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#FF6B2C", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 18, color: "white", fontWeight: 700 }}>Q</span></div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "white", letterSpacing: 1 }}>QUANTUM</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: active === item.id ? 600 : 400, background: active === item.id ? "#FF6B2C" : "transparent", color: active === item.id ? "white" : "#6B7280", textAlign: "left" }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {item.badge && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: active === item.id ? "rgba(255,255,255,0.25)" : "#FF6B2C22", color: active === item.id ? "white" : "#FF6B2C", padding: "2px 6px", borderRadius: 4 }}>{item.badge}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #2a2d3a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FF6B2C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0 }}>{user.name?.[0]?.toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>Investor</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", padding: "8px", background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 8, color: "#6B7280", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Sign out</button>
      </div>
    </div>
  );
}

function generateChartData(stocks) {
  const total = stocks.reduce((s, x) => s + x.buyPrice * x.quantity, 0) || 1000;
  const points = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const prev = points.length > 0 ? points[points.length - 1].value : total * 0.85;
    points.push({ date: label, value: Math.max(0, prev + (Math.random() - 0.45) * total * 0.04) });
  }
  return points;
}

// ─── AI Insights ──────────────────────────────────────────────────────────────
function AIInsightsView({ stocks, portfolioValue }) {
  const [activeInsight, setActiveInsight] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const portfolioSummary = stocks.length === 0
    ? "The user has no stocks in their portfolio yet."
    : `Portfolio: ${stocks.map(s => `${s.stockSymbol} (${s.quantity} shares @ $${s.buyPrice})`).join(", ")}. Total invested: $${stocks.reduce((s, x) => s + x.buyPrice * x.quantity, 0).toFixed(2)}.${portfolioValue ? ` Current value: $${portfolioValue.currentValue?.toFixed(2)}, P&L: $${portfolioValue.profitloss?.toFixed(2)}` : ""}`;

  const insights = [
    {
      id: "diversification",
      icon: "🧩",
      title: "Diversification check",
      desc: "Analyse sector spread and concentration risk",
      prompt: `You are a financial analyst. ${portfolioSummary}. Analyse the portfolio diversification: check sector spread, concentration risk, and suggest improvements. Be concise, use bullet points, and give 3 actionable tips. Keep response under 250 words.`,
    },
    {
      id: "risk",
      icon: "⚠️",
      title: "Risk assessment",
      desc: "Evaluate overall portfolio risk level",
      prompt: `You are a financial risk analyst. ${portfolioSummary}. Evaluate the risk profile of this portfolio. Rate it Low/Medium/High, explain why, and give 3 specific risk mitigation suggestions. Keep response under 250 words.`,
    },
    {
      id: "performance",
      icon: "📊",
      title: "Performance review",
      desc: "Review gains, losses, and performance trends",
      prompt: `You are a portfolio manager. ${portfolioSummary}. Review the performance of this portfolio. Identify best and worst positions, comment on overall returns, and suggest rebalancing actions. Keep response under 250 words.`,
    },
    {
      id: "suggestions",
      icon: "💡",
      title: "Investment suggestions",
      desc: "Get AI-powered stock recommendations",
      prompt: `You are an investment advisor. ${portfolioSummary}. Based on the current holdings, suggest 3-5 complementary stocks or ETFs to consider adding. Explain the reasoning for each. Keep response under 300 words. Add a disclaimer that this is not financial advice.`,
    },
  ];

  const runInsight = async (insight) => {
    if (stocks.length === 0) return;
    setActiveInsight(insight.id);
    setLoading(l => ({ ...l, [insight.id]: true }));
    try {
      const text = await askClaude(insight.prompt);
      setResults(r => ({ ...r, [insight.id]: text }));
    } catch {
      setResults(r => ({ ...r, [insight.id]: "Failed to get AI insight. Make sure the Anthropic API is accessible." }));
    } finally {
      setLoading(l => ({ ...l, [insight.id]: false }));
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(h => [...h, { role: "user", text: userMsg }]);
    setChatLoading(true);
    try {
      const context = `You are a helpful financial assistant for a stock portfolio app. ${portfolioSummary}. Answer the user's question concisely and helpfully. If it's not finance-related, politely redirect.`;
      const text = await askClaude(`${context}\n\nUser question: ${userMsg}`);
      setChatHistory(h => [...h, { role: "ai", text }]);
    } catch {
      setChatHistory(h => [...h, { role: "ai", text: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setChatLoading(false); }
  };

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      {/* Left — insight cards + result */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 4 }}>AI Portfolio Insights</div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>Powered by Claude — click any card to get instant analysis</div>
        </div>

        {stocks.length === 0 && (
          <div style={{ background: "#1a1d27", border: "1px solid #FF6B2C44", borderRadius: 12, padding: "1.25rem", marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>ℹ️</span>
            <span style={{ fontSize: 14, color: "#9CA3AF" }}>Add stocks to your portfolio first to get personalized AI insights.</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {insights.map(ins => (
            <button key={ins.id} onClick={() => runInsight(ins)} disabled={stocks.length === 0}
              style={{ background: activeInsight === ins.id ? "#FF6B2C11" : "#1a1d27", border: `1px solid ${activeInsight === ins.id ? "#FF6B2C" : "#2a2d3a"}`, borderRadius: 12, padding: "1.25rem", cursor: stocks.length === 0 ? "not-allowed" : "pointer", textAlign: "left", opacity: stocks.length === 0 ? 0.5 : 1, transition: "all 0.15s" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{ins.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 4 }}>{ins.title}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{ins.desc}</div>
              {loading[ins.id] && <div style={{ marginTop: 8, fontSize: 12, color: "#FF6B2C" }}>Analysing…</div>}
            </button>
          ))}
        </div>

        {/* Result panel */}
        {activeInsight && results[activeInsight] && (
          <div style={{ background: "#1a1d27", border: "1px solid #FF6B2C44", borderRadius: 14, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>{insights.find(i => i.id === activeInsight)?.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "white" }}>{insights.find(i => i.id === activeInsight)?.title}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, background: "#FF6B2C22", color: "#FF6B2C", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>Claude AI</span>
            </div>
            <div style={{ fontSize: 14, color: "#D1D5DB", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{results[activeInsight]}</div>
          </div>
        )}
        {activeInsight && loading[activeInsight] && (
          <div style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 14, padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>✦</div>
            <div style={{ fontSize: 14, color: "#6B7280" }}>Claude is analysing your portfolio…</div>
          </div>
        )}
      </div>

      {/* Right — Chat */}
      <div style={{ width: 320, flexShrink: 0, background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 14, display: "flex", flexDirection: "column", height: 520 }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #2a2d3a" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "white", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✦</span> Ask Claude
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Ask anything about your portfolio</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
          {chatHistory.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#4B5563" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✦</div>
              <div style={{ fontSize: 13 }}>Try asking:<br /><br />
                <span style={{ color: "#6B7280" }}>"Should I sell any of my stocks?"</span><br />
                <span style={{ color: "#6B7280" }}>"What's my biggest risk?"</span><br />
                <span style={{ color: "#6B7280" }}>"How diversified am I?"</span>
              </div>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "85%", padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.6, background: msg.role === "user" ? "#FF6B2C" : "#0f1117", color: msg.role === "user" ? "white" : "#D1D5DB", border: msg.role === "ai" ? "1px solid #2a2d3a" : "none", whiteSpace: "pre-wrap" }}>
                {msg.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div style={{ padding: "10px 14px", borderRadius: 12, fontSize: 13, background: "#0f1117", border: "1px solid #2a2d3a", color: "#6B7280" }}>Claude is thinking…</div>
            </div>
          )}
        </div>

        <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #2a2d3a", display: "flex", gap: 8 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Ask about your portfolio…"
            style={{ flex: 1, background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 8, padding: "9px 12px", color: "white", fontSize: 13, outline: "none" }} />
          <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
            style={{ padding: "9px 14px", background: "#FF6B2C", border: "none", borderRadius: 8, color: "white", fontWeight: 600, cursor: chatLoading ? "not-allowed" : "pointer", opacity: chatLoading ? 0.7 : 1, fontSize: 16 }}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard View ───────────────────────────────────────────────────────────
function DashboardView({ stocks, portfolioValue, loadingValue, onRefresh, onAdd }) {
  const totalInvested = stocks.reduce((s, x) => s + x.buyPrice * x.quantity, 0);
  const chartData = generateChartData(stocks.length > 0 ? stocks : [{ buyPrice: 100, quantity: 10 }]);
  const plPositive = portfolioValue ? portfolioValue.profitloss >= 0 : true;
  const fmt = v => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
        {[
          { label: "Total Holdings", value: stocks.length, sub: "positions", color: "#FF6B2C" },
          { label: "Total Invested", value: fmt(totalInvested), sub: "cost basis", color: "#3B82F6" },
          { label: "Current Value", value: portfolioValue ? fmt(portfolioValue.currentValue) : "—", sub: "market value", color: "#8B5CF6" },
          { label: "Profit / Loss", value: portfolioValue ? (plPositive ? "+" : "") + fmt(Math.abs(portfolioValue.profitloss)) : "—", sub: plPositive ? "in profit" : "in loss", color: plPositive ? "#10B981" : "#EF4444" },
        ].map(card => (
          <div key={card.label} style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 14, padding: "1.25rem" }}>
            <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 500, marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: card.color, marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 11, color: "#4B5563" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 14, padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Portfolio Performance</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "white" }}>{fmt(totalInvested)}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["1W", "1M", "3M", "ALL"].map(p => (
              <button key={p} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #2a2d3a", background: p === "ALL" ? "#FF6B2C" : "transparent", color: p === "ALL" ? "white" : "#6B7280", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>{p}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B2C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6B2C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#4B5563", fontSize: 11 }} axisLine={false} tickLine={false} interval={6} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 8, color: "white", fontSize: 13 }} formatter={v => ["$" + Number(v).toFixed(2), "Value"]} />
            <Area type="monotone" dataKey="value" stroke="#FF6B2C" strokeWidth={2} fill="url(#grad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "white" }}>Portfolio Overview</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onRefresh} disabled={loadingValue || stocks.length === 0} style={{ padding: "8px 16px", background: "#0f1117", border: "1px solid #2a2d3a", borderRadius: 8, color: "#9CA3AF", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>{loadingValue ? "Fetching…" : "↻ Refresh values"}</button>
          <button onClick={onAdd} style={{ padding: "8px 18px", background: "#FF6B2C", border: "none", borderRadius: 8, color: "white", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>+ Add position</button>
        </div>
      </div>
    </div>
  );
}

function PortfolioTable({ stocks, onEdit, onDelete }) {
  if (stocks.length === 0) return (
    <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#4B5563" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#6B7280", marginBottom: 6 }}>No positions yet</div>
      <div style={{ fontSize: 13 }}>Add your first stock to start tracking.</div>
    </div>
  );
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #2a2d3a" }}>
          {["Stock", "Buy Price", "Quantity", "Invested", "Added", ""].map(h => (
            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#4B5563", letterSpacing: 0.5 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {stocks.map((s, i) => (
          <tr key={s._id} style={{ borderBottom: "1px solid #2a2d3a", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
            <td style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FF6B2C22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#FF6B2C" }}>{s.stockSymbol.slice(0, 2)}</div>
                <span style={{ fontWeight: 600, color: "white" }}>{s.stockSymbol}</span>
              </div>
            </td>
            <td style={{ padding: "12px 14px", color: "#9CA3AF" }}>${Number(s.buyPrice).toFixed(2)}</td>
            <td style={{ padding: "12px 14px", color: "#9CA3AF" }}>{s.quantity}</td>
            <td style={{ padding: "12px 14px", color: "white", fontWeight: 600 }}>${(s.buyPrice * s.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            <td style={{ padding: "12px 14px", color: "#4B5563", fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString()}</td>
            <td style={{ padding: "12px 14px", textAlign: "right" }}>
              <button onClick={() => onEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", padding: "4px 8px", borderRadius: 6, fontSize: 15, marginRight: 4 }}>✏️</button>
              <button onClick={() => onDelete(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444", padding: "4px 8px", borderRadius: 6, fontSize: 15 }}>🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MarketView({ addToast }) {
  const [symbol, setSymbol] = useState(""); const [result, setResult] = useState(null); const [loading, setLoading] = useState(false);
  const lookup = async e => {
    e.preventDefault(); if (!symbol.trim()) return; setLoading(true); setResult(null);
    try { const data = await api(`/stock/${symbol.trim().toUpperCase()}`); setResult(data); }
    catch (err) { addToast(err.message, "error"); } finally { setLoading(false); }
  };
  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 20 }}>Live Price Lookup</div>
      <form onSubmit={lookup} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Enter ticker (e.g. AAPL, TSLA)" style={{ flex: 1, background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 8, padding: "11px 14px", color: "white", fontSize: 14, outline: "none", textTransform: "uppercase" }} />
        <button type="submit" disabled={loading} style={{ padding: "11px 22px", background: "#FF6B2C", border: "none", borderRadius: 8, color: "white", fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "…" : "Look up"}</button>
      </form>
      {result && (
        <div style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 14, padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{result.symbol}</div><div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>Live market price</div></div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10B981" }}>${Number(result.currentPrice).toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout, addToast }) {
  const [active, setActive] = useState("dashboard");
  const [stocks, setStocks] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [loadingValue, setLoadingValue] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editStock, setEditStock] = useState(null);
  const [deleteStock, setDeleteStock] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStocks = useCallback(async () => {
    setLoadingStocks(true);
    try { const data = await api("/portfolio"); setStocks(data); }
    catch (err) { addToast(err.message, "error"); } finally { setLoadingStocks(false); }
  }, [addToast]);

  const fetchPortfolioValue = async () => {
    setLoadingValue(true); setPortfolioValue(null);
    try { const data = await api("/stock/portfolio/value"); setPortfolioValue(data); }
    catch (err) { addToast(err.message, "error"); } finally { setLoadingValue(false); }
  };

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const handleSave = (stock, action) => {
    if (action === "add") setStocks(p => [...p, stock]);
    else setStocks(p => p.map(s => s._id === stock._id ? stock : s));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await api(`/portfolio/${deleteStock._id}`, { method: "DELETE" }); setStocks(p => p.filter(s => s._id !== deleteStock._id)); addToast(`${deleteStock.stockSymbol} removed.`); setDeleteStock(null); }
    catch (err) { addToast(err.message, "error"); } finally { setDeleting(false); }
  };

  const titles = { dashboard: "Dashboard", portfolio: "Portfolio", market: "Market", insights: "AI Insights", watchlist: "Watchlist" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f1117", fontFamily: "system-ui, sans-serif" }}>
      <Sidebar active={active} setActive={setActive} user={user} onLogout={onLogout} />
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>{titles[active]}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Welcome back, {user.name}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FF6B2C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "white" }}>{user.name?.[0]?.toUpperCase()}</div>
            <div><div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{user.name}</div><div style={{ fontSize: 11, color: "#6B7280" }}>{user.email}</div></div>
          </div>
        </div>

        {active === "dashboard" && (
          <>
            <DashboardView stocks={stocks} portfolioValue={portfolioValue} loadingValue={loadingValue} onRefresh={fetchPortfolioValue} onAdd={() => { setEditStock(null); setShowModal(true); }} />
            <div style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 14, marginTop: 20, overflow: "hidden" }}>
              {loadingStocks ? <div style={{ textAlign: "center", padding: "3rem", color: "#4B5563" }}>Loading…</div> : <PortfolioTable stocks={stocks} onEdit={s => { setEditStock(s); setShowModal(true); }} onDelete={s => setDeleteStock(s)} />}
            </div>
          </>
        )}

        {active === "portfolio" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 10 }}>
              <button onClick={fetchPortfolioValue} disabled={loadingValue || stocks.length === 0} style={{ padding: "8px 16px", background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 8, color: "#9CA3AF", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>{loadingValue ? "Fetching…" : "↻ Refresh values"}</button>
              <button onClick={() => { setEditStock(null); setShowModal(true); }} style={{ padding: "8px 18px", background: "#FF6B2C", border: "none", borderRadius: 8, color: "white", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>+ Add position</button>
            </div>
            <div style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 14, overflow: "hidden" }}>
              {loadingStocks ? <div style={{ textAlign: "center", padding: "3rem", color: "#4B5563" }}>Loading…</div> : <PortfolioTable stocks={stocks} onEdit={s => { setEditStock(s); setShowModal(true); }} onDelete={s => setDeleteStock(s)} />}
            </div>
            {portfolioValue && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 16 }}>
                {[
                  { label: "Total invested", value: "$" + Number(portfolioValue.totalInvestment).toLocaleString("en-US", { minimumFractionDigits: 2 }), color: "#3B82F6" },
                  { label: "Current value", value: "$" + Number(portfolioValue.currentValue).toLocaleString("en-US", { minimumFractionDigits: 2 }), color: "#8B5CF6" },
                  { label: "Profit / loss", value: (portfolioValue.profitloss >= 0 ? "+" : "") + "$" + Math.abs(portfolioValue.profitloss).toLocaleString("en-US", { minimumFractionDigits: 2 }), color: portfolioValue.profitloss >= 0 ? "#10B981" : "#EF4444" },
                ].map(c => (
                  <div key={c.label} style={{ background: "#1a1d27", border: "1px solid #2a2d3a", borderRadius: 14, padding: "1.25rem" }}>
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>{c.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {active === "market" && <MarketView addToast={addToast} />}
        {active === "insights" && <AIInsightsView stocks={stocks} portfolioValue={portfolioValue} />}
        {active === "watchlist" && (
          <div style={{ textAlign: "center", padding: "6rem 2rem", color: "#4B5563" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>☆</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#6B7280", marginBottom: 8 }}>Coming soon</div>
            <div style={{ fontSize: 13 }}>Watchlist feature is under construction.</div>
          </div>
        )}
      </main>

      {showModal && <StockModal stock={editStock} onClose={() => { setShowModal(false); setEditStock(null); }} onSave={handleSave} addToast={addToast} />}
      {deleteStock && <DeleteConfirm stock={deleteStock} onClose={() => setDeleteStock(null)} onConfirm={handleDelete} loading={deleting} />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => getUser());
  const { toasts, addToast } = useToast();
  return (
    <>
      <Toast toasts={toasts} />
      {user
        ? <Dashboard user={user} onLogout={() => { localStorage.removeItem("spt_token"); localStorage.removeItem("spt_user"); setUser(null); }} addToast={addToast} />
        : <AuthPage onAuth={u => setUser(u)} addToast={addToast} />}
    </>
  );
}
