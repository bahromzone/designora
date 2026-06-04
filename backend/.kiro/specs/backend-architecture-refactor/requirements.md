# Requirements Document

## Introduction

Ushbu hujjat Designora onlayn ta'lim platformasining mavjud FastAPI backendini qatlamli (layered) arxitekturaga refaktoring qilish talablarini belgilaydi. Hozirgi holatda biznes-mantiq (business logic), ma'lumotlarga kirish (data access) va HTTP ishlash logikasi bevosita router fayllarida aralashib ketgan. Pydantic schema'lar ham router fayllari ichida e'lon qilingan.

Maqsad: mas'uliyatlarni aniq qatlamlarga ajratish — `routers` (faqat HTTP), `services` (biznes-mantiq), `repositories` (ma'lumotlarga kirish), `models` (ORM), `schemas` (Pydantic), va `dependencies` (FastAPI dependency injection). Refaktoring **mavjud xulq-atvorni o'zgartirmasligi** (no behavior regression) va kodning sinovga yaroqliligini (testability) oshirishi shart.

Bu hujjat faqat backend (`backend/app/`) bilan cheklanadi. Frontend (React) o'zgartirilmaydi va mavjud HTTP API kontrakti (endpoint yo'llari, so'rov/javob formatlari, status kodlari) saqlanadi.

## Glossary

- **Backend_System**: Designora platformasining `backend/app/` ichidagi FastAPI ilovasi va uning barcha modullari.
- **Router_Layer**: HTTP so'rovlarini qabul qiluvchi va javob qaytaruvchi qatlam (`app/routers/`). Faqat HTTP bilan bog'liq vazifalarni bajaradi.
- **Service_Layer**: Biznes-mantiqni o'z ichiga oluvchi qatlam (`app/services/`). Repository_Layer orqali ma'lumotlar bilan ishlaydi.
- **Repository_Layer**: Ma'lumotlar bazasiga kirishni (CRUD operatsiyalari, SQLAlchemy query'lar) inkapsulyatsiya qiluvchi qatlam (`app/repositories/`).
- **Schema_Layer**: Pydantic so'rov (request) va javob (response) modellarini saqlovchi qatlam (`app/schemas/`).
- **Model_Layer**: SQLAlchemy ORM modellari (`app/models/`).
- **Dependency_Module**: FastAPI dependency injection funksiyalarini saqlovchi modul (`app/dependencies/`).
- **Business_Logic**: Domen qoidalari, hisoblashlar va qarorlar (masalan: streak hisoblash, points/level berish, sertifikat yaratish, admin tekshiruvi).
- **Data_Access_Logic**: Ma'lumotlar bazasidan o'qish, yozish, yangilash va o'chirish operatsiyalari (`db.query`, `db.add`, `db.commit` va boshqalar).
- **HTTP_API_Contract**: Tashqi (frontend) mijozlarga taqdim etiladigan endpoint yo'llari, HTTP metodlari, so'rov/javob JSON tuzilmasi va HTTP status kodlari to'plami.
- **Behavior_Regression**: Refaktoringdan keyin mavjud funksionallikning kuzatiladigan xulq-atvorida ataylab kiritilmagan o'zgarish.
- **Developer**: Backend kodini ishlab chiquvchi va saqlovchi muhandis.

## Requirements

### Requirement 1: Router qatlamini HTTP bilan cheklash

**User Story:** As a Developer, I want router'lar faqat HTTP bilan bog'liq vazifalarni bajarishini, so that biznes-mantiq HTTP detallaridan ajratilgan va qayta ishlatiladigan bo'lsin.

#### Acceptance Criteria

1. THE Router_Layer SHALL delegate all Business_Logic to the Service_Layer.
2. THE Router_Layer SHALL delegate all Data_Access_Logic to the Service_Layer or the Repository_Layer.
3. WHEN a router handler receives an HTTP request, THE Router_Layer SHALL limit its work to exactly the following operations: (a) request parsing va Schema_Layer request model orqali validatsiya, (b) Service_Layer yoki Repository_Layer invocation, va (c) HTTP response construction.
4. WHERE a router handler does not require all three operations listed in criterion 3 (masalan, redirect-only handler), THE Router_Layer SHALL perform only the applicable subset of those operations and SHALL NOT introduce any additional Business_Logic yoki Data_Access_Logic.
5. THE Router_Layer SHALL NOT contain direct SQLAlchemy query calls. (Error/anti-pattern oldini olish uchun: `db.query`, `db.add`, `db.commit`, `db.refresh`, `db.delete` chaqiruvlari Router_Layer fayllarida bo'lmasligi shart.)
6. WHERE a router handler returns data, THE Router_Layer SHALL use a Schema_Layer response model defined in `app/schemas/`.
7. IF an incoming HTTP request fails parsing or validation against its Schema_Layer request model, THEN THE Router_Layer SHALL return an HTTP error response indicating which validation rule(s) failed va Service_Layer ni chaqirmasligi shart.
8. IF the Service_Layer raises a business yoki domain exception while handling the request, THEN THE Router_Layer SHALL translate it into an HTTP error response indicating the failure without implementing any Business_Logic to resolve the exception.

### Requirement 2: Pydantic schema'larni alohida qatlamga ajratish

**User Story:** As a Developer, I want Pydantic request/response modellari alohida `schemas/` katalogida bo'lishini, so that schema'lar ORM modellaridan va router'lardan ajratilib, qayta ishlatilishi va sinovdan o'tkazilishi oson bo'lsin.

#### Acceptance Criteria

1. THE Schema_Layer SHALL contain every Pydantic request model and response model that is currently declared inline within the Router_Layer modules and used by the Router_Layer.
2. THE Router_Layer SHALL import the Pydantic request and response models it uses from the Schema_Layer.
3. THE Router_Layer SHALL NOT declare Pydantic `BaseModel` subclasses inline. (Anti-pattern oldini olish uchun: `class ... (BaseModel)` e'lonlari Router_Layer fayllarida bo'lmasligi shart.)
4. THE Schema_Layer SHALL be defined in modules separate from the Model_Layer.
5. WHERE a Pydantic response model maps from a SQLAlchemy model, THE Schema_Layer SHALL declare `from_attributes = True` for that response model.
6. THE Schema_Layer SHALL preserve, for each migrated model, the identical field names, field types, optional/required status with the same default values, and the same validation constraints (such as `StringConstraints` min_length/max_length bounds and `EmailStr` validation) as the corresponding current inline Pydantic model, such that any request payload accepted or rejected before the refactoring is accepted or rejected identically after the refactoring.
7. IF a request payload violates a Schema_Layer validation constraint, THEN THE Backend_System SHALL reject the request with the same validation error response structure and HTTP status that the pre-refactoring inline model produced, and SHALL NOT execute Service_Layer Business_Logic.

### Requirement 3: Service qatlamini ajratish (biznes-mantiq)

**User Story:** As a Developer, I want biznes-mantiq alohida `services/` qatlamida bo'lishini, so that domen qoidalari bir joyda jamlanib, qayta ishlatilishi va birlik testlari bilan qoplanishi mumkin bo'lsin.

#### Acceptance Criteria

1. THE Service_Layer SHALL contain all Business_Logic currently located in the Router_Layer.
2. THE Service_Layer SHALL expose functions or classes that accept domain inputs (Schema_Layer models or primitive Python values) and return domain results or Schema_Layer models, including thin pass-through functions that delegate directly to the Repository_Layer when no Business_Logic is required, and SHALL NOT receive Router_Layer HTTP objects such as `Request` or `Response` as parameters.
3. WHEN the Router_Layer invokes a Service_Layer operation for authentication, registration, password reset, profile update, progress update, or course management, THE Service_Layer SHALL execute the corresponding Business_Logic exactly once per invocation.
4. THE Service_Layer SHALL access Data_Access_Logic only through the Repository_Layer and SHALL NOT contain direct SQLAlchemy calls (`db.query`, `db.add`, `db.commit`, `db.refresh`, `db.delete`) in `app/services/` files.
5. WHILE executing a multi-step write operation — an operation that performs more than one Data_Access_Logic write (create, update, or delete) that must succeed or fail together — THE Service_Layer SHALL commit the transaction exactly once after all steps complete successfully, preserving the current commit point.
6. IF a Data_Access_Logic write fails during a multi-step write operation, THEN THE Service_Layer SHALL roll back the transaction, leave no partial writes persisted, and surface the failure to the Router_Layer so that the existing HTTP error response is preserved.

### Requirement 4: Repository (ma'lumotlarga kirish) qatlamini ajratish

**User Story:** As a Developer, I want ma'lumotlar bazasiga kirish `repositories/` qatlamida inkapsulyatsiya qilinishini, so that data-access kodi markazlashtirilib, almashtirilishi va mock qilinishi oson bo'lsin.

#### Acceptance Criteria

1. THE Repository_Layer SHALL contain all Data_Access_Logic for the User, Course, Progress, Certificate, Assignment, Notification, Payment, and PasswordReset entities.
2. THE Repository_Layer SHALL operate on a SQLAlchemy Session received as an input parameter and SHALL NOT open, create, or close its own Session or database connection.
3. WHEN the Service_Layer requests a User by `id` or `email`, or a PasswordReset by `token`, THE Repository_Layer SHALL return the matching Model_Layer instance, or `None` when no matching row exists.
4. WHEN the Service_Layer invokes a create or update operation, THE Repository_Layer SHALL return the persisted Model_Layer instance, or `None` when the update target does not exist.
5. THE Repository_Layer SHALL NOT contain HTTP-specific objects such as `HTTPException`, `Request`, or `Response`.
6. WHEN the Service_Layer invokes a collection read operation, THE Repository_Layer SHALL return a collection of Model_Layer instances that is empty when no matching rows exist.
7. WHEN the Service_Layer invokes a delete operation, THE Repository_Layer SHALL return a boolean value that is `true` when a row was deleted and `false` when no matching row exists.
8. IF a database integrity or uniqueness constraint violation occurs during a create, update, or delete operation, THEN THE Repository_Layer SHALL propagate the resulting exception to the Service_Layer without swallowing it.

### Requirement 5: Dependency injection modulini joriy qilish

**User Story:** As a Developer, I want FastAPI dependency'lar markazlashtirilgan `dependencies/` modulida bo'lishini, so that dependency'lar takrorlanmasin va router'lar orasida izchil ishlatilsin.

#### Acceptance Criteria

1. THE Dependency_Module SHALL provide a database session dependency that yields exactly one SQLAlchemy Session per incoming request.
2. WHEN a request carries valid authentication credentials, THE Dependency_Module SHALL resolve and return the authenticated user's email identity.
3. WHEN an authenticated request — resolved through the current-user dependency — belongs to a user whose role is admin, THE Dependency_Module SHALL return that user's admin User record.
4. WHEN multiple routers require admin authorization, THE Router_Layer SHALL use the single admin-authorization dependency from the Dependency_Module.
5. THE Backend_System SHALL define each shared dependency exactly once in the Dependency_Module. (Hozirgi `_require_admin` (main.py) va `require_admin` (admin_courses.py) takrorlanishini bartaraf etish uchun.)
6. WHEN a request finishes processing — whether it completes successfully yoki error bilan yakunlansa — THE Dependency_Module SHALL close that request's SQLAlchemy Session.
7. IF a request has missing or invalid authentication credentials, THEN THE Dependency_Module SHALL raise an authentication error response and SHALL NOT return a user identity.
8. IF an authenticated request belongs to a non-admin user, THEN THE Dependency_Module SHALL raise an HTTP 403 response and SHALL NOT return a User.

### Requirement 6: Mavjud HTTP API kontraktini saqlash (regressiyasiz)

**User Story:** As a frontend foydalanuvchisi, I want refaktoringdan keyin API bir xil ishlashini, so that mavjud frontend hech qanday o'zgarishsiz ishlashda davom etsin.

#### Acceptance Criteria

1. THE Backend_System SHALL preserve all existing endpoint paths and HTTP methods that existed before the refactoring.
2. WHEN any request is sent to an endpoint, THE Backend_System SHALL return the same HTTP status code that the pre-refactoring implementation returns for an identical request (same path, method, headers, and body) in the same ENVIRONMENT.
3. WHEN any request is sent to an endpoint, THE Backend_System SHALL return a response body whose JSON field names and nesting structure are identical to the response body that the pre-refactoring implementation returns for an identical request (same path, method, headers, and body) in the same ENVIRONMENT, where value differences are allowed only for non-deterministic fields such as access_token and timestamps.
4. IF a request triggers an error condition that existed before the refactoring, THEN THE Backend_System SHALL return the same HTTP error status code that the pre-refactoring implementation returns for that identical request (same path, method, headers, and body) in the same ENVIRONMENT.
5. WHEN the Backend_System sets the authentication cookie, THE Backend_System SHALL set a cookie named `access_token` with `httponly` enabled, `samesite` set to strict, `max_age` set to 3600 seconds, and the `secure` flag enabled WHERE the ENVIRONMENT is production.
6. WHEN a request exceeds the rate-limiting threshold, THE Backend_System SHALL return the same response that the pre-refactoring implementation returns for that identical request (same path, method, headers, and body) in the same ENVIRONMENT.
7. WHERE the ENVIRONMENT is production, IF a request fails CSRF protection validation, THEN THE Backend_System SHALL reject the request with the same response that the pre-refactoring implementation returns for that identical request (same path, method, headers, and body).
8. WHERE the ENVIRONMENT is production, IF a request fails reCAPTCHA verification, THEN THE Backend_System SHALL reject the request with the same response that the pre-refactoring implementation returns for that identical request (same path, method, headers, and body).
9. WHEN any response is returned, THE Backend_System SHALL include the same security headers that the pre-refactoring implementation includes for that identical request (same path, method, headers, and body) in the same ENVIRONMENT.

### Requirement 7: Domen biznes-qoidalarini saqlash

**User Story:** As a platforma foydalanuvchisi, I want gamification va o'quv jarayoni qoidalari avvalgidek ishlashini, so that ballar, streak, sertifikat va progress to'g'ri hisoblanishda davom etsin.

#### Acceptance Criteria

1. WHEN a user logs in, THE Service_Layer SHALL update `streak_days` by comparing the UTC calendar date of the stored `last_login_date` with the current UTC date: null → `streak_days = 1`; same UTC date → unchanged; exactly 1 day prior → `streak_days` += 1; otherwise → `streak_days = 1`.
2. WHEN the streak is updated on login, THE Service_Layer SHALL set `last_login_date` to the current UTC timestamp.
3. WHEN a course progress update sets `percent` to at least 100 and no Certificate exists for that user/course, THE Service_Layer SHALL create exactly one Certificate and increase `points` by 100 plus the current session `minutes_spent` (absent/null/negative treated as 0), exactly once.
4. WHEN a course progress update does not create a new Certificate (percent < 100, or Certificate already exists), THE Service_Layer SHALL increase `points` only by the current session `minutes_spent` (absent/null/negative treated as 0) and create no Certificate.
5. WHEN course progress is updated and no Progress record exists for that user/course, THE Service_Layer SHALL create a new Progress record with `percent = 0` and `minutes_spent = 0` before applying the update.
6. WHEN course progress is updated, THE Service_Layer SHALL store `percent` as an integer clamped to the inclusive range 0 to 100.
7. WHEN a login, registration, or password-reset request succeeds, THE Service_Layer SHALL return the role-based redirect target (admin roles {admin, superadmin} → admin course-management page; all others → dashboard).

### Requirement 8: Kodning sinovga yaroqliligi (testability)

**User Story:** As a Developer, I want har bir qatlam mustaqil ravishda sinovdan o'tkazilishini, so that biznes-mantiq HTTP yoki haqiqiy ma'lumotlar bazasisiz tekshirilsin.

#### Acceptance Criteria

1. THE Service_Layer SHALL be unit-testable by injecting a mocked or fake Repository_Layer such that its Business_Logic is exercised without starting an HTTP server and without opening a connection to a real database.
2. THE Repository_Layer SHALL be testable using an in-memory or test SQLAlchemy Session.
3. THE Backend_System SHALL include automated tests that, for the authentication, profile, and course-management endpoints, assert that each response returns the same HTTP status code and the same JSON structure and field names defined by the HTTP_API_Contract, for both successful and error responses.
4. WHEN the single documented test command is executed, THE Backend_System SHALL run all automated unit and contract tests in one invocation.
5. THE Backend_System SHALL provide an automated test for the streak calculation Business_Logic that asserts `streak_days` equals 1 on first login, `streak_days` remains unchanged when the user has already logged in on the same day, `streak_days` increases by exactly 1 on a consecutive-day login, and `streak_days` resets to 1 when one or more days were skipped.
6. IF one or more tests fail while executing the single documented test command, THEN THE Backend_System SHALL terminate with a non-zero exit status that distinguishes failure from success.
7. THE Backend_System SHALL provide an automated test for the course-completion Business_Logic that asserts one Certificate and 100 bonus points plus the current session minutes are awarded exactly once when progress first reaches at least 100 percent, and that only the current session minutes are awarded when a Certificate already exists for that course.

### Requirement 9: Bosqichma-bosqich va xavfsiz migratsiya

**User Story:** As a Developer, I want refaktoring bosqichma-bosqich amalga oshirilishini, so that har bir qadamdan keyin ilova ishga tushadigan holatda qolsin.

#### Acceptance Criteria

1. WHEN har bir refactoring qadami yakunlanadi, THE Backend_System SHALL import qilinishni `ImportError` yoki `ModuleNotFoundError` chiqarmasdan yakunlasin.
2. THE Backend_System SHALL `app/alembic/versions/` jildidagi birorta version faylini qo'shmasin, o'chirmasin yoki o'zgartirmasin, shu tariqa mavjud database schema va Alembic migration history saqlanib qolsin.
3. WHEN Alembic `app/alembic/env.py` orqali ishga tushadi, THE Model_Layer SHALL barcha model modullarini `ImportError` chiqarmasdan resolve qilsin.
4. WHERE bir modul boshqa joyga ko'chiriladi, THE Backend_System SHALL ushbu modulga murojaat qiluvchi barcha import statement larini yangilasin, shunda hech qanday `ImportError` yoki `ModuleNotFoundError` qolmasin.
5. WHEN `app/main.py` dagi router registration o'zgartiriladi, THE Backend_System SHALL refaktoringdan oldingi har bir endpoint path ini erishib bo'ladigan holatda saqlasin, shunda kutilmagan HTTP 404 javobi qaytmasin.
6. WHEN FastAPI ilovasi ishga tushiriladi, THE Backend_System SHALL startup jarayonini hech qanday handle qilinmagan exception chiqarmasdan yakunlasin.
7. IF biror refactoring qadami resolve bo'lmaydigan import yoki startup failure keltirib chiqarsa, THEN THE Backend_System SHALL oxirgi import qilinadigan va ishga tushadigan holatga qaytsin.
8. WHEN Alembic autogenerate ishga tushiriladi, THE Backend_System SHALL nol (0) ta schema-change operatsiyasini hosil qilsin, shu tariqa database schema o'zgarmaganligi tasdiqlansin.
