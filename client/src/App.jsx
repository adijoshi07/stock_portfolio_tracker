import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api";

function getToken() { return localStorage.getItem("spt_token"); }
function getUser() { try { return JSON.parse(localStorage.getItem("spt_user")); } catch { return null; } }

async function api(path, options = {}) {
  const token = getToken();
  let r;
  try {
    r = await fetch(`${API}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    });
  } catch (err) {
    // Network error — backend not running or CORS blocked
    throw new Error("Can't reach the server. Make sure your backend is running on port 5000 and CORS is enabled.");
  }
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
          background: t.type === "error" ? "var(--bg-danger)" : "var(--bg-success)",
          color: t.type === "error" ? "var(--text-danger)" : "var(--text-success)",
          border: `0.5px solid ${t.type === "error" ? "var(--border-danger)" : "var(--border-success)"}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return { toasts, addToast };
}

// ─── Auth Pages ───────────────────────────────────────────────────────────────
function AuthPage({ onAuth, addToast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const data = await api(`/users/${mode}`, { method: "POST", body: JSON.stringify(body) });
      if (mode === "login") {
        localStorage.setItem("spt_token", data.token);
        localStorage.setItem("spt_user", JSON.stringify(data.user));
        onAuth(data.user);
      } else {
        addToast("Account created — log in to continue.");
        setMode("login");
      }
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "skyblue", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--fill-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-chart-line" style={{ fontSize: 20, color: "var(--on-accent)" }} aria-hidden="true" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)" }}>StockTracker</span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
            {mode === "login" ? "Sign in to your portfolio" : "Create your account"}
          </p>
        </div>

        <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "1.5rem" }}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <div>
                <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Name</label>
                <input name="name" value={form.name} onChange={handle} placeholder="Your name" required style={{ width: "100%", boxSizing: "border-box" }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="name@example.com" required style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required style={{ width: "100%", boxSizing: "border-box" }} />
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: 4, background: "var(--fill-accent)", color: "var(--on-accent)", border: "none", borderRadius: "var(--radius)", padding: "10px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)", margin: "1rem 0 0" }}>
            {mode === "login" ? "No account? " : "Already have one? "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: "var(--text-accent)", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: 0 }}>
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Stock Modal ────────────────────────────────────────────────────
function StockModal({ stock, onClose, onSave, addToast }) {
  const [form, setForm] = useState({ stockSymbol: stock?.stockSymbol || "", quantity: stock?.quantity || "", buyPrice: stock?.buyPrice || "" });
  const [loading, setLoading] = useState(false);
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { stockSymbol: form.stockSymbol.toUpperCase(), quantity: Number(form.quantity), buyPrice: Number(form.buyPrice) };
      if (stock) {
        const updated = await api(`/portfolio/${stock._id}`, { method: "PUT", body: JSON.stringify(body) });
        onSave(updated, "edit");
        addToast("Stock updated.");
      } else {
        const created = await api("/portfolio", { method: "POST", body: JSON.stringify(body) });
        onSave(created.stock, "add");
        addToast("Stock added to portfolio.");
      }
      onClose();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "1.5rem", width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{stock ? "Edit stock" : "Add stock"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 20, padding: 0, lineHeight: 1 }}>
            <i className="ti ti-x" aria-label="Close" />
          </button>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Ticker symbol</label>
            <input name="stockSymbol" value={form.stockSymbol} onChange={handle} placeholder="e.g. AAPL" required style={{ width: "100%", boxSizing: "border-box", textTransform: "uppercase" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Quantity</label>
            <input name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={handle} placeholder="10" required style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Buy price (per share, $)</label>
            <input name="buyPrice" type="number" min="0.01" step="0.01" value={form.buyPrice} onChange={handle} placeholder="150.00" required style={{ width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "9px" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: "9px", background: "var(--fill-accent)", color: "var(--on-accent)", border: "none", borderRadius: "var(--radius)", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving…" : stock ? "Save changes" : "Add stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Stock Price Lookup ───────────────────────────────────────────────────────
function PriceLookup({ addToast }) {
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api(`/stock/${symbol.trim().toUpperCase()}`);
      setResult(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
      <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
        <i className="ti ti-zoom-money" aria-hidden="true" style={{ marginRight: 6 }} />
        Live price lookup
      </p>
      <form onSubmit={lookup} style={{ display: "flex", gap: 8 }}>
        <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Ticker (e.g. TSLA)" style={{ flex: 1, textTransform: "uppercase" }} />
        <button type="submit" disabled={loading} style={{ padding: "0 16px", background: "var(--fill-accent)", color: "var(--on-accent)", border: "none", borderRadius: "var(--radius)", cursor: loading ? "not-allowed" : "pointer", fontWeight: 500, opacity: loading ? 0.7 : 1 }}>
          {loading ? "…" : "Look up"}
        </button>
      </form>
      {result && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--surface-1)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{result.symbol}</span>
          <span style={{ fontSize: 18, fontWeight: 500, color: "var(--text-accent)" }}>
            ${Number(result.currentPrice).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Portfolio Table ──────────────────────────────────────────────────────────
function PortfolioTable({ stocks, onEdit, onDelete }) {
  if (stocks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
        <i className="ti ti-chart-bar-off" style={{ fontSize: 40, display: "block", marginBottom: 12 }} aria-hidden="true" />
        <p style={{ margin: "0 0 4px", fontWeight: 500, color: "var(--text-secondary)" }}>No stocks yet</p>
        <p style={{ margin: 0, fontSize: 13 }}>Add your first stock to start tracking.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
            {["Symbol", "Qty", "Buy price", "Invested", "Added"].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
            ))}
            <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 500, color: "var(--text-secondary)", fontSize: 12 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((s, i) => {
            const invested = s.buyPrice * s.quantity;
            return (
              <tr key={s._id} style={{ borderBottom: "0.5px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--surface-1)" }}>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontWeight: 500, background: "var(--bg-accent)", color: "var(--text-accent)", padding: "2px 8px", borderRadius: 4, fontSize: 13 }}>{s.stockSymbol}</span>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--text-primary)" }}>{s.quantity}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-primary)" }}>${Number(s.buyPrice).toFixed(2)}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-primary)", fontWeight: 500 }}>${invested.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 13 }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                  <button onClick={() => onEdit(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px 6px", borderRadius: 4 }} aria-label={`Edit ${s.stockSymbol}`}>
                    <i className="ti ti-edit" style={{ fontSize: 16 }} aria-hidden="true" />
                  </button>
                  <button onClick={() => onDelete(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-danger)", padding: "4px 6px", borderRadius: 4 }} aria-label={`Delete ${s.stockSymbol}`}>
                    <i className="ti ti-trash" style={{ fontSize: 16 }} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ stock, onClose, onConfirm, loading }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, padding: "1.5rem", width: "100%", maxWidth: 340, textAlign: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-danger)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <i className="ti ti-trash" style={{ fontSize: 22, color: "var(--text-danger)" }} aria-hidden="true" />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 500 }}>Remove {stock.stockSymbol}?</h2>
        <p style={{ margin: "0 0 1.25rem", fontSize: 14, color: "var(--text-secondary)" }}>This will delete the stock from your portfolio. This can't be undone.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, background: "var(--fill-danger)", color: "var(--on-danger)", border: "none", borderRadius: "var(--radius)", padding: "9px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout, addToast }) {
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
    try {
      const data = await api("/portfolio");
      setStocks(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingStocks(false);
    }
  }, [addToast]);

  const fetchPortfolioValue = async () => {
    setLoadingValue(true);
    setPortfolioValue(null);
    try {
      const data = await api("/stock/portfolio/value");
      setPortfolioValue(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoadingValue(false);
    }
  };

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const totalInvested = stocks.reduce((sum, s) => sum + s.buyPrice * s.quantity, 0);

  const handleSave = (stock, action) => {
    if (action === "add") setStocks((prev) => [...prev, stock]);
    else setStocks((prev) => prev.map((s) => (s._id === stock._id ? stock : s)));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api(`/portfolio/${deleteStock._id}`, { method: "DELETE" });
      setStocks((prev) => prev.filter((s) => s._id !== deleteStock._id));
      addToast(`${deleteStock.stockSymbol} removed.`);
      setDeleteStock(null);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("spt_token");
    localStorage.removeItem("spt_user");
    onLogout();
  };

  const plColor = portfolioValue
    ? portfolioValue.profitloss >= 0 ? "var(--text-success)" : "var(--text-danger)"
    : "var(--text-primary)";

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-0)" }}>
      {/* Header */}
      <div style={{ background: "var(--surface-2)", borderBottom: "0.5px solid var(--border)", padding: "0 1.5rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-chart-line" style={{ fontSize: 20, color: "var(--text-accent)" }} aria-hidden="true" />
            <span style={{ fontWeight: 500, fontSize: 15, color: "var(--text-primary)" }}>StockTracker</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Hi, {user.name}</span>
            <button onClick={logout} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-logout" aria-hidden="true" style={{ fontSize: 15 }} /> Sign out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.5rem" }}>
        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
          {[
            { label: "Holdings", value: stocks.length, icon: "ti-list", fmt: (v) => v },
            { label: "Total invested", value: totalInvested, icon: "ti-coins", fmt: (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
            { label: "Current value", value: portfolioValue?.currentValue, icon: "ti-trending-up", fmt: (v) => v != null ? "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—" },
            { label: "Profit / loss", value: portfolioValue?.profitloss, icon: "ti-arrows-diff", fmt: (v) => v != null ? (v >= 0 ? "+" : "") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", color: plColor },
          ].map(({ label, value, icon, fmt, color }) => (
            <div key={label} style={{ background: "var(--surface-1)", borderRadius: "var(--radius)", padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 14, color: "var(--text-muted)" }} aria-hidden="true" />
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, color: color || "var(--text-primary)" }}>{fmt(value)}</div>
            </div>
          ))}
        </div>

        {/* Action row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>Your portfolio</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchPortfolioValue} disabled={loadingValue || stocks.length === 0} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <i className="ti ti-refresh" aria-hidden="true" style={{ fontSize: 14 }} />
              {loadingValue ? "Fetching…" : "Refresh values"}
            </button>
            <button onClick={() => { setEditStock(null); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "var(--fill-accent)", color: "var(--on-accent)", border: "none", borderRadius: "var(--radius)", padding: "7px 14px", fontWeight: 500, cursor: "pointer" }}>
              <i className="ti ti-plus" aria-hidden="true" style={{ fontSize: 14 }} /> Add stock
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "var(--surface-2)", border: "0.5px solid var(--border)", borderRadius: 12, marginBottom: "1.5rem", overflow: "hidden" }}>
          {loadingStocks
            ? <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 14 }}>Loading portfolio…</div>
            : <PortfolioTable stocks={stocks} onEdit={(s) => { setEditStock(s); setShowModal(true); }} onDelete={(s) => setDeleteStock(s)} />
          }
        </div>

        {/* Price lookup */}
        <PriceLookup addToast={addToast} />
      </div>

      {showModal && (
        <StockModal stock={editStock} onClose={() => { setShowModal(false); setEditStock(null); }} onSave={handleSave} addToast={addToast} />
      )}
      {deleteStock && (
        <DeleteConfirm stock={deleteStock} onClose={() => setDeleteStock(null)} onConfirm={handleDelete} loading={deleting} />
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => getUser());
  const { toasts, addToast } = useToast();

  return (
    <>
      <Toast toasts={toasts} />
      {user
        ? <Dashboard user={user} onLogout={() => setUser(null)} addToast={addToast} />
        : <AuthPage onAuth={(u) => setUser(u)} addToast={addToast} />
      }
    </>
  );
}
