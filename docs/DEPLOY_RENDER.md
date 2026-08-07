# Deploy to Render with MySQL

This guide deploys **Jala / Artisan Koforidua** to production using:

| Part | Where | Technology |
| --- | --- | --- |
| **Frontend** | Vercel *or* Render Static | React (Vite) |
| **Backend API** | Render Web Service | Node.js + Express |
| **Database** | External MySQL host | MySQL 8 |

> **Important:** [Render](https://render.com) hosts your **API**, not MySQL directly.
> Render's built-in databases are **PostgreSQL**. For **MySQL**, use a free cloud MySQL
> provider and connect via `DATABASE_URL`.

Recommended free MySQL hosts:
- [Aiven](https://aiven.io) — MySQL free trial / tier
- [PlanetScale](https://planetscale.com) — MySQL-compatible
- [Railway](https://railway.app) — MySQL plugin

Repo: [github.com/khobie/jala](https://github.com/khobie/jala)

---

## Architecture (production)

```text
[Vercel / Render Static]     [Render Web Service]     [Cloud MySQL]
   jala-coral.vercel.app  →   jala-api.onrender.com  →  Aiven / PlanetScale
        React                      Node.js API              MySQL 8
```

---

## Step 1 — Create a MySQL database

### Option A: Aiven (recommended)

1. Sign up at [aiven.io](https://aiven.io).
2. Create a **MySQL** service (free trial available).
3. Copy the connection details. Format as:
   ```text
   mysql://USER:PASSWORD@HOST:PORT/DATABASE
   ```
4. Enable **SSL** (required for most cloud MySQL).

### Option B: PlanetScale

1. Create a database at [planetscale.com](https://planetscale.com).
2. Get the connection string (may need `?ssl={"rejectUnauthorized":true}`).

---

## Step 2 — Create tables in cloud MySQL

On your **local machine**, with the cloud `DATABASE_URL` set:

```bash
cd backend
npm install

# Windows PowerShell (one line):
$env:DATABASE_URL="mysql://USER:PASS@HOST:3306/DATABASE"
$env:DB_SSL="true"
npm run db:migrate
npm run db:seed
```

This runs `schema-tables.sql` (creates all 9 tables) and loads demo data.

---

## Step 3 — Deploy the API to Render

### Using the Blueprint (`render.yaml`)

1. Push this repo to GitHub: [github.com/khobie/jala](https://github.com/khobie/jala).
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the `jala` repo — Render reads `render.yaml`.
4. Set these **secret** environment variables for `jala-api`:

| Variable | Example | Required |
| --- | --- | --- |
| `DATABASE_URL` | `mysql://user:pass@host:3306/artisan_db` | ✅ |
| `CLIENT_URL` | `https://jala-coral.vercel.app,https://jala-web.onrender.com` | ✅ |
| `JWT_SECRET` | long random string (Render can auto-generate) | ✅ |
| `DB_SSL` | `true` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `SMS_PROVIDER` | `console` or `hubtel` | optional |
| `CLOUDINARY_*` | for image uploads in prod | recommended |
| `PAYSTACK_*` | for Mobile Money | optional |

5. Deploy. Your API will be at: `https://jala-api.onrender.com`
6. Test: `https://jala-api.onrender.com/api/health`

### Manual setup (without Blueprint)

1. **New → Web Service** → connect GitHub repo.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add env vars from the table above.

---

## Step 4 — Deploy the frontend

You already have **[jala-coral.vercel.app](https://jala-coral.vercel.app)** on Vercel.

### Vercel (recommended — keep existing site)

1. Vercel project → **Settings** → **Environment Variables**
2. Add:
   ```text
   VITE_API_URL = https://jala-api.onrender.com
   ```
3. **Redeploy** the frontend.

The React app will call `https://jala-api.onrender.com/api/...` instead of the local proxy.

### Or: Render Static Site

The `render.yaml` includes a `jala-web` static site. Set:

```text
VITE_API_URL = https://jala-api.onrender.com
```

---

## Step 5 — Verify end-to-end

1. Open your frontend URL.
2. Search artisans — data should load from Render API + cloud MySQL.
3. Log in: `client1@artisan.gh` / `Passw0rd!`
4. Check API health: `GET /api/health`

---

## Environment variables reference

### Backend (Render `jala-api`)

```env
NODE_ENV=production
PORT=10000                    # Render sets PORT automatically
DATABASE_URL=mysql://...
DB_SSL=true
CLIENT_URL=https://jala-coral.vercel.app
JWT_SECRET=your-long-secret
SMS_PROVIDER=console
```

### Frontend (Vercel or Render)

```env
VITE_API_URL=https://jala-api.onrender.com
```

---

## Notes & tips

### Free tier cold starts
Render free tier **spins down after inactivity**. First request may take ~30 seconds.
Upgrade to a paid plan for always-on, or use a uptime ping service for demos.

### File uploads on Render
Render's disk is **ephemeral** — uploaded files disappear on redeploy.
For production, set **Cloudinary** keys in Render env vars.

### CORS
`CLIENT_URL` must include **every** frontend origin, comma-separated:
```text
https://jala-coral.vercel.app,http://localhost:5173
```

### Re-seed production (careful!)
```bash
DATABASE_URL=... DB_SSL=true npm run db:seed
```
This **wipes demo data** and reloads it. Only run once after first deploy.

---

## Quick command summary

```bash
# Local development (Docker MySQL)
docker compose up -d
cd backend && npm run dev
cd frontend && npm run dev

# Cloud MySQL setup (one-time)
DATABASE_URL=mysql://... DB_SSL=true npm run db:migrate
DATABASE_URL=mysql://... DB_SSL=true npm run db:seed

# Production API test
curl https://jala-api.onrender.com/api/health
```
