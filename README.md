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

- Discover events by category, search, date and price; a slideshow shows the 10 most recently created events.
- Event pages with organizer-defined agenda, venue map and ticket tiers.
- Free events: attendees register without payment and still receive a ticket.
- Paid events: prices in KSh, paid with M-Pesa (STK Push or Paybill) or card.
- Profile photos are optional; the user's initials are shown until a photo is uploaded.
- Organizer dashboard to create, edit, publish, unpublish and delete events.

## Notes

- Google Sign-In needs `http://localhost:3000` listed under *Authorized JavaScript origins* for the OAuth client,
  and the same client ID in both `.env` files.
- Password reset emails are printed to the backend console in development; the link opens Django's reset page.
- M-Pesa STK push and the e-mail "dispatch" in the ticket modal are still simulated in the browser; the booking
  itself (price, availability, ticket code) is created and validated by the backend.
