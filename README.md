# MagiVents

MagiVents is a Kenyan platform for discovering and booking events. Attendees browse, save and book tickets;
organizers publish paid or free events and track bookings. All prices are in Kenyan shillings (KSh), and paid
tickets are settled with M-Pesa or card.

This repository is the React + Vite frontend. All data (events, accounts, bookings, bookmarks) comes from the
Django REST API in `../MagiVents_backend`.

Event categories: Sports & Outdoors, Entertainment & Music, Business & Entrepreneurship, Tech & Innovation,
Education & Career, Arts & Culture, Social Impact & Community, Political, Others.

Contact: [magiventskenya@gmail.com](mailto:magiventskenya@gmail.com)

## Run locally

**1. Backend** (from `MagiVents_backend/`)

```bash
python3 -m venv venv && venv/bin/pip install -r requirements.txt   # first time only
cp .env.example .env            # then set GOOGLE_OAUTH_CLIENT_ID
venv/bin/python manage.py migrate
venv/bin/python manage.py seed_gatherings   # loads the demo events
venv/bin/python manage.py runserver         # http://localhost:8000
```

Or with Docker (Postgres + Redis): `docker compose up --build`.

Run the API tests with `venv/bin/python manage.py test`.

**2. Frontend** (from `magivents_interface/`)

```bash
npm install
cp .env.example .env            # VITE_API_BASE_URL and VITE_GOOGLE_CLIENT_ID
npm run dev                     # http://localhost:3000
```

## Features

- Discover events by category, tag, search, date and price; a slideshow shows the 10 newest events.
- Event pages with agenda, ticket types and a real OpenStreetMap venue map.
- Free events confirm at once; paid events hold tickets while the attendee pays with M-Pesa (prompt on the
  phone, or Paybill) or by card on Paystack. Payment state always comes from the server.
- Tickets with scannable QR codes, server-generated PDFs and confirmation emails; guests find their ticket
  with its code and email.
- Organizer dashboard: events with ticket-type editor and map pin, promo codes, sales from real bookings,
  and QR check-in at the door.

Full documentation: [`docs/MAGIVENTS_SYSTEM_DOCUMENTATION.md`](docs/MAGIVENTS_SYSTEM_DOCUMENTATION.md)
(`docs/DJANGO_BACKEND_GUIDE.md` is an early guide and out of date).

## Notes

- With an empty backend `.env`, payments run in simulated mode (no money moves) and emails print to the
  backend console. See the documentation's "Going live checklist" for real M-Pesa, Paystack and email.
- Google Sign-In needs `http://localhost:3000` listed under *Authorized JavaScript origins* for the OAuth client,
  and the same client ID in both `.env` files.
- `npm test` runs the Vitest unit tests; `npm run lint` type-checks.
- Production: `Dockerfile` + `nginx.conf` build and serve the app; the backend's `docker-compose.prod.yml`
  runs the whole stack.
