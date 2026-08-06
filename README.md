# CampusDesk - LNMIIT Resource Reservation System

CampusDesk is a full-stack Next.js app I built for the GDG LNMIIT recruitment task. The idea is simple: LNMIIT has a bunch of halls, labs, and equipment that students and admins need to book, but there's no clean way to see what's free and grab a slot without double-booking something. This handles that end to end, from OTP login to a live availability grid to actual conflict-checked bookings.

**Answered questions:** the recruitment task's design questions are answered in [design.md](./design.md).

## What it does

**Login without passwords.** Email OTP based auth, rate limited to 3 requests every 10 minutes so nobody spams it, and sessions run on a 24h JWT.

**Emails actually go out.** Wired up Ethereal Mail fallback for local dev, so instead of digging through console logs you get a real preview link to see the rendered email in your browser. Custom SMTP works too if you want to hook up a real provider.

**Resource search and admin controls.** Admins can create, edit, or soft delete resources.

**Booking logic that doesn't let you double-book.** This was the trickiest part honestly. It checks for overlaps properly (start_A < end_B and start_B < end_A), blocks bookings in the past, enforces a 30 min to 4 hour duration window, respects opening hours, and caps students at 2 active bookings per resource so one person can't hog everything.

**A grid you can actually use.** Daily availability shown as an interactive timeline, click a free slot and it pre-fills the booking form for you.

**Cancels feel instant.** Optimistic UI updates when you cancel a reservation, and if the API call fails it just rolls back automatically instead of leaving the UI in a weird state.

**Reminders run on their own.** A cron job sends an email an hour before your booking starts and flips past bookings to "completed." Set up with native Vercel Cron (`vercel.json` is already configured for it).

## Running it locally

### You'll need
- Node.js v18+
- npm v9+

### Set up your env
Copy `.env.example` to `.env` (or just make one) with:
```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="campusdesk-secret-key-gdg-recruitment-2026"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Install and seed the DB
```bash
npm install
npx prisma db push
npm run seed
```

### Start it up
```bash
npm run dev
```
Then just open [http://localhost:3000](http://localhost:3000).

## Test accounts

Didn't want to make reviewers set up real mailboxes, so here's what to use:

| Role | Email | Where to find the OTP |
| :--- | :--- | :--- |
| Admin | `admin@lnmiit.ac.in` | Console log, Ethereal Mail URL, or dev UI |
| Student 1 | `student1@lnmiit.ac.in` | Console log, Ethereal Mail URL, or dev UI |
| Student 2 | `student2@lnmiit.ac.in` | Console log, Ethereal Mail URL, or dev UI |

Every time an OTP goes out or a reminder fires, Nodemailer actually sends an HTML email through Ethereal. The server logs print a preview URL (`https://ethereal.email/message/...`) so you can open it and see exactly what the user would've received.

## Deployed to Vercel

# [campusdesk.anshul.space](https://campusdesk.anshul.space)

This is live. Here's how it actually got there:

1. Created a Postgres database on Supabase and grabbed the pooled connection string (the `pgbouncer` one, not the direct connection, since Vercel's serverless functions need pooling).
2. Swapped `provider = "sqlite"` for `provider = "postgresql"` in `prisma/schema.prisma` and ran `npx prisma db push` against the Supabase URL to get the schema up there.
3. Pushed the repo to GitHub: `github.com/anshul/campusdesk` (placeholder, will fill in the real one).
4. Imported the repo into Vercel, set `DATABASE_URL` (Supabase pooled string), `JWT_SECRET`, and `NEXT_PUBLIC_API_URL` (set to the production domain, not localhost) in the Vercel project's environment variables.
5. Added `campusdesk.anshul.space` as a custom domain in Vercel and pointed the DNS at it.

Deployed and running, no manual seeding needed on prod since the app populates data through actual usage.

## API reference

- `POST /api/auth/otp/request` — request an OTP (max 3 per 10 min)
- `POST /api/auth/otp/verify` — verify the OTP, get a JWT back
- `GET /api/auth/me` — check if the session's still valid
- `GET /api/resources` — list resources, supports `?search=`, `?category=`, `?page=`, `?limit=`
- `POST /api/resources` — create a resource (admin only)
- `PATCH /api/resources/:id` — update a resource (admin only)
- `DELETE /api/resources/:id` — soft delete a resource (admin only)
- `GET /api/resources/:id/bookings` — confirmed bookings for a given `?date=YYYY-MM-DD`
- `POST /api/bookings` — create a booking, runs the conflict check
- `GET /api/bookings/me` — your own bookings, filterable by `?status=`
- `PATCH /api/bookings/:id/cancel` — cancel a booking
- `GET /api/admin/bookings` — admin view of every reservation across the system
- `GET /api/cron/reminders` — triggers the reminder emails and status updates