# Cafe Indoori 🍱

> **Ghar jaisa khana. Aapke darwaze tak.**

Premium meal subscription & delivery service for Indore, India.

---

## Setup

### Prerequisites
- Node.js 18+

### Install
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Configure Environment
```bash
# Copy and fill in server env
cp server/.env.example server/.env
```

### Seed Database
```bash
cd server
node db/migrate.js
node db/seed.js
```

### Run
```bash
# In one terminal (backend)
cd server && npm run dev

# In another terminal (frontend)
cd client && npm run dev
```

---

## Portal URLs

| Portal | URL |
|--------|-----|
| Customer | http://localhost:5173/customer |
| Delivery Partner | http://localhost:5173/partner |
| Admin | http://localhost:5173/admin |

---

## Test Credentials

### Admin
- **Email:** admin@cafeindoori.com
- **Password:** Admin@123

### Customer (OTP Login)
- Any 10-digit phone number
- **OTP:** 123456 (dev mode)

### Delivery Partners (OTP Login)
- Phones: 9800000001 to 9800000005
- **OTP:** 123456 (dev mode)

---

## Razorpay Test

Set `RAZORPAY_MOCK=true` in `server/.env` to skip real payment (default).

For real Razorpay testing:
- Set `RAZORPAY_MOCK=false` and add real keys
- **Card:** 4111 1111 1111 1111 | Any future expiry | Any CVV

---

## Key Features

### Order Cutoff Times
- **Lunch cutoff:** 9:00 AM IST
- **Dinner cutoff:** 4:00 PM IST
- Live countdown timer on customer dashboard
- Auto-lock booking UI when cutoff passes
- Server-side validation on every booking

### Kitchen Prep List
- Auto-generated at 9:01 AM (lunch) and 4:01 PM (dinner)
- Groups tiffins by meal preference (Veg/Non-Veg/Jain/Special) and Indore area
- Print-ready view with `@media print` white override
- Manual refresh by admin

### Cron Jobs
- `9:01 AM` — Generate lunch kitchen prep list
- `4:01 PM` — Generate dinner kitchen prep list
- `Midnight` — Auto-generate orders for all active subscriptions
- `8:00 AM` — Check and expire subscriptions

---

## Environment Variables

```env
NODE_ENV=development
PORT=3001
TZ=Asia/Kolkata
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_XXXX
RAZORPAY_KEY_SECRET=XXXX
RAZORPAY_MOCK=true
DB_PATH=./db/cafe_indoori.sqlite
```
