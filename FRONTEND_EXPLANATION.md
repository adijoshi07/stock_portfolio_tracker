# Stock Portfolio Tracker - Frontend Code Explanation

## 🎯 Project Overview

**QUANTUM** is a stock portfolio management dashboard built with **React**. It allows users to:
- Register and login with JWT authentication
- Add, edit, and delete stocks from their portfolio
- Track portfolio performance with charts
- Look up live stock prices
- View profit/loss calculations

---

## ✨ Key Features

### 1. **User Authentication**
- Register new account with name, email, password
- Login with email and password
- JWT token stored in localStorage
- Automatic logout when token expires
- Protected routes (can't access dashboard without login)

### 2. **Portfolio Management (CRUD)**
- **Create**: Add new stock with ticker symbol, quantity, buy price
- **Read**: View all stocks in a table with details
- **Update**: Edit stock information (quantity, price, ticker)
- **Delete**: Remove stock from portfolio with confirmation

### 3. **Dashboard & Analytics**
- 4 metric cards showing:
  - Total holdings (number of stocks)
  - Total invested amount (cost basis)
  - Current portfolio value (from API)
  - Profit/Loss (calculated as: current value - invested amount)
- 30-day performance area chart (simulated data)
- Real-time data refresh button

### 4. **Live Price Lookup**
- Search for any stock ticker (AAPL, TSLA, etc.)
- Fetch live price from Alpha Vantage API
- Display current price instantly

### 5. **Dark Theme UI**
- Modern dark dashboard design
- Responsive sidebar navigation
- Modal dialogs for add/edit operations
- Toast notifications for user feedback

---

## 📁 File Structure

```
client/
├── src/
│   ├── App.jsx          (Main component - 600+ lines)
│   ├── main.jsx         (React entry point)
│   └── index.css        (Global styles)
├── index.html           (HTML template)
├── package.json         (Dependencies: React, Recharts)
└── vite.config.js       (Vite config)
```

---

## 🔧 Code Breakdown

### **1. Imports & Setup**

```javascript
import { useState, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
```

- **React Hooks**: `useState` (manage state), `useEffect` (side effects), `useCallback` (memoize functions)
- **Recharts**: Library for rendering the performance chart

### **2. API Helper Functions**

```javascript
const API = "http://localhost:5000/api";

function getToken() { 
  return localStorage.getItem("spt_token"); 
}

function getUser() { 
  try { 
    return JSON.parse(localStorage.getItem("spt_user")); 
  } catch { 
    return null; 
  } 
}
```

**Purpose**: 
- Store and retrieve JWT token from browser's localStorage
- Get logged-in user info (name, email, ID)
- Used for authentication on every API call

---

### **3. API Fetch Wrapper**

```javascript
async function api(path, options = {}) {
  const token = getToken();
  let r;
  try {
    r = await fetch(`${API}${path}`, {
      headers: { 
        "Content-Type": "application/json", 
        ...(token ? { Authorization: `Bearer ${token}` } : {}) 
      },
      ...options,
    });
  } catch {
    throw new Error("Backend not running on port 5000");
  }
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || "Request failed");
  return data;
}
```

**What it does**:
1. Makes HTTP requests to backend
2. Automatically adds JWT token to `Authorization` header
3. Handles errors and converts response to JSON
4. Used for all API calls: login, add stock, delete stock, etc.

**Example usage**:
```javascript
const data = await api("/portfolio", { method: "POST", body: JSON.stringify(stockData) });
```

---

### **4. Toast Notification System**

```javascript
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}
```

**What it does**:
- Shows small notifications at top-right (success/error messages)
- Auto-dismisses after 3.5 seconds
- Used for: "Stock added!", "Login successful!", "Error messages"

---

### **5. Authentication Page (AuthPage Component)**

```javascript
function AuthPage({ onAuth, addToast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
```

**State management**:
- `mode`: Toggle between "login" and "register"
- `form`: Store user input (email, password, name)
- `loading`: Show spinner while authenticating

**Key features**:
1. **Toggle between Login/Register**
   ```javascript
   {mode === "register" && <input for name field>}
   ```

2. **Form submission**
   ```javascript
   const submit = async e => {
     const body = mode === "login"
       ? { email: form.email, password: form.password }
       : { name: form.name, email: form.email, password: form.password };
     const data = await api(`/users/${mode}`, { method: "POST", body: JSON.stringify(body) });
   ```

3. **On successful login**:
   ```javascript
   localStorage.setItem("spt_token", data.token);
   localStorage.setItem("spt_user", JSON.stringify(data.user));
   onAuth(data.user); // Switch to dashboard
   ```

---

### **6. Stock Modal (Add/Edit Dialog)**

```javascript
function StockModal({ stock, onClose, onSave, addToast }) {
  const [form, setForm] = useState({ 
    stockSymbol: stock?.stockSymbol || "", 
    quantity: stock?.quantity || "", 
    buyPrice: stock?.buyPrice || "" 
  });
```

**Features**:
1. **Reusable for Add & Edit**
   - If `stock` prop exists → edit mode (pre-fill fields)
   - If no `stock` → add mode (empty fields)

2. **Form validation**
   ```javascript
   const body = { 
     stockSymbol: form.stockSymbol.toUpperCase(), 
     quantity: Number(form.quantity), 
     buyPrice: Number(form.buyPrice) 
   };
   ```

3. **API calls**:
   ```javascript
   if (stock) {
     const updated = await api(`/portfolio/${stock._id}`, { 
       method: "PUT", 
       body: JSON.stringify(body) 
     });
   } else {
     const created = await api("/portfolio", { 
       method: "POST", 
       body: JSON.stringify(body) 
     });
   }
   ```

---

### **7. Sidebar Navigation**

```javascript
function Sidebar({ active, setActive, user, onLogout }) {
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "portfolio", label: "Portfolio", icon: "◈" },
    { id: "market", label: "Market", icon: "📈" },
  ];
```

**Features**:
- Active tab highlighting (orange background)
- User profile section showing name & avatar
- Sign out button
- Navigation between pages

---

### **8. Dashboard View Component**

```javascript
function DashboardView({ stocks, portfolioValue, loadingValue, onRefresh, onAdd }) {
  const totalInvested = stocks.reduce((s, x) => s + x.buyPrice * x.quantity, 0);
  const fmt = v => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
```

**Calculations**:
```javascript
// Total invested = sum of (buyPrice × quantity) for all stocks
const totalInvested = stocks.reduce((s, x) => s + x.buyPrice * x.quantity, 0);

// Format as currency with 2 decimal places
const fmt = v => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
```

**Displays**:
1. **4 Metric Cards**
   - Total Holdings: `stocks.length`
   - Total Invested: calculated above
   - Current Value: from API call (`portfolioValue.currentValue`)
   - Profit/Loss: `portfolioValue.currentValue - totalInvested`
   - Color-coded: Red if negative, Green if positive

2. **Performance Chart**
   ```javascript
   <ResponsiveContainer width="100%" height={200}>
     <AreaChart data={chartData}>
       <Area type="monotone" dataKey="value" stroke="#FF6B2C" fill="url(#grad)" />
     </AreaChart>
   </ResponsiveContainer>
   ```

---

### **9. Portfolio Table Component**

```javascript
function PortfolioTable({ stocks, onEdit, onDelete }) {
  if (stocks.length === 0) return (
    <div>No positions yet</div>
  );
  
  return (
    <table>
      <thead>
        <tr>
          {["Stock", "Buy Price", "Qty", "Invested", "Added", ""].map(h => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {stocks.map((s, i) => (
          <tr key={s._id}>
            <td>{s.stockSymbol}</td>
            <td>${Number(s.buyPrice).toFixed(2)}</td>
            <td>{s.quantity}</td>
            <td>${(s.buyPrice * s.quantity).toLocaleString()}</td>
            <td>{new Date(s.createdAt).toLocaleDateString()}</td>
            <td>
              <button onClick={() => onEdit(s)}>✏️ Edit</button>
              <button onClick={() => onDelete(s)}>🗑️ Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Features**:
- Displays all stocks in tabular format
- Edit button calls `onEdit(s)` → opens modal
- Delete button calls `onDelete(s)` → shows confirmation
- Shows empty state if no stocks
- Calculates "Invested" column: `buyPrice × quantity`

---

### **10. Market View (Price Lookup)**

```javascript
function MarketView({ addToast }) {
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookup = async e => {
    e.preventDefault();
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const data = await api(`/stock/${symbol.trim().toUpperCase()}`);
      setResult(data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };
```

**How it works**:
1. User enters ticker (e.g., "AAPL")
2. Clicks "Look up" button
3. Calls backend API: `/stock/AAPL`
4. Backend fetches from Alpha Vantage API
5. Shows live price in UI

---

### **11. Main Dashboard Component**

```javascript
function Dashboard({ user, onLogout, addToast }) {
  const [active, setActive] = useState("dashboard");
  const [stocks, setStocks] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStock, setEditStock] = useState(null);
  const [deleteStock, setDeleteStock] = useState(null);
```

**State management**:
- `active`: Current tab (dashboard/portfolio/market)
- `stocks`: Array of user's stocks
- `portfolioValue`: Object with totalInvestment, currentValue, profitloss
- `showModal`: Show/hide add/edit stock dialog
- `editStock`: Which stock is being edited (null if adding)
- `deleteStock`: Which stock is being deleted

**Fetch stocks on mount**:
```javascript
const fetchStocks = useCallback(async () => {
  setLoadingStocks(true);
  try { 
    const data = await api("/portfolio"); 
    setStocks(data); 
  }
  catch (err) { 
    addToast(err.message, "error"); 
  } finally { 
    setLoadingStocks(false); 
  }
}, [addToast]);

useEffect(() => { fetchStocks(); }, [fetchStocks]);
```

**Handle add/edit**:
```javascript
const handleSave = (stock, action) => {
  if (action === "add") 
    setStocks(p => [...p, stock]); // Add to list
  else 
    setStocks(p => p.map(s => s._id === stock._id ? stock : s)); // Update
};
```

**Handle delete**:
```javascript
const handleDelete = async () => {
  setDeleting(true);
  try {
    await api(`/portfolio/${deleteStock._id}`, { method: "DELETE" });
    setStocks(p => p.filter(s => s._id !== deleteStock._id)); // Remove from list
    addToast(`${deleteStock.stockSymbol} removed.`);
    setDeleteStock(null);
  } catch (err) { 
    addToast(err.message, "error"); 
  } finally { 
    setDeleting(false); 
  }
};
```

---

### **12. Root App Component**

```javascript
export default function App() {
  const [user, setUser] = useState(() => getUser());
  const { toasts, addToast } = useToast();

  return (
    <>
      <Toast toasts={toasts} />
      {user
        ? <Dashboard user={user} onLogout={() => { 
            localStorage.removeItem("spt_token");
            localStorage.removeItem("spt_user");
            setUser(null); 
          }} addToast={addToast} />
        : <AuthPage onAuth={u => setUser(u)} addToast={addToast} />
      }
    </>
  );
}
```

**Logic**:
1. On app load, check if token exists in localStorage
2. If user logged in → show Dashboard
3. If not logged in → show AuthPage
4. When logout clicked → clear localStorage → show AuthPage again

---

## 📊 Data Flow Diagram

```
User Registration/Login (AuthPage)
    ↓
Token stored in localStorage
    ↓
Dashboard loads
    ↓
fetchStocks() → GET /api/portfolio
    ↓
Display stocks in table
    ↓
User adds stock
    ↓
POST /api/portfolio → Update stocks array
    ↓
User clicks "Refresh values"
    ↓
fetchPortfolioValue() → GET /api/stock/portfolio/value
    ↓
Update metric cards with profit/loss
```

---

## 🎨 Styling Approach

**No CSS file needed!** All styles are inline using JavaScript objects:

```javascript
<div style={{ 
  background: "#1a1d27", 
  border: "1px solid #2a2d3a", 
  borderRadius: 14, 
  padding: "1.25rem" 
}}>
  Content
</div>
```

**Color scheme**:
- Background: `#0f1117` (very dark)
- Cards: `#1a1d27` (dark)
- Borders: `#2a2d3a` (gray)
- Accent: `#FF6B2C` (orange)
- Success: `#10B981` (green)
- Danger: `#EF4444` (red)

---

## 🔌 API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/users/login` | User login |
| POST | `/users/register` | User registration |
| GET | `/portfolio` | Fetch all stocks |
| POST | `/portfolio` | Add new stock |
| PUT | `/portfolio/:id` | Update stock |
| DELETE | `/portfolio/:id` | Delete stock |
| GET | `/stock/:symbol` | Get live price |
| GET | `/stock/portfolio/value` | Get portfolio summary |

---

## 🚀 Key Features Summary

✅ **Authentication**: Secure login/register with JWT
✅ **CRUD Operations**: Add, read, update, delete stocks
✅ **Real-time Data**: Live stock prices from API
✅ **Analytics**: Performance chart and profit/loss calculations
✅ **Responsive UI**: Works on desktop and mobile
✅ **Error Handling**: Toast notifications for feedback
✅ **State Management**: React hooks (useState, useEffect, useCallback)
✅ **API Integration**: Fetch calls with automatic token handling

---

## 💡 Interview Talking Points

1. **Authentication Flow**: 
   - User registers → Password hashed on backend
   - Login returns JWT token → Stored in localStorage
   - Token added to every request header

2. **State Management**:
   - Used React hooks for state (no Redux needed for small app)
   - Callback memoization to prevent unnecessary re-renders

3. **API Integration**:
   - Wrapper function handles auth headers automatically
   - Error handling and loading states

4. **Performance**:
   - Chart renders 30 days of data without lag
   - Modal dialogs for efficient UX

5. **Real-time Features**:
   - Alpha Vantage API integration for live prices
   - Refresh button to update portfolio value

---

## 📚 Technologies Used

- **React 18**: UI library with hooks
- **Recharts**: Data visualization
- **Fetch API**: HTTP requests
- **localStorage**: Client-side storage for tokens
- **Vite**: Modern build tool

---

This is a **production-quality frontend** that demonstrates solid React skills! 🚀
