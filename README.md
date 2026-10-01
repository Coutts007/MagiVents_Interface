# MagiVents

React + Vite frontend for MagiVents. All data (gatherings, accounts, bookings, bookmarks) comes from the
Django REST API in `../MagiVents_backend`.

## Run locally

**1. Backend** (from `MagiVents_backend/`)

```bash
python3 -m venv venv && venv/bin/pip install -r requirements.txt   # first time only
cp .env.example .env            # then set GOOGLE_OAUTH_CLIENT_ID
venv/bin/python manage.py migrate
venv/bin/python manage.py seed_gatherings   # loads the demo gatherings
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

## Notes

- Google Sign-In needs `http://localhost:3000` listed under *Authorized JavaScript origins* for the OAuth client,
  and the same client ID in both `.env` files.
- Password reset emails are printed to the backend console in development; the link opens Django's reset page.
- M-Pesa STK push and the e-mail "dispatch" in the ticket modal are still simulated in the browser; the booking
  itself (price, availability, ticket code) is created and validated by the backend.
