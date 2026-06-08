# TripZen Backend API Specification

> Version: 1.0  
> Frontend: Next.js 14 App Router  
> Current state: Mock in-memory store (`lib/mockStore.ts`)  
> Planned DB: PostgreSQL (Supabase) or MongoDB

## Overview

TripZen is a budget group-trip platform. Customers browse trips, book seats, pay via Razorpay, download invoices, and join WhatsApp groups. Admins manage trips, bookings, and Q&A.

---

## Authentication

- **Header:** `Authorization: Bearer <token>`
- **Roles:** `user` | `admin`
- Admin routes return `401` if not authenticated, `403` if not admin
- **Demo admin:** `admin@tripzen.com` / `admin123`

---

## Data Models

### User

| Field | Type | Required |
|-------|------|----------|
| id | UUID | auto |
| name | string | yes |
| email | string | yes, unique |
| phone | string | optional |
| passwordHash | string | yes (backend only) |
| role | enum(user, admin) | yes, default user |
| createdAt | datetime | auto |

### Trip

| Field | Type | Required |
|-------|------|----------|
| id | UUID | auto |
| slug | string | yes, unique |
| title | string | yes |
| location | string | yes |
| startDate | date (ISO) | yes |
| endDate | date (ISO) | yes |
| pricePerPerson | number | yes |
| currency | string | default INR |
| totalSeats | number | yes |
| bookedSeats | number | default 0 |
| status | enum(draft, upcoming, full, completed, cancelled) | yes |
| description | text | yes |
| coverImage | string | yes |
| gallery | JSON[] | { type: image\|video, url, caption? } |
| inclusions | string[] | yes |
| exclusions | string[] | yes |
| itinerary | JSON[] | { day, title, activities[] } |
| whatsappGroupLink | string | optional |
| createdAt | datetime | auto |
| updatedAt | datetime | auto |

### Booking

| Field | Type | Required |
|-------|------|----------|
| id | UUID | auto |
| userId | UUID | yes |
| tripId | UUID | yes |
| seats | number | yes |
| totalAmount | number | yes |
| status | enum(pending, paid, confirmed, cancelled) | yes |
| paymentId | string | optional |
| razorpayOrderId | string | optional |
| createdAt | datetime | auto |

### Question

| Field | Type | Required |
|-------|------|----------|
| id | UUID | auto |
| tripId | UUID | yes |
| name | string | yes |
| email | string | yes |
| question | text | yes |
| answer | text | optional |
| isPublic | boolean | default true |
| createdAt | datetime | auto |

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login, return JWT + user |
| GET | `/api/auth/me` | User | Current user from token |

#### POST /api/auth/register

**Body:**
```json
{ "name": "string", "email": "string", "phone": "string", "password": "string" }
```

**Response 201:**
```json
{ "message": "Registration successful", "token": "string", "user": { "id", "name", "email", "role" } }
```

#### POST /api/auth/login

**Body:**
```json
{ "email": "string", "password": "string" }
```

**Response 200:**
```json
{ "message": "Login successful", "token": "string", "user": { "id", "name", "email", "role" } }
```

#### GET /api/auth/me

**Response 200:**
```json
{ "user": { "id", "name", "email", "role" } }
```

---

### Trips (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips` | — | List published trips |
| GET | `/api/trips/:slug` | — | Single trip by slug |
| GET | `/api/trips/:slug/availability` | — | Seat availability |
| GET | `/api/trips/:slug/questions` | — | Public answered Q&A |
| POST | `/api/trips/:slug/questions` | — | Ask a question |

#### GET /api/trips

**Query params:** `status`, `limit`, `page`

**Response 200:**
```json
{ "trips": [], "total": 0, "page": 1 }
```

#### GET /api/trips/:slug

**Response 200:** `{ "trip": { ... } }`  
**Response 404:** `{ "message": "Trip not found" }`

#### GET /api/trips/:slug/availability

**Response 200:**
```json
{ "totalSeats": 40, "bookedSeats": 12, "availableSeats": 28 }
```

#### POST /api/trips/:slug/questions

**Body:**
```json
{ "name": "string", "email": "string", "question": "string" }
```

**Response 201:** `{ "question": { ... } }`

---

### Trips (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/trips` | Admin | List all trips (incl. drafts) |
| POST | `/api/admin/trips` | Admin | Create trip |
| GET | `/api/admin/trips/:id` | — | Get trip by ID |
| PUT | `/api/admin/trips/:id` | Admin | Update trip |
| DELETE | `/api/admin/trips/:id` | Admin | Delete trip |

#### POST /api/admin/trips

**Body:** Full trip object (without id, bookedSeats, timestamps)

**Response 201:** `{ "trip": { ... } }`

---

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/bookings` | User | Create booking |
| GET | `/api/bookings` | User | User's bookings |
| GET | `/api/bookings/:id` | User/Admin | Single booking + WhatsApp link if paid |
| GET | `/api/bookings/:id/invoice` | User/Admin | Invoice data (PDF in production) |
| GET | `/api/admin/bookings` | Admin | All bookings |

#### POST /api/bookings

**Body:**
```json
{ "tripId": "string", "seats": 2 }
```

**Response 201:**
```json
{ "booking": { ... }, "razorpayOrderId": "string" }
```

**Errors:** `400` not enough seats, `404` trip not found

---

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/create-order` | User | Create Razorpay order |
| POST | `/api/payments/verify` | User | Verify payment (mock auto-confirms) |
| POST | `/api/payments/webhook` | Razorpay | Webhook handler (TODO) |

#### POST /api/payments/create-order

**Body:** `{ "bookingId": "string" }`

**Response 200:**
```json
{ "orderId": "string", "amount": 300000, "currency": "INR", "keyId": "string" }
```

#### POST /api/payments/verify

**Body:**
```json
{
  "bookingId": "string",
  "razorpayOrderId": "string",
  "razorpayPaymentId": "string",
  "razorpaySignature": "string"
}
```

**Response 200:** `{ "success": true, "booking": { ... } }`

---

### Questions (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/questions` | Admin | List questions (`?answered=false`) |
| PATCH | `/api/admin/questions/:id` | Admin | Answer a question |

#### PATCH /api/admin/questions/:id

**Body:**
```json
{ "answer": "string", "isPublic": true }
```

---

### Contact

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/contact` | — | General contact form |

**Body:**
```json
{ "fullName": "string", "email": "string", "phone": "string", "message": "string" }
```

---

### Media (Admin) — TODO

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/media/upload` | Admin | Upload trip image/video |
| DELETE | `/api/admin/media/:id` | Admin | Remove media |

---

## Environment Variables (Production)

```env
DATABASE_URL=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
STORAGE_BUCKET=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
NEXT_PUBLIC_APP_URL=
```

---

## Recommended Production Stack

| Layer | Technology |
|-------|------------|
| Database | Supabase (PostgreSQL) or MongoDB |
| Auth | JWT + bcrypt or Supabase Auth |
| Payments | Razorpay |
| File storage | Supabase Storage or Cloudinary |
| Invoices | `@react-pdf/renderer` or PDFKit |
| Email | Resend or Nodemailer |

---

## Frontend Routes

| Route | Purpose |
|-------|---------|
| `/` | Home |
| `/trips` | All upcoming trips |
| `/trips/[slug]` | Trip detail page |
| `/trips/[slug]/book` | Booking + payment |
| `/dashboard` | Customer bookings |
| `/login` | Login |
| `/register` | Sign up |
| `/contact` | Contact form |
| `/admin` | Admin dashboard |
| `/admin/trips` | Manage trips |
| `/admin/trips/new` | Create trip |
| `/admin/trips/[id]/edit` | Edit trip |
| `/admin/bookings` | View bookings |
| `/admin/questions` | Answer Q&A |

---

## Seed Data

Default trips in `data/trips.json`:

1. **rishikesh-adventure-weekend** — ₹1,500, 40 seats, Jun 20–22 2026  
2. **manali-snow-retreat** — ₹2,200, 30 seats  
3. **goa-beach-bash** — ₹1,800, 35 seats  

---

## Migration Checklist (Mock → Real Backend)

- [ ] Replace `lib/mockStore.ts` with Prisma/Mongoose models
- [ ] Add password hashing (bcrypt) to auth routes
- [ ] Implement real JWT signing/verification
- [ ] Connect Razorpay SDK in payment routes
- [ ] Add webhook handler for payment confirmation
- [ ] Generate PDF invoices
- [ ] Add file upload for trip gallery
- [ ] Add email notifications on booking
- [ ] Add seat locking during checkout (Redis optional)
- [ ] Add rate limiting on public endpoints
