# FinTrack

FinTrack is a personal-finance web application for recording transactions, setting financial goals, tracking bill reminders, reviewing monthly reports, calculating ITR and mutual-fund projections, monitoring an Indian stock portfolio, and asking a built-in AI assistant for guidance.

## Features

- INR-based income and expense tracking
- Financial goals and bill reminders
- Monthly income and expense charts
- ITR and mutual-fund calculators
- NSE/BSE portfolio tracking
- Google sign-in and session-based accounts
- AI assistant for financial-planning questions

## Tech stack

- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- Passport Google OAuth
- Chart.js

## Run locally

### 1. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### 2. Configure environment variables

Copy `server/.env.example` to `server/.env`, then provide your own values for:

```env
MONGODB_URI=
SESSION_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=
```

Do not commit `server/.env` or any real credentials.

### 3. Start the app

Run these commands in two separate terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

## Main pages

| Page | Path |
| --- | --- |
| Dashboard overview | `/dashboard` |
| Transactions | `/transactions` |
| Goals | `/goals` |
| Reminders | `/reminders` |
| Monthly reports | `/reports` |
| ITR and mutual-fund calculators | `/calculators` |
| Portfolio | `/portfolio` |
| AI assistant | `/ai-chat` |

## Production note

Before deploying, restrict Google sign-in to approved email addresses and require an authenticated session for every API route. Use HTTPS and keep all secrets in the deployment environment.
