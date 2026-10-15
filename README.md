Quantum Stock Tracker

A MERN stack web app for tracking a personal stock portfolio. Create a profile for each stock you hold, and the app fetches its current price from the Alpha Vantage API and calculates your overall profit or loss.

Live demo: [add link]
Demo video / screenshots: [add link or images below]

Features
Stock profiles
Create, view, edit, and delete stock holdings
Each profile stores the stock name, symbol, quantity, buy price, and other relevant details
Current price fetched from the Alpha Vantage API
Dashboard and analytics
Total holdings: number of stocks in your portfolio
Total invested amount: cost basis across all holdings
Current portfolio value: calculated from live prices fetched from the API
Profit / Loss: current value minus invested amount
30-day performance area chart (uses simulated data)
Refresh button to pull the latest prices on demand
How It Works
Add / edit / delete stock
Click refresh
Save or update holdings
Fetch current price
Latest price
Stored holdings
Holdings + current prices
User opens dashboard
React frontend
Express REST API
MongoDB
Alpha Vantage API
Calculate metrics
Dashboard: holdings,invested amount, portfoliovalue, profit/loss, 30-daychart
Tech Stack
Layer	Technology
Frontend	React, [charting library, e.g. Recharts]
Backend	Node.js, Express
Database	MongoDB (Mongoose)
External API	Alpha Vantage
Getting Started
Prerequisites
Node.js (v18 or later)
MongoDB (local or Atlas)
A free Alpha Vantage API key
Installation
bash
git clone https://github.com/adijoshi07/[repo-name].git
cd [repo-name]

# install backend dependencies
cd server
npm install

# install frontend dependencies
cd ../client
npm install
Environment variables

Create a .env file in the server folder:

MONGO_URI=your_mongodb_connection_string
ALPHA_VANTAGE_API_KEY=your_api_key
PORT=5000
Run the app
bash
# backend
cd server
npm start

# frontend (in a new terminal)
cd client
npm start
API Endpoints

Update this table to match your routes.

Method	Endpoint	Description
GET	/api/stocks	Get all stock holdings
POST	/api/stocks	Add a new stock
PUT	/api/stocks/:id	Update a stock
DELETE	/api/stocks/:id	Delete a stock
GET	/api/stocks/refresh	Fetch latest prices from Alpha Vantage
Notes and Limitations
The 30-day performance chart currently uses simulated data, not real historical prices.
The Alpha Vantage free tier has request limits, so refreshing many stocks at once may hit the limit.
Future Improvements
Replace simulated chart data with real historical prices from the API
Cache prices on the backend to reduce API calls
Add user authentication so each user has a private portfolio
Add price alerts and sector-wise portfolio breakdown
