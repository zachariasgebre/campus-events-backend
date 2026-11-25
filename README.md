# Campus Events NestJS Backend

A learning-focused REST API for campus events. It uses NestJS with Express, in-memory event and user storage, DTO validation, request logging, JWT authentication, and response timing.

## Install and run

```bash
npm install
Copy-Item .env.example .env
```

Set distinct, long, random `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values in `.env` before starting the server. Never commit `.env` or real secrets. Then run:

```bash
npm run start:dev
```

The API listens at `http://localhost:3001/api`; Swagger UI is at `http://localhost:3001/api/docs`. Access tokens expire after 15 minutes and refresh tokens after 7 days. In-memory users and event data reset when the process restarts; this is a learning project, not production persistence.

## JWT authentication flow

- `POST /api/auth/register` accepts an email and 8–64 character password, hashes it using Argon2id, and returns only public user fields. New accounts receive the `student` role; registration does not accept client-selected roles.
- `POST /api/auth/login` verifies the password hash and returns `accessToken`, `refreshToken`, and a safe user object. Unknown email and wrong password return the same 401 message.
- `POST /api/auth/refresh` accepts the current refresh token, verifies its signature and stored Argon2 hash, then rotates it and returns a new pair. Reusing an old token fails.
- `GET /api/auth/me` returns the authenticated user from `req.user`.
- `POST /api/auth/logout` clears the stored refresh-token hash. An already issued access token may remain valid until its 15-minute expiry; immediate revocation requires additional server-side access-token state.

Access and refresh JWTs use separate secrets and HS256. The access payload contains user ID, email, and roles; the refresh payload contains only the user ID. JWT payloads are encoded, not encrypted, so never put passwords, hashes, or private information in them. Only register, login, and refresh are public. The global guard protects all other routes, including events.

## API routes

| Method and route | Access | Behavior |
| --- | --- | --- |
| `POST /api/auth/register` | Public | Create an account (201); duplicate email returns 409 |
| `POST /api/auth/login` | Public | Validate credentials and return tokens (200) |
| `POST /api/auth/refresh` | Public | Rotate a refresh token (200) |
| `GET /api/auth/me` | Bearer access token | Return current user |
| `POST /api/auth/logout` | Bearer access token | Clear refresh session |
| `GET /api/events` | Bearer access token | Filter, sort, and paginate events |
| `GET /api/events/upcoming` | Bearer access token | Events dated today or later |
| `GET /api/events/:id` | Bearer access token | One event |
| `GET /api/events/:id/sessions` | Bearer access token | Event sessions |
| `POST /api/events` | Bearer access token | Create an event |

List query parameters: `category`, `isPublished` (`true`/`false`), `sortBy` (`eventDate`, `title`, `category`), `order` (`asc`, `desc`), positive integer `page`, and `limit` (1–100). Defaults are page 1 and limit 10.

See [requests.http](requests.http) for sample auth and protected-route calls. Swagger uses a single Bearer-authenticated document at `/api/docs`.

## Validation and request lifecycle

The global ValidationPipe transforms DTOs, rejects unknown properties, and validates registration, login, refresh, event bodies, and list filters. IDs and pagination use integer parsing. Request handling is:

`Middleware → Global JWT guard → Interceptor → Pipes → Controller → Service`

The middleware logs every request and sets an `x-request-id`; the timing interceptor logs events request duration. Public route metadata bypasses only the JWT guard.

## Testing

Run the e2e suite with `npm run test:e2e`. It covers registration, duplicate and invalid registration, role injection rejection, login, generic credential failures, bearer-protected routes, tampered and expired tokens, refresh rotation and reuse, and logout.

## API test evidence

See [screenshots/README.md](screenshots/README.md) for the redacted Swagger screenshots and the test each one documents.

