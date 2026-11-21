# Deployment Guide

CampusGigs is deployed as three free services:

| Part | Service | What it hosts |
|---|---|---|
| Database | MongoDB Atlas | `campusgigs` database (already in use) |
| Backend | Render (Web Service) | `server/` — Node + Express API |
| Frontend | Vercel | `client/` — React (Vite) build |

## 1. MongoDB Atlas
1. **Security → Network Access → Add IP Address → Allow Access From Anywhere** (`0.0.0.0/0`). Render uses changing IPs, so this is required.
2. Keep your database user and password (they go into `MONGO_URI`).

## 2. Backend on Render
1. Push the project to GitHub (see the main README).
2. On https://render.com choose **New → Web Service** and connect the GitHub repository.
3. Settings:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
4. Under **Environment** add:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas connection string (with the real username/password) |
   | `JWT_SECRET` | a long random string (at least 32 characters) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | your Vercel URL (add it after step 3; see below) |

5. Deploy. When it is live, open `https://<your-service>.onrender.com/api/health` — it must return `{"status":"ok", ...}`.

> The free Render plan sleeps after ~15 minutes without traffic. The first request after that takes about 30–60 seconds to wake the server.

## 3. Frontend on Vercel
1. On https://vercel.com choose **Add New → Project** and import the same GitHub repository.
2. Settings:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (detected automatically)
   - **Environment Variable:** `VITE_API_URL` = `https://<your-service>.onrender.com/api`  (must end with `/api`)
3. Deploy. `client/vercel.json` makes React Router links such as `/gigs/123` work after a page refresh.

## 4. Connect the two (CORS)
1. Copy the Vercel URL (for example `https://campusgigs.vercel.app`, **no trailing slash**).
2. In Render → **Environment**, set `CLIENT_URL` to that URL. To keep local development working too, separate with a comma:
   `https://campusgigs.vercel.app,http://localhost:5173`
3. Render redeploys automatically.

## 5. Verify the live site
1. Open the Vercel URL, register a client and a freelancer, post a gig, apply, accept and send a message.
2. Optional: run the automated API test against the live backend:
   ```bash
   cd server
   API_URL=https://<your-service>.onrender.com/api npm run test:api
   ```
   (On Windows PowerShell: `$env:API_URL="https://<your-service>.onrender.com/api"; npm run test:api`)

## Troubleshooting
| Problem | Fix |
|---|---|
| Browser console shows a CORS error | `CLIENT_URL` on Render does not exactly match the Vercel URL (no trailing slash). |
| Login/Register says network error | `VITE_API_URL` is wrong or missing `/api`. After changing it, **redeploy** the Vercel project (Vite reads it at build time). |
| First request is very slow | Render free instance was asleep; wait up to a minute. |
| Render logs show `MongoDB connection error` | Atlas Network Access must allow `0.0.0.0/0`; check the username/password in `MONGO_URI`. |
| Refreshing `/gigs/...` gives 404 on Vercel | `client/vercel.json` is missing from the repository. |
| `Missing environment variable(s)` in Render logs | Add `MONGO_URI` and `JWT_SECRET` in the Render Environment tab. |
