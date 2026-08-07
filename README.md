# Artisan Koforidua — Web Application for Booking & Managing Artisan Services

A full-stack marketplace that connects **clients** with skilled **artisans** (plumbers,
electricians, carpenters, painters, welders, masons, etc.) across the **Koforidua
Municipality**, with a platform **administrator** overseeing the system.

Built as a final-year project to the specification: search & book artisans, manage
profiles & portfolios, track bookings, leave reviews, receive notifications, pay with
Mobile Money, and view reports.

---

## Documentation

- [Setup walkthrough](docs/SETUP.md) — detailed install & run guide (Docker or local MySQL)
- [Deploy to Render + MySQL](docs/DEPLOY_RENDER.md) — production hosting guide
- [API reference](docs/API.md) — every endpoint, grouped by module
- [ER diagram](docs/ER_DIAGRAM.md) — database schema + booking lifecycle (Mermaid)

---

## Tech stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| Frontend       | React 18 + Vite + Tailwind CSS + Recharts   |
| Backend        | Node.js + Express (ES modules)              |
| Database       | MySQL (via `mysql2`)                         |
| Auth           | JWT + bcrypt                                |
| File storage   | Cloudinary (local disk fallback in dev)     |
| Maps           | Google Maps (embed) + Geolocation           |
| Notifications  | In-app + Email (Nodemailer) + SMS (Hubtel/Twilio) |
| Payments       | Paystack (MTN MoMo / Telecel / AirtelTigo / card) |

> The app is designed to **run out-of-the-box in development without any paid API keys**.
> Email/SMS fall back to console logging, image uploads fall back to local disk, and
> payments/maps simply stay disabled until you add keys. Add real keys in `.env` to go live.

---

## Project structure

```
artisan/
├── backend/                # Express REST API
│   ├── db/schema.sql       # MySQL schema
│   └── src/
│       ├── config/         # env, db pool, cloudinary
│       ├── controllers/    # request handlers
│       ├── middleware/     # auth, validation, errors, uploads
│       ├── routes/         # API routes
│       ├── services/       # payments, sms, email, otp, recommendation, notifications
│       ├── scripts/        # db:init, db:seed
│       └── app.js / server.js
└── frontend/               # React SPA
    └── src/
        ├── api/            # axios client
        ├── components/     # Navbar, cards, charts helpers...
        ├── context/        # AuthContext
        └── pages/          # Home, auth, listing, profile, booking, dashboards
```

---

## Prerequisites

- **Node.js 18+** (tested on v22)
- **MySQL 8+** running locally (XAMPP/WAMP, Docker, or a native install)

---

## Getting started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # then edit DB credentials (Windows: copy .env.example .env)
npm run db:init               # creates the database + tables from schema.sql
npm run db:seed               # loads demo data (admin, clients, artisans, bookings)
npm run dev                   # starts API at http://localhost:5000
```

If MySQL isn't on your PATH, you can still run the SQL by importing `backend/db/schema.sql`
through phpMyAdmin / MySQL Workbench, then run `npm run db:seed`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # starts the app at http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend on port 5000, so just
open **http://localhost:5173**.

---

## Demo accounts (after `npm run db:seed`)

All demo passwords are: **`Passw0rd!`**

| Role    | Email                  |
| ------- | ---------------------- |
| Admin   | `admin@artisan.gh`     |
| Client  | `client1@artisan.gh`   |
| Artisan | `artisan1@artisan.gh`  |

> Phone verification & password-reset codes are sent by SMS. In development
> (`SMS_PROVIDER=console`) the 6-digit code is printed in the **backend terminal**.

---

## Environment variables (`backend/.env`)

| Key | Purpose |
| --- | --- |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | MySQL connection |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Token signing |
| `CLOUDINARY_*` | Image storage (optional; falls back to local disk) |
| `SMTP_*`, `EMAIL_FROM` | Email notifications (optional; falls back to console) |
| `SMS_PROVIDER` (`console`/`hubtel`/`twilio`) + provider keys | OTP & SMS alerts |
| `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` | Mobile Money / card payments |
| `GOOGLE_MAPS_API_KEY` | Maps (the profile map embed works without a key) |

---

## Feature checklist

**Clients** — register/login, forgot/reset password, search & filter (trade, location,
rating, availability), AI-style recommendations, view rich artisan profiles (portfolio +
reviews + map + WhatsApp), book a service, track bookings, pay with Mobile Money, leave reviews.

**Artisans** — register with trade details, manage profile & availability, upload avatar &
portfolio gallery, manage services & pricing, accept/reject/complete bookings, earnings
dashboard with charts, notifications.

**Admin** — dashboard stats & charts, approve artisan registrations, suspend/reactivate
users, monitor all bookings, moderate (hide/restore) reviews, reports (most-booked
artisans, top trades, monthly bookings).

**Advanced** — GPS-aware recommendations, WhatsApp deep links, OTP phone verification,
portfolio gallery, explainable recommendation engine, Mobile Money payments.

---

## API overview

Base URL: `http://localhost:5000/api`

| Group | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/phone/send-otp`, `POST /auth/phone/verify`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Artisans | `GET /artisans/trades`, `GET /artisans/:id`, `GET/PUT /artisans/me/profile`, `GET /artisans/me/earnings`, `POST /artisans/me/avatar`, portfolio & services CRUD |
| Search | `GET /search`, `GET /search/recommend` |
| Bookings | `POST /bookings`, `GET /bookings/me`, `GET /bookings/artisan`, `PATCH /bookings/:id/status` |
| Reviews | `POST /reviews`, `GET /reviews/artisan/:artisanId` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Payments | `POST /payments/initialize`, `GET /payments/verify/:reference` |
| Admin | `GET /admin/dashboard`, `GET /admin/users`, `PATCH /admin/users/:id/active`, `GET /admin/artisans/pending`, `PATCH /admin/artisans/:id/approve`, `GET /admin/bookings`, `GET /admin/reviews`, `PATCH /admin/reviews/:id/hidden`, `GET /admin/reports` |

---

## How the recommendation engine works

`backend/src/services/recommendation.service.js` ranks artisans with a transparent,
weighted score (no opaque black box, which is ideal to document in your report):

- **35%** rating quality
- **25%** proximity to the client (Haversine distance from GPS)
- **20%** reliability (experience + jobs completed)
- **15%** trade affinity from the client's previous bookings
- **5%** current availability

---

## License

MIT — built for academic use in the Koforidua Municipality.
