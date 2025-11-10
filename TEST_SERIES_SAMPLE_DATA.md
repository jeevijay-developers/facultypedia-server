# Test Series Module - Sample Test Data

## Sample JSON Objects for Testing TestSeries API

### 1. IIT-JEE Physics Test Series (Standalone)

```json
{
  "title": "IIT-JEE Advanced Physics Test Series 2025",
  "description": "Comprehensive test series covering all topics of Physics for JEE Advanced preparation. Includes 25 full-length tests, chapter-wise tests, and mock exams.",
  "price": 4999,
  "validity": "2025-12-31T23:59:59.000Z",
  "numberOfTests": 25,
  "image": "https://example.com/images/jee-physics-test-series.jpg",
  "educatorId": "507f1f77bcf86cd799439011",
  "subject": ["Physics"],
  "specialization": ["IIT-JEE"],
  "isCourseSpecific": false
}
```

### 2. NEET Biology Test Series (Course-Specific)

```json
{
  "title": "NEET Biology Complete Test Series 2025",
  "description": "Extensive test series for NEET Biology with 30 tests covering Botany and Zoology. Includes topic-wise tests and full syllabus mock tests.",
  "price": 3999,
  "validity": "2025-06-30T23:59:59.000Z",
  "numberOfTests": 30,
  "image": "https://example.com/images/neet-biology-test-series.jpg",
  "educatorId": "507f1f77bcf86cd799439012",
  "subject": ["Biology"],
  "specialization": ["NEET"],
  "isCourseSpecific": true,
  "courseId": "507f1f77bcf86cd799439020"
}
```

### 3. CBSE Mathematics Test Series (Class 10th)

```json
{
  "title": "CBSE Class 10th Mathematics Test Series",
  "description": "Board exam oriented test series for Class 10th Mathematics with 15 chapter-wise tests and 5 full syllabus tests.",
  "price": 1999,
  "validity": "2025-03-31T23:59:59.000Z",
  "numberOfTests": 20,
  "image": "https://example.com/images/cbse-10-math-test-series.jpg",
  "educatorId": "507f1f77bcf86cd799439013",
  "subject": ["Mathematics"],
  "specialization": ["CBSE"],
  "isCourseSpecific": false
}
```

### 4. IIT-JEE Chemistry Test Series (Standalone)

```json
{
  "title": "JEE Mains + Advanced Chemistry Test Series",
  "description": "Complete chemistry test series for both JEE Mains and Advanced. 40 tests covering Physical, Organic, and Inorganic Chemistry.",
  "price": 5499,
  "validity": "2025-12-31T23:59:59.000Z",
  "numberOfTests": 40,
  "image": "https://example.com/images/jee-chemistry-test-series.jpg",
  "educatorId": "507f1f77bcf86cd799439014",
  "subject": ["Chemistry"],
  "specialization": ["IIT-JEE"],
  "isCourseSpecific": false
}
```

### 5. NEET Physics + Chemistry Combined Test Series

```json
{
  "title": "NEET Physics + Chemistry Combined Test Series",
  "description": "Integrated test series for NEET aspirants covering both Physics and Chemistry. 35 tests with detailed solutions and analysis.",
  "price": 6999,
  "validity": "2025-05-31T23:59:59.000Z",
  "numberOfTests": 35,
  "image": "https://example.com/images/neet-phy-chem-test-series.jpg",
  "educatorId": "507f1f77bcf86cd799439015",
  "subject": ["Physics", "Chemistry"],
  "specialization": ["NEET"],
  "isCourseSpecific": false
}
```

### 6. CBSE Class 11th Science Test Series (Course-Specific)

```json
{
  "title": "CBSE Class 11th PCM Test Series",
  "description": "Comprehensive test series for Physics, Chemistry, and Mathematics for Class 11th students. 45 tests total.",
  "price": 4499,
  "validity": "2025-03-31T23:59:59.000Z",
  "numberOfTests": 45,
  "image": "https://example.com/images/cbse-11-pcm-test-series.jpg",
  "educatorId": "507f1f77bcf86cd799439016",
  "subject": ["Physics", "Chemistry", "Mathematics"],
  "specialization": ["CBSE"],
  "isCourseSpecific": true,
  "courseId": "507f1f77bcf86cd799439021"
}
```

### 7. IIT-JEE Mathematics Test Series (Dropper)

```json
{
  "title": "IIT-JEE Mathematics Crash Course Test Series for Droppers",
  "description": "Intensive test series designed specifically for dropper students. 50 tests with advanced level problems and detailed video solutions.",
  "price": 7999,
  "validity": "2025-12-31T23:59:59.000Z",
  "numberOfTests": 50,
  "image": "https://example.com/images/jee-math-dropper-test-series.jpg",
  "educatorId": "507f1f77bcf86cd799439017",
  "subject": ["Mathematics"],
  "specialization": ["IIT-JEE"],
  "isCourseSpecific": false
}
```

---

## API Endpoints for Testing

### Create Test Series

```
POST /api/test-series
Content-Type: application/json

Body: Use any of the above JSON objects
```

### Get All Test Series

```
GET /api/test-series?page=1&limit=10
GET /api/test-series?specialization=IIT-JEE
GET /api/test-series?subject=Physics
GET /api/test-series?minPrice=3000&maxPrice=6000
GET /api/test-series?minRating=4
GET /api/test-series?search=JEE Mathematics
GET /api/test-series?isCourseSpecific=true
```

### Get Test Series by ID

```
GET /api/test-series/507f1f77bcf86cd799439011
```

### Get Test Series by Slug

```
GET /api/test-series/slug/iit-jee-advanced-physics-test-series-2025-1699123456789
```

### Update Test Series

```
PUT /api/test-series/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "price": 3999,
  "validity": "2026-12-31T23:59:59.000Z",
  "description": "Updated description with new content"
}
```

### Delete Test Series

```
DELETE /api/test-series/507f1f77bcf86cd799439011
```

### Get by Educator

```
GET /api/test-series/educator/507f1f77bcf86cd799439011
```

### Get by Specialization

```
GET /api/test-series/specialization/IIT-JEE
GET /api/test-series/specialization/NEET
GET /api/test-series/specialization/CBSE
```

### Get by Subject

```
GET /api/test-series/subject/Physics
GET /api/test-series/subject/Biology
GET /api/test-series/subject/Mathematics
```

### Get by Rating

```
GET /api/test-series/rating/4.5
```

### Search by Title

```
GET /api/test-series/search/title?title=JEE&page=1&limit=10
```

### Get by Course

```
GET /api/test-series/course/507f1f77bcf86cd799439020
```

### Enroll Student

```
POST /api/test-series/507f1f77bcf86cd799439011/enroll
Content-Type: application/json

{
  "studentId": "507f1f77bcf86cd799439030"
}
```

### Remove Student

```
DELETE /api/test-series/507f1f77bcf86cd799439011/enroll
Content-Type: application/json

{
  "studentId": "507f1f77bcf86cd799439030"
}
```

### Add Test to Test Series

```
POST /api/test-series/507f1f77bcf86cd799439011/tests
Content-Type: application/json

{
  "testId": "507f1f77bcf86cd799439040"
}
```

### Remove Test from Test Series

```
DELETE /api/test-series/507f1f77bcf86cd799439011/tests
Content-Type: application/json

{
  "testId": "507f1f77bcf86cd799439040"
}
```

### Rate Test Series

```
POST /api/test-series/507f1f77bcf86cd799439011/rating
Content-Type: application/json

{
  "rating": 4.5
}
```

### Get Test Series Statistics

```
GET /api/test-series/507f1f77bcf86cd799439011/statistics
```

### Get Overall Statistics

```
GET /api/test-series/statistics/overall
```

---

## Sample Response Examples

### Create Test Series Response (201)

```json
{
  "message": "Test series created successfully",
  "testSeries": {
    "_id": "507f1f77bcf86cd799439050",
    "title": "IIT-JEE Advanced Physics Test Series 2025",
    "description": "Comprehensive test series covering all topics...",
    "price": 4999,
    "validity": "2025-12-31T23:59:59.000Z",
    "numberOfTests": 25,
    "slug": "iit-jee-advanced-physics-test-series-2025-1699123456789",
    "educatorId": "507f1f77bcf86cd799439011",
    "subject": ["Physics"],
    "specialization": ["IIT-JEE"],
    "enrolledStudents": [],
    "tests": [],
    "isCourseSpecific": false,
    "rating": 0,
    "ratingCount": 0,
    "isActive": true,
    "enrolledCount": 0,
    "testCount": 0,
    "isValid": true,
    "isExpired": false,
    "createdAt": "2025-11-10T12:00:00.000Z",
    "updatedAt": "2025-11-10T12:00:00.000Z"
  }
}
```

### Get All Test Series Response (200)

```json
{
  "testSeries": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "title": "IIT-JEE Advanced Physics Test Series 2025",
      "description": "Comprehensive test series...",
      "price": 4999,
      "validity": "2025-12-31T23:59:59.000Z",
      "numberOfTests": 25,
      "slug": "iit-jee-advanced-physics-test-series-2025-1699123456789",
      "rating": 4.5,
      "ratingCount": 120,
      "enrolledCount": 350,
      "testCount": 25,
      "isValid": true,
      "educatorId": {
        "fullName": "Prof. Amit Verma",
        "username": "amit_verma",
        "email": "amit.verma@iitjee.com",
        "profilePicture": "https://example.com/images/amit.jpg"
      },
      "courseId": null
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalTestSeries": 48,
    "testSeriesPerPage": 10
  }
}
```

### Get Test Series Statistics Response (200)

```json
{
  "statistics": {
    "testSeriesId": "507f1f77bcf86cd799439050",
    "title": "IIT-JEE Advanced Physics Test Series 2025",
    "enrolledCount": 350,
    "testCount": 25,
    "numberOfTests": 25,
    "rating": 4.5,
    "ratingCount": 120,
    "price": 4999,
    "isExpired": false,
    "isValid": true,
    "validity": "2025-12-31T23:59:59.000Z",
    "isCourseSpecific": false
  }
}
```

### Overall Statistics Response (200)

```json
{
  "totalTestSeries": 156,
  "courseSpecificCount": 42,
  "standaloneCount": 114,
  "specializationStats": [
    {
      "_id": "IIT-JEE",
      "count": 68,
      "avgRating": 4.3,
      "totalEnrolled": 4520,
      "avgPrice": 5499
    },
    {
      "_id": "NEET",
      "count": 56,
      "avgRating": 4.5,
      "totalEnrolled": 5230,
      "avgPrice": 4999
    },
    {
      "_id": "CBSE",
      "count": 32,
      "avgRating": 4.2,
      "totalEnrolled": 2180,
      "avgPrice": 2999
    }
  ],
  "subjectStats": [
    {
      "_id": "Physics",
      "count": 52,
      "avgRating": 4.4
    },
    {
      "_id": "Mathematics",
      "count": 48,
      "avgRating": 4.3
    },
    {
      "_id": "Chemistry",
      "count": 42,
      "avgRating": 4.2
    },
    {
      "_id": "Biology",
      "count": 38,
      "avgRating": 4.5
    }
  ],
  "topRatedTestSeries": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "title": "IIT-JEE Advanced Physics Test Series 2025",
      "rating": 4.9,
      "ratingCount": 420,
      "price": 4999,
      "educatorId": {
        "fullName": "Prof. Amit Verma",
        "username": "amit_verma"
      }
    }
  ],
  "mostEnrolledTestSeries": [
    {
      "_id": "507f1f77bcf86cd799439051",
      "title": "NEET Biology Complete Test Series 2025",
      "educatorId": "507f1f77bcf86cd799439012",
      "enrolledCount": 850,
      "price": 3999
    }
  ]
}
```

---

## Validation Error Examples

### Missing Required Fields

```json
{
  "errors": [
    {
      "msg": "Test series title is required",
      "param": "title",
      "location": "body"
    },
    {
      "msg": "Price is required",
      "param": "price",
      "location": "body"
    }
  ]
}
```

### Invalid Data Types

```json
{
  "errors": [
    {
      "msg": "Price must be a non-negative number",
      "param": "price",
      "location": "body"
    },
    {
      "msg": "Number of tests must be at least 1",
      "param": "numberOfTests",
      "location": "body"
    },
    {
      "msg": "Validity date must be in the future",
      "param": "validity",
      "location": "body"
    }
  ]
}
```

---

## Notes for Testing

1. **Educator ID**: Replace `507f1f77bcf86cd799439011` with actual educator IDs from your database
2. **Course ID**: Replace course IDs with actual course IDs when testing course-specific test series
3. **Student ID**: Use actual student IDs for enrollment operations
4. **Test ID**: Use actual test IDs when adding/removing tests
5. **Validity Date**: Must be in the future (after current date)
6. **Price**: Must be non-negative number
7. **Number of Tests**: Must be at least 1
8. **Slug**: Auto-generated, no need to provide

---

## Quick Test Flow

1. **Create an educator** first (if not already created)
2. **Create a test series** using educator ID
3. **Get all test series** to verify creation
4. **Get by ID** to see full details
5. **Update test series** to modify price/validity
6. **Create a student** (if not already created)
7. **Enroll student** in test series
8. **Add tests** to test series (requires Test model)
9. **Rate the test series**
10. **Get statistics** to see metrics
11. **Delete test series** (soft delete)

---

**Created**: November 10, 2025
**API Base URL**: `/api/test-series`
**Total Endpoints**: 20+
