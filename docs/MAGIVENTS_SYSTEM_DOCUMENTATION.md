# MagiVents: System Documentation

*Covers the frontend (`magivents_interface`) and the backend (`MagiVents_backend`) as of 14 October 2026, after the work that added the admin dashboard, the listing fee (pay to publish), ticket tier types and flash sales, and organizer payment details and payouts.*

---

## Table of contents

1. [What MagiVents is](#1-what-magivents-is)
2. [System architecture](#2-system-architecture)
3. [Technology stack](#3-technology-stack)
4. [Repository layout](#4-repository-layout)
5. [Running the system](#5-running-the-system)
6. [Configuration (environment variables)](#6-configuration-environment-variables)
7. [User roles and access rules](#7-user-roles-and-access-rules)
8. [Feature guide (what users can do)](#8-feature-guide-what-users-can-do)
9. [Backend reference](#9-backend-reference)
10. [The paid booking lifecycle and payments](#10-the-paid-booking-lifecycle-and-payments)
11. [REST API reference](#11-rest-api-reference)
12. [Frontend reference](#12-frontend-reference)
13. [Design system](#13-design-system)
14. [Testing](#14-testing)
15. [What is still simulated or limited](#15-what-is-still-simulated-or-limited)
16. [Going live checklist](#16-going-live-checklist)
17. [Development history](#17-development-history)

---

## 1. What MagiVents is

MagiVents is a Kenyan platform for discovering and booking events.

**Attendees**
- Browse, search, filter and save events.
- Register for free events, or buy tickets for paid ones with M-Pesa (a prompt on the phone, or Paybill) or by card.
- No account is needed to book. Guests get their ticket by email and can find it again with the ticket code and their email.

**Organizers** (users with the organizer role)
- Create events with their own ticket types (VVIP, VIP, Regular, Couple, Group, Early Bird or any name), flash sales and an agenda, and pin the venue on a real map.
- Pay a one-off **listing fee** (set by the admin per category) to publish an event.
- Give the **payment details** the platform pays their ticket sales out to, and follow their earnings and payouts.
- Create promo codes.
- See their real sales.
- Check attendees in at the door by scanning QR codes.

**Admins** (users with the admin role, the same as Django's staff status)
- Run the **admin dashboard**: organizers, category listing fees, the platform's payment details, listing-fee payments, payouts and notifications.

All prices are whole **Kenyan shillings (KES)**. The contact address used throughout is **magiventskenya@gmail.com**.

### Event categories

The backend (`Gathering.CATEGORIES`) and the frontend (`src/data/categories.ts`) use the same nine categories:

| Category | Short label | Icon |
|---|---|---|
| Sports & Outdoors | Sports | Trophy |
| Entertainment & Music | Music | Music |
| Business & Entrepreneurship | Business | Briefcase |
| Tech & Innovation | Tech | Cpu |
| Education & Career | Education | GraduationCap |
| Arts & Culture | Arts | Palette |
| Social Impact & Community | Community | HeartHandshake |
| Political | Political | Landmark |
| Others | Others | Shapes |

---

## 2. System architecture

```
                         ┌──────────────── HTTPS proxy (Caddy / load balancer, sets X-Forwarded-Proto)
                         ▼
┌─────────────────────────────────┐   /api /admin /static   ┌───────────────────────────────────┐
│ web: nginx                      │ ──────────────────────▶ │ api: Django 5 + DRF under Gunicorn │
│  · React 19 SPA (Vite build)    │                          │  · JWT auth, payments, tickets     │
│  · /media from shared volume    │                          │  · WhiteNoise static files         │
└─────────────────────────────────┘                          └──┬──────────┬──────────┬──────────┘
                                                                │          │          │
                                                       PostgreSQL       Redis     holds worker
                                                                                  (releases expired
                                                                                   ticket holds)
External services:
  Safaricom Daraja (M-Pesa STK Push + C2B Paybill) ──callbacks──▶ /api/payments/hooks/...
  Paystack (hosted card checkout)                  ──webhook───▶ /api/payments/hooks/paystack/
  SMTP provider (confirmation emails), OpenStreetMap (map tiles, Nominatim address search),
  Google Identity Services (sign-in), optional S3-compatible bucket (media)
```

- **Data.** The frontend is a single-page app; all data comes from the Django REST API.
- **Auth.** Sessions use JWT: access tokens last 7 days, refresh tokens 30 days. Tokens are stored in `localStorage` and refreshed automatically.
- **Server is authoritative.** The server computes every price, availability figure, ticket code and payment state. The browser never decides that a payment succeeded.
- **Images.** The browser compresses images and sends them as base64 data URLs inside JSON. The server stores them locally or in an S3-compatible bucket.

---

## 3. Technology stack

### Backend (`MagiVents_backend`)

| Concern | Technology |
|---|---|
| Framework | Django 5.2, Django REST Framework 3.15+ |
| Auth | `djangorestframework-simplejwt`, `google-auth` (Google ID-token verification) |
| API schema / docs | `drf-spectacular`: OpenAPI at `/api/schema/`, Swagger UI at `/api/docs/` |
| Payments | `requests` against Safaricom Daraja and Paystack (no SDKs) |
| Tickets | `reportlab` (PDF ticket with its built-in QR code widget) |
| Email | Django email framework; console backend by default, SMTP by configuration |
| Database | SQLite locally (`SQLITE_PATH` optional); PostgreSQL 15 when `POSTGRES_HOST` is set |
| Cache | In-process memory; Redis 7 (`django-redis`) when `REDIS_URL` is set |
| Media storage | Local `media/`; S3-compatible bucket via `django-storages` when `AWS_STORAGE_BUCKET_NAME` is set |
| Production server | Gunicorn, with WhiteNoise for static files |
| Containers | `Dockerfile`, `docker-compose.yml` (development), `docker-compose.prod.yml` (production) |

### Frontend (`magivents_interface`)

| Concern | Technology |
|---|---|
| UI | React 19, TypeScript |
| Build | Vite 8 (dev server on port 3000) |
| Styling | Tailwind CSS v4, custom theme in `src/index.css` |
| HTTP | Axios with auth and refresh interceptors |
| Icons | `lucide-react` |
| Map | Leaflet 1.9 with OpenStreetMap tiles, loaded on demand |
| QR codes | `qrcode` (generate); `barcode-detector` + `zxing-wasm` (scan, used only when the browser has no built-in QR detector, loaded on demand) |
| Tests | Vitest 5 |
| Serving | nginx (`Dockerfile`, `nginx.conf`) |

The admin round (admin dashboard, listing fees, tier types, payouts) added no dependencies to either repository.

---

## 4. Repository layout

There are two Git repositories:

- Frontend: `https://github.com/Coutts007/MagiVents_Interface`
- Backend: `https://github.com/Coutts007/MagiVents_backend`

```
magivents_hybrid/
├── MAGIVENTS_SYSTEM_DOCUMENTATION.md      (this file)
├── MagiVents_backend/
│   ├── config/            settings.py, urls.py
│   ├── core/              images.py (base64 → file), geocoding.py, health/config/geocode views, assets/ (logo for PDFs)
│   ├── accounts/          User model, auth, profile, become-organizer
│   ├── gatherings/        Gathering, TicketTier, AgendaItem; event API, check-in, attendees; seed command
│   ├── tickets/           Booking, Bookmark, PromoCode; booking API, ticket PDF (documents.py), emails.py,
│   │                      templates/tickets/emails/ (HTML + text confirmation)
│   ├── console/           staff console API (secret path + staff), ConsoleAction audit log
│   ├── payments/          Payment model (booking or listing fee), services.py (lifecycle), providers/
│   │                      (simulated, daraja, paystack), hooks.py (callbacks), commands release_expired_holds
│   │                      and register_c2b_urls
│   ├── adminpanel/        admin dashboard API (/api/admin/, role admin, 403 for others), organizer invite email
│   ├── listings/          CategoryFee, PlatformPaymentAccount, ListingFee; services.py (pay to publish)
│   ├── notifications/     Notification model, notify_admins (in app + email), /api/notifications/
│   ├── payouts/           PayoutAccount (payment details), Payout; ledger.py (earnings), services.py
│   │                      (record_payout), automated.py (where automated payouts would go)
│   ├── Dockerfile, docker-compose.yml, docker-compose.prod.yml, requirements.txt, .env.example
└── magivents_interface/
    ├── Dockerfile, nginx.conf, vite.config.ts (also configures Vitest)
    └── src/
        ├── App.tsx                 view switching, global state, deep links (?event, ?ticket, ?booking)
        ├── services/api.ts         every API call
        ├── utils/                  format, search, share, ticketPrinting, checkout, tiers, time, payoutDetails
        │                           (+ *.test.ts), qrScanner, useNow
        └── components/
            ├── checkout/           CheckoutModal, MpesaPaymentSection (method picker), PaymentStatusPanel
            ├── ticket/             TicketView (Find my ticket), PrintableTicketModal, EmailConfirmationModal
            ├── console/            AdminConsole (staff console: overview, organizers, payments, bookings, activity)
            ├── admin/              AdminDashboard (overview, organizers, listing fees, category fees, platform
            │                       payment), NotificationBell, ReasonDialog
            ├── organizer/          OrganizerDashboard, EventEditorModal, PromoCodesPanel, CheckInPanel,
            │                       CoordinatePicker, BecomeOrganizerModal, PayListingFeePanel, EarningsPanel,
            │                       PayoutDetailsFields, PayoutDetailsCard
            ├── map/VenueMap.tsx    Leaflet wrapper
            └── … discover, calendar, search, event-details, profile, auth, navigation, ui
```

`magivents_interface/docs/DJANGO_BACKEND_GUIDE.md` is an early, outdated guide; use this document instead.

---

## 5. Running the system

### Development with an empty `.env`

Everything works without any credentials. Payments run in **simulated** mode and emails print to the console.

```bash
# Backend
cd MagiVents_backend
python3 -m venv venv && venv/bin/pip install -r requirements.txt
venv/bin/python manage.py migrate
venv/bin/python manage.py seed_gatherings        # 10 demo events, owned by curator@magivents.local
venv/bin/python manage.py createsuperuser        # an admin: superusers (and staff) have the admin role
venv/bin/python manage.py runserver              # http://localhost:8000  (API docs: /api/docs/)

# Frontend
cd magivents_interface
npm install
npm run dev                                       # http://localhost:3000
```

A paid booking then completes end to end:

1. The booking comes back pending.
2. About 6 seconds later the fake gateway reports success.
3. The ticket, QR code, PDF and email appear.

To demo a failed M-Pesa payment, use a phone number ending in `1032`. The same applies to listing-fee payments.

The full admin and organizer flow also works with an empty `.env` (it was run end to end in a browser):

1. The admin signs in, opens **Admin** in the navbar, sets a category's listing fee and the platform payment details.
2. The admin adds an organizer. The emailed link (printed in the server log) sets the password and returns to the app's sign-in.
3. The organizer adds payment details in their profile and creates an event with VVIP, VIP, Regular, Couple and Group tickets and a flash sale. It is saved as a draft; the admin's bell shows "fee due".
4. **Publish event** opens **Pay to publish**. After the simulated payment (about 6 seconds) the event is published and the admin is notified.
5. A guest books a Couple ticket (one price, admits 2) and a VIP ticket at the flash-sale price.
6. The organizer's **Earnings & payouts** shows the money; the admin records a payout and both balances update.

The development Docker stack (PostgreSQL and Redis, with demo data and `runserver`) starts with `docker compose up --build`.

### Commands

| Command | Purpose |
|---|---|
| `manage.py test` | Backend tests (155) |
| `manage.py seed_gatherings [--reset]` | Load or reload the demo events |
| `manage.py release_expired_holds` | Expire unpaid bookings whose hold ran out; production runs it every minute |
| `manage.py register_c2b_urls` | Register the Paybill validation and confirmation URLs with Daraja (once per environment) |
| `manage.py createsuperuser` | Admin account: the in-app admin dashboard and the Django admin at `/admin/` |
| `npm run lint` / `npm run build` / `npm test` | Type-check / production build / frontend tests (34) |

### Production

```bash
cd MagiVents_backend
cp .env.example .env.production      # set DJANGO_DEBUG=False, secrets, credentials (see section 16)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

This starts:

- PostgreSQL
- Redis
- `api`: runs migrations, then Gunicorn
- `holds`: releases expired holds every minute
- `web`: nginx on port 80, serving the app, proxying the API and serving media

Put a TLS-terminating proxy in front of port 80. It must set `X-Forwarded-Proto`. The production file never seeds demo data and never runs `runserver`.

---

## 6. Configuration (environment variables)

All variables are listed with comments in `MagiVents_backend/.env.example` and `magivents_interface/.env.example`. Every external service is optional in development, and a missing credential produces a clear message instead of a crash.

### Core

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | dev key | Required when `DJANGO_DEBUG=False`; the server refuses to start with the default |
| `DJANGO_DEBUG` | `True` | `False` turns on HTTPS redirect, secure cookies, HSTS and the proxy SSL header |
| `DJANGO_ALLOWED_HOSTS` | `127.0.0.1,localhost,0.0.0.0` | |
| `CSRF_TRUSTED_ORIGINS` | empty | HTTPS origins for the admin and password-reset forms |
| `CORS_ALLOWED_ORIGINS` | localhost:3000/5173 | Used when not in debug |
| `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS`, `SECURE_HSTS_INCLUDE_SUBDOMAINS` | `True`, `31536000`, `False` | HTTPS options for production |
| `FRONTEND_URL` | `http://localhost:3000` | Base of ticket QR links, email links and the Paystack return URL |
| `PUBLIC_API_URL` | `http://localhost:8000` | Public HTTPS address of the API, used for Daraja callback URLs |
| `POSTGRES_HOST` (+ `_DB`, `_USER`, `_PASSWORD`, `_PORT`, `_CONN_MAX_AGE`) | unset | Use PostgreSQL |
| `SQLITE_PATH` | `db.sqlite3` | Alternative SQLite file |
| `REDIS_URL` | unset | Use Redis for the cache |
| `LOG_LEVEL` | `INFO` | Logs go to stdout |
| `GOOGLE_OAUTH_CLIENT_ID` | empty | Google sign-in (503 when empty) |
| `ADMIN_CONSOLE_PATH` | empty (console off) | Secret path of the staff console; at least 16 random characters |
| `ADMIN_CONSOLE_MAX_FAILURES` | `10` | Wrong console paths allowed per account or IP before a one-hour lockout |

### Payments

| Variable | Default | Purpose |
|---|---|---|
| `PAYMENTS_MODE` | `simulated` | `simulated` or `live`. Also decides listing fees: `simulated` takes them online with the fake gateway; `live` has no online listing-fee gateway yet, so organizers pay the platform Paybill or Till by hand and an admin records it |
| `PAYMENT_HOLD_MINUTES` | `10` | How long a pending booking holds its tickets |
| `PAYMENTS_SIMULATED_DELAY_SECONDS` | `6` | How long the fake gateway takes (0 = immediately) |
| `PAYMENT_CALLBACK_SECRET` | empty | Unguessable path segment in Daraja callback URLs (required for Daraja) |
| `DARAJA_ALLOWED_IPS` | empty | Optional allowlist of Safaricom callback IPs |
| `BEHIND_PROXY` | `False` | Read the caller's IP from `X-Forwarded-For` |
| `MPESA_ENVIRONMENT` | `sandbox` | `sandbox` or `production` |
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET` | empty | Daraja app keys |
| `MPESA_STK_SHORTCODE`, `MPESA_PASSKEY` | empty | STK Push (sandbox shortcode is 174379) |
| `MPESA_STK_TRANSACTION_TYPE`, `MPESA_STK_PARTY_B` | `CustomerPayBillOnline`, empty | Use `CustomerBuyGoodsOnline` plus the till number for a Till |
| `MPESA_C2B_SHORTCODE` | empty | Paybill for manual payments (sandbox 600984) |
| `MPESA_PAYBILL_NUMBER`, `MPESA_ACCOUNT_NAME` | `000000` (placeholder), `MagiVents` | Shown in simulated mode and as a fallback |
| `PAYSTACK_SECRET_KEY` | empty | Card payments (`sk_test_…` for test mode) |

### Email, storage, map, rate limits

| Variable | Default | Purpose |
|---|---|---|
| `EMAIL_BACKEND` | console | `django.core.mail.backends.smtp.EmailBackend` for real email |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `EMAIL_TIMEOUT` | localhost, 587, –, –, True, 15 | SMTP |
| `DEFAULT_FROM_EMAIL`, `MAGIVENTS_CONTACT_EMAIL` | MagiVents address | Sender and help address |
| `ADMIN_NOTIFICATION_EMAILS` | `True` | Email admins as well as notifying them in the app (event with a listing fee due, fee paid, fee payment failed) |
| `AWS_STORAGE_BUCKET_NAME` (+ `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_ENDPOINT_URL`, `AWS_S3_REGION_NAME`, `AWS_S3_CUSTOM_DOMAIN`, `AWS_QUERYSTRING_AUTH`) | unset | S3-compatible media storage |
| `MEDIA_ROOT`, `STATIC_ROOT` | `media/`, `staticfiles/` | |
| `GEOCODER_URL`, `GEOCODER_USER_AGENT` | public Nominatim, `MagiVents/1.0 (…)` | Address search for the map pin |
| `GUEST_BOOKING_RATE`, `PROMO_VALIDATE_RATE`, `TICKET_LOOKUP_RATE`, `TICKET_RESEND_RATE`, `PAYMENT_ATTEMPT_RATE`, `GEOCODE_RATE` | 20/hour, 30/minute, 10/hour, 5/hour, 20/hour, 30/hour | Per-IP (or per-user) rate limits |

### Frontend `.env`

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | `/api` in the production image |
| `VITE_GOOGLE_CLIENT_ID` | empty | Google sign-in button |
| `VITE_NOTIFICATION_POLL_SECONDS` | `30` (minimum 10) | How often an admin's notification bell checks for new notifications |

The platform's own payment details (the Paybill or Till organizers pay listing fees to) are display details edited in the admin dashboard. Payment-provider credentials stay in environment variables and are never stored in the database.

---

## 7. User roles and access rules

| Who | Can do |
|---|---|
| **Guest** | Browse, search, share. Book and pay without an account (rate-limited). Open a ticket from its QR or email link, or with **Find my ticket** (code and email). |
| **Attendee** (role `patron`, the default for new accounts) | Everything a guest can, plus: save events, see confirmed tickets under **My tickets**, edit their profile, change their password. They can upgrade themselves with **Become an organizer**. |
| **Organizer** (role `curator`) | Create events (always saved as drafts). Pay listing fees, publish, manage their own events, promo codes, check-in, payment details, and see earnings and payouts. |
| **Suspended organizer** (`is_suspended`) | Can sign in and see their events, sales, attendees and earnings, but cannot create events, publish or pay listing fees. Set by an admin. |
| **Event owner** | Only the organizer who created an event can edit, publish, unpublish or delete it, see its attendees, sales, listing fee and event payment details, and check its tickets in. Drafts are visible only to their owner. |
| **Admin** (role `admin`) | The in-app **admin dashboard** (section 8.8), linked from the navbar only for admins, with the notification bell. Admins keep every organizer ability. The role is kept in sync with Django's `is_staff`: superusers are always admins, ticking "Staff status" in the Django admin makes an admin, unticking it demotes (to organizer if they own events). Admins also have the Django admin at `/admin/` and the staff console. |
| **Staff console** | The separate, hidden **staff console** at the secret path `/<ADMIN_CONSOLE_PATH>` (section 8.7) is unchanged and needs staff (= admin) on that path. |

**Access control is on the server.** Creating events needs the organizer (or admin) role and an unsuspended account. Every admin dashboard endpoint refuses anyone who is not an active admin with HTTP 403 (401 when signed out); tests prove it for every endpoint. Payment details are returned only to their organizer and to admins.

Data migrations gave the organizer role to every user who already owned an event, and the admin role to every staff user and superuser.

---

## 8. Feature guide (what users can do)

### 8.1 Browsing

**Navigation**
- A sticky navbar has Discover, Calendar, Organizer Dashboard, search, saved events, and the account menu or sign-in. Admins also get **Admin** and the notification bell.
- The mobile menu adds **Find my ticket**; the footer links to it too.
- API errors appear as a dismissible banner.

**Deep links**
- `?event=<id>` opens an event.
- `?ticket=<uuid>` opens a ticket.
- `?booking=<uuid>` resumes checkout. Paystack sends people back to this link.

**Discover page**
- **Slideshow** of the 10 newest events.
- **Category pills** with counts.
- **Search**: matches every word, ignoring accents.
- **Filters**: date (this week, this month, next 30 days) and free only.
- **Sort**: by date or price.
- **Tag filter**: clicking a `#tag` on a card or an event page filters by it. The active tag shows as a removable chip.
- **Event cards** show places left, which never goes below 0.

**Other views**
- **Site-wide search**: press `/` or Ctrl/Cmd+K. Up to 8 ranked results, keyboard navigable.
- **Calendar**: month and week views, with a day schedule.
- **Saved events**: a drawer from the navbar (closes on Esc) and a tab in the profile.
- **Sharing**: the device share sheet, a copied link, X, WhatsApp, LinkedIn, Facebook, Telegram and email.

### 8.2 Event page

- **Details**: hero image, date, time and place; description, organizer note and clickable tags; agenda; and the organizer card.
- **Venue map**: a Leaflet map with OpenStreetMap tiles and the pin at the event's real coordinates.
  - Full screen (Esc exits), zoom, copy coordinates, copy address, and **Directions** in Google Maps.
  - Arrival, Parking and Getting there tabs.
  - Events without coordinates show the address and a Directions link instead of a guessed pin.
- **Booking card**: pick a ticket type (a keyboard-accessible radio group showing price, perks and tickets left) and a quantity, then go to checkout or register for free.
  - **Couple and group tickets** say how many people one ticket admits ("Admits 2 people · one ticket"). The quantity is capped by the places left divided by that number.
  - **Flash sales** show the normal price struck through, the sale price, a live countdown to the end and how many are left at that price. When the sale ends or its allowance runs out, the normal price comes back without a reload; the server decides the price at the moment of booking either way.
  - A tier outside its own **sales window** shows "On sale from …" or "Sales closed" and cannot be booked. Times are shown in Nairobi time.

### 8.3 Checkout and payment

1. **Details.** The attendee's name and email (pre-filled when signed in), and an optional note to the organizer.
2. **Promo code** (paid events). The server checks the code and shows the discount before booking.
3. **Payment method** (paid events). Options the server cannot take are disabled:
   - **M-Pesa, prompt on my phone (STK Push).** Enter the M-Pesa number; any common format works (`0712 345 678`, `+254…`).
   - **M-Pesa Paybill.**
   - **Card.** Paystack's secure page; MagiVents never sees card details.
4. **Submit.**
   - Free bookings are confirmed at once.
   - Paid bookings become **pending**, and their tickets are held for 10 minutes with a visible countdown.
5. **Complete the payment.** What the attendee sees depends on the method:
   - STK: **Check your phone**, then approve with the M-Pesa PIN.
   - Paybill: the business number, a personal account number (e.g. `MV4KL8JPEF`) and the exact amount.
   - Card: a redirect to Paystack, which sends the attendee back to `?booking=<id>`.
   - Checkout polls the server until the booking is confirmed, failed or expired.
6. **Failure or expiry.** A clear message, and **Try again** or a switch of method on the **same booking**, so no duplicate is created. "Didn't get it? Send again or pay another way" is available while waiting.
7. **Confirmation**, issued by the server:
   - A ticket code (`MV-` + 6 digits) and a **scannable QR code**. The QR encodes `FRONTEND_URL/?ticket=<booking uuid>`, never the guessable ticket code.
   - **Download PDF**, generated on the server.
   - **Print**.
   - **Email**: resend the confirmation from the server, or forward it with the user's own email app.
   - **Add to Calendar** (`.ics`).
   - **Invite friends**.
   - A confirmation email (HTML and plain text, with the PDF attached) is sent automatically.

### 8.4 Tickets after booking

- **My tickets** in the profile lists confirmed bookings, each with its QR code, print, email and view actions, and how many people it admits.
- The confirmation screen, printable ticket, ticket page, PDF and email all say how many people the ticket admits (a Couple ticket: 2).
- **Find my ticket** is for guests: enter the ticket code and the booking email. Both must match. The answer is the same whether the code or the email was wrong, and the page is rate-limited.
- A ticket link (from the QR code or email) opens the ticket page with its QR code, PDF download, print and email.

### 8.5 Accounts

- **Sign up and sign in**: email and password, with a strength meter and server-side password validation, or Google.
- **Password reset** by email.
- **Profile**: photo or initials, name, town and bio.
- **Change password**: not shown for Google accounts.
- **Become an organizer**: one confirmation screen, reached from the dashboard or from Create event. It never changes an admin's role.
- **Payment details** (organizers): a profile tab for where the platform pays out their ticket sales. Choose an M-Pesa number, a Till number, a Paybill with account number, or a bank account (bank, account name, account number); each format is validated.
- **Organizer invitation**: an organizer created by an admin gets an email with a link (Django's password-reset machinery) to set their password; afterwards the app opens its sign-in form (`?signin=1`).

### 8.6 Organizer tools

**Dashboard sections: Events, Earnings & payouts, Promo codes, Check-in.**

**Events**
- Stats: total events, registered attendees (people, so a couple ticket counts 2), ticket sales and tickets issued. They are computed by the server from **confirmed bookings only**, so sales are what attendees actually paid after discounts.
- Tabs: All, Published, Drafts.
- Per event: its **listing-fee status** (Fee unpaid · KSh X, Fee pending, Fee paid, Fee waived, No listing fee), an attendance bar, plus view, publish/unpublish, edit and delete (with a confirmation step). Unpaid drafts have **Pay to publish**.
- A suspended organizer sees a notice and no Create button.

**Pay to publish**
- Publishing a draft whose listing fee is due opens **Pay KSh X to publish**: the fee, the platform's Paybill or Till, account number (the event's own reference unless the admin set a fixed one), account name, instructions, and an M-Pesa number field.
- After **Pay**, the step shows "Check your phone" and polls the server; the browser never decides that the fee was paid. Once the server confirms, the event is published and the step says so. A failed payment can be retried.
- In live mode, where listing fees cannot be paid online yet, the step shows the details and reference, and waits for an admin to record the payment.
- Moving a paid event to a category with a higher fee shows the difference inside the event form; after paying it, the category changes and the rest of the edits are saved.

**Earnings & payouts**
- Earned (confirmed bookings, after discounts), paid out, and the balance outstanding; earnings per event (tickets, people, discounts) and the payouts received, with the details they were sent to.
- The wording is that MagiVents collects ticket payments and pays out to the details provided; nothing says money goes directly to the organizer.

**Event editor**
- Title, tagline, category (searchable), date, start and end time.
- Venue name, street, town.
- **Map pin**: search the address (the search runs only when Search is pressed), choose a result, then drag the pin or click the map. The pin can also be placed by hand or removed.
- **Ticket types**:
  - Add, edit, reorder and remove (name, price, quantity, people per ticket, description, perks).
  - **Quick add** presets: VVIP, VIP, Regular, Couple (admits 2), Group (admits 5 by default), Early Bird. They are starting points the organizer edits freely; any custom name is allowed.
  - **Flash sale and sales dates** per ticket type: a sale price lower than the normal price, a start and an end (typed in Nairobi time, stored in UTC), an optional limit on tickets at that price; and an optional on sale from / on sale until window.
  - Capacity is the sum of quantity × people per ticket. The cheapest ticket becomes the event's "from" price.
  - Free events make every ticket free and have no sales.
  - A ticket type with sales cannot be removed, reduced below what is sold, or change how many people it admits.
- **Payment details**: use the organizer's default, or different details for this event only (paid events).
- Image, description, agenda, host, tags and a note to attendees.
- Buttons: **Save as draft** next to **Publish event** / **Save changes**. New events are always saved as drafts first; **Publish event** then applies the payment details and publishes, opening Pay to publish when the listing fee is due.

**Promo codes**
- Create a code for one of your events with: percent off, optional maximum uses, and an optional valid-from and valid-until.
- Each code shows its state (active, scheduled, expired, used up, paused). Codes can be paused, resumed or deleted.

**Check-in**
- Choose the event. Then scan QR codes with the device camera (the browser's own detector, or a WebAssembly fallback), or type ticket codes.
- Each scan reports **Checked in**, **Already checked in (at time)**, **Wrong event**, **Not paid** or **Not found**.
- The attendee list shows checked-in counts and a progress bar, has search, and lets staff check people in manually.

### 8.7 Staff console (platform admin)

An admin section inside the app for people who run MagiVents.

**Access needs two things at once:**
1. The **secret path**, `https://<site>/<ADMIN_CONSOLE_PATH>`. The value is set only in the backend's environment; it never appears in the frontend code, so it cannot be found by reading the JavaScript.
2. A signed-in **staff** account: `createsuperuser`, or "Staff status" ticked in `/admin/`.

**Everyone else sees the normal site.** That includes signed-out visitors, attendees, organizers, and staff on a wrong path. The API answers them with the same plain 404 as a page that doesn't exist, so the console cannot be discovered.

**Protections:**
- Wrong paths are counted per account (or per IP when signed out). After `ADMIN_CONSOLE_MAX_FAILURES` attempts (default 10), even the right path answers 404 for an hour.
- An unset or short (< 16 characters) `ADMIN_CONSOLE_PATH` switches the console off.
- The console is left out of the public API docs and marked `noindex`.
- Leaving it removes the path from the address bar.

**Sections:**

| Section | What it shows and does |
|---|---|
| **Overview** | Confirmed revenue (all time, last 30 days, today); tickets held by unpaid bookings; failed payments this week; users and organizers; a 30-day revenue chart (hover for each day, or switch to a table); bookings by status; revenue by payment method; top organizers; a banner when payments need a refund |
| **Organizers** | Search and sort by revenue, events or newest. Each organizer has a page with sales, open refunds and every event (sold, held, revenue). Actions: **revoke or restore the organizer role**, **unpublish or republish an event**. Each action asks for a reason. |
| **Payments** | Every payment attempt, filterable by refund state, status and provider, and searchable by reference, M-Pesa receipt, ticket code or email. The detail view shows the raw provider messages. **Needs refund** payments are settled outside MagiVents (M-Pesa reversal, Paystack dashboard), then recorded here with a note. |
| **Bookings** | All bookings (guests marked), filterable by status and event, searchable by ticket code, name, email or event. Shows check-in state. |
| **Activity** | Audit log of every console change: who, what, when and why |

**Opening it:**
1. Set `ADMIN_CONSOLE_PATH` on the server (e.g. `python -c "import secrets; print(secrets.token_urlsafe(24))"`) and restart the API.
2. Create a staff account with `manage.py createsuperuser`.
3. Sign in on the site with that account and visit `https://<site>/<that value>`.

The path is a second secret, not a replacement for the staff account. Keep it out of chats and git, and change it if it leaks.

The console was left as it was when the admin dashboard was added. Two compatibility changes: its payment lists, overview counts and refund queue cover ticket payments only (`Payment.booking_payments`), because listing-fee payments have no booking; and its republish action goes through the publish rules (an unpaid event cannot be republished there either). Its organizer list labels admins as "Revoked", because it only knows the organizer and attendee roles.

### 8.8 Admin dashboard

A role-based view inside the app for admins, linked from the navbar (**Admin**) only for them and opened by `?view=admin` (the link in admin emails). It is loaded on demand. The Django admin at `/admin/` is unchanged.

| Section | What it shows and does |
|---|---|
| **Overview** | Organizers (and how many are suspended), events awaiting payment (and the fees due), listing fees collected this month (Nairobi time) and all time, organizer balances outstanding |
| **Organizers** | Search, filter by status (active, suspended, invited) and role, sort. Each row: status, events, listing fees paid, ticket sales, balance, payment details. **Add organizer** (name, email, town, bio) sends the set-password email. The organizer page: edit name, email, town, bio and role (promote an attendee or demote an organizer; admins are managed in the Django admin), resend the invitation, edit payment details, **suspend** (reason required; optionally take their published events down to draft) and **reactivate**, **delete** (only when none of their events has a booking or a paid listing fee, confirmed by typing their email; otherwise suspension is offered). Events with their listing-fee status and event-only payment details. **Earnings and payouts** per event, payouts made, the balance, and **Record payout** (amount, reference, date, note; never more than the balance). |
| **Listing fees** | Every event's fee: status (unpaid, pending, paid, waived, no fee), amount, reference, organizer and date; filters by status, category, date and search; totals paid, waived and still due. **Waive** and **Mark paid** need a reason (and a reference to mark paid), record who and when, and publish the event if the organizer had asked to. |
| **Category fees** | The nine categories with their listing fee in KSh (0 = no fee) and how many events await payment in each. A change applies to events not yet listed; events already paid keep what they paid. |
| **Platform payment** | Paybill or Till, number, account number (Paybill; empty means each event's reference), account name and instructions shown to organizers |

**Notifications.** The bell in an admin's navbar shows the unread count and the latest notifications (Esc or a click outside closes it; mark one or all read). It polls every `VITE_NOTIFICATION_POLL_SECONDS`; there are no websockets. Admins are notified in the app and by email (Django's email framework, the console backend by default) when an organizer creates an event with a fee due, when a listing fee is paid, and when a listing-fee payment fails. A repeated payment confirmation never notifies twice.

Every dashboard change is written to the shared audit log (`console.ConsoleAction`) with who, what and why.

---

## 9. Backend reference

### 9.1 Apps

| App | Responsibility |
|---|---|
| `accounts` | User model and authentication |
| `gatherings` | Events, ticket types, agenda; check-in and attendee list |
| `tickets` | Bookings, bookmarks, promo codes; ticket PDF and confirmation email |
| `payments` | Payment records, the paid booking lifecycle, providers and their callbacks |
| `core` | Image decoding, geocoding proxy, health check, public configuration |
| `console` | Staff console API under `/api/console/<secret>/` (`access.py` holds the two-lock check) and the `ConsoleAction` audit log |
| `adminpanel` | Admin dashboard API under `/api/admin/` (role admin; 403 for others) and the organizer invitation email |
| `listings` | Category fees, the platform's payment details, each event's listing fee and the pay-to-publish lifecycle |
| `notifications` | In-app notifications and admin emails |
| `payouts` | Organizer payment details, payouts, the earnings ledger, and the placeholder for automated payouts |

### 9.2 Data model

```
User 1─* Gathering 1─* TicketTier ─────────────┐
  │          │  1─* AgendaItem                 │
  │          │  1─* PromoCode (or site-wide)   │
  │          │  1─1 ListingFee 1─* Payment (purpose listing_fee)
  │          │  1─0..1 PayoutAccount (this event's payment details)
  │          1─* Booking *─0..1 User           │ (null for guests)
  │                 │  *─0..1 TicketTier ◀──────┘
  │                 │  *─0..1 PromoCode
  │                 1─* Payment (purpose booking)
  1─* Bookmark *─1 Gathering
  1─0..1 PayoutAccount (default payment details)
  1─* Payout
  1─* Notification
CategoryFee (one per category)   PlatformPaymentAccount (one row)
```

**`accounts.User`.** It extends `AbstractUser` and logs in by `email`.

| Field | Notes |
|---|---|
| `role` | `patron` (Attendee), `curator` (Organizer) or `admin`. `admin` ⇔ `is_staff`; superusers are admins. `save()` keeps the two in sync, whichever was changed |
| `is_suspended`, `suspended_at`, `suspension_reason` | A suspended organizer cannot create, publish or pay listing fees |
| `auth_provider` | `email` or `google` |
| `google_id`, `avatar` / `avatar_url`, `bio`, `city`, `joined_date` | |

**`gatherings.Gathering`.** An event, with `id` as a string primary key (UUID, or a readable slug for seed events).

| Fields | Notes |
|---|---|
| `organizer`, `title`, `subtitle`, `category`, `description`, `full_content` | |
| `date_display`, `iso_date`, `time_display` | |
| `venue_name`, `venue_address`, `venue_city`, `venue_neighborhood`, `venue_map_note`, `venue_lat`, `venue_lng` | Coordinates are optional |
| `is_free`, `starting_price`, `currency` (KES) | |
| `capacity`, `attendee_count` | `attendee_count` includes tickets held by pending bookings |
| `artwork_image` / `artwork_url`, `host_name`, `host_role`, `host_avatar_url`, `host_bio` | |
| `status` | `published`, `draft` or `sold_out`. New events are always drafts. `save()` refuses to make a draft public, or to move a paid event to a dearer category, unless the publish rules pass (section 9.3), whatever code path saves it |
| `is_featured`, `tags`, `curator_note`, `created_at` | |

**`gatherings.TicketTier`**

| Field | Meaning |
|---|---|
| `quantity` | Total tickets of this type |
| `available` | Tickets left |
| `sold` | Property: `quantity − available` |
| `order` | Display position |
| `name`, `price`, `description`, `perks` | |
| `admits` | People one ticket admits: 1 by default, 2 for a couple, the group size for a group. One ticket uses that many places of capacity |
| `sale_price`, `sale_starts_at`, `sale_ends_at`, `sale_quantity` | Flash sale: the price from the start (inclusive) to the end (exclusive), for at most `sale_quantity` tickets when set. Times in UTC |
| `sale_sold` | Tickets held or sold at the sale price (given back when a pending booking fails or expires) |
| `on_sale_from`, `on_sale_until` | The tier's own sales window, e.g. an Early Bird tier that closes by itself |

`price_at(now)` returns the price in effect and whether it is the sale price; only the server uses it to charge.

**`gatherings.AgendaItem`**: `time`, `title`, `detail`, `order`.

**`tickets.Booking`**

| Field | Notes |
|---|---|
| `id` | UUID string |
| `user` | Null for guests |
| `gathering`, `tier`, `tier_name`, `quantity` | `quantity` is the number of tickets |
| `admits_per_ticket` | Copied from the tier when booking; `people` = quantity × admits_per_ticket |
| `unit_price`, `is_sale_price` | The unit price actually charged and whether it was the flash-sale price, kept even if the tier changes later |
| `discount`, `total_price`, `currency`, `total_in_kes` | Computed by the server |
| `promo_code` | The code used, if any |
| `attendee_name`, `attendee_email`, `notes` | |
| `status` | `pending`, `confirmed`, `failed` or `expired` |
| `expires_at`, `confirmed_at` | |
| `holds_tickets` | True while the booking counts against availability |
| `ticket_code` | Unique, `MV-` + 6 digits, set only when confirmed |
| `payment_method` | `mpesa`, `card`, `free` or `complimentary` |
| `mpesa_mode`, `mpesa_phone_number`, `mpesa_receipt_number` | Filled from the provider, never from the client |
| `checked_in_at`, `checked_in_by` | |
| `booking_date` | |

**`tickets.PromoCode`**

| Field | Notes |
|---|---|
| `code` | Stored upper-case |
| `percent_off` | 1–100 |
| `gathering` | Null means site-wide |
| `valid_from`, `valid_until`, `max_uses`, `use_count`, `is_active` | |
| `created_by` | |

Codes are unique per event, and site-wide codes are unique among themselves. `KARIBU15` (15%, site-wide) is seeded by a data migration.

**`tickets.Bookmark`**: `user`, `gathering`, unique together.

**`console.ConsoleAction`**: `staff`, `action`, `target_type`, `target_id`, `target_label`, `note`, `created_at`. One row per staff change.

**`payments.Payment`.** One payment attempt, for a booking or for an event's listing fee.

| Field | Meaning |
|---|---|
| `purpose` | `booking` or `listing_fee`; a database constraint requires exactly the matching link below |
| `booking` | The booking being paid for |
| `listing_fee` | The listing fee being paid for (protected: a paid fee's event cannot be deleted) |
| `target_category` | For a listing-fee payment that moves a paid event to a dearer category: that category |
| `provider` | `simulated`, `mpesa_stk`, `mpesa_paybill`, `paystack`, or `manual` (recorded by an admin) |
| `method` | `mpesa` or `card` |
| `reference` | Ours: the Paystack reference, or the Paybill account number |
| `provider_reference` | The provider's: STK CheckoutRequestID, C2B TransID, or Paystack transaction id |
| `amount`, `currency` | |
| `status` | `pending`, `succeeded` or `failed` |
| `phone_number`, `receipt_number`, `authorization_url`, `failure_reason` | |
| `needs_refund` | Money arrived that must go back: duplicate, late, or wrong amount |
| `raw_payloads` | The last 20 callbacks and queries |
| `refund_resolved_at`, `refund_resolved_by`, `refund_note` | Set in the staff console when a flagged refund is settled |
| `created_at`, `updated_at`, `completed_at`, `last_queried_at` | |

`Payment.booking_payments` is a manager for ticket payments only (used by the staff console).

**`listings.CategoryFee`**: `category` (unique, one of the nine), `amount` (whole KES, 0 = no fee), `updated_at`, `updated_by`. A category without a row has no fee.

**`listings.PlatformPaymentAccount`**: one row (pk 1). `method` (`paybill` or `till`), `business_number`, `account_number` (Paybill; empty = each event's reference), `account_name`, `instructions`, `updated_at`, `updated_by`.

**`listings.ListingFee`**: one per event.

| Field | Meaning |
|---|---|
| `reference` | `LF` + 8 characters; also the Paybill account number for paying by hand |
| `status` | `unpaid`, `pending`, `paid`, `waived` or `exempt` (no fee); kept current for filtering |
| `cleared`, `cleared_category`, `cleared_amount` | The fee is settled for that category at that fee level (KES) |
| `amount_paid`, `amount_waived`, `payment_reference`, `paid_at` | Money actually received, and the reference of the payment that cleared it |
| `grandfathered` | Existed before listing fees (and the demo events): counts as paid |
| `publish_requested` | The organizer asked to publish: the event goes live as soon as the fee is confirmed |
| `waived_by`, `waived_at`, `waive_reason`, `marked_paid_by`, `marked_paid_at`, `mark_paid_reason` | Who settled it by hand, when and why |

**`notifications.Notification`**: `recipient`, `kind` (`listing_fee_due`, `listing_fee_paid`, `listing_fee_failed`), `title`, `body`, `gathering`, `dedupe_key` (unique per recipient, so one event is never notified twice), `created_at`, `read_at`.

**`payouts.PayoutAccount`**: where the platform pays out an organizer's ticket money. `organizer`; `gathering` (empty for the organizer's default, set for one event's override); `method` (`mpesa_phone`, `till`, `paybill`, `bank`) with `phone_number` (stored `2547…`), `till_number`, `paybill_number` + `paybill_account`, or `bank_name` + `bank_account_name` + `bank_account_number`; `updated_by`. One default per organizer.

**`payouts.Payout`**: money the platform sent an organizer, recorded by an admin. `organizer` (protected), `amount`, `reference`, `paid_on`, `note`, `sent_to` (the payment details at the time), `recorded_by`, `created_at`.

### 9.3 Business rules

**Events**
- The API reads and writes the nested `EventItem` shape.
- **Free events** force every price to 0 and clear any sale. **Paid events** need every ticket type priced above 0, and the starting price becomes the cheapest tier.
- **Tiers on update.**
  - Tiers sent with their numeric `id` are updated; others are created; tiers not sent are deleted.
  - A tier with sales cannot be deleted.
  - A tier's `quantity` cannot go below what is sold; `available` is recomputed as `quantity − sold`.
  - Older clients that send only `available` still work.
- When every tier sends a `quantity`, **capacity = sum of quantity × admits** (a couple ticket uses two places). Capacity can never drop below the places already booked or held.
- Drafts are visible only to their owner. Creating an event needs the **organizer role** (or admin) and an unsuspended account. Editing needs ownership.
- **Every new event is saved as a draft**, whatever status is sent.
- `organizerStats` (`revenue`, `ticketsSold`), `confirmedAttendees` (people) and `listingFee` (`status`, `amountDue`, `categoryFee`, `amountPaid`, `reference`, `publishRequested`, `paidAt`, `onlinePayment`) appear only for the owner and count **confirmed** bookings.
- Payment details never appear in any event, booking or ticket payload.

**Publishing.** One set of rules (`gatherings/publishing.py`), checked in this order on every path that can make an event public (create, full update, partial update, the staff console's status action, the listing-fee confirmation, and `Gathering.save()` as a backstop):

1. The organizer is not suspended (HTTP 403, `organizer_suspended`).
2. An event with any paid ticket has payment details: its own or the organizer's default (HTTP 400, `payment_details_missing`).
3. The listing fee is settled: paid or waived, or the category's fee is 0 (HTTP 402, `listing_fee_due` with `amountDue`; `listing_fee_pending` while a payment is being confirmed).

The order means nobody pays a fee for an event that still could not be published.

**Listing fee.**
- Charged once per event. The first publish while nothing is due settles it for good; unpublishing and republishing never charges again, even if the category's fee is raised later.
- The amount actually paid is recorded; a later change to a category's fee does not affect events already paid or waived.
- Moving a paid event to a category with a higher fee is refused (HTTP 402, `category_upgrade_due`, with `amountDue`, `category`, `targetCategory`) until the difference is paid; the category changes when that payment is confirmed. Moving to a cheaper category is free and gives no refund. An unpaid draft can change category freely; it then owes the new category's fee.
- Free events pay the listing fee like any other; the admin sets a category's fee to 0 to exempt it.
- Existing events (data migration) and the seeded demo events count as paid.
- An event whose listing fee was paid cannot be deleted (unpublish it instead).

**Ticket tiers and pricing** (inside the booking transaction, under the gathering and tier row locks):
- The tier's sales window must be open.
- The places needed are quantity × admits; they must fit in the event's places left, and the quantity in the tier's tickets left.
- The unit price is the flash-sale price while the sale runs and its allowance lasts, otherwise the normal price. A request bigger than the sale allowance left is refused with how many remain at the sale price, rather than charging a mix of prices.
- The promo code applies on top of whichever price is in effect.
- The booking records the unit price charged, whether it was the sale price, and the people it admits. A failed or expired booking gives back its places, tickets and sale allowance once; a late payment re-takes them only if still available.

**Earnings and payouts.**
- The platform collects every ticket payment (an M-Pesa STK Push pays into the account whose credentials the platform holds; it cannot be pointed at an organizer's own number or Till) and pays organizers out to their payment details.
- Earnings per event = confirmed bookings' totals, after discounts. Balance = earnings − payouts recorded.
- A payout can never exceed the balance: `payouts.services.record_payout` locks the organizer's row before checking. Payouts are made by hand today; `payouts/automated.py` is where Daraja B2C or card-gateway split payments would be added.

**Bookings**

All of the following happens inside one transaction with row locks.

1. Expired holds for the event are released first.
2. The event must be published.
3. The quantity (1–20) must fit both the event's places left and the tier's tickets left.
4. The tier is found by `tierId`, or failing that by `tierName`.
5. The unit price comes from the tier. Any client-sent amount or receipt is ignored.
6. The promo code is looked up: the event's own code first, then a site-wide one. Validity window, maximum uses and active flag are checked, and the use is counted.
7. The discount is rounded half-up to whole shillings.
8. If the total is 0, the booking is confirmed at once with a ticket code, and the email is sent after commit.
9. Otherwise the booking is **pending**: its tickets are held and `expires_at = now + PAYMENT_HOLD_MINUTES`. The payment is then started (section 10).
10. In live mode, a method with missing credentials, or an invalid phone number, is refused **before** anything is held.

Guests may book; their bookings have no user and are rate-limited per IP.

**Tickets**
- Ticket, PDF, resend, lookup, **My tickets** and check-in work only for **confirmed** bookings.
- Emails never fail a booking: errors are logged.

**Check-in**
- Only the event's organizer can check tickets in.
- It accepts the scanned URL, a booking UUID, or a ticket code (`mv-123456`, `MV 123456` and `123456` all work).
- Results:
  - `checked_in`
  - `already_checked_in` (with the time)
  - `wrong_event`: says nothing about the other event's attendee
  - `not_paid`
  - `not_found`

### 9.4 Seed data and migrations

`seed_gatherings` loads 10 Kenyan demo events (Nairobi, Mombasa, Kisumu, Nakuru) owned by `curator@magivents.local`, an organizer with no usable password.

Notable data migrations:

| Migration | Effect |
|---|---|
| `gatherings/0004` and `tickets/0004` | Earlier categories and dollar prices converted to the Kenyan list and KES |
| `gatherings/0006` | Event owners get the organizer role |
| `tickets/0006` | Links bookings to tiers, sets tier quantities, seeds `KARIBU15` |
| `tickets/0008` | Existing bookings are marked confirmed |
| `accounts/0004` | Staff and superusers get the admin role; event owners keep the organizer role |
| `listings/0002` | Every existing event gets a listing fee that counts as paid |

### 9.5 Django admin

`/admin/` has:

- Users (with role and suspension filters), gatherings, tiers, agenda items, bookings, bookmarks and promo codes.
- **Payments**: read-only, filterable by purpose, provider, status and `needs_refund`.
- Category fees, platform payment account, listing fees (read-only), notifications, payment details and payouts.

---

## 10. The paid booking lifecycle and payments

```
                ┌──── provider reports success AND amount == server total ───▶ confirmed
                │                                                          (ticket code, QR, PDF, email)
 POST /bookings/ ─▶ pending (tickets held, countdown) ──── provider reports failure ───▶ failed ┐
                │                                                                             ├─ tickets released once,
                └──── hold time runs out (lazy check or release_expired_holds) ──▶ expired ┘   promo use returned,
                                                                                               sold_out → published
 POST /bookings/<id>/pay/ on a failed/expired booking: re-checks availability, holds again, new attempt.
```

### Rules

- **Idempotent.**
  - A repeated callback never confirms twice or sends a second email.
  - A failure report after a success changes nothing.
  - Releasing tickets happens once.
- **Late payments.** A success arriving after expiry revives the booking only if the tickets are still available. Otherwise the payment is flagged `needs_refund` and nothing is oversold.
- **Duplicates and wrong amounts.**
  - A second payment for an already-confirmed booking is flagged `needs_refund`. So is a second Paybill transaction to the same account number.
  - A wrong amount never confirms; it is flagged `needs_refund`.
- **One live attempt.** Starting a new attempt marks earlier pending attempts as replaced.
- **Lock order.** Rows are always locked in the order gathering → booking → payment → tier, so concurrent requests cannot deadlock on PostgreSQL.

### Providers

They all sit behind one interface: `payments/providers/base.py`, with `initiate`, `query` and `instructions`. Adding a gateway means one new class.

| Provider | Mode | How it confirms |
|---|---|---|
| Simulated | `PAYMENTS_MODE=simulated` (default) | The status endpoint asks the fake gateway, which succeeds after the configured delay. Phone numbers ending `1032` or `2001` fail. |
| Daraja STK Push | live | `POST /mpesa/stkpush/v1/processrequest`, with the phone normalised to `2547…` or `2541…`, the CheckoutRequestID stored, and AccountReference ≤ 12 and TransactionDesc ≤ 13 characters. Confirmed by the STK callback (amount and receipt from `CallbackMetadata`). Fallback: STK Query, from 25 seconds after the push, at most every 15 seconds while checkout polls. |
| Daraja C2B Paybill | live | The attendee pays the Paybill with their own account number. The validation callback rejects an unknown account (`C2B00012`) or a wrong amount (`C2B00013`). The confirmation callback is matched on account number and exact amount. |
| Paystack | live | Hosted checkout (`/transaction/initialize`, amount in KES cents, `channels: ['card']`, return to `FRONTEND_URL/?booking=<id>`). The webhook must carry a valid `x-paystack-signature` (HMAC-SHA512 of the raw body); then `/transaction/verify/<reference>` decides. The status poll also verifies. |

### Listing-fee payments (pay to publish)

```
 POST /gatherings/<id>/listing-fee/pay/ ─▶ pending ──(provider confirms, amount matches)──▶ paid ──▶ published
                                            │                                              (if publish was asked)
                                            └──(provider reports failure)──▶ failed: fee unpaid, admins notified
 Admin: Waive (reason) ──▶ waived          Admin: Mark paid (reason + reference) ──▶ paid (Payment, provider manual)
```

- Listing-fee payments are `Payment` rows with `purpose='listing_fee'`, through the same provider interface. `record_success` and `record_failure` hand them to `listings.services`, which locks gathering → listing fee → payment.
- **Idempotent**: a repeated confirmation records nothing more and publishes and notifies only once (notifications also carry a unique key). A failure report after a success changes nothing. A wrong amount, or money for a fee already settled another way, is flagged `needs_refund` and publishes nothing.
- Starting a new attempt marks earlier pending ones as replaced. An attempt left pending longer than `PAYMENT_HOLD_MINUTES` stops blocking a new one.
- `listings.services.listing_fee_provider()` returns the gateway that takes listing fees online: the simulated one in `PAYMENTS_MODE=simulated`, none in live mode (pay by hand, an admin records it). Daraja STK Push or a card gateway would plug in there.

### Callback security

Callback endpoints are public and cannot carry a JWT, so each is protected differently.

**Daraja** does not sign its callbacks. Its URLs are:

- `/api/payments/hooks/stk/<PAYMENT_CALLBACK_SECRET>/`
- `/api/payments/hooks/c2b-validate/<secret>/`
- `/api/payments/hooks/c2b-confirm/<secret>/`

These are protected by:

- An unguessable path secret.
- An optional IP allowlist (`DARAJA_ALLOWED_IPS`, using Safaricom's published list).
- Always matching the reference and amount against a stored payment.

The paths avoid words Daraja rejects, such as "mpesa", "safaricom" and "query".

**Paystack** (`/api/payments/hooks/paystack/`) is protected by the signature check, then a server-side verify call.

---

## 11. REST API reference

Base URL `/api`. Authenticated calls send `Authorization: Bearer <access token>`. JSON is camelCase. The complete, current schema is at **`/api/schema/`**, browsable at **`/api/docs/`**.

### Auth and profile

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register/` | public | `{name, email, password}` → `{tokens, user}` |
| POST | `/auth/login/` | public | `{email, password}` → `{tokens, user}` or 401 |
| POST | `/auth/google/` | public | `{credential}` → `{tokens, user}`; 503 if not configured |
| POST | `/auth/token/`, `/auth/token/refresh/` | public | SimpleJWT |
| GET / PATCH | `/auth/profile/` | user | `{id, name, email, avatarUrl, bio, city, role, joinedDate, authProvider}` |
| POST | `/auth/avatar/upload/` | user | multipart `file` |
| POST | `/auth/password/change/`, `/auth/password/reset/` | user / public | |
| POST | `/auth/become-organizer/` | user | Upgrades an attendee to `curator` (never changes an admin); returns the profile |

The profile also has `isSuspended` and `suspensionReason`; `role` can be `admin`.

### Events

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/gatherings/`, `/gatherings/{id}/` | public | `?search=`; adds `organizerStats` for the owner |
| POST | `/gatherings/` | organizer, not suspended | Create; always saved as a draft. Admins are notified when a listing fee is due |
| PUT / PATCH / DELETE | `/gatherings/{id}/` | owner | Publishing follows the rules in section 9.3 (403 / 400 / 402 with `{error, code, amountDue?}`). DELETE is refused (403) once the listing fee was paid |
| GET | `/gatherings/{id}/listing-fee/` | owner | `{status, amountDue, categoryFee, amountPaid, reference, publishRequested, paidAt, onlinePayment, payment, platform: {method, methodLabel, businessNumber, accountNumber, accountName, instructions, isConfigured}, clearedCategory, eventId, eventStatus, category}`; also asks the provider about a pending payment |
| POST | `/gatherings/{id}/listing-fee/pay/` | owner, not suspended, throttled | `{mpesaPhoneNumber, category?}` (`category` pays the difference for a dearer category). 400 nothing due / payment details missing, 503 `listing_fee_offline` in live mode |
| GET | `/gatherings/my_gatherings/` | user | |
| GET | `/gatherings/{id}/attendees/` | owner | `{counts: {bookings, people, checkedInBookings, checkedInPeople}, attendees: [...]}` |
| POST | `/gatherings/{id}/check-in/` | owner | `{ticket}` → `{result, message, attendee?}` (409 for already / wrong event / not paid, 404 not found) |

Tier fields in `pricing.tiers[]`: `id`, `name`, `price`, `description`, `quantity`, `available`, `sold` (read-only), `perks`, `admits`, `salePrice`, `saleStartsAt`, `saleEndsAt`, `saleQuantity`, `onSaleFrom`, `onSaleUntil` (ISO, UTC), and read-only `saleRemaining`, `saleActive`, `currentPrice` (the price in effect when the response was made) and `salesState` (`on_sale`, `not_started`, `ended`).

### Bookings and payments

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/bookings/` | public (guests throttled) | Returns a **booking with payment**: the `TicketBooking` fields + `status`, `expiresAt`, `payment`, `holdSecondsLeft`. Free → `confirmed`; paid → `pending` (or `failed` if the provider refused) |
| GET | `/bookings/` | user | Confirmed bookings only |
| GET | `/bookings/{uuid}/status/` | public (UUID is the key) | Polled by checkout; runs the status-query fallback and lazy expiry |
| POST | `/bookings/{uuid}/pay/` | public, throttled | `{paymentMethod, mpesaMode?, mpesaPhoneNumber?}`: retry or switch method on the same booking; 409 if already paid or tickets gone |
| POST | `/promo-codes/validate/` | public, throttled | `{code, eventId, tierId?, quantity?}` → `{code, percentOff, subtotal, discount, total}`; uses nothing |
| CRUD | `/promo-codes/` | user | Codes for the user's own events: `{id, code, percentOff, eventId, eventTitle, validFrom, validUntil, maxUses, useCount, isActive}` |
| POST | `/payments/hooks/...` | provider callbacks | See section 10 |

`payment` object: `id`, `provider`, `method`, `status`, `reference`, `amount`, `failureReason`, `authorizationUrl`, `receiptNumber`, and `instructions`, which holds `paybill` and `accountNumber`, `phoneNumber`, or `simulated`.

`TicketBooking` gained these fields (none were removed):

- `status`, `expiresAt`
- `admits` (people in total), `admitsPerTicket`, `isSalePrice`
- `ticketUrl`: the QR link, null until confirmed
- `checkedInAt`
- `ticketCode`: null until confirmed

The client fields `mpesaReceiptNumber` and `totalInKes` are still accepted, for compatibility, but ignored.

### Tickets

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/tickets/{uuid}/` | public | Confirmed ticket (the QR / email link) |
| GET | `/tickets/{uuid}/pdf/` | public | PDF ticket (`?inline=1` to view in the browser) |
| POST | `/tickets/{uuid}/resend/` | public, throttled | Emails the attendee again; 503 if sending fails |
| POST | `/tickets/lookup/` | public, throttled | `{ticketCode, email}` → ticket, or the same 404 for any mismatch |

### Other

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/bookmarks/`, POST `/bookmarks/toggle/{id}/` | user | |
| GET | `/config/` | public | `{mpesaPaybill, mpesaAccountName, paymentsMode, paymentMethods: {mpesaStk, mpesaPaybill, card}, paymentHoldMinutes, listingFeeOnline}` |
| GET / PUT / DELETE | `/payouts/details/` | organizer | The organizer's default payment details: `{method, phoneNumber, tillNumber, paybillNumber, paybillAccount, bankName, bankAccountName, bankAccountNumber}`; GET returns `{details}` (with `summary`, `methodLabel`) or `{details: null}` |
| GET / PUT / DELETE | `/payouts/events/{id}/details/` | owner | One event's override: `{override, effective, usesDefault}`; DELETE goes back to the default |
| GET | `/payouts/summary/` | organizer | `{earnings, payoutsTotal, balance, events: [{eventId, title, ticketsSold, people, earnings, discounts, …}], payouts, details}` |
| GET | `/notifications/?limit=` | user | `{unreadCount, results: [{id, kind, title, body, eventId, createdAt, readAt}]}` |
| POST | `/notifications/read/` | user | `{ids: [...]}` or `{all: true}` → `{unreadCount}` |
| GET | `/geocode/?q=` | user, throttled | `{results: [{name, lat, lng}]}` from Nominatim, cached; 503 when unavailable |
| GET | `/health/` | public | `{status, database, cache}`, 200 or 503 |
| GET | `/schema/`, `/docs/` | public | OpenAPI and Swagger UI |
| GET / POST | `/console/<ADMIN_CONSOLE_PATH>/…` | staff on the secret path; 404 for everyone else | `session/`, `overview/`, `organizers/`, `organizers/<id>/`, `organizers/<id>/role/`, `events/<id>/status/`, `payments/`, `payments/<uuid>/`, `payments/<uuid>/resolve-refund/`, `bookings/`, `actions/`. Deliberately left out of `/api/schema/`. |

### Admin dashboard (`/api/admin/`, role admin; 403 for every other signed-in user, 401 when signed out)

| Method | Path | Notes |
|---|---|---|
| GET | `overview/` | `{organizers, suspendedOrganizers, eventsAwaitingPayment, feesCollectedThisMonth, feesCollectedAllTime, balancesOutstanding, unpaidFeesTotal, monthStart}` |
| GET / POST | `organizers/` | List: `?search=&status=active\|suspended\|invited&role=curator\|patron&sort=name\|joined\|events\|sales\|fees&page=`. Create: `{name, email, city?, bio?}` → organizer + `inviteSent` (set-password email) |
| GET / PATCH / DELETE | `organizers/{id}/` | Detail with `events`, `eventEarnings`, `payouts`. PATCH `{name?, email?, city?, bio?, role?: patron\|curator}`. DELETE `{confirmEmail}`; 409 `has_bookings` / `has_payments` with `canSuspend` |
| POST | `organizers/{id}/resend-invite/` | Only before the password is set |
| PUT / DELETE | `organizers/{id}/payment-details/` | The organizer's default payment details |
| POST | `organizers/{id}/suspend/`, `organizers/{id}/reactivate/` | Suspend: `{reason, takeDownEvents}` → `eventsTakenDown` |
| GET / POST | `organizers/{id}/payouts/` | `{earnings, payoutsTotal, balance, payouts}`; POST `{amount, reference, paidOn, note?}`; 400 if more than the balance |
| GET / PUT | `category-fees/` | `{fees: [{category, amount, updatedAt, updatedBy, eventsAwaitingPayment}]}`; PUT `{fees: [{category, amount}]}` |
| GET / PUT | `platform-payment/` | `{method, businessNumber, accountNumber, accountName, instructions}` |
| GET | `listing-fees/` | `?status=&category=&organizerId=&search=&dateFrom=&dateTo=&page=` → page of fees + `totals {count, byStatus, amountPaid, amountWaived, amountUnpaid}` |
| POST | `listing-fees/{eventId}/waive/`, `listing-fees/{eventId}/mark-paid/` | `{reason}` / `{reason, reference}` |

Admin dashboard endpoints are part of `/api/schema/`, unlike the hidden staff console.

Errors: DRF validation format or `{"error": "..."}`; publishing rules add a `code` (section 9.3).

---

## 12. Frontend reference

### App shell

- There is no router library. `App.tsx` switches between the views `discover` (grid or calendar), `details`, `organizer`, `profile`, `ticket`, `console` and `admin` (admins only).
- It holds events, bookmarks, confirmed bookings, search, tag filter and modal state.
- It handles the deep links `?event=`, `?ticket=`, `?booking=`, `?view=admin` (admins) and `?signin=1` (after setting a password).
- It opens the **Pay to publish** step when publishing is refused because the listing fee is due.
- It opens checkout and the **Become an organizer** screen.

### Auth and API

- **`AuthContext`** restores the session and provides login, signup, Google, reset, profile update, password change, `becomeOrganizer` and logout.
- **`services/api.ts`** is an Axios client with the Bearer token and a single shared refresh on 401. Its API groups:
  - `authApi`, `gatheringsApi`, `bookingsApi` (`create`, `list`, `status`, `pay`), `bookmarksApi`
  - `promoApi`, `ticketsApi` (`get`, `lookup`, `resend`, `pdfUrl`), `checkInApi`, `geocodeApi`
  - `listingFeeApi` (`get`, `pay`), `payoutsApi` (payment details, event overrides, `summary`), `adminApi`, `notificationsApi`
  - `publishBlockedReason` / `PublishBlocked` read the server's publish-rule refusals (`code`, `amountDue`, …)
  - `getPublicConfig` (cached)

### Checkout

- **`CheckoutModal`** has three steps: form → payment → success.
  - It submits through `bookingsApi.create` and polls `status` with back-off (2.5 s, then 4 s, then 8 s).
  - It reports confirmed bookings to `App` and redirects to Paystack when there is an authorization URL.
- **`MpesaPaymentSection`** is now a pure **method picker**: method, M-Pesa mode and phone.
- **`PaymentStatusPanel`** shows the countdown, Check your phone, the Paybill numbers, the card redirect, failure and expiry messages, retry, and method switching.
- **`utils/checkout.ts`** holds the pure state helpers covered by tests: `checkoutStage`, `paymentAction`, `failureMessage`, `formatCountdown`, `pollDelay`, `normalizeKenyanPhone`, `phoneError`.

### Tickets and organizer components

| Component | Purpose |
|---|---|
| `TicketQRCode` | Inline SVG QR for a ticket URL |
| `TicketView` | The Find my ticket page and ticket-link page |
| `PrintableTicketModal` | Print, or download the server PDF |
| `EmailConfirmationModal` | Server resend, or forward with the user's own email app |
| `PromoCodesPanel` | Promo code management |
| `CheckInPanel` | Camera scan via `utils/qrScanner.ts` (native `BarcodeDetector`, or a lazily loaded WASM polyfill bundled with the app), typed codes, attendee list |
| `CoordinatePicker` | Address search, draggable pin |
| `BecomeOrganizerModal` | The organizer upgrade screen |
| `PayListingFeePanel` | Pay to publish (or pay a category difference): platform details, M-Pesa payment, server polling |
| `EarningsPanel` | Organizer earnings per event, payouts received, balance |
| `PayoutDetailsFields`, `PayoutDetailsCard` | Payment details form (profile, event form, admin) |
| `admin/AdminDashboard` | Overview, organizers, listing fees, category fees, platform payment (lazy loaded) |
| `admin/NotificationBell` | Admin notifications with unread count; polls |
| `admin/ReasonDialog` | Reason (and reference) for admin actions that change money or access |
| `map/VenueMap` | Leaflet map, lazy loaded |

Large libraries load only when needed: Leaflet (about 150 kB), and the QR decoder (about 44 kB of JS plus a 1.1 MB WASM file). The admin dashboard (about 43 kB) loads only for admins.

**Tier and time helpers.** `utils/tiers.ts` mirrors the server's pricing rule so prices and countdowns change on time (`tierPriceAt`, `saleSecondsLeft`, `tierSalesState`, `admitsLabel`, the presets). `utils/time.ts` converts between Nairobi `datetime-local` values and UTC, and formats Nairobi times. `utils/useNow.ts` ticks only while a sale countdown is on screen.

---

## 13. Design system

**Look and type**
- Warm sand and ivory backgrounds, espresso text, and copper and gold accents (`src/index.css`). Light theme only.
- Playfair Display for headings, Plus Jakarta Sans for text.

**Colours**

| Name | Hex |
|---|---|
| sand | #E9E2D6 |
| ivory | #F4EFE7 |
| espresso | #1E1814 |
| terracotta | #8A4F33 |
| gold | #C7B173 |
| onyx | #110D0B |

The same palette is used for the PDF ticket, the email, the map pin and the QR code colours.

**Accessibility**
- ARIA labels and roles: dialogs, comboboxes, radiogroups for payment choices, tablists for the dashboard sections, and live regions for check-in results.
- Keyboard support; Esc closes modals, the saved drawer and the full-screen map.
- Mobile layouts were checked at 390 px wide.

**Print stylesheet**: prints only the ticket.

---

## 14. Testing

### Backend: 155 tests (`manage.py test`), all passing

All external HTTP (Safaricom, Paystack, Nominatim, SMTP) is mocked, so the suite runs offline.

| Suite | Tests | Covers |
|---|---|---|
| `accounts` | 10 | Registration, login, profile, avatar, password change and reset, Google sign-in |
| `gatherings` | 9 | Event CRUD and visibility, KES and free rules, categories, agenda order, organizer stats, tier quantities and capacity, role enforcement |
| `tickets` | 20 | Server-side pricing, promo codes (seeded `KARIBU15`, per-event, limits, expiry, scope, validate endpoint, management), sold out, privacy, bookmarks, free and guest bookings, confirmation email (HTML + text + PDF), failing email, QR URL, PDF, resend, lookup and its throttle, check-in |
| `payments` | 24 | Phone normalisation; simulated lifecycle (pending → confirmed, failure + retry on the same booking, expiry and sold-out reopening, the command, confirmed-only counts, promo use returned); idempotency (repeated success and failure, amount mismatch, late success with and without availability); Daraja STK (request fields, callback, wrong secret, IP allowlist, cancel, query fallback, refusal, invalid phone); C2B (validation codes, confirmation, repeat, second payment, underpayment); Paystack (initialize, bad signature, verify-before-trust, status poll); live mode without credentials |
| `core` | 11 | Public config, API schema and docs, geocoding (auth, cache, upstream failure), health (ok, database down, cache down), production settings (refuses the dev key, HTTPS protections) |
| `console` | 13 | Access (only staff on the secret path; 404 for signed-out, attendees, organizers, wrong path and inactive staff; off when unset or short; lockout after repeated guesses; hidden from the schema); overview counts confirmed sales only; organizer list and detail; payment and booking search and filters; refund resolution (note required, once only, logged); role revoke and restore; unpublish and republish (full events return as sold out) |
| `accounts` (new) | +4 | Admin role follows `is_staff` both ways and for superusers; become-organizer never demotes an admin; the role data migration; suspension on the profile |
| `gatherings` (new) | +2 | A suspended organizer cannot create or publish (PATCH and PUT) but still sees and edits their drafts |
| `tickets` (new) | +13 | Capacity counts people; couple and group tickets (price, people, the last group ticket, the last place); flash-sale price at the start, before, and at the end; the sale limit and the last sale ticket (no mixed prices); a failed payment returns the sale ticket and places; promo on top of the sale price; tier sales window; the public tier payload; sale validation; free events clear sales; admits locked once sold |
| `payouts` | 11 | Each payment-details format; attendees have none; paid events need details to publish (PATCH and PUT); default and event override; free events need none; only the owner reads or changes them; details never appear in any public event response; earnings from confirmed bookings after discounts; a payout never exceeds the balance (more than the balance, decimals, future dates, the exact balance, then nothing left); balances on the admin overview; only organizers see earnings |
| `listings` | 25 | New events are drafts and admins are notified (in app and email) only when a fee is due; an unpaid event cannot be published by PATCH, PUT, `sold_out`, create, the staff console or `save()`; free events pay too; paying publishes and notifies once, repeated confirmations change nothing; charged once even after unpublishing and a fee change; category upgrade pays the difference first, cheaper is free; unpaid drafts change category freely; failure leaves a draft and notifies; nothing to pay and payment details checked before taking money; owner only; suspended cannot pay or publish; live mode is paid by hand; a paid fee's event cannot be deleted; pending then confirmed by polling; a late failure after success; a wrong amount never publishes; seeded and migrated events count as paid |
| `adminpanel` | 13 | **Every admin endpoint returns 403** to attendees, organizers, a demoted former admin and an inactive admin (and 401 signed out), and changes nothing; admins and superusers get in; creating an organizer emails a working set-password link (followed through Django's pages to signing in); list search and filters; edit details, email clash, role and payment details; admins' roles are not editable here; suspend with and without taking events down, then reactivate; delete needs the typed email and no bookings; category fees (validation, exempting clears unpaid events); platform payment details; listing-fee list, filters and totals; waive and mark paid need a reason and record who, and mark paid publishes when asked and notifies the other admins |

Some test fixtures were changed where the work changed behaviour on purpose (the assertions were not):

- **New events are drafts** (listing fee). The tier-editor test now publishes the event it creates before booking it; it also asserts the new event is a draft.
- **Payment details** (Part 3 of the admin round). Owners in the older event tests are given payment details, because publishing a paid event now needs them.
- **Throttle cache.** New tests that make guest bookings clear the shared rate-limit cache, as the payments and console suites already did.

- **Organizer role.** The original gatherings test owner is created with the organizer role, because creating events now requires it.
- **Simulated delay.** The original paying test classes run the simulated gateway with no delay, because paid bookings are now confirmed by the payment provider rather than at creation.

### Frontend: 34 tests (`npm test`, Vitest)

| File | Covers |
|---|---|
| `format.test.ts` | KSh formatting, initials, local ISO dates |
| `search.test.ts` | Accent-insensitive all-words matching; ranking (title matches, upcoming, past; drafts excluded) |
| `share.test.ts` | Invite text, channel URLs and encoding, behaviour outside the browser |
| `ticketPrinting.test.ts` | Payment summaries, confirmation email text |
| `checkout.test.ts` | Stages, payment actions, failure messages, countdown, polling back-off, Kenyan phone normalisation and errors |
| `tiers.test.ts` | Flash-sale price at the boundaries and when the allowance is used up, countdown, sales window, admits label, Nairobi time conversions, durations |
| `payoutDetails.test.ts` | M-Pesa, Till, Paybill and bank formats |

`npm run lint` (TypeScript) and `npm run build` also pass.

The flows were also exercised in a headless browser:

- Ticket page and QR decoding.
- Find my ticket.
- Check-in.
- STK, failure + retry, Paybill and card in simulated mode.
- The real Leaflet map and the address search.

The production Docker stack was built and checked end to end, including media, a paid booking and the PDF.

The admin round was walked through end to end in headless Chrome against a fresh clone with no `.env` (simulated payments): the admin set a category fee and the platform details and created an organizer; the organizer set a password from the emailed link, added payment details, created an event with VVIP, VIP, Regular, Couple and Group tickets and a flash sale, was sent to Pay to publish, paid, and the event went live with the admin notified; a guest booked a Couple ticket (KSh 2,500, admits 2) and a flash-sale VIP ticket (KSh 3,500 instead of 5,000), taking the attendee count from 0 to 3; the organizer saw KSh 6,000 earned; the admin recorded a KSh 5,000 payout and both sides showed KSh 1,000 outstanding. Mobile layouts were checked at 390 px.

---

## 15. What is still simulated or limited

| Item | Status | What is needed |
|---|---|---|
| **Daraja and Paystack against their real sandboxes** | The integrations are written from the current official docs and covered by tests with mocked HTTP. **They have not yet been run against the live sandbox** (no credentials were available). | Daraja sandbox keys and Paystack test keys, a public HTTPS `PUBLIC_API_URL`, then one test booking per method (section 16) |
| **Demo payments** | `PAYMENTS_MODE=simulated` (the default) uses a fake gateway | Set `PAYMENTS_MODE=live` with credentials |
| **Refunds** | Duplicate, late and wrong-amount payments are flagged `needs_refund` in the admin, but refunds are made by hand (M-Pesa reversal, Paystack dashboard) | A refund flow could be added later |
| **STK success via the query fallback** | Daraja's query response has no amount or receipt; the amount is the one requested (an STK prompt cannot charge a different amount) and the receipt stays empty until a callback brings it | Accepted limitation |
| **C2B phone numbers** | Daraja v2 masks the payer's number, so Paybill payments are matched only on account number and amount | None |
| **External C2B validation** | Off by default at Safaricom; until it is enabled, wrong amounts are caught at confirmation (flagged for refund) instead of being rejected up front | Ask Safaricom API support to enable external validation |
| **Map data** | Public OpenStreetMap tiles and Nominatim allow light use only (attribution shown, search on button press, results cached, one request per second) | For heavy traffic, a commercial or self-hosted tile and geocoding provider (`GEOCODER_URL`; tile URL in `VenueMap.tsx`) |
| **Parking / Getting there tabs** | General guidance text; only Arrival shows organizer-written text (`venue.mapNote`) | Editor fields for these notes, if wanted |
| **Guest bookings** | Rate-limited per IP; no account recovery beyond code + email lookup | None |
| **Frontend tests** | Cover utilities and checkout logic, not components | Component tests could be added |
| **Listing fees online in live mode** | Only the simulated gateway takes listing fees online. With `PAYMENTS_MODE=live`, organizers pay the platform Paybill or Till by hand (quoting their reference) and an admin records it | A provider in `listings.services.listing_fee_provider()` (Daraja STK Push into the platform shortcode, or a card gateway) |
| **Payouts** | Made by hand outside MagiVents and recorded by an admin | Daraja B2C or card-gateway split payments, at `payouts/automated.py` |
| **Platform commission** | None: organizers earn the full ticket totals after discounts | A commission rule in `payouts/ledger.py`, if the business wants one |
| **Admin role from the dashboard** | Admins are made in the Django admin (staff status) or with `createsuperuser`, not from the dashboard | None |

---

## 16. Going live checklist

**1. Safaricom Daraja (M-Pesa)**
- Create an app at developer.safaricom.co.ke and test in the sandbox first:
  - Shortcode 174379 with the sandbox passkey for STK.
  - Shortcode 600984 for C2B.
- Get **production** credentials through Go Live:
  - Consumer key and secret.
  - Your own **Paybill or Till**.
  - The **Lipa na M-Pesa Online passkey**, which Safaricom emails after Go Live.
- Set:
  - `PAYMENTS_MODE=live`, `MPESA_ENVIRONMENT=production`
  - `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`
  - `MPESA_STK_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_STK_TRANSACTION_TYPE` (and `MPESA_STK_PARTY_B` for a Till)
  - `MPESA_C2B_SHORTCODE`
  - `PAYMENT_CALLBACK_SECRET` (a long random string)
  - `DARAJA_ALLOWED_IPS` (Safaricom's list in `payments/providers/daraja.py`)
- Run `python manage.py register_c2b_urls` once. Production registration is one-time; changing the URLs later needs Safaricom's URL management.
- Optionally ask Safaricom API support to enable external validation for the Paybill.

**2. Paystack (cards)**
- Open a Kenyan Paystack account and test with `sk_test_…` and the test cards (e.g. 4084 0840 8408 4081).
- Then set the **live secret key** `PAYSTACK_SECRET_KEY=sk_live_…`.
- In the dashboard, set the webhook URL to `https://<your api>/api/payments/hooks/paystack/`.

**3. Email**
- Choose an SMTP provider (for example Brevo, Mailgun, SES or Postmark) and verify the sending domain (SPF and DKIM).
- Set:
  - `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`
  - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`
  - `DEFAULT_FROM_EMAIL`

**4. Domain and HTTPS**
- Get a domain and a TLS-terminating proxy in front of the `web` container.
- Set:
  - `DJANGO_DEBUG=False`
  - `DJANGO_SECRET_KEY` (long and random)
  - `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `CORS_ALLOWED_ORIGINS`
  - `FRONTEND_URL=https://<site>`, `PUBLIC_API_URL=https://<site>` (when the API is served through the same nginx)
  - `BEHIND_PROXY=True`

**5. Data and media**
- Set `POSTGRES_PASSWORD`. The production compose file provides PostgreSQL and Redis.
- Optionally use an S3-compatible bucket: `AWS_STORAGE_BUCKET_NAME` and related variables.
- Back up the database volume.

**6. Google sign-in** (optional)
- Add the production origin to the OAuth client.
- Set `GOOGLE_OAUTH_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend build argument).

**7. Start**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Then:
- Create an admin with `createsuperuser`.
- Check `https://<site>/api/health/`.
- Make one small real booking per payment method.

**8. Operations**
- Watch the admin **Payments** list for `needs_refund`.
- Keep the `holds` service running.
- In the admin dashboard: set the category listing fees and the platform payment details before organizers publish; record listing fees paid by hand (live mode) and payouts once sent.

---

## 17. Development history

**Before this round:**
- Scaffold, sharing and calendar.
- Simulated M-Pesa and ticket printing.
- Google sign-in.
- Django integration, search, free events and Kenyan categories.
- Brand refresh.
- Guest booking.

**This round, phase by phase** (each phase is one commit in each repository):

1. **Quick fixes.**
   - Places-left clamp, Esc on the saved drawer, tag filter, Save as draft.
   - Paybill read from configuration (placeholder `000000`).
   - Real organizer revenue.
   - drf-spectacular API docs.
2. **Organizer tooling.**
   - Ticket-tier editor and tier quantities.
   - PromoCode model with an organizer UI and checkout validation.
   - Organizer role and Become an organizer.
3. **Tickets.**
   - Scannable QR codes (UUID links).
   - Check-in API and screen.
   - Server PDF tickets.
   - Confirmation email with the PDF, and resend.
   - Find my ticket.
4. **Real payments.**
   - Pending/confirmed/failed/expired lifecycle with holds.
   - Payment model and idempotent callbacks.
   - Simulated, Daraja STK, Daraja C2B and Paystack providers.
   - Server-driven checkout with countdown and retry.
5. **Real map.**
   - Leaflet with OpenStreetMap tiles.
   - Coordinate picker with a cached Nominatim proxy.
6. **Production.**
   - Gunicorn, WhiteNoise and S3 storage.
   - HTTPS settings.
   - Health check.
   - Production compose with nginx.
   - Vitest.
7. **This documentation.**

**Afterwards:** the in-app **staff console** on a secret path for staff accounts, covering platform sales, organizer oversight, the payment refund queue, bookings and an audit log. Promo codes and a proper bookings list were also registered in the Django admin.

**Admin round (13–14 October 2026)**, one commit per part in each repository:

1. **Roles**: `admin` role synced with `is_staff`; organizer suspension; one publish gate with a model backstop.
2. **Ticket tiers**: presets, couple and group tickets (`admits`), flash sales, tier sales windows.
3. **Organizer payment details**: default and per-event; required to publish paid events; private.
4. **Listing fee (pay to publish)**: category fees, platform payment details, listing fees through the generalised `Payment`; notifications. (Built before the dashboard, which needs it.)
5. **Admin dashboard**: role-based API and view, organizers CRUD with invitations, suspension and safe deletion, fees, notifications bell.
6. **Earnings and payouts**: ledger, payouts capped at the balance, organizer earnings view.

Then a fix for the admin navbar layout and the flash-sale label, and this documentation.
