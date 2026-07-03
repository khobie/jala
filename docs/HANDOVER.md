# Handover & Defense Guide

This document is for the **student receiving the project**. It explains how to set it up
on your own computer, run it, prepare for the project defense, and answer the questions a
supervisor is likely to ask.

---

## 1. What you are receiving

A full-stack web application — **"Artisan Koforidua"** — that lets clients find and book
artisans (plumbers, electricians, etc.), lets artisans manage their work, and lets an admin
oversee the platform.

```
artisan/
├── backend/      # Node.js + Express REST API
├── frontend/     # React (Vite) web app
├── docs/         # Documentation (this file, API, ER diagram, setup)
├── docker-compose.yml
└── README.md
```

> **You do NOT need the `node_modules` folders.** They are re-created with `npm install`.
> Keep `backend/.env` private — it can contain secret API keys.

---

## 2. Install the tools (one-time)

| Tool | Why | Download |
| --- | --- | --- |
| **Node.js 18+** | Runs the backend & builds the frontend | https://nodejs.org |
| **Docker Desktop** | Runs MySQL with one command (easiest) | https://docker.com/products/docker-desktop |
| *(or)* **XAMPP** | Alternative MySQL if you don't want Docker | https://apachefriends.org |
| **VS Code** | To open and edit the code | https://code.visualstudio.com |

Verify Node works: open a terminal and run `node -v` (should print v18 or higher).

---

## 3. Run the project (every time)

### Step 1 — Start the database

**With Docker (recommended):** from the project root
```bash
docker compose up -d
```

**With XAMPP instead:** open the XAMPP Control Panel → Start **MySQL**. Then create the
database once with `cd backend` and `npm run db:init`.

### Step 2 — Start the backend
```bash
cd backend
npm install        # first time only
npm run db:seed    # first time only — loads demo data
npm run dev        # API at http://localhost:5000
```

### Step 3 — Start the frontend (new terminal)
```bash
cd frontend
npm install        # first time only
npm run dev        # app at http://localhost:5173
```

### Step 4 — Open the app
Go to **http://localhost:5173**.

> Full detail & troubleshooting: see [`docs/SETUP.md`](SETUP.md).

---

## 4. Demo accounts

All passwords are **`Passw0rd!`**

| Role | Email | What to show |
| --- | --- | --- |
| Admin | `admin@artisan.gh` | Stats, approvals, reports, moderation |
| Client | `client1@artisan.gh` | Search, book, pay, review |
| Artisan | `artisan1@artisan.gh` | Accept jobs, profile, portfolio, earnings |

---

## 5. Suggested demo script (for the defense)

Follow this order so the story flows naturally:

1. **Home page** → show search bar, categories, top-rated artisans.
2. **Search** → filter by trade = Electrician, rating 4+, show pagination & "Recommend for me".
3. **Artisan profile** → portfolio (before/after badges), reviews, map, WhatsApp button.
4. **Register a new client** → show the phone verification code appearing on screen (dev mode).
5. **Book an artisan** → fill the form, submit.
6. **Log in as the artisan** (`artisan1@artisan.gh`) → accept the booking, mark complete.
7. **Back as the client** → pay (Mobile Money) and leave a review.
8. **Log in as admin** → show dashboard charts, approve a pending artisan, view reports.

Tip: before the defense, run `npm run db:seed` again to reset to clean demo data.

---

## 6. Likely defense questions & answers

**Q: What architecture does it use?**
A three-tier architecture: a **React** front-end (presentation), a **Node.js/Express**
REST API (application logic), and a **MySQL** database (data). They communicate over HTTP/JSON.

**Q: How is security handled?**
Passwords are hashed with **bcrypt**; sessions use **JWT** tokens. Routes are protected by
authentication middleware and **role-based authorization** (client/artisan/admin). Inputs
are validated server-side, and the API uses Helmet and rate limiting.

**Q: How does the recommendation feature work? (the "AI" part)**
It's an **explainable weighted scoring engine** (in `backend/src/services/recommendation.service.js`):
35% rating, 25% proximity (GPS/Haversine distance), 20% reliability (experience + jobs done),
15% the client's past booking trade affinity, 5% availability. It ranks artisans by a 0–100
match score. (Explainable, not a black box — easy to justify academically.)

**Q: Show me the database design.**
Open [`docs/ER_DIAGRAM.md`](ER_DIAGRAM.md). 9 tables: users, artisans, services,
portfolio_images, bookings, reviews, payments, notifications, otp_codes. Explain the
relationships (a user can be an artisan; a client makes many bookings; a completed booking
can have one review; etc.).

**Q: What is the booking lifecycle?**
pending → accepted/rejected (by artisan) → completed; client can cancel a pending/accepted
booking. The status diagram is in `docs/ER_DIAGRAM.md`.

**Q: Which third-party services are integrated?**
Paystack (Mobile Money / card), Hubtel/Twilio (SMS OTP), Cloudinary (images), Google Maps,
SMTP email. They are optional — the app runs in development without keys (SMS prints to the
console, images save locally), and goes live when keys are added to `backend/.env`.

**Q: How would you deploy this for real?**
Frontend → Netlify/Vercel; API → Render/Railway; MySQL → a managed MySQL host. Set the
production environment variables and point the frontend at the API URL.

**Q: What could be improved / future work?**
Real-time chat, live notifications (WebSockets), an artisan availability calendar, a mobile
app, multi-language (Twi), and an admin analytics export.

---

## 7. Where the important code lives

| Concern | File(s) |
| --- | --- |
| Database schema | `backend/db/schema.sql` |
| Auth (login/register/OTP) | `backend/src/controllers/auth.controller.js` |
| Recommendation engine | `backend/src/services/recommendation.service.js` |
| Booking logic | `backend/src/controllers/booking.controller.js` |
| Admin features | `backend/src/controllers/admin.controller.js` |
| API routes (overview) | `backend/src/routes/index.js` |
| Front-end pages | `frontend/src/pages/` |
| Role routing/guards | `frontend/src/App.jsx`, `frontend/src/components/ProtectedRoute.jsx` |

---

## 8. Final checklist before handover

- [ ] Project folder copied **without** `node_modules` and **without** a private `.env`
      (keep `.env.example`).
- [ ] `docs/` folder included (this guide, SETUP, API, ER diagram).
- [ ] Confirm it runs on a clean machine: install Node + Docker → the 3 run steps above.
- [ ] Re-seed the database so the demo data is clean.
- [ ] Share login credentials (table in section 4).
