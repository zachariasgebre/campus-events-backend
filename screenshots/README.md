# JWT API Test Screenshots

These screenshots were captured from the Campus Events API Swagger UI. Request passwords and JWT values have been redacted before committing; endpoint names and HTTP result codes remain visible.

| File | Test shown | Result |
| --- | --- | --- |
| `User Registration/01-registration-request-redacted.jpg` | Registration request screen; credentials are hidden | Request setup |
| `User Registration/02-registration-success-201.jpg` | Register a new user; safe user response | 201 Created |
| `Login and JWT Generation/03-login-request-redacted.jpg` | Login request screen; credentials are hidden | Request setup |
| `Login and JWT Generation/04-login-success-200-tokens-redacted.jpg` | Successful login; token response values are hidden | 200 OK |
| `Protect Routes/05-me-without-token-401.jpg` | Request `/api/auth/me` without a Bearer token | 401 Unauthorized |
| `Protect Routes/06-me-with-access-token-200-token-redacted.jpg` | Request `/api/auth/me` with a valid Bearer token; token is hidden | 200 OK |
| `Refresh Tokens and Logout/07-refresh-request-token-redacted.jpg` | Refresh request screen; refresh token is hidden | Request setup |
| `Refresh Tokens and Logout/08-refresh-success-200-tokens-redacted.jpg` | Successful refresh; token response values are hidden | 200 OK |
| `Refresh Tokens and Logout/09-logout-success-200-token-redacted.jpg` | Logout with a Bearer token; token is hidden | 200 OK |

The automated suite also covers duplicate registration, invalid registration, wrong credentials, refresh-token reuse, and refresh after logout. Run it with `npm run test:e2e`.
