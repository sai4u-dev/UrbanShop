# UrbanShop 🛒

Full-stack ecommerce reference: **TypeScript + Next.js (App Router) + PostgreSQL + Prisma + Redis + Stripe + Auth.js + S3 + Docker + Zod + REST API + GitHub Actions + Sentry.**

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Route Handlers) |
| Language | TypeScript (strict) |
| DB / ORM | PostgreSQL 16 + Prisma 6 |
| Cache | Redis 7 (`ioredis`) — product list cache, cart cache, rate limiting |
| Auth | Auth.js v5 (NextAuth) — GitHub, Google OAuth + Credentials |
| Payments | Stripe Checkout + Webhooks |
| Storage | AWS S3 presigned uploads |
| Validation | Zod (API + env + forms via react-hook-form) |
| State | Zustand (persisted cart) |
| Observability | Sentry (client/server/edge) + `/api/health` |
| DevOps | Docker Compose, multi-stage Dockerfile, GitHub Actions CI |

## Quickstart

```bash
# 1. Env
cp .env.example .env
# edit DATABASE_URL, REDIS_URL, AUTH_SECRET (openssl rand -base64 32), Stripe, AWS, OAuth keys

# 2. Infra
docker compose up -d            # postgres :5432 + redis :6379

# 3. App
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev                     # http://localhost:3000
```

## Project structure

```
prisma/
  schema.prisma                 # User/Account/Session, Category, Product(+Image), Cart(+Item), Order(+Item), Payment, Address, Review
  seed.ts
src/
  app/
    layout.tsx page.tsx         # storefront home (featured, categories)
    products/ products/[slug]/  # listing + detail (RSC + Prisma)
    cart/ checkout/ checkout/success/
    login/ account/ admin/      # Auth.js pages, role-guarded
    api/
      auth/[...nextauth]/       # Auth.js handlers
      auth/signup/              # credentials registration (bcrypt)
      products/ products/[id]/  # REST + Redis cache + Zod + admin guard
      categories/
      cart/ cart/items/[productId]/
      checkout/                 # creates Order + Stripe session
      webhooks/stripe/          # PAID → Payment + stock decrement
      upload/                   # S3 presigned POST (admin)
      orders/ orders/[id]/      # own orders, admin ?all=1
      health/                   # db + redis checks
  components/                   # header, product-card, add-to-cart-button
  store/cart.ts                 # zustand persisted cart
  lib/
    db.ts redis.ts stripe.ts s3.ts auth.ts env.ts utils.ts validations.ts
  middleware.ts                 # protects /admin /checkout /account
  instrumentation.ts
sentry.{client,server,edge}.config.ts
docker-compose.yml Dockerfile
.github/workflows/ci.yml        # pg+redis services, lint, type-check, test, build
```

## REST API

All handlers return `{ success, data }` / `{ success: false, error }` and validate with Zod (422 on failure).

- `GET /api/products?page&limit&q&category&sort` (60s Redis cache)
- `POST /api/products` (ADMIN)
- `GET/PATCH/DELETE /api/products/:id`
- `GET /api/cart` · `POST /api/cart` · `DELETE /api/cart`
- `PATCH/DELETE /api/cart/items/:productId`
- `POST /api/checkout` → `{ orderId, url }`
- `POST /api/webhooks/stripe`
- `POST /api/upload` (ADMIN → presigned POST)
- `GET /api/orders` · `GET /api/orders/:id`
- `GET /api/health`

## Auth

- `src/lib/auth.ts` — PrismaAdapter, JWT sessions, role in token/session, GitHub/Google/Credentials.
- `src/middleware.ts` — redirects anon from `/admin /checkout /account`, non-admin from `/admin`.
- Extend session type in `src/types/next-auth.d.ts`.

Set in OAuth dashboards callback: `http://localhost:3000/api/auth/callback/<provider>`.

## Stripe (test mode)

1. `stripe login`, then `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Copy `whsec_...` → `STRIPE_WEBHOOK_SECRET`, use test keys.
3. Checkout with `4242 4242 4242 4242`, any future date/CVC.

## S3 uploads

`POST /api/upload { filename, contentType }` → `{ url, fields, key, publicUrl }`. Upload directly from browser via `FormData` to `url`, then save `publicUrl` as `ProductImage.url`. 5MB image-only guard.

## Redis usage

- `products:*` list cache (60s), `product:*` detail (120s), invalidated on write.
- Cart payload cache (7d TTL), invalidated on mutation.
- `rateLimit(key, limit, windowSec)` helper for sensitive routes.

## Docker

```bash
docker compose up -d
docker build -t urbanshop .
docker run -p 3000:3000 --env-file .env urbanshop
```

Standalone output is enabled (`next.config.mjs` → `output: "standalone"`).

## CI/CD + Sentry

- `ci.yml` runs migrate + lint + `tsc --noEmit` + vitest + build.
- `docker.yml` pushes on tags.
- Set `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` to enable uploads.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev/build/start` | next |
| `npm run db:migrate/db:seed/db:studio` | prisma |
| `npm run type-check/lint/test` | quality |
| `npm run docker:up/down` | compose |
