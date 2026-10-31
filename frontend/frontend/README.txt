HomeServe Worker Profile persistence patch

This is a correction-only patch, not the complete project.

File to replace:
  frontend/src/lib/useWorker.ts

How to install:
1. Stop the Vite frontend (Ctrl+C in its terminal).
2. Make a backup of your current frontend/src/lib/useWorker.ts.
3. Extract this ZIP into your existing HomeServe project root, allowing the file to overwrite the existing one.
   The ZIP preserves the path frontend/src/lib/useWorker.ts.
4. Start the frontend again with npm run dev.
5. Ensure the Spring Boot backend is running on http://localhost:8080 and sign in again so the token exists in localStorage under homeserve.auth.user.
6. Update headline, bio, city, state, pincode, experience, availability, or starting price and click Save Profile.
7. Check MySQL worker_profiles and refresh the page.

Important limitation:
The current backend WorkerProfileUpdateRequest and worker_profiles table support only headline, bio, serviceCategory, experienceYears, city, state, pincode, availabilityStatus, and startingPrice. Other form fields (photo, DOB, gender, address, preferred areas, languages, minimum/maximum price, pricing type, visit charge, negotiable, additional charges, qualifications) are NOT made persistent by this patch because the current backend/database contract does not support them. Those require additional backend DTO/entity/table changes.

If save fails, copy the error toast and backend terminal message. Do not share passwords or tokens.
