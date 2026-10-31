HomeServe frontend wired to the Java/Spring Boot user authentication API

Auth flow:
- POST /api/auth/register creates a CUSTOMER account in MySQL and returns a signed 24-hour bearer token plus the user profile.
- POST /api/auth/login verifies the email and BCrypt password, then returns a token and profile.
- Public registration cannot assign admin/worker roles.
- The frontend stores the signed-in user/token in localStorage and clears it on sign out.
- Existing visual design is preserved.

Run:
1. Install/start MySQL.
2. Configure DB_USERNAME and DB_PASSWORD environment variables if your local MySQL credentials differ from root with no password.
3. Start the backend from homeserve-backend with `mvn spring-boot:run` (or `mvnw.cmd spring-boot:run` on Windows).
4. From this frontend folder run `npm install`, then `npm run dev`.
5. Open http://localhost:5173.

Database:
- Default database URL is jdbc:mysql://localhost:3306/homeserve_db?createDatabaseIfNotExist=true.
- Hibernate creates/updates the `users` table automatically (`spring.jpa.hibernate.ddl-auto=update`).
- Never commit real DB credentials or the signing secret. Set HOMESERVE_AUTH_SECRET to a random secret of at least 32 characters before deployment.
- This is a college-project signed-token implementation. For production, use a standard JWT/OAuth solution and enforce authorization on every protected endpoint.
