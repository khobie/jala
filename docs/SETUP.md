# Setup Walkthrough

A step-by-step guide to get the Artisan Koforidua platform running locally.

## 0. Prerequisites

- **Node.js 18+** — check with `node -v`
- **One of:**
  - **Docker Desktop** (recommended — zero MySQL install), or
  - A local **MySQL 8** server (XAMPP / WAMP / native)

---

## Option A — Run the database with Docker (recommended)

From the project root:

```bash
docker compose up -d
```

This starts:

| Container | Port | Purpose |
| --- | --- | --- |
| `artisan_mysql` | 3306 | MySQL 8 (tables auto-created from `backend/db/schema.sql`) |
| `artisan_adminer` | 8080 | Web DB browser at http://localhost:8080 |

The default `backend/.env` already matches this (host `localhost`, user `root`, empty password, db `artisan_db`).

Browse the DB at **http://localhost:8080** → System: `MySQL`, Server: `mysql`, Username: `root`, Password: *(blank)*, Database: `artisan_db`.

### Useful Docker commands

```bash
docker compose stop      # stop (keeps data)
docker compose up -d     # start again
docker compose down      # remove containers (data kept in volume)
docker compose down -v   # remove EVERYTHING incl. data (then re-seed)
```

---

## Option B — Use your own MySQL

1. Ensure MySQL is running.
2. Edit `backend/.env` with your credentials (`DB_USER`, `DB_PASSWORD`, etc.).
3. Create the schema:
   ```bash
   cd backend
   npm run db:init
   ```
   (Or import `backend/db/schema.sql` via phpMyAdmin / MySQL Workbench.)

---

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run db:seed             # load demo accounts + data
npm run dev                 # http://localhost:5000
```

> If you used Docker, the tables already exist — `npm run db:seed` is all you need.
> If you used a fresh local MySQL, run `npm run db:init` before `npm run db:seed`.

## 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Open **http://localhost:5173**.

---

## 3. Log in

All demo passwords: **`Passw0rd!`**

| Role | Email |
| --- | --- |
| Admin | `admin@artisan.gh` |
| Client | `client1@artisan.gh` |
| Artisan | `artisan1@artisan.gh` |

When registering a **new** account, the phone-verification code is shown directly on the
verify screen in development (and also printed in the backend terminal).

---

## 4. Optional: enable real integrations

Add these to `backend/.env` and restart the backend:

| Feature | Variables |
| --- | --- |
| Image storage | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| Real SMS/OTP | `SMS_PROVIDER=hubtel` (+ Hubtel keys) or `twilio` (+ Twilio keys) |
| Mobile Money / card | `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` |
| Maps | `GOOGLE_MAPS_API_KEY` |

Without these, the app still runs fully: images save to local disk, email/SMS print to the
console, and payment/map features stay disabled.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Backend logs "Database connection failed" | Start MySQL / `docker compose up -d`, verify `backend/.env`. |
| Frontend shows `proxy error ECONNREFUSED` | Backend isn't running on port 5000, or a stray `PORT` env var changed it. |
| Search returns empty | Run `npm run db:seed`. |
| Port already in use | Stop the other process or change `PORT` (backend) / `server.port` in `vite.config.js`. |
| Changed `schema.sql` but tables didn't change | With Docker: `docker compose down -v && docker compose up -d`, then re-seed. |
