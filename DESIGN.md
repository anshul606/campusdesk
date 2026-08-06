# CampusDesk - Architectural Design Document

## 1. Overlap check logic and why back-to-back bookings work

Two bookings, A and B, for the same resource overlap only if:

$$\text{start}_A < \text{end}_B \quad \text{AND} \quad \text{start}_B < \text{end}_A$$

Both conditions have to be true at once. In Prisma, the actual query looks like this:

```typescript
const conflictingBooking = await db.booking.findFirst({
  where: {
    resourceId,
    status: 'confirmed',
    startTime: { lt: newEndTime },
    endTime: { gt: newStartTime },
  },
});
```

Say there's already a booking A from 10:00 to 11:00, and someone tries to book B from 11:00 to 12:00 right after. Walking through the check:

1. start_A < end_B, so 10:00 < 12:00. True.
2. start_B < end_A, so 11:00 < 11:00. False, because it's strict inequality, not `<=`.

Since both have to be true for it to count as a conflict, and the second one fails, this comes back as no overlap. Someone can book 11 to 12 right after someone else's 10 to 11 slot, and the system won't block it, which is exactly the behavior we want for back-to-back bookings.

## 2. The race condition, and how I stopped it

### What could go wrong
If two people hit "book" on the same resource and time slot within milliseconds of each other, both requests could run the overlap check before either one has actually written its booking to the database. Both queries come back clean (nothing to conflict with yet), so both requests move forward and create a booking. Now you've got two people holding the same slot.

### How I handled it
I wrapped the check-then-create sequence inside a single `db.$transaction`. That forces the read and the write to happen as one atomic unit instead of two separate steps that a second request could come in between. On both SQLite and Postgres this means the transaction holds a lock during that read-check-write cycle, so if two requests come in at the same time, the second one has to wait for the first to finish (and by then, the first one's booking already exists, so the second one's overlap check actually catches it).

## 3. Keeping people logged in through a hard refresh

1. **Getting the token.** Once someone verifies their 6-digit OTP through `/api/auth/otp/verify`, the server signs a 24-hour JWT with `{ userId, email, role, name }` in it. That token gets saved to `localStorage` as `campusdesk_token`.
2. **Reading it back.** On a reload or a hard refresh, `AuthContext` pulls the token back out with `localStorage.getItem('campusdesk_token')` before anything else renders.
3. **Checking it's still good.** The client immediately fires off a request to `GET /api/auth/me` with `Authorization: Bearer <token>` to confirm the token hasn't expired or been changed.
4. **Restoring state, or logging out.** If the server says the JWT checks out, the user's session gets restored in memory and they're back where they left off. If it comes back invalid or expired (401), the client wipes the stored token and logs them out automatically instead of leaving them in a broken half-logged-in state.

## 4. A bug I actually had to fight

### What happened
Early on, `npm run dev` was throwing an `ENOENT: no such file or directory, scandir` error. Took me a bit to trace it back, turned out the `postinstall` script was trying to run `prisma generate` before `prisma/schema.prisma` even existed yet.

### How I fixed it
I wrote `prisma/schema.prisma` properly first, with actual data models, primary keys, and keys defined, instead of letting the install script assume it was already there. Then I added `prisma/seed.ts` and set the install flow to run `npx prisma db push && npm run seed` in that order. Once the schema existed before anything tried to generate off it, `db push` created `dev.db` with all the SQLite tables it needed, and `postinstall` and `npm run dev` both ran normally after that.