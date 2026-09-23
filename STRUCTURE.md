# Folder and file structure

```
adventure-booking/
├── README.md
├── STRUCTURE.md
├── .gitignore
├── docs/
│   ├── api.md                    API endpoints and status
│   └── roadmap.md                Step-by-step build plan
├── database/
│   └── schema.sql                Reference SQL for all tables
│
├── backend/                      Flask REST API
│   ├── run.py                    Start the server
│   ├── config.py                 Settings read from .env
│   ├── seed.py                   Sample data + admin user
│   ├── requirements.txt
│   ├── .env.example
│   ├── migrations/               Flask-Migrate (Alembic) files
│   ├── tests/
│   │   └── test_health.py
│   └── app/
│       ├── __init__.py           App factory, registers routes
│       ├── extensions.py         db, jwt, cors, migrate
│       ├── models/
│       │   ├── user.py           users
│       │   ├── activity.py       activities, slots
│       │   ├── booking.py        bookings, coupons
│       │   └── review.py         reviews
│       ├── routes/
│       │   ├── auth.py           register, login, me
│       │   ├── activities.py     list, details, slots
│       │   ├── bookings.py       create, my bookings, cancel
│       │   ├── payments.py       Razorpay / Stripe (Step 9)
│       │   ├── reviews.py
│       │   ├── admin.py          admin-only endpoints
│       │   └── weather.py        live weather (Step 11)
│       ├── services/
│       │   ├── payment_service.py
│       │   ├── ticket_service.py         QR tickets
│       │   └── notification_service.py   Email + WhatsApp
│       └── utils/
│           ├── decorators.py     admin_required
│           └── validators.py
│
└── frontend/                     React (Vite)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx               All routes
        ├── api/                  client.js, activities.js, bookings.js
        ├── context/AuthContext.jsx
        ├── components/           Navbar, Footer, ActivityCard, SlotPicker,
        │                         ReviewList, ProtectedRoute
        ├── pages/                Home, Activities, ActivityDetails, Booking,
        │                         About, Contact, Login, Register, Dashboard
        │   └── admin/            AdminLayout, Activities, Bookings, Users,
        │                         Revenue, Coupons
        ├── styles/global.css
        └── i18n/                 en.json, hi.json
```
