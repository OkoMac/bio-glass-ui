# BION — Beauty, Health & Wellness Platform

Africa's health & wellness industry OS. Browse verified providers, book services, track wellness.

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Express + TypeScript + Supabase
- **Database:** PostgreSQL (Supabase)
- **Payments:** Paystack (split payments, subscriptions)
- **Auth:** Supabase Auth (email/password, Google OAuth)

## Getting Started

```sh
# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:8080`

## Backend

```sh
cd ../backend
npm install
npm run dev
```

Backend API runs at `http://localhost:4000`

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase and Paystack keys.

## Features

- **Directory:** 700+ real Pretoria health & wellness providers
- **Booking:** Search, book, and pay for services
- **Payments:** Paystack split payments (5%+5% fee model)
- **Provider Tools:** Dashboard, bookings, availability, client management
- **Client Tools:** Water tracker, sleep tracker, medical card, AI life coach
- **Admin:** User management, provider verification, platform settings
- **Corporate:** Employee wellness programs, voucher system
