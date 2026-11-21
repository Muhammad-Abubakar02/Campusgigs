# Deployment Guide

CampusGigs is deployed on free tiers (no credit card needed):

| Part | Service | What it hosts |
|---|---|---|
| Database | MongoDB Atlas | `campusgigs` database |
| Backend | Vercel (project 1, root `server`) | Express API as a serverless function (`server/api/index.js`) |
| Frontend | Vercel (project 2, root `client`) | React (Vite) build |

> The API can also run on any Node host (Render, Railway, ...) with `npm start` from `server/`; the Vercel entry point is only used on Vercel.

## 1. MongoDB Atlas
1. **Security → Network Access → Add IP Address → Allow Access From Anywhere** (`0.0.0.0/0`). Vercel functions use changing IPs, so this is required.
2. Keep your database user and password (they go into `MONGO_URI`).

## 2. Backend on Vercel
1. Push the project to GitHub (see the main README).
2. On https://vercel.com choose **Add New → Project** and import the GitHub repository.
3. Settings:
   - **Project Name:** `campusgigs-api`
   - **Root Directory:** `server` (click **Edit**)
   - **Framework Preset:** Other
   - Leave Build/Output commands empty.
4. Under **Environment Variables** add:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas connection string (with the real username/password) |
   | `JWT_SECRET` | a long random string (at least 32 characters) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `http://localhost:5173` for now (changed in step 4) |

5. **Deploy.** Open `https://<campusgigs-api>.vercel.app/api/health` — it must return `{"status":"ok", ...}`.

## 3. Frontend on Vercel
1. **Add New → Project**, import the same repository again.
2. Settings:
   - **Project Name:** `campusgigs`
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (detected automatically)
   - **Environment Variable:** `VITE_API_URL` = `https://<campusgigs-api>.vercel.app/api`  (must end with `/api`)
3. **Deploy.** `client/vercel.json` makes React Router links such as `/gigs/123` work after a refresh.

## 4. Connect the two (CORS)
1. Copy the frontend URL (for example `https://campusgigs.vercel.app`, **no trailing slash**).
2. Backend project → **Settings → Environment Variables** → edit `CLIENT_URL` to that URL. To keep local development working too, separate with a comma:
   `https://campusgigs.vercel.app,http://localhost:5173`
3. **Deployments → ⋯ → Redeploy** the backend so the new value is used.

## 5. Verify the live site
1. Open the frontend URL, register a client and a freelancer, post a gig, apply, accept and send a message.
2. Optional: run the automated API test against the live backend:
   ```bash
   cd server
   API_URL=https://<campusgigs-api>.vercel.app/api npm run test:api
   ```
   (Windows PowerShell: `$env:API_URL="https://<campusgigs-api>.vercel.app/api"; npm run test:api`)

## Troubleshooting
| Problem | Fix |
|---|---|
| Browser console shows a CORS error | `CLIENT_URL` on the backend project does not exactly match the frontend URL (no trailing slash) — fix it and redeploy the backend. |
| Login/Register says network error | `VITE_API_URL` is wrong or missing `/api`. After changing it, **redeploy** the frontend (Vite reads it at build time). |
| API returns "Database unavailable" | Atlas Network Access must allow `0.0.0.0/0`; check the username/password in `MONGO_URI`. |
| API returns "missing MONGO_URI or JWT_SECRET" | Add the variables in the backend project's settings, then redeploy. |
| First request after a pause is slow | Serverless cold start; the next requests are fast. |
| Refreshing `/gigs/...` gives 404 | `client/vercel.json` is missing from the repository. |
