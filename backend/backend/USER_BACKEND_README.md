# HomeServe — User Backend

This update focuses on customer/user accounts only. It preserves the existing services and bookings code and adds user profile endpoints.

## What is included
- Customer registration and login backed by MySQL `users` table.
- Passwords stored as BCrypt hashes; raw passwords are never returned.
- Public registration always creates the `CUSTOMER` role (users cannot self-register as admins/workers).
- Signed bearer token returned from registration/login; expires after 24 hours.
- `GET /api/users/me` to fetch the logged-in user's profile.
- `PUT /api/users/me` to update full name, email, phone and address.
- Address column added to the existing `users` entity; Hibernate `ddl-auto=update` adds it without dropping the table.

## Configuration (Windows PowerShell)
Open PowerShell in this backend folder. Set environment variables in the same terminal before starting the app:

```powershell
$env:DB_PASSWORD = "YOUR_MYSQL_PASSWORD"
$env:HOMESERVE_AUTH_SECRET = "REPLACE_WITH_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
.\mvnw.cmd spring-boot:run
```

MySQL should be running and the `homeserve_db` database should exist. The default JDBC URL is `jdbc:mysql://localhost:3306/homeserve_db`.

## Endpoints
- `POST http://localhost:8080/api/auth/register`
  ```json
  { "fullName": "Sample User", "email": "sample@example.com", "password": "StrongPass123", "phone": "9876543210" }
  ```
- `POST http://localhost:8080/api/auth/login`
  ```json
  { "email": "sample@example.com", "password": "StrongPass123" }
  ```
  Both return `{ "token": "...", "user": { "id": 1, "fullName": "...", "email": "...", "phone": "...", "address": null, "role": "CUSTOMER" } }`.
- `GET http://localhost:8080/api/users/me` — header: `Authorization: Bearer <token>`.
- `PUT http://localhost:8080/api/users/me` — header: `Authorization: Bearer <token>`, JSON body:
  ```json
  { "fullName": "Sample User", "email": "sample@example.com", "phone": "9876543210", "address": "Navi Mumbai" }
  ```

## Notes
- Keep the token secret private and different from the development fallback. Do not commit database passwords or secrets.
- The signed token implementation is a lightweight college-project approach, not a substitute for a mature OAuth2/JWT identity setup in production.
- Existing services and booking endpoints are retained. They have not all been refactored to enforce this token yet; do not deploy publicly until authorization is applied consistently to every protected endpoint.
- The environment used to prepare this ZIP could not download Maven Wrapper's Maven distribution, so a compile could not be independently verified here. Run ` .\mvnw.cmd clean compile ` on your Windows machine and share any errors if they appear.
