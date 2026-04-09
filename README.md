# 🚀 Premium Finance Dashboard

A beautiful, fully private, and self-hosted personal finance tracking dashboard built with Next.js 16. It empowers you to track your Net Worth, Cash, Assets, Subscriptions, and side-hustles in one clean interface reminiscent of professional institutional tools like the Bloomberg Terminal.

![Dashboard Preview](https://via.placeholder.com/1200x600.png?text=Dashboard+Preview)

## ✨ Features

- **Total Wealth Aggregation**: Real-time Net Worth calculation merging cash, assets, and active cash flows.
- **Deep Asset Insights**: Integration with Yahoo Finance via server actions. Click any asset to open a deep-dive modal featuring historical charts (1M, 3M, 1Y, 3Y), real-time Euro-converted quotes, P/E ratios, Ex-Dividend / Earnings Calendar, and Analyst Ratings.
- **Privacy First Approach**: All data is strictly yours. Kept locally in a single invisible `.json` or strictly within a serverless Upstash KV namespace. No third-party accounts required.
- **Advanced Basic Auth**: Completely invisible to intruders. Deployed behind an Edge Proxy that intercepts requests and enforces Basic Authentication before rendering any React code.
- **Smart Cloud Adaptation**: The backend dynamically detects if it's running locally (writing to system storage) or on a cloud provider like Vercel (writing to an Upstash Redis KV instance).

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS (CSS Modules & Global tokens)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Market Data Engine**: Yahoo Finance API v2
- **Cloud Storage**: Upstash Redis (Vercel KV)

---

## 🚀 Getting Started

If you wish to host your own instance or run it locally, follow these steps.

### 1. Local Development (Offline Mode)

Simply clone the repository and run the startup batch script. The application will automatically install dependencies and initialize a local database (`finanzas_db.json`).

```bash
git clone https://github.com/yourusername/DashboardFinanzas.git
cd DashboardFinanzas
./start.bat
```
*(The local DB file is automatically ignored by `.gitignore` to prevent leaking your financial data to GitHub).*

### 2. Cloud Deployment (Vercel / Production Mode)

This dashboard is designed to instantly deploy to Vercel with zero friction.

1. Fork or Import this repository into **Vercel**.
2. Before deploying, configure your Edge Security variables under the **Environment Variables** tab:
   - `AUTH_USER`: `your_secure_username`
   - `AUTH_PASS`: `your_secure_password`
3. Hit **Deploy**.
4. To enable save-persistence in the cloud, attach a free **Upstash Redis** database to the project via the Vercel Storage tab. Vercel will automatically inject the required `KV_REST_API_URL` and `KV_REST_API_TOKEN` tokens. 
5. Redeploy your project. You now have a 100% private financial tracker accessible globally.

---

## 🔒 Security Posture

- **Edge Authorization**: Access is gated at the Next.js `proxy.ts` execution layer. Intruders are blocked via an HTTP 401 response and never reach the application bundles.
- **Zero Config Leakage**: `.env` and `finanzas_db.json` are strictly untracked. A `.env.example` is provided for template configuration.

## 🤝 Contribution
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/DashboardFinanzas/issues).
