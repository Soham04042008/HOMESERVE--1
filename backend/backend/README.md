# HomeServe Java + MySQL Backend

A starter REST API for the HomeServe Vite frontend. It uses Java 21, Spring Boot, Spring Web, Spring Data JPA, MySQL, and BCrypt password hashing.

## Requirements
- JDK 21+
- Maven 3.9+ (or use an IDE with Maven support)
- MySQL 8+

## 1. Create the database
Run in MySQL Workbench or the MySQL command line:

```sql
CREATE DATABASE homeserve_db;
```

## 2. Configure database credentials
The defaults are `root` and an empty password. If your MySQL setup differs, set environment variables before running:

Windows PowerShell:
```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password"
```

macOS/Linux:
```bash
export DB_USERNAME=root
export DB_PASSWORD='your_mysql_password'
```

You can also override the JDBC URL with `DB_URL`. Hibernate creates/updates the tables on startup (`spring.jpa.hibernate.ddl-auto=update`).

## 3. Run
From this directory:

```bash
mvn spring-boot:run
```

API base URL: `http://localhost:8080/api`

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a customer |
| POST | `/api/auth/login` | Check email/password |
| GET | `/api/services` | List active services |
| GET | `/api/services?category=Cleaning` | Filter services by category |
| GET | `/api/services/{id}` | Get a service |
| POST | `/api/services` | Create a service (development only; secure before deployment) |
| PUT | `/api/services/{id}` | Update a service (development only; secure before deployment) |
| DELETE | `/api/services/{id}` | Deactivate a service (development only; secure before deployment) |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings/user/{userId}` | List a user's bookings |
| GET | `/api/bookings` | List all bookings (development/admin only; secure before deployment) |
| PATCH | `/api/bookings/{id}/status` | Update booking status (secure before deployment) |

## Example JSON

Register (`POST /api/auth/register`):
```json
{"fullName":"Aarav Patil","email":"aarav@example.com","password":"changeMe123","phone":"9876543210"}
```

Login (`POST /api/auth/login`):
```json
{"email":"aarav@example.com","password":"changeMe123"}
```

Create service (`POST /api/services`):
```json
{"name":"Home Cleaning","category":"Cleaning","description":"Basic home cleaning service","price":799.00,"imageUrl":"https://example.com/cleaning.jpg","active":true}
```

Create booking (`POST /api/bookings`): use the actual IDs returned by registration/service listing.
```json
{"userId":1,"serviceId":1,"bookingDate":"2027-01-15","bookingTime":"10:30:00","address":"Flat 12, Example Building, Navi Mumbai","notes":"Please call before arriving"}
```

## Frontend connection
The CORS configuration allows `http://localhost:5173` and `http://127.0.0.1:5173`. Call the API from the frontend using `http://localhost:8080/api`.

Example:
```ts
const response = await fetch('http://localhost:8080/api/services');
const services = await response.json();
```

## Important security note
This is a development starter, not production-ready authentication. Login verifies credentials and returns user details, but does **not** issue a JWT/session token. The booking endpoints currently accept a `userId` from the request, and service/admin operations are not access-controlled. Before public deployment, add Spring Security with JWT or server sessions, authorization/ownership checks, and restrict admin endpoints. Do not use this version to handle real customer accounts in production.

## Project layout
```
src/main/java/com/homeserve/
  HomeServeApplication.java
  config/AppConfig.java
  controller/AuthController.java
  controller/ServiceController.java
  controller/BookingController.java
  dto/
  model/
  repository/
src/main/resources/application.properties
```
