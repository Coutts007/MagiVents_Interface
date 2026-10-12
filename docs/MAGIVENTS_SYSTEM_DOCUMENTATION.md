# MagiVents: System Documentation

*Covers the frontend (`magivents_interface`) and the backend (`MagiVents_backend`) as of 12 October 2026, after the work that made payments, tickets, email, maps and deployment real.*

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
- Publish events with several ticket types and an agenda, and pin the venue on a real map.
- Create promo codes.
- See their real sales.
- Check attendees in at the door by scanning QR codes.

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
│   ├── payments/          Payment model, services.py (lifecycle), providers/ (simulated, daraja, paystack),
│   │                      hooks.py (callbacks), commands release_expired_holds and register_c2b_urls
│   ├── Dockerfile, docker-compose.yml, docker-compose.prod.yml, requirements.txt, .env.example
└── magivents_interface/
    ├── Dockerfile, nginx.conf, vite.config.ts (also configures Vitest)
    └── src/
        ├── App.tsx                 view switching, global state, deep links (?event, ?ticket, ?booking)
        ├── services/api.ts         every API call
        ├── utils/                  format, search, share, ticketPrinting, checkout (+ *.test.ts), qrScanner
        └── components/
            ├── checkout/           CheckoutModal, MpesaPaymentSection (method picker), PaymentStatusPanel
            ├── ticket/             TicketView (Find my ticket), PrintableTicketModal, EmailConfirmationModal
            ├── organizer/          OrganizerDashboard, EventEditorModal, PromoCodesPanel, CheckInPanel,
            │                       CoordinatePicker, BecomeOrganizerModal
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

To demo a failed M-Pesa payment, use a phone number ending in `1032`.

The development Docker stack (PostgreSQL and Redis, with demo data and `runserver`) starts with `docker compose up --build`.

### Commands

| Command | Purpose |
|---|---|
| `manage.py test` | Backend tests (74) |
| `manage.py seed_gatherings [--reset]` | Load or reload the demo events |
| `manage.py release_expired_holds` | Expire unpaid bookings whose hold ran out; production runs it every minute |
| `manage.py register_c2b_urls` | Register the Paybill validation and confirmation URLs with Daraja (once per environment) |
| `manage.py createsuperuser` | Admin account for `/admin/` |
| `npm run lint` / `npm run build` / `npm test` | Type-check / production build / frontend tests (23) |

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

### Payments

| Variable | Default | Purpose |
|---|---|---|
| `PAYMENTS_MODE` | `simulated` | `simulated` or `live` |
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
| `AWS_STORAGE_BUCKET_NAME` (+ `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_ENDPOINT_URL`, `AWS_S3_REGION_NAME`, `AWS_S3_CUSTOM_DOMAIN`, `AWS_QUERYSTRING_AUTH`) | unset | S3-compatible media storage |
| `MEDIA_ROOT`, `STATIC_ROOT` | `media/`, `staticfiles/` | |
| `GEOCODER_URL`, `GEOCODER_USER_AGENT` | public Nominatim, `MagiVents/1.0 (…)` | Address search for the map pin |
| `GUEST_BOOKING_RATE`, `PROMO_VALIDATE_RATE`, `TICKET_LOOKUP_RATE`, `TICKET_RESEND_RATE`, `PAYMENT_ATTEMPT_RATE`, `GEOCODE_RATE` | 20/hour, 30/minute, 10/hour, 5/hour, 20/hour, 30/hour | Per-IP (or per-user) rate limits |

### Frontend `.env`

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | `/api` in the production image |
| `VITE_GOOGLE_CLIENT_ID` | empty | Google sign-in button |

---

## 7. User roles and access rules

| Who | Can do |
|---|---|
| **Guest** | Browse, search, share. Book and pay without an account (rate-limited). Open a ticket from its QR or email link, or with **Find my ticket** (code and email). |
| **Attendee** (role `patron`, the default for new accounts) | Everything a guest can, plus: save events, see confirmed tickets under **My tickets**, edit their profile, change their password. They can upgrade themselves with **Become an organizer**. |
| **Organizer** (role `curator`) | Create events. Manage their own events, promo codes and check-in. |
| **Event owner** | Only the organizer who created an event can edit, publish, unpublish or delete it, see its attendees and sales, and check its tickets in. Drafts are visible only to their owner. |
| **Admin** (Django staff) | Everything, through `/admin/`, including payments that need a refund (filter `needs_refund`) and site-wide promo codes. |

A data migration gave the organizer role to every user who already owned an event.

---

## 8. Feature guide (what users can do)

### 8.1 Browsing

**Navigation**
- A sticky navbar has Discover, Calendar, Organizer Dashboard, search, saved events, and the account menu or sign-in.
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
- **Booking card**: pick a ticket type (price, perks, tickets left) and a quantity, then go to checkout or register for free.

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

- **My tickets** in the profile lists confirmed bookings, each with its QR code, print, email and view actions.
- **Find my ticket** is for guests: enter the ticket code and the booking email. Both must match. The answer is the same whether the code or the email was wrong, and the page is rate-limited.
- A ticket link (from the QR code or email) opens the ticket page with its QR code, PDF download, print and email.

### 8.5 Accounts

- **Sign up and sign in**: email and password, with a strength meter and server-side password validation, or Google.
- **Password reset** by email.
- **Profile**: photo or initials, name, town and bio.
- **Change password**: not shown for Google accounts.
- **Become an organizer**: one confirmation screen, reached from the dashboard or from Create event.

### 8.6 Organizer tools

**Dashboard sections: Events, Promo codes, Check-in.**

**Events**
- Stats: total events, registered attendees, revenue and tickets issued. They are computed by the server from **confirmed bookings only**, so revenue is what attendees actually paid after discounts.
- Tabs: All, Published, Drafts.
- Per event: an attendance bar, plus view, publish/unpublish, edit and delete (with a confirmation step).

**Event editor**
- Title, tagline, category (searchable), date, start and end time.
- Venue name, street, town.
- **Map pin**: search the address (the search runs only when Search is pressed), choose a result, then drag the pin or click the map. The pin can also be placed by hand or removed.
- **Ticket types**:
  - Add, edit, reorder and remove (name, price, quantity, description, perks).
  - Capacity is the sum of the quantities. The cheapest ticket becomes the event's "from" price.
  - Free events make every ticket free.
  - A ticket type with sales cannot be removed, or reduced below what is sold.
- Image, description, agenda, host, tags and a note to attendees.
- Buttons: **Save as draft** next to **Publish event** / **Save changes**.

**Promo codes**
- Create a code for one of your events with: percent off, optional maximum uses, and an optional valid-from and valid-until.
- Each code shows its state (active, scheduled, expired, used up, paused). Codes can be paused, resumed or deleted.

**Check-in**
- Choose the event. Then scan QR codes with the device camera (the browser's own detector, or a WebAssembly fallback), or type ticket codes.
- Each scan reports **Checked in**, **Already checked in (at time)**, **Wrong event**, **Not paid** or **Not found**.
- The attendee list shows checked-in counts and a progress bar, has search, and lets staff check people in manually.

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

### 9.2 Data model

```
User 1─* Gathering 1─* TicketTier ─────────────┐
  │          │  1─* AgendaItem                 │
  │          │  1─* PromoCode (or site-wide)   │
  │          1─* Booking *─0..1 User           │ (null for guests)
  │                 │  *─0..1 TicketTier ◀──────┘
  │                 │  *─0..1 PromoCode
  │                 1─* Payment
  1─* Bookmark *─1 Gathering
```

**`accounts.User`.** It extends `AbstractUser` and logs in by `email`.

| Field | Notes |
|---|---|
| `role` | `patron` (Attendee) or `curator` (Organizer) |
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
| `status` | `published`, `draft` or `sold_out` |
| `is_featured`, `tags`, `curator_note`, `created_at` | |

**`gatherings.TicketTier`**

| Field | Meaning |
|---|---|
| `quantity` | Total tickets of this type |
| `available` | Tickets left |
| `sold` | Property: `quantity − available` |
| `order` | Display position |
| `name`, `price`, `description`, `perks` | |

**`gatherings.AgendaItem`**: `time`, `title`, `detail`, `order`.

**`tickets.Booking`**

| Field | Notes |
|---|---|
| `id` | UUID string |
| `user` | Null for guests |
| `gathering`, `tier`, `tier_name`, `quantity` | |
| `unit_price`, `discount`, `total_price`, `currency`, `total_in_kes` | Computed by the server |
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

**`payments.Payment`.** One payment attempt.

| Field | Meaning |
|---|---|
| `booking` | The booking being paid for |
| `provider` | `simulated`, `mpesa_stk`, `mpesa_paybill` or `paystack` |
| `method` | `mpesa` or `card` |
| `reference` | Ours: the Paystack reference, or the Paybill account number |
| `provider_reference` | The provider's: STK CheckoutRequestID, C2B TransID, or Paystack transaction id |
| `amount`, `currency` | |
| `status` | `pending`, `succeeded` or `failed` |
| `phone_number`, `receipt_number`, `authorization_url`, `failure_reason` | |
| `needs_refund` | Money arrived that must go back: duplicate, late, or wrong amount |
| `raw_payloads` | The last 20 callbacks and queries |
| `created_at`, `updated_at`, `completed_at`, `last_queried_at` | |

### 9.3 Business rules

**Events**
- The API reads and writes the nested `EventItem` shape.
- **Free events** force every price to 0. **Paid events** need every ticket type priced above 0, and the starting price becomes the cheapest tier.
- **Tiers on update.**
  - Tiers sent with their numeric `id` are updated; others are created; tiers not sent are deleted.
  - A tier with sales cannot be deleted.
  - A tier's `quantity` cannot go below what is sold; `available` is recomputed as `quantity − sold`.
  - Older clients that send only `available` still work.
- When every tier sends a `quantity`, **capacity = sum of quantities**. Capacity can never drop below the places already booked or held.
- Drafts are visible only to their owner. Creating an event needs the **organizer role**. Editing needs ownership.
- `organizerStats` (`revenue`, `ticketsSold`) appears only for the owner and counts **confirmed** bookings.

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

### 9.5 Django admin

`/admin/` has:

- Users, gatherings, tiers, agenda items, bookings, bookmarks and promo codes.
- **Payments**: read-only, filterable by provider, status and `needs_refund`.

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
| POST | `/auth/become-organizer/` | user | Upgrades to `curator`; returns the profile |

### Events

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/gatherings/`, `/gatherings/{id}/` | public | `?search=`; adds `organizerStats` for the owner |
| POST | `/gatherings/` | organizer | Create |
| PUT / PATCH / DELETE | `/gatherings/{id}/` | owner | |
| GET | `/gatherings/my_gatherings/` | user | |
| GET | `/gatherings/{id}/attendees/` | owner | `{counts: {bookings, people, checkedInBookings, checkedInPeople}, attendees: [...]}` |
| POST | `/gatherings/{id}/check-in/` | owner | `{ticket}` → `{result, message, attendee?}` (409 for already / wrong event / not paid, 404 not found) |

Tier fields in `pricing.tiers[]`: `id`, `name`, `price`, `description`, `quantity`, `available`, `sold` (read-only), `perks`.

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
| GET | `/config/` | public | `{mpesaPaybill, mpesaAccountName, paymentsMode, paymentMethods: {mpesaStk, mpesaPaybill, card}, paymentHoldMinutes}` |
| GET | `/geocode/?q=` | user, throttled | `{results: [{name, lat, lng}]}` from Nominatim, cached; 503 when unavailable |
| GET | `/health/` | public | `{status, database, cache}`, 200 or 503 |
| GET | `/schema/`, `/docs/` | public | OpenAPI and Swagger UI |

Errors: DRF validation format or `{"error": "..."}`.

---

## 12. Frontend reference

### App shell

- There is no router library. `App.tsx` switches between the views `discover` (grid or calendar), `details`, `organizer`, `profile` and `ticket`.
- It holds events, bookmarks, confirmed bookings, search, tag filter and modal state.
- It handles the deep links `?event=`, `?ticket=` and `?booking=`.
- It opens checkout and the **Become an organizer** screen.

### Auth and API

- **`AuthContext`** restores the session and provides login, signup, Google, reset, profile update, password change, `becomeOrganizer` and logout.
- **`services/api.ts`** is an Axios client with the Bearer token and a single shared refresh on 401. Its API groups:
  - `authApi`, `gatheringsApi`, `bookingsApi` (`create`, `list`, `status`, `pay`), `bookmarksApi`
  - `promoApi`, `ticketsApi` (`get`, `lookup`, `resend`, `pdfUrl`), `checkInApi`, `geocodeApi`
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
| `map/VenueMap` | Leaflet map, lazy loaded |

Large libraries load only when needed: Leaflet (about 150 kB), and the QR decoder (about 44 kB of JS plus a 1.1 MB WASM file).

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

### Backend: 74 tests (`manage.py test`), all passing

All external HTTP (Safaricom, Paystack, Nominatim, SMTP) is mocked, so the suite runs offline.

| Suite | Tests | Covers |
|---|---|---|
| `accounts` | 10 | Registration, login, profile, avatar, password change and reset, Google sign-in |
| `gatherings` | 9 | Event CRUD and visibility, KES and free rules, categories, agenda order, organizer stats, tier quantities and capacity, role enforcement |
| `tickets` | 20 | Server-side pricing, promo codes (seeded `KARIBU15`, per-event, limits, expiry, scope, validate endpoint, management), sold out, privacy, bookmarks, free and guest bookings, confirmation email (HTML + text + PDF), failing email, QR URL, PDF, resend, lookup and its throttle, check-in |
| `payments` | 24 | Phone normalisation; simulated lifecycle (pending → confirmed, failure + retry on the same booking, expiry and sold-out reopening, the command, confirmed-only counts, promo use returned); idempotency (repeated success and failure, amount mismatch, late success with and without availability); Daraja STK (request fields, callback, wrong secret, IP allowlist, cancel, query fallback, refusal, invalid phone); C2B (validation codes, confirmation, repeat, second payment, underpayment); Paystack (initialize, bad signature, verify-before-trust, status poll); live mode without credentials |
| `core` | 11 | Public config, API schema and docs, geocoding (auth, cache, upstream failure), health (ok, database down, cache down), production settings (refuses the dev key, HTTPS protections) |

Some test fixtures were changed where the work changed behaviour on purpose (the assertions were not):

- **Organizer role.** The original gatherings test owner is created with the organizer role, because creating events now requires it.
- **Simulated delay.** The original paying test classes run the simulated gateway with no delay, because paid bookings are now confirmed by the payment provider rather than at creation.

### Frontend: 23 tests (`npm test`, Vitest)

| File | Covers |
|---|---|
| `format.test.ts` | KSh formatting, initials, local ISO dates |
| `search.test.ts` | Accent-insensitive all-words matching; ranking (title matches, upcoming, past; drafts excluded) |
| `share.test.ts` | Invite text, channel URLs and encoding, behaviour outside the browser |
| `ticketPrinting.test.ts` | Payment summaries, confirmation email text |
| `checkout.test.ts` | Stages, payment actions, failure messages, countdown, polling back-off, Kenyan phone normalisation and errors |

`npm run lint` (TypeScript) and `npm run build` also pass.

The flows were also exercised in a headless browser:

- Ticket page and QR decoding.
- Find my ticket.
- Check-in.
- STK, failure + retry, Paybill and card in simulated mode.
- The real Leaflet map and the address search.

The production Docker stack was built and checked end to end, including media, a paid booking and the PDF.

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
