# Course API Documentation

## Overview

Complete API documentation for the Course module in Faculty Pedia platform. This module handles comprehensive course management including videos, study materials, live classes, test series, enrollments, and analytics.

## Table of Contents

- [Schema Overview](#schema-overview)
- [CRUD Operations](#crud-operations)
- [Filter Endpoints](#filter-endpoints)
- [Enrollment Operations](#enrollment-operations)
- [Content Management](#content-management)
- [Statistics & Analytics](#statistics--analytics)
- [Validation Rules](#validation-rules)

---

## Schema Overview

### Course Model Fields

#### Basic Information

- **title**: String (5-200 chars, required)
- **description**: String (max 2000 chars, required)
- **courseType**: Enum ["OTO", "OTA"] - One-to-One or One-to-All (required)
- **educatorID**: ObjectId ref Educator (required)
- **slug**: String (unique, auto-generated)

#### Academic Details

- **specialization**: Array ["IIT-JEE", "NEET", "CBSE"] (required)
- **class**: Array ["Class 6th" to "Class 12th", "Dropper"] (required)
- **subject**: Array ["Biology", "Physics", "Mathematics", "Chemistry", "English", "Hindi"] (required)

#### Pricing & Enrollment

- **fees**: Number (min: 0, required)
- **discount**: Number (0-100, default: 0)
- **maxStudents**: Number (min: 1, default: 100)
- **enrolledStudents**: Array of Student ObjectIds
- **purchase**: Array of Student ObjectIds (who purchased)

#### Media & Resources

- **image**: String (URL, optional)
- **courseThumbnail**: String (URL, optional)
- **introVideo**: String (URL, optional - hosted on Vimeo)
- **videos**: Array of video objects with:
  - title: String (max 200 chars)
  - link: String (YouTube URL)
  - duration: String (optional)
  - sequenceNumber: Number (required, unique within course)
- **studyMaterials**: Array of material objects with:
  - title: String (max 200 chars)
  - link: String (URL)
  - fileType: Enum ["PDF", "DOC", "PPT", "EXCEL", "OTHER"]

#### Dates & Duration

- **startDate**: Date (required)
- **endDate**: Date (required, must be after startDate)
- **courseDuration**: String (required)
- **validDate**: Date (required, access validity till this date)

#### Additional Details

- **courseObjectives**: Array of strings (max 500 chars each)
- **prerequisites**: Array of strings (max 500 chars each)
- **language**: String (default: "English")
- **certificateAvailable**: Boolean (default: false)

#### Ratings & References

- **rating**: Number (0-5, default: 0)
- **ratingCount**: Number (default: 0)
- **liveClass**: Array of Webinar ObjectIds
- **testSeries**: Array of TestSeries ObjectIds

#### System Fields

- **isActive**: Boolean (default: true, for soft delete)
- **createdAt**: Date (auto-generated)
- **updatedAt**: Date (auto-updated)

### Virtual Fields

- **enrolledCount**: Number of enrolled students
- **purchaseCount**: Number of purchases
- **isFull**: Boolean (maxStudents reached)
- **seatsAvailable**: Number of available seats
- **discountedPrice**: Calculated price after discount
- **isOngoing**: Boolean (currently running)
- **isCompleted**: Boolean (ended)
- **isUpcoming**: Boolean (not started yet)
- **isAccessValid**: Boolean (within valid date)
- **videoCount**: Number of videos
- **liveClassCount**: Number of live classes
- **testSeriesCount**: Number of test series

---

## CRUD Operations

### 1. Create Course

**Endpoint**: `POST /api/courses`

**Request Body**:

```json
{
  "title": "Complete IIT-JEE Physics Masterclass 2024",
  "description": "Comprehensive physics course covering all topics for JEE Advanced preparation",
  "courseType": "OTA",
  "educatorID": "507f1f77bcf86cd799439011",
  "specialization": ["IIT-JEE"],
  "class": ["Class 11th", "Class 12th"],
  "subject": ["Physics"],
  "fees": 15000,
  "discount": 20,
  "image": "https://example.com/course-banner.jpg",
  "courseThumbnail": "https://example.com/thumbnail.jpg",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "courseDuration": "12 months",
  "validDate": "2025-06-30T23:59:59.000Z",
  "introVideo": "https://vimeo.com/123456789",
  "videos": [
    {
      "title": "Introduction to Mechanics",
      "link": "https://youtube.com/watch?v=abc123",
      "duration": "45:30",
      "sequenceNumber": 1
    },
    {
      "title": "Laws of Motion - Part 1",
      "link": "https://youtube.com/watch?v=def456",
      "duration": "50:15",
      "sequenceNumber": 2
    }
  ],
  "studyMaterials": [
    {
      "title": "Chapter 1 - Mechanics Notes",
      "link": "https://example.com/notes.pdf",
      "fileType": "PDF"
    }
  ],
  "courseObjectives": [
    "Master all concepts of mechanics",
    "Solve advanced level problems",
    "Prepare for JEE Advanced"
  ],
  "prerequisites": ["Basic understanding of physics", "Completed Class 10th"],
  "language": "English",
  "certificateAvailable": true,
  "maxStudents": 200
}
```

**Response** (201):

```json
{
  "message": "Course created successfully",
  "course": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Complete IIT-JEE Physics Masterclass 2024",
    "slug": "complete-iit-jee-physics-masterclass-2024-1699123456789",
    "courseType": "OTA",
    "fees": 15000,
    "discount": 20,
    "discountedPrice": 12000,
    "rating": 0,
    "enrolledCount": 0,
    "seatsAvailable": 200,
    "isUpcoming": true
    // ... all other fields
  }
}
```

---

### 2. Get All Courses (with Filters)

**Endpoint**: `GET /api/courses`

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `specialization`: Filter by specialization
- `subject`: Filter by subject
- `class`: Filter by class
- `minRating`: Minimum rating filter
- `maxFees`: Maximum fees filter
- `courseType`: Filter by OTO/OTA
- `search`: Search in title/description
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: asc/desc (default: desc)
- `status`: ongoing/upcoming/completed

**Example Request**:

```
GET /api/courses?specialization=IIT-JEE&subject=Physics&minRating=4&page=1&limit=10&sortBy=rating&sortOrder=desc
```

**Response** (200):

```json
{
  "courses": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Complete IIT-JEE Physics Masterclass 2024",
      "slug": "complete-iit-jee-physics-masterclass-2024-1699123456789",
      "courseType": "OTA",
      "fees": 15000,
      "discount": 20,
      "discountedPrice": 12000,
      "rating": 4.5,
      "ratingCount": 150,
      "enrolledCount": 180,
      "seatsAvailable": 20,
      "educatorID": {
        "fullName": "Dr. Rajesh Kumar",
        "username": "rajesh_physics",
        "email": "rajesh@example.com",
        "profilePicture": "https://example.com/profile.jpg"
      },
      "isOngoing": true
    }
    // ... more courses
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCourses": 48,
    "coursesPerPage": 10
  }
}
```

---

### 3. Get Course by ID

**Endpoint**: `GET /api/courses/:id`

**Response** (200):

```json
{
  "course": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Complete IIT-JEE Physics Masterclass 2024",
    "description": "Comprehensive physics course...",
    "courseType": "OTA",
    "educatorID": {
      "fullName": "Dr. Rajesh Kumar",
      "username": "rajesh_physics",
      "email": "rajesh@example.com",
      "specialization": ["IIT-JEE"]
    },
    "enrolledStudents": [
      {
        "fullName": "Amit Sharma",
        "email": "amit@example.com"
      }
      // ... more students
    ],
    "purchase": [
      {
        "fullName": "Priya Singh",
        "email": "priya@example.com"
      }
    ],
    "liveClass": [
      {
        "title": "Live Doubt Session - Mechanics",
        "timing": "2024-02-15T18:00:00.000Z",
        "duration": "2 hours"
      }
    ],
    "testSeries": [
      {
        "title": "JEE Advanced Mock Test Series",
        "description": "10 full-length mock tests"
      }
    ],
    "videos": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Introduction to Mechanics",
        "link": "https://youtube.com/watch?v=abc123",
        "duration": "45:30",
        "sequenceNumber": 1
      }
    ],
    "studyMaterials": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "Chapter 1 - Mechanics Notes",
        "link": "https://example.com/notes.pdf",
        "fileType": "PDF"
      }
    ],
    "rating": 4.5,
    "ratingCount": 150,
    "fees": 15000,
    "discount": 20,
    "discountedPrice": 12000,
    "enrolledCount": 180,
    "purchaseCount": 185,
    "seatsAvailable": 20,
    "isFull": false,
    "isOngoing": true,
    "videoCount": 85,
    "liveClassCount": 24,
    "testSeriesCount": 5
  }
}
```

---

### 4. Get Course by Slug

**Endpoint**: `GET /api/courses/slug/:slug`

**Example**: `GET /api/courses/slug/complete-iit-jee-physics-masterclass-2024-1699123456789`

**Response**: Same as Get by ID

---

### 5. Update Course

**Endpoint**: `PUT /api/courses/:id`

**Request Body** (all fields optional):

```json
{
  "title": "Updated Course Title",
  "description": "Updated description",
  "fees": 18000,
  "discount": 25,
  "maxStudents": 250,
  "language": "Hindi + English"
}
```

**Response** (200):

```json
{
  "message": "Course updated successfully",
  "course": {
    // updated course object
  }
}
```

**Note**: Cannot directly update `purchase`, `enrolledStudents`, `liveClass`, `testSeries`, `rating`, `ratingCount` through this endpoint. Use specific endpoints for these operations.

---

### 6. Delete Course (Soft Delete)

**Endpoint**: `DELETE /api/courses/:id`

**Response** (200):

```json
{
  "message": "Course deleted successfully"
}
```

---

## Filter Endpoints

### 1. Get Courses by Educator

**Endpoint**: `GET /api/courses/educator/:educatorId`

**Query Parameters**: `page`, `limit`

---

### 2. Get Courses by Specialization

**Endpoint**: `GET /api/courses/specialization/:specialization`

**Valid Values**: IIT-JEE, NEET, CBSE

**Query Parameters**: `page`, `limit`

---

### 3. Get Courses by Subject

**Endpoint**: `GET /api/courses/subject/:subject`

**Valid Values**: Biology, Physics, Mathematics, Chemistry, English, Hindi

---

### 4. Get Courses by Class

**Endpoint**: `GET /api/courses/class/:className`

**Valid Values**: Class 6th, Class 7th, Class 8th, Class 9th, Class 10th, Class 11th, Class 12th, Dropper

---

### 5. Get Courses by Rating

**Endpoint**: `GET /api/courses/rating/:minRating`

**Example**: `GET /api/courses/rating/4.5`

---

### 6. Get Courses by Date Range

**Endpoint**: `GET /api/courses/date-range?startDate=2024-01-01&endDate=2024-12-31`

**Required Query Parameters**:

- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date

---

### 7. Get Ongoing Courses

**Endpoint**: `GET /api/courses/status/ongoing`

Returns courses where current date is between startDate and endDate.

---

### 8. Get Upcoming Courses

**Endpoint**: `GET /api/courses/status/upcoming`

Returns courses where startDate is in the future.

---

## Enrollment Operations

### 1. Enroll Student in Course

**Endpoint**: `POST /api/courses/:id/enroll`

**Request Body**:

```json
{
  "studentId": "507f1f77bcf86cd799439015"
}
```

**Validations**:

- Course must not be full
- Student must not already be enrolled

**Response** (200):

```json
{
  "message": "Student enrolled successfully",
  "course": {
    // updated course with student in enrolledStudents array
  }
}
```

**Error Response** (400):

```json
{
  "message": "Course is full"
}
// or
{
  "message": "Student is already enrolled in this course"
}
```

---

### 2. Add Student to Purchase List

**Endpoint**: `POST /api/courses/:id/purchase`

**Request Body**:

```json
{
  "studentId": "507f1f77bcf86cd799439015"
}
```

**Response** (200):

```json
{
  "message": "Purchase recorded successfully",
  "course": {
    // updated course
  }
}
```

---

## Content Management

### 1. Live Class Operations

#### Add Live Class to Course

**Endpoint**: `POST /api/courses/:id/live-class`

**Request Body**:

```json
{
  "liveClassId": "507f1f77bcf86cd799439016"
}
```

**Response** (200):

```json
{
  "message": "Live class added successfully",
  "course": {
    // updated course
  }
}
```

#### Remove Live Class from Course

**Endpoint**: `DELETE /api/courses/:id/live-class`

**Request Body**:

```json
{
  "liveClassId": "507f1f77bcf86cd799439016"
}
```

---

### 2. Test Series Operations

#### Add Test Series to Course

**Endpoint**: `POST /api/courses/:id/test-series`

**Request Body**:

```json
{
  "testSeriesId": "507f1f77bcf86cd799439017"
}
```

#### Remove Test Series from Course

**Endpoint**: `DELETE /api/courses/:id/test-series`

**Request Body**:

```json
{
  "testSeriesId": "507f1f77bcf86cd799439017"
}
```

---

### 3. Video Operations

#### Add Video to Course

**Endpoint**: `POST /api/courses/:id/videos`

**Request Body**:

```json
{
  "title": "Advanced Mechanics - Part 3",
  "link": "https://youtube.com/watch?v=xyz789",
  "duration": "55:20",
  "sequenceNumber": 86
}
```

**Validation**: Sequence number must be unique within the course.

**Response** (200):

```json
{
  "message": "Video added successfully",
  "course": {
    // updated course with new video
  }
}
```

#### Remove Video from Course

**Endpoint**: `DELETE /api/courses/:id/videos/:videoId`

**Response** (200):

```json
{
  "message": "Video removed successfully",
  "course": {
    // updated course
  }
}
```

---

### 4. Study Material Operations

#### Add Study Material to Course

**Endpoint**: `POST /api/courses/:id/study-materials`

**Request Body**:

```json
{
  "title": "Practice Problems Set 5",
  "link": "https://example.com/problems-set5.pdf",
  "fileType": "PDF"
}
```

**Valid File Types**: PDF, DOC, PPT, EXCEL, OTHER

**Response** (200):

```json
{
  "message": "Study material added successfully",
  "course": {
    // updated course
  }
}
```

#### Remove Study Material from Course

**Endpoint**: `DELETE /api/courses/:id/study-materials/:materialId`

---

### 5. Update Course Rating

**Endpoint**: `POST /api/courses/:id/rating`

**Request Body**:

```json
{
  "rating": 4.5
}
```

**Validation**: Rating must be between 0 and 5.

**Logic**: Uses rolling average calculation:

```
newAverage = (currentRating * ratingCount + newRating) / (ratingCount + 1)
```

**Response** (200):

```json
{
  "message": "Rating updated successfully",
  "course": {
    "id": "507f1f77bcf86cd799439012",
    "rating": 4.48,
    "ratingCount": 151
  }
}
```

---

## Statistics & Analytics

### 1. Get Course Statistics

**Endpoint**: `GET /api/courses/:id/statistics`

**Response** (200):

```json
{
  "statistics": {
    "courseId": "507f1f77bcf86cd799439012",
    "title": "Complete IIT-JEE Physics Masterclass 2024",
    "enrolledCount": 180,
    "purchaseCount": 185,
    "rating": 4.5,
    "ratingCount": 150,
    "seatsAvailable": 20,
    "isFull": false,
    "videoCount": 85,
    "liveClassCount": 24,
    "testSeriesCount": 5,
    "studyMaterialsCount": 42,
    "discountedPrice": 12000,
    "isOngoing": true,
    "isCompleted": false,
    "isUpcoming": false,
    "isAccessValid": true
  }
}
```

---

### 2. Get Overall Platform Statistics

**Endpoint**: `GET /api/courses/statistics/overall`

**Response** (200):

```json
{
  "totalCourses": 124,
  "ongoingCourses": 45,
  "upcomingCourses": 32,
  "completedCourses": 47,
  "specializationStats": [
    {
      "_id": "IIT-JEE",
      "count": 56,
      "avgRating": 4.3,
      "totalEnrolled": 3420
    },
    {
      "_id": "NEET",
      "count": 48,
      "avgRating": 4.5,
      "totalEnrolled": 4150
    },
    {
      "_id": "CBSE",
      "count": 20,
      "avgRating": 4.1,
      "totalEnrolled": 890
    }
  ],
  "subjectStats": [
    {
      "_id": "Physics",
      "count": 42,
      "avgRating": 4.4
    },
    {
      "_id": "Mathematics",
      "count": 38,
      "avgRating": 4.3
    },
    {
      "_id": "Chemistry",
      "count": 35,
      "avgRating": 4.2
    },
    {
      "_id": "Biology",
      "count": 30,
      "avgRating": 4.5
    }
  ],
  "topRatedCourses": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Complete IIT-JEE Physics Masterclass 2024",
      "rating": 4.9,
      "ratingCount": 320,
      "educatorID": {
        "fullName": "Dr. Rajesh Kumar",
        "username": "rajesh_physics"
      }
    }
    // ... top 10 courses
  ],
  "mostEnrolledCourses": [
    {
      "_id": "507f1f77bcf86cd799439018",
      "title": "NEET Biology Complete Course",
      "educatorID": "507f1f77bcf86cd799439019",
      "enrolledCount": 450
    }
    // ... top 10 courses
  ]
}
```

---

## Validation Rules

### Create Course Validation

All required fields must be present and valid:

1. **Title**: 5-200 characters, required
2. **Description**: Max 2000 characters, required
3. **Course Type**: Must be "OTO" or "OTA", required
4. **Educator ID**: Valid MongoDB ObjectId, required
5. **Specialization**: Array with at least one valid value, required
6. **Subject**: Array with at least one valid value, required
7. **Class**: Array with at least one valid value, required
8. **Fees**: Non-negative number, required
9. **Discount**: 0-100 (optional)
10. **Start Date**: Valid ISO 8601 date, required
11. **End Date**: Valid ISO 8601 date, must be after start date, required
12. **Course Duration**: 1-100 characters, required
13. **Valid Date**: Valid ISO 8601 date, must be >= end date, required
14. **Videos**: Array (optional), each video must have:
    - title (max 200 chars)
    - link (valid URL)
    - sequenceNumber (unique within course)
15. **Study Materials**: Array (optional), each material must have:
    - title (max 200 chars)
    - link (valid URL)
    - fileType (PDF/DOC/PPT/EXCEL/OTHER)
16. **Course Objectives**: Array of strings (max 500 chars each)
17. **Prerequisites**: Array of strings (max 500 chars each)
18. **Max Students**: Integer >= 1 (optional, default: 100)

### Update Course Validation

All fields are optional, but if provided must be valid according to create rules.

### Common Validation Errors

```json
{
  "errors": [
    {
      "msg": "Course title must be between 5 and 200 characters",
      "param": "title",
      "location": "body"
    },
    {
      "msg": "End date must be after start date",
      "param": "endDate",
      "location": "body"
    },
    {
      "msg": "Invalid educator ID format",
      "param": "educatorID",
      "location": "body"
    }
  ]
}
```

---

## Error Codes

- **200**: Success
- **201**: Resource created
- **400**: Validation error or bad request
- **404**: Course not found
- **500**: Server error

---

## Notes

1. **Soft Delete**: Deleted courses have `isActive: false` but remain in database
2. **Slug Generation**: Auto-generated from title + timestamp to ensure uniqueness
3. **Date Validation**: System validates startDate < endDate <= validDate
4. **Enrollment Limit**: System prevents enrollment if `enrolledCount >= maxStudents`
5. **Rating Calculation**: Uses rolling average, cannot be set directly
6. **Video Sequence**: Must be unique within a course to maintain order
7. **Virtual Fields**: Calculated dynamically, not stored in database
8. **Populate**: ID endpoints populate related educator, student, webinar, and test series data

---

## Future Enhancements

1. Payment integration for purchase
2. Certificate generation
3. Progress tracking per student
4. Assignment submission
5. Discussion forum per course
6. Email notifications for course updates
7. Course completion criteria
8. Refund handling
9. Course reviews and testimonials
10. Wishlist functionality

---

**Last Updated**: November 10, 2025
**Version**: 1.0.0
