# Student API Documentation

## Overview
The Student API provides comprehensive functionality for managing student accounts, profiles, course enrollments, educator following, and progress tracking in the Faculty Pedia platform.

## Base URL
```
http://localhost:3000/api/students
```

## Authentication
Currently, the API does not require authentication headers, but in production, you should implement JWT token-based authentication.

## Student Schema

### Required Fields
- **name**: String (2-100 characters, letters and spaces only)
- **username**: String (3-30 characters, lowercase letters, numbers, underscores only, unique)
- **password**: String (min 6 characters with uppercase, lowercase, and number)
- **mobileNumber**: String (10-digit Indian mobile number starting with 6-9, unique)
- **email**: String (valid email format, unique)
- **specialization**: Enum ['IIT-JEE', 'NEET', 'CBSE']
- **class**: Enum ['Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th', 'Class 11th', 'Class 12th', 'Dropper']

### Optional Fields
- **address**: Object with street, city, state, country, pincode
- **image**: String (valid URL)
- **isEmailVerified**: Boolean (default: false)
- **isActive**: Boolean (default: true)
- **courses**: Array of enrolled course objects
- **test**: Array of test IDs
- **testSeries**: Array of test series IDs
- **webinar**: Array of webinar IDs
- **followingEducator**: Array of educator IDs
- **results**: Array of test result objects
- **role**: String (default: 'student')
- **progress**: Object with completion statistics
- **deviceToken**: String for push notifications
- **preferences**: Object with notification, language, and theme settings

## API Endpoints

### 1. Create Student
**POST** `/api/students`

Create a new student account.

**Request Body:**
```json
{
  "name": "John Doe",
  "username": "john_doe_123",
  "password": "JohnDoe@123",
  "mobileNumber": "9876543210",
  "email": "john.doe@email.com",
  "specialization": "IIT-JEE",
  "class": "Class 12th",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001"
  },
  "preferences": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "language": "english",
    "theme": "light"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "_id": "64a7f8d9e1234567890abcde",
    "name": "John Doe",
    "username": "john_doe_123",
    "email": "john.doe@email.com",
    // ... other fields (password excluded)
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get All Students (with Pagination & Filtering)
**GET** `/api/students`

Retrieve students with optional pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `specialization`: Filter by specialization
- `class`: Filter by class
- `isActive`: Filter by active status

**Example:**
```
GET /api/students?page=1&limit=5&specialization=IIT-JEE&class=Class 12th
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a7f8d9e1234567890abcde",
      "name": "John Doe",
      "username": "john_doe_123",
      "specialization": "IIT-JEE",
      "class": "Class 12th",
      // ... other fields
    }
  ],
  "totalStudents": 25,
  "totalPages": 5,
  "currentPage": 1,
  "limit": 5
}
```

### 3. Get Student by ID
**GET** `/api/students/{studentId}`

Retrieve a specific student by their ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64a7f8d9e1234567890abcde",
    "name": "John Doe",
    "username": "john_doe_123",
    "email": "john.doe@email.com",
    "specialization": "IIT-JEE",
    "class": "Class 12th",
    "totalCourses": 3,
    "completedCourses": 1,
    "totalTests": 15,
    "passedTests": 12,
    "averageScore": 85.5,
    // ... other fields
  }
}
```

### 4. Get Student by Username
**GET** `/api/students/username/{username}`

Retrieve a student by their username.

**Example:**
```
GET /api/students/username/john_doe_123
```

### 5. Update Student
**PUT** `/api/students/{studentId}`

Update student information (partial updates supported).

**Request Body:**
```json
{
  "name": "Updated Name",
  "specialization": "NEET",
  "preferences": {
    "theme": "dark"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    // Updated student object
  }
}
```

### 6. Delete Student
**DELETE** `/api/students/{studentId}`

Delete a student account.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

### 7. Get Students by Class
**GET** `/api/students/class/{className}`

Get all students in a specific class.

**Example:**
```
GET /api/students/class/Class 12th
```

### 8. Enroll Student in Course
**POST** `/api/students/{studentId}/enroll`

Enroll a student in a course.

**Request Body:**
```json
{
  "courseId": "64a7f8d9e1234567890abcde"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student enrolled in course successfully",
  "data": {
    "courseId": "64a7f8d9e1234567890abcde",
    "enrolledAt": "2024-01-01T00:00:00.000Z",
    "progress": 0
  }
}
```

### 9. Follow Educator
**POST** `/api/students/{studentId}/follow`

Make a student follow an educator.

**Request Body:**
```json
{
  "educatorId": "64a7f8d9e1234567890abcef"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Now following educator",
  "data": {
    "educatorId": "64a7f8d9e1234567890abcef",
    "followedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 10. Unfollow Educator
**DELETE** `/api/students/{studentId}/follow/{educatorId}`

Unfollow an educator.

### 11. Get Student Statistics
**GET** `/api/students/{studentId}/statistics`

Get comprehensive statistics for a student.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalCourses": 5,
    "completedCourses": 2,
    "totalTests": 25,
    "passedTests": 20,
    "averageScore": 87.5,
    "totalWebinars": 10,
    "attendedWebinars": 8,
    "followingEducators": 3,
    "progressPercentage": 75.5
  }
}
```

### 12. Update Password
**PUT** `/api/students/{studentId}/password`

Update student password.

**Request Body:**
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@456"
}
```

## Error Responses

### Validation Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
  ]
}
```

### Not Found Error (404 Not Found)
```json
{
  "success": false,
  "message": "Student not found"
}
```

### Duplicate Entry Error (409 Conflict)
```json
{
  "success": false,
  "message": "Student with this email already exists"
}
```

### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Testing the API

### Using the Test Scripts

1. **Node.js Test Runner:**
   ```bash
   node test-student-api-node.js
   ```

2. **Browser Test (for testing in browser console):**
   Load `test-student-api.js` and run `runAllTests()`

### Using cURL

**Create Student:**
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "username": "test_student_123",
    "password": "TestPass@123",
    "mobileNumber": "9876543210",
    "email": "test@example.com",
    "specialization": "IIT-JEE",
    "class": "Class 12th"
  }'
```

**Get All Students:**
```bash
curl http://localhost:3000/api/students?page=1&limit=5
```

**Get Student by ID:**
```bash
curl http://localhost:3000/api/students/{studentId}
```

### Using Postman

Import the following collection or create requests manually:

1. **POST** Create Student - `/api/students`
2. **GET** Get Students - `/api/students`
3. **GET** Get Student by ID - `/api/students/{{studentId}}`
4. **PUT** Update Student - `/api/students/{{studentId}}`
5. **DELETE** Delete Student - `/api/students/{{studentId}}`
6. **POST** Enroll in Course - `/api/students/{{studentId}}/enroll`
7. **POST** Follow Educator - `/api/students/{{studentId}}/follow`
8. **GET** Get Statistics - `/api/students/{{studentId}}/statistics`

## Business Logic Features

### 1. Course Enrollment Tracking
- Students can enroll in multiple courses
- Progress tracking for each course
- Completion status and timestamps

### 2. Educator Following System
- Students can follow educators
- Social features for educational engagement
- Following/follower counts

### 3. Test Result Management
- Store test results with scores and timestamps
- Calculate averages and pass rates
- Progress analytics

### 4. User Preferences
- Notification settings (email, push, SMS)
- Language preferences
- Theme preferences (light/dark)

### 5. Virtual Fields
- Calculated fields for statistics
- Dynamic course and test counts
- Average score calculations

## Security Considerations

1. **Password Hashing**: Passwords are hashed using bcrypt
2. **Input Validation**: Comprehensive validation using express-validator
3. **Data Sanitization**: Mongoose built-in sanitization
4. **Unique Constraints**: Email, username, and mobile number uniqueness
5. **Field Exclusion**: Passwords excluded from responses

## Performance Optimizations

1. **Database Indexing**: Indexes on frequently queried fields
2. **Pagination**: Default pagination for large datasets
3. **Field Selection**: Option to limit returned fields
4. **Query Optimization**: Efficient database queries

This API provides a complete foundation for student management in an educational platform with room for future enhancements like authentication, role-based access control, and advanced analytics.