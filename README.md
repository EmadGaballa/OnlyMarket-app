# OnlyMarket

OnlyMarket is a full-stack e-commerce platform with a React single-page application frontend and a Spring Boot REST API backend. Customers can browse a product catalog filtered by category and brand, search and sort products, read product ratings and reviews, manage a shopping cart and wishlist, mark products as favorites, place orders with coupon codes, track and cancel order history, and manage their own account profile. The backend supports user registration, login, logout, and refresh-based sessions (JWT access token plus a rotating httpOnly refresh-token cookie), email-verification and password-reset flows with time-limited one-time tokens, and an admin product import that pulls catalog data from the DummyJSON API.

## Live Deployment

- Frontend: https://onlymarket-emg.vercel.app/
- Backend API: https://onlymarket-app-production.up.railway.app/

## Tech Stack

### Backend
- Java 21
- Spring Boot 3.3.4
- Spring Security (session-less; JWT bearer authentication)
- Spring Data JPA (Hibernate)
- Flyway 10 (database migrations)
- PostgreSQL driver (production database: Neon)
- Spring Data Redis (production cache: Upstash)
- JJWT 0.12.6 (JWT creation/parsing)
- MapStruct 1.6.3 + Lombok 1.18.42 (DTO mapping / boilerplate)
- springdoc-openapi 2.6.0 (Swagger UI at `/swagger-ui.html`, `/v3/api-docs`)
- Thymeleaf (invoice templates)
- Apache Commons CSV (export support)

### Frontend
- React 18.3
- TypeScript 5.5
- Vite 5.4
- React Router 6.22
- TanStack Query (React Query) 5.17
- React Hook Form 7.49 + `@hookform/resolvers`
- Zod 3.22 (schema validation)
- CSS Modules + theme CSS variables (light/dark via a `data-theme` attribute)

### Infrastructure / Hosting
- Backend: Docker (multi-stage build) deployed on Railway
- Frontend: static Vite build deployed on Vercel
- PostgreSQL: Neon (managed)
- Redis: Upstash (managed, TLS)

## Architecture Overview

The application is split into two independently deployed parts:

- a React single-page application (`frontend/`) that renders the UI and talks to the API; and
- a Spring Boot REST API (`backend/`) that owns all data, authentication, and business rules under `/api/v1`.

For the browser, the frontend and backend behave as if they are the same origin: `vercel.json` rewrites `/api/v1/*` (and `/uploads/*`) requests to the Railway backend. Requests reach `/api/v1/*` on the Vercel domain, are rewritten to the Railway API by Vercel, and round-trip through the browser's own domain. This keeps cookies same-origin from the browser's perspective, which is what makes the httpOnly refresh-token cookie work in production.

Authentication uses two layers:

- An access JWT (15-minute TTL) is returned in the response body and held in memory by the SPA; it is sent on every API call via an `Authorization: Bearer ...` header.
- An opaque refresh token (7-day TTL) is delivered in an HttpOnly, Secure, SameSite=Strict cookie. It is rotated on every refresh, and only the SHA-256 hash of the raw token is stored in the database (`refresh_tokens`) with rotation and "family" revocation: reusing an already-rotated token revokes the whole token family for that user as a theft signal.

Redis (Upstash) is used for several things, not just caching:

- JWT blacklist. On logout the access token's `jti` is stored under a `revoked:` key for the remainder of its natural life; the JWT filter refuses any blacklisted token.
- Password-reset tokens. One-time `reset:` tokens mapped to a user id with a 30-minute TTL.
- Email-verification tokens. One-time `verifyToken:` tokens mapped to a user id with a 24-hour TTL.
- Rate limiting. `auth/login` (5/min/IP), `auth/register` (3/min/IP), and `auth/forgot-password` (3/min/IP) are throttled with a Redis `INCR` sliding-window counter and return `429` with a `Retry-After` header.
- Cache. `@Cacheable` data (10-minute TTL locally, 30 minutes in production) is stored under the `ecommerce:` prefix.
## Features

Features below are implemented in the codebase; each maps to a backend controller.

- **Product catalog.** Public listing with pagination, free-text search, category and brand filtering, price/brand sorting, and an "Express delivery" filter. Products and their sku variants (with price overrides, stock, and JSON attributes) are served from `/api/v1/products`; categories and brands have their own read endpoints.
- **Product detail & variants.** A product detail page with variant selection, computed effective pricing/discounts, stock display, and quantity selection.
- **Reviews & ratings.** Customers can read the aggregate rating breakdown and per-review comments/ratings, and authenticated users can submit a review for a product (`GET/POST /api/v1/products/{id}/reviews`). A Flyway migration (`V4`) seeds varied product reviews.
- **Shopping cart.** User-scoped cart with server-computed subtotal and item count, optimistic add-to-cart updates, quantity stepping, and remove.
- **Wishlist.** User-scoped wishlist of saved products (`/api/v1/wishlist`) with a dedicated page.
- **Favorites.** User-scoped favorite-product relation (`/api/v1/favorites`) with its own page.
- **Checkout & orders.** Place an order from the cart with a shipping address (saved addresses supported), an optional coupon code, and payment card attributes (brand, last-4); order history with subtotals, discounts, and shipping; ability to cancel pending orders and view returned order history on the profile page.
- **Coupons.** Server-side coupon validation and discount application at checkout, with active/expiry checks.
- **User accounts & profile.** Registration, login/logout, email verification, profile view and update, address management, and account deletion. Roles and permissions (RBAC) are defined in the `user` package.
- **Password reset.** `forgot-password` (rate-limited) generates a Redis-backed one-time token and emails a reset link; `reset-password` consumes it. The endpoint always returns 200 to avoid user enumeration.
- **Auth rate limiting.** Redis-backed sliding-window rate limiting on the auth endpoints listed above.
- **Admin product import from DummyJSON.** An admin controller pulls product catalog data from `https://dummyjson.com` (`app.dummyjson.base-url`) and imports it with per-product error reporting.
- **File uploads.** Local filesystem storage for avatars and product images, with allowed-content-type validation, served under `/uploads/...`.

## Local Development Setup

Prerequisites: Docker and Docker Compose (the `backend` and `frontend` services are containers, and `postgres` and `redis` run as companion containers), plus the equivalent JVM/Node toolchains if you run services natively instead.

The `docker-compose.yml` at the repo root starts the full stack. To run everything, including the optional pgAdmin SQL UI:

```
docker compose up
```

To include the optional `pgadmin` container (which is behind a `tools` profile), use:

```
docker compose --profile tools up
```

Services and ports:

| Service  | Port  | Notes                                                     |
| -------- | ----- | --------------------------------------------------------- |
| backend  | 8080  | Spring Boot API (`/api/v1`), profile `dev`, from `./backend` |
| frontend | 5173  | Vite dev server (uses `Dockerfile.dev`, hot reload)        |
| postgres | 5432  | `ecommerce` database (user/password `ecommerce`/`ecommerce`) |
| redis    | 6379  | Local Redis with AOF persistence                          |
| pgadmin  | 5050  | Only with the `tools` profile (default login `admin@ecommerce.local` / `admin`) |

For container services the required environment variables (database URL and credentials, `REDIS_HOST`/`REDIS_PORT`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, and the frontend `VITE_API_BASE_URL`) are provided inline by `docker-compose.yml`. Backend defaults are also defined in `application.yml` / `application-dev.yml`, so the backend can run from an IDE against a local Postgres/Redis. During development the frontend targets `http://localhost:8080/api/v1` and a Vite dev proxy forwards `/api` and `/uploads` to the backend.

There is no checked-in `.env.example`. For running against a remote (Neon/Upstash) backend locally, create a `.env` and set the production variable names listed in the next section; never commit real secret values into compose files or source.

Frontend commands:

```
cd frontend
npm install
npm run build
```
## Environment Variables

The following environment variables are read by the backend in production (names only; values are secrets set in your hosting panel/secret store):

| Variable                    | Required | Description                                                    |
| --------------------------- | -------- | -------------------------------------------------------------- |
| `SPRING_PROFILES_ACTIVE`    | yes      | Spring active profile; set to `prod` in production.            |
| `SPRING_DATASOURCE_URL`     | yes      | JDBC URL for PostgreSQL (Neon), e.g. `jdbc:postgresql://...`.  |
| `SPRING_DATASOURCE_USERNAME`| yes      | PostgreSQL username.                                           |
| `SPRING_DATASOURCE_PASSWORD`| yes      | PostgreSQL password.                                           |
| `REDIS_HOST`                | yes      | Redis host (Upstash).                                          |
| `REDIS_PORT`                | no       | Redis port (default `6379`).                                   |
| `REDIS_PASSWORD`            | no       | Redis password, when the instance requires it.                 |
| `REDIS_SSL_ENABLED`         | no       | Enable TLS to Redis; defaults to `true` in the `prod` profile. |
| `JWT_SECRET`                | yes      | HS256 signing secret; must be at least 256 bits in production. |
| `CORS_ALLOWED_ORIGINS`      | yes      | Comma-separated allowed origins (e.g. `https://onlymarket-emg.vercel.app`). |
| `PORT`                      | no       | Server port; injected by Railway (default `8080`).             |
| `UPLOAD_DIR`                | no       | Local filesystem upload root (default `./uploads`).            |

The frontend consumes its own values at build/dev time through `VITE_`-prefixed variables (e.g. `VITE_API_BASE_URL` for local development). `SPRING_DATA_REDIS_HOST` / `SPRING_REDIS_HOST` aliases are also accepted by the local `docker-compose.yml`.

## Deployment Notes

- Backend (Railway): built from `backend/Dockerfile`, a multi-stage build. The first (`build`) stage uses `maven:3.9.9-eclipse-temurin-21` and runs `mvn package -DskipTests`; the second stage copies the resulting JAR into `eclipse-temurin:21-jre-alpine` and runs `java -jar app.jar` as a non-root user. Railway supplies the port via `PORT`, and production configuration is selected with `SPRING_PROFILES_ACTIVE=prod` plus the datasource/Redis/JWT/CORS variables above.
- Frontend (Vercel): a static Vite build. `vercel.json` rewrites `/api/v1/*` and `/uploads/*` to the Railway origin and falls back to `index.html` for SPA routes. The deployment uses a Node runtime; the project's container dev config pins Node 20, while the exact Node version used by Vercel is taken from the Vercel project settings.
- Product images: the catalog stores image URLs that point directly at DummyJSON's CDN (referenced by URL, not re-hosted). This avoids Railway's ephemeral filesystem, which does not persist locally uploaded files across redeploys or restarts. Locally uploaded files (avatars, product uploads) are written under `UPLOAD_DIR` on this same ephemeral storage path.

## Project Structure

```
java-web/
├── backend/
│   ├── pom.xml                           # Maven build and dependencies
│   ├── Dockerfile                        # Multi-stage Railway image
│   └── src/main/
│       ├── java/com/platform/ecommerce/
│       │   ├── auth/                     # register, login, refresh, logout, reset/verify
│       │   ├── cart/                     # user-scoped shopping cart
│       │   ├── catalog/
│       │   │   ├── product/              # products, admin import, reviews, images
│       │   │   ├── brand/
│       │   │   ├── category/
│       │   │   └── variant/
│       │   ├── order/                    # orders, order items, coupons
│       │   ├── favorite/                 # favorite products
│       │   ├── wishlist/                 # wishlist
│       │   ├── user/                     # profiles, RBAC roles/permissions
│       │   ├── security/                 # JWT filter, rate-limit filter
│       │   ├── config/                   # Security, Redis, CORS
│       │   ├── common/                   # exceptions, storage, validation
│       │   └── notification/             # mail service
│       └── resources/
│           ├── application.yml / -dev.yml / -prod.yml
│           └── db/migration/             # Flyway migrations (V1..V7)
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── vercel.json                       # /api/v1 + /uploads rewrites to backend
    ├── index.html
    └── src/
        ├── App.tsx                       # routes (public + protected)
        ├── main.tsx
        ├── pages/                        # Products, ProductDetail, Cart, Checkout, Profile, Auth, ...
        ├── components/                   # ProductCard, PasswordInput, RatingStars, Reviews, ...
        ├── layouts/                      # CustomerLayout, SearchBar
        ├── context/                      # Auth, Theme, Toast providers
        ├── hooks/                        # useCart, useWishlist, useAddToCart, ...
        ├── api/                          # typed API client
        ├── types/                        # shared TypeScript types
        ├── utils/                        # pricing, cart-cache, etc.
        └── styles/                       # global.css, variables.css (theme tokens)
```

## Scripts

Backend (from `backend/`):

```
mvn -DskipTests package   # compile and package
```

Frontend (from `frontend/`):

```
npm install                # install dependencies
npm run dev                # start Vite dev server (port 5173)
npm run build              # production build
npm run lint               # ESLint
npm run preview            # preview the production build
```