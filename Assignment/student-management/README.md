# Student Management REST API

Spring Boot + Spring Data JPA + MySQL.

## Run
1. Install Java 17+, Maven, MySQL.
2. Edit `src/main/resources/application.properties` (MySQL username/password).
3. `mvn spring-boot:run`
4. API runs at http://localhost:8080/api/students

## Endpoints
| Method | URL | Description | Success code |
|---|---|---|---|
| POST | /api/students | Add student | 201 |
| GET | /api/students | All students | 200 |
| GET | /api/students/{id} | Student by id | 200 (404 if missing) |
| PUT | /api/students/{id} | Update student | 200 (404 if missing) |
| DELETE | /api/students/{id} | Delete student | 204 (404 if missing) |
| GET | /api/students/course/{course} | Students by course | 200 |

Sample body:
```json
{ "name": "Rahul Sharma", "email": "rahul@example.com", "course": "Computer Science", "age": 20 }
```
