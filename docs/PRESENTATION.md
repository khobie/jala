# Presentation / Defense Slide Guide

A ready-to-use slide outline for the project defense of **"Design and Implementation of a
Web Application for Booking and Managing Artisan Services in Koforidua Municipality."**

- **Suggested length:** 12–15 slides, ~12–15 minutes + demo + Q&A.
- For each slide: a **title**, the **bullets to put on the slide**, and **what to say**
  (speaker notes). Keep slide text short — talk to the details, don't read them.
- Tip: do slides 1–7, then the **live demo**, then slides 8–13.

---

## Slide 1 — Title

**On slide:**
- Design and Implementation of a Web Application for Booking and Managing Artisan Services in Koforidua Municipality
- Your name · Index/ID number
- Supervisor's name
- Department · Institution · Date

**Say:** Greet the panel, state your name and your project title in one sentence.

---

## Slide 2 — Introduction & Background

**On slide:**
- Artisans (plumbers, electricians, carpenters…) are vital but hard to find reliably
- Current practice: word-of-mouth, no ratings, no records
- Koforidua Municipality has growing demand for skilled trades

**Say:** Set the scene — finding a trusted artisan today is informal and risky. There's no
central, verified place to search, compare and book them.

---

## Slide 3 — Problem Statement

**On slide:**
- No centralized platform to discover & book artisans
- No verification, ratings, or accountability
- Clients can't compare; artisans lack visibility & records
- No digital payment or booking trail

**Say:** State the gap clearly. This is the problem the project solves.

---

## Slide 4 — Aim & Objectives

**On slide:**
- **Aim:** Build a web platform to connect clients with verified artisans in Koforidua
- **Objectives:**
  1. Let clients search, filter & book artisans
  2. Let artisans manage profiles, jobs & earnings
  3. Provide admin oversight & reporting
  4. Add reviews, notifications & mobile-money payments

**Say:** Aim = the destination; objectives = the measurable steps. You'll show each was met.

---

## Slide 5 — Scope

**On slide:**
- Web application (responsive) for the Koforidua Municipality
- Three user roles: Client, Artisan, Admin
- In scope: search/book, profiles, reviews, payments, reports
- Out of scope (future): native mobile app, live chat

**Say:** Define boundaries so the panel knows what to expect — and what's deliberately left
for future work.

---

## Slide 6 — Literature / Existing Systems

**On slide:**
- Similar global platforms: TaskRabbit, Upwork
- Gap: not localized for Ghana (no Mobile Money, no local trades focus)
- This project: a localized, verified marketplace

**Say:** Briefly compare to known systems and justify why a localized solution is needed.

---

## Slide 7 — Methodology

**On slide:**
- Software development model (e.g. **Agile / Iterative**)
- Requirements → Design → Implementation → Testing → Deployment
- Tools: VS Code, Git, Postman, MySQL Workbench

**Say:** Explain how you built it step by step and why you chose this model (iterative =
build and refine features in increments).

---

## Slide 8 — System Architecture

**On slide:**
- Three-tier architecture diagram:
  `React (frontend)` → `Express REST API (backend)` → `MySQL (database)`
- Communicate via HTTP / JSON; auth via JWT

**Say:** Walk left-to-right: the browser app calls the API, the API enforces rules and talks
to the database. Separation of concerns makes it maintainable and scalable.

> Use the diagram from the README, or draw the 3 boxes.

---

## Slide 9 — Database Design (ER Diagram)

**On slide:**
- ER diagram (from `docs/ER_DIAGRAM.md`)
- 9 tables: users, artisans, services, portfolio_images, bookings, reviews, payments, notifications, otp_codes

**Say:** Point out 2–3 key relationships: a user can be an artisan; a client makes many
bookings; a completed booking can have one review. Mention normalization to avoid data
duplication.

---

## Slide 10 — Key Features (by role)

**On slide:**
- **Client:** search/filter, recommendations, book, pay (MoMo), review
- **Artisan:** profile & portfolio, accept/complete jobs, earnings dashboard
- **Admin:** approvals, user management, moderation, reports
- **Advanced:** OTP verification, GPS recommendations, WhatsApp, before/after gallery

**Say:** Tie each feature back to an objective from Slide 4.

---

## Slide 11 — Technologies Used

**On slide:**
| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind |
| Backend | Node.js + Express |
| Database | MySQL |
| Auth | JWT + bcrypt |
| Payments | Paystack (Mobile Money) |
| Others | Cloudinary, Hubtel/Twilio, Google Maps |

**Say:** Justify a couple of choices (e.g. React for a dynamic UI, MySQL for structured
relational data, JWT for stateless auth).

---

## Slide 12 — The Recommendation Engine (highlight)

**On slide:**
- Explainable weighted scoring (0–100 match)
- 35% rating · 25% proximity (GPS) · 20% reliability · 15% past-booking affinity · 5% availability

**Say:** This is your "wow" feature. Emphasize it's **explainable** (you can justify every
number), not a black box — which is exactly what a supervisor wants to hear.

---

## Slide 13 — LIVE DEMO

**On slide:**
- "Live Demonstration"
- The 3 demo logins (admin / client / artisan)

**Say / do (follow this order):**
1. Home → search Electrician, rating 4+, show recommendations.
2. Open an artisan profile → portfolio (before/after), reviews, map, WhatsApp.
3. Register a new client → show the OTP code appearing on screen.
4. Book the artisan.
5. Log in as artisan → accept & complete the job.
6. Back as client → pay & leave a review.
7. Log in as admin → dashboard charts, approve an artisan, reports.

> **Before the defense:** start Docker + both servers, and run `npm run db:seed` for clean data.
> Have http://localhost:5173 already open in the browser.

---

## Slide 14 — Testing

**On slide:**
- Functional testing of each module (auth, booking, payment, reviews)
- Role-based access verified (client/artisan/admin)
- Input validation & error handling
- Cross-browser & responsive checks

**Say:** Briefly state how you confirmed each feature works and that unauthorized actions
are blocked.

---

## Slide 15 — Challenges, Future Work & Conclusion

**On slide:**
- **Challenges:** integrating payments, role-based security, data modelling
- **Future work:** live chat, real-time notifications, native mobile app, Twi language
- **Conclusion:** objectives achieved — a working, localized artisan booking platform

**Say:** Acknowledge a real challenge and how you solved it. End by restating that every
objective from Slide 4 was met. Thank the panel and invite questions.

---

## Appendix slides (optional, keep in reserve for Q&A)

- Booking status lifecycle diagram (`docs/ER_DIAGRAM.md`)
- API endpoint table (`docs/API.md`)
- Security details (bcrypt, JWT, validation, Helmet, rate limiting)
- Deployment plan (Netlify/Vercel + Render/Railway + managed MySQL)

---

## Delivery tips

- **Practice the demo twice** the night before; demos fail when rushed.
- Have a **backup**: screen-record the demo in case the live one breaks.
- Keep each slide to **~3–5 bullets**; speak to the rest.
- Know **3 things cold:** the architecture, the ER diagram, and the recommendation engine —
  these attract the most questions (answers are in `docs/HANDOVER.md`).
