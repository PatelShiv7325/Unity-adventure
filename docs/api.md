# API reference (v0.1)

Base URL: `http://localhost:5000/api`. Protected routes need `Authorization: Bearer <token>`.

| Method | Path | Auth | Purpose | Status |
|---|---|---|---|---|
| GET | /health | - | Health check | done |
| POST | /auth/register | - | Create account | done |
| POST | /auth/login | - | Log in, returns JWT | done |
| GET | /auth/me | user | Current user | done |
| POST | /auth/google | - | Google login | Step 8 |
| GET | /activities | - | List activities | done |
| GET | /activities/:slug | - | Activity details | done |
| GET | /activities/:slug/slots?date= | - | Available slots | done |
| POST | /bookings | user | Create booking (needs customer_name, customer_phone); starts as pending | done |
| GET | /bookings/:id | user | One of my bookings | done |
| GET | /bookings/mine | user | My bookings | done |
| POST | /bookings/:id/cancel | user | Cancel booking | done |
| POST | /payments/create-order | user | Start payment (Razorpay, or demo mode without keys) | done |
| POST | /payments/verify | user | Verify Razorpay signature, mark paid | done |
| POST | /payments/demo-confirm | user | Fake payment for local testing; disabled when Razorpay keys are set | done |
| GET/POST | /reviews/:activityId | user (POST) | Reviews | done |
| POST | /admin/activities | admin | Add activity | done |
| GET | /admin/bookings, /admin/payments, /admin/users, /admin/revenue | admin | Admin data | done |
| GET | /weather/:slug | - | Live weather | Step 11 |
