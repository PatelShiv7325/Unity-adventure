adventure-booking/
├── README.md, STRUCTURE.md, .gitignore, compress_images.py
├── docs/            api.md, roadmap.md
├── database/        schema.sql
├── tools/           optimize_images.py
│
├── backend/
│   ├── run.py, config.py, seed.py, show_data.py
│   ├── requirements.txt, requirements-dev.txt, .env.example
│   ├── tests/       conftest.py, test_health.py, test_payments.py
│   └── app/
│       ├── __init__.py, extensions.py
│       ├── assets/fonts/            DejaVuSans fonts for tickets
│       ├── models/  user.py, activity.py (Activity, Slot),
│       │            booking.py (Booking, Coupon, Payment), review.py
│       ├── routes/  auth, activities, bookings, payments,
│       │            reviews, admin, weather (stub)
│       ├── services/ booking_service, payment_service, ticket_service,
│       │             notification_service, schema_service
│       └── utils/   decorators.py, validators.py, rate_limit.py
│
└── frontend/
    ├── index.html, package.json, vite.config.js, .env.example
    └── src/
        ├── main.jsx, App.jsx
        ├── api/        client, activities, bookings, payments, admin
        ├── context/    AuthContext, ToastContext
        ├── components/ Navbar, Footer, Scene, ActivityCard, SlotPicker, Stepper,
        │               Modal, TicketModal, StatusPill, Skeleton, Reveal,
        │               TrustBand, WhyChooseUs, AuthLayout, ProtectedRoute,
        │               ScrollToTop, ReviewList (stub)
        ├── pages/      Home, Activities, ActivityDetails, Booking, Pay, Dashboard,
        │               About, Contact, Gallery, Terms, Vision, Login, Register, NotFound
        │   ├── services/ JoyRides, Training
        │   └── admin/    Layout, Overview, Activities, Bookings, Users,
        │                 Revenue, Coupons, Checkin
        ├── styles/     global.css, responsive.css, polish.css
        ├── utils/      format.js, download.js
        └── i18n/       en.json, hi.json (unused)