# Campus Events NestJS Backend

A learning-focused REST API for campus events. It uses NestJS with Express, in-memory arrays, DTO validation, request logging, a classroom API key guard, and a response timing interceptor.

## Install and run

```bash
npm install
Copy-Item .env.example .env
npm run start:dev
```

The API listens on `http://localhost:3001` and uses the `/api` global prefix. `PORT` and `FRONTEND_ORIGIN` can be changed in `.env`. CORS defaults to `http://localhost:3000`.

Set `CLASSROOM_API_KEY` in `.env` to a non-empty value before creating events. The example value (`classroom-demo-key`) is for local learning only and is not a sensitive or production credential. If the variable is unset or blank, event creation is denied.

## Routes

| Method and route | Behavior | Success status |
| --- | --- | --- |
| `GET /api/events` | Filter, sort, and paginate events | 200 |
| `GET /api/events/upcoming` | Events dated today or later | 200 |
| `GET /api/events/:id` | One event | 200; 404 if missing |
| `GET /api/events/:id/sessions` | Sessions for an event | 200; 404 if event missing |
| `POST /api/events` | Create an event; requires `x-api-key` | 201; 400 validation error; 401 bad/missing key |

List query parameters:

| Parameter | Accepted values | Default |
| --- | --- | --- |
| `category` | Any category string (case-insensitive match) | all |
| `isPublished` | `true` or `false` | all |
| `sortBy` | `eventDate`, `title`, `category` | `eventDate` |
| `order` | `asc`, `desc` | `asc` |
| `page` | Positive integer | `1` |
| `limit` | Integer from 1 to 100 | `10` |

Examples:

```bash
curl "http://localhost:3001/api/events?category=Workshop&isPublished=true&page=1&limit=5"
curl "http://localhost:3001/api/events/upcoming"
curl "http://localhost:3001/api/events/2/sessions"
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "x-api-key: classroom-demo-key" \
  -d '{"title":"Campus Film Night","description":"A student screening.","location":"Lecture Hall A","eventDate":"2030-06-15T10:00:00.000Z","category":"Arts","isPublished":true}'
```

See [requests.http](requests.http) for a runnable set of valid and invalid requests.

## Data model and storage

An event has `id` (number), `title`, `description`, `location`, `eventDate` (ISO date string), `category`, and `isPublished` (boolean). A session has `id`, `eventId`, `title`, `speaker`, `startTime`, and `endTime`.

The service seeds ten events in Community, Workshop, Arts, and Talk categories, with past and future dates and both publication states. Five sessions belong to three seeded events. Data is held in private arrays inside `EventsService`; new event IDs auto-increment from the seed. All changes are lost when the process restarts. No database, user authentication, or persistent storage is included.

## Request lifecycle

For an HTTP request, the relevant lifecycle is:

`Middleware → Guard → Interceptor → Pipe → Controller → Service → Interceptor → Response`

The logging middleware runs for every request, adds an `x-request-id` response header, and logs the timestamp, method, and original URL. Nest guards run before interceptors; the API key guard is attached only to event creation. The timing interceptor logs request start and completion duration. Pipes validate and transform route/query/body values before controller methods run. The response payload is unchanged by the timing interceptor.

## DTO validation

`POST /api/events` requires non-empty strings for `title`, `description`, `location`, and `category`; an ISO date string for `eventDate`; and a boolean for `isPublished`. The global validation pipe transforms DTOs, strips no unknown data silently, and rejects unknown properties with 400 (`whitelist: true`, `forbidNonWhitelisted: true`). Query filters and sort fields are checked too. `id` uses `ParseIntPipe`; `page` and `limit` must be positive integers, and `limit` cannot exceed 100. Booleans in query strings must be exactly `true` or `false`.

## How to see each cross-cutting component

- **Middleware:** send any request and inspect the server console for an ISO timestamp, request ID, method, and URL. The response includes `x-request-id`.
- **Guard:** POST without `x-api-key` or with a wrong key and receive 401. Also try an unset/blank `CLASSROOM_API_KEY`; it remains denied.
- **Interceptor:** any events route logs `Request started` and `Request completed in ...ms` (or a failure duration).
- **Pipes and validation:** `/api/events?page=hello` and `/api/events/nope` return 400; an invalid create body returns 400. A valid create with the key returns 201.

## Middleware, guards, interceptors, and pipes

| Component | When it runs | What it does here |
| --- | --- | --- |
| Middleware | Before route handling | Logs every request and sets a request ID |
| Guard | Before controller/interceptor execution | Allows event creation only with the configured API key |
| Interceptor | Around handler execution | Logs request timing without changing the payload |
| Pipe | Before the handler receives a parameter | Parses and validates IDs, query values, and DTOs |

## Testing

Run the e2e suite with:

```bash
npm run test:e2e
```

The suite covers listing, filtering, missing resources, valid and invalid event creation, key rejection, route parsing, pagination validation, upcoming-route precedence, and sessions. The API-key provider is set to a test value in the suite. To capture middleware and interceptor evidence for a submission, start the server with `npm run start:dev`, send requests from `requests.http`, and save the terminal output showing request IDs and timing lines.
