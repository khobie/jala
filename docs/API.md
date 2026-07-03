# API Reference

Base URL (development): `http://localhost:5000/api`
(The frontend reaches it through the Vite proxy at `/api`.)

## Conventions

- All request/response bodies are JSON unless uploading files (`multipart/form-data`).
- Authentication uses a **Bearer JWT**: `Authorization: Bearer <token>`.
- Success responses include `"success": true`. Errors return
  `{ "success": false, "message": "...", "details"?: [...] }` with an appropriate HTTP status.
- Roles: `client`, `artisan`, `admin`.

---

## Auth — `/auth`

| Method | Path | Auth | Body | Description |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | — | `name, email, phone, password, role(client\|artisan)` + (artisan) `trade, experience, location, bio` | Create account. Returns `token`, `user`, and `devCode` (dev only). |
| POST | `/auth/login` | — | `email, password` | Returns `token`, `user`. |
| GET | `/auth/me` | any | — | Current user (+ artisan profile if applicable). |
| POST | `/auth/phone/send-otp` | any | — | (Re)send phone OTP. Returns `devCode` in dev. |
| POST | `/auth/phone/verify` | any | `code` | Verify phone with OTP. |
| POST | `/auth/forgot-password` | — | `email` | Send password-reset OTP. Returns `devCode` in dev. |
| POST | `/auth/reset-password` | — | `email, code, newPassword` | Reset password using OTP. |

> **`devCode`** is only included when `SMS_PROVIDER=console` (development). With a real
> SMS provider configured it is never returned.

---

## Artisans — `/artisans`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/artisans/trades` | — | Distinct trades with counts (for filters). |
| GET | `/artisans/:id` | — | Full public profile (services, portfolio, reviews). |
| GET | `/artisans/me/profile` | artisan | Own profile. |
| PUT | `/artisans/me/profile` | artisan | Update profile fields. |
| GET | `/artisans/me/earnings` | artisan | Earnings stats + monthly breakdown. |
| POST | `/artisans/me/avatar` | artisan | `multipart` `image`. Upload avatar. |
| POST | `/artisans/me/portfolio` | artisan | `multipart` `image, kind(before\|after\|general), caption?`. |
| DELETE | `/artisans/me/portfolio/:imageId` | artisan | Remove a portfolio image. |
| POST | `/artisans/me/services` | artisan | `service_name, description?, price?`. |
| PUT | `/artisans/me/services/:serviceId` | artisan | Update a service. |
| DELETE | `/artisans/me/services/:serviceId` | artisan | Delete a service. |

---

## Search — `/search`

| Method | Path | Auth | Query | Description |
| --- | --- | --- | --- | --- |
| GET | `/search` | — | `trade, location, minRating, availability, q, sort(rating\|experience\|jobs\|newest), page, limit` | Paginated artisan search. Returns `results, total, page, limit`. |
| GET | `/search/recommend` | optional | `trade?, lat?, lng?, limit?` | Personalized recommendations with `match_score` & `distance_km`. |

---

## Bookings — `/bookings`

| Method | Path | Auth | Body | Description |
| --- | --- | --- | --- | --- |
| POST | `/bookings` | client | `artisan_id, service_id?, booking_date, booking_time?, description, address?, amount?` | Create a booking request. |
| GET | `/bookings/me` | client | — (`?status`) | Client's bookings. |
| GET | `/bookings/artisan` | artisan | — (`?status`) | Bookings made to the artisan. |
| GET | `/bookings/:id` | involved party / admin | — | Single booking. |
| PATCH | `/bookings/:id/status` | involved party | `status(accepted\|rejected\|completed\|cancelled)` | Transition booking status (validated lifecycle). |

---

## Reviews — `/reviews`

| Method | Path | Auth | Body | Description |
| --- | --- | --- | --- | --- |
| POST | `/reviews` | client | `booking_id, rating(1-5), comment?` | Review a completed booking (one per booking). |
| GET | `/reviews/artisan/:artisanId` | — | — | Visible reviews for an artisan. |

---

## Notifications — `/notifications`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/notifications` | any | List notifications + `unread` count. |
| PATCH | `/notifications/:id/read` | any | Mark one as read. |
| PATCH | `/notifications/read-all` | any | Mark all as read. |

---

## Payments — `/payments`

| Method | Path | Auth | Body | Description |
| --- | --- | --- | --- | --- |
| POST | `/payments/initialize` | client | `booking_id` | Initialize Paystack transaction. Returns `authorization_url`, `reference`. |
| GET | `/payments/verify/:reference` | any | — | Verify a transaction and update its status. |

---

## Admin — `/admin` (all require `admin` role)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/admin/dashboard` | Platform stats, bookings-by-status, recent bookings. |
| GET | `/admin/users` | List users (`?role`). |
| PATCH | `/admin/users/:id/active` | Suspend / reactivate (`is_active`). |
| GET | `/admin/artisans/pending` | Artisans awaiting approval. |
| PATCH | `/admin/artisans/:id/approve` | Approve an artisan. |
| GET | `/admin/bookings` | All bookings. |
| GET | `/admin/reviews` | All reviews. |
| PATCH | `/admin/reviews/:id/hidden` | Hide / restore a review (`is_hidden`). |
| GET | `/admin/reports` | Top artisans, top trades, monthly bookings. |

---

## Utility

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness probe. |
| GET | `/config` | Public runtime config (Google Maps key, Paystack public key, `paymentsEnabled`). |

---

## Example: full client flow with `curl`

```bash
# 1. Login
TOKEN=$(curl -s http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client1@artisan.gh","password":"Passw0rd!"}' | jq -r .token)

# 2. Search electricians in Koforidua
curl -s "http://localhost:5000/api/search?trade=Electrician&minRating=4" | jq

# 3. Create a booking (artisan id 1)
curl -s http://localhost:5000/api/bookings \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"artisan_id":1,"booking_date":"2026-07-15","description":"Wiring for 2-bed apartment","amount":250}'
```
