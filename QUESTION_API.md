# Question API Documentation

This document provides comprehensive information about the Question API endpoints.

## Base URL

```
/api/questions
```

## Question Schema

### Question Types

- `single-select`: Multiple choice with one correct answer (A, B, C, or D)
- `multi-select`: Multiple choice with multiple correct answers (array of A, B, C, D)
- `integer`: Numeric answer type (no options needed)

### Fields

- `title` (String, required): Question text (10-2000 characters)
- `slug` (String, auto-generated): URL-friendly version of title
- `questionType` (String, required): Type of question (single-select, multi-select, integer)
- `image` (String, optional): URL to question image
- `subject` (Array, required): Subject tags (Physics, Chemistry, Mathematics, Biology, English, etc.)
- `specialization` (Array, required): Exam specialization (IIT-JEE, NEET, CBSE)
- `class` (Array, required): Class levels (6, 7, 8, 9, 10, 11, 12)
- `topics` (Array, required): Array of topic strings
- `options` (Object, conditional): Required for single-select and multi-select types
  - `A` (String): Option A text
  - `B` (String): Option B text
  - `C` (String): Option C text
  - `D` (String): Option D text
- `correctOptions` (Mixed, required):
  - String (A/B/C/D) for single-select
  - Array of Strings ([A, B, C, D]) for multi-select
  - Number for integer type
- `difficulty` (String, required): Easy, Medium, or Hard
- `marks` (Object, required):
  - `positive` (Number): Marks awarded for correct answer
  - `negative` (Number): Marks deducted for wrong answer (should be negative)
- `explanation` (String, optional): Detailed explanation (max 5000 characters)
- `tags` (Array, optional): Array of tag strings for categorization
- `educatorId` (ObjectId, required): Reference to the educator who created the question
- `tests` (Array): References to tests containing this question
- `isActive` (Boolean): Soft delete flag (default: true)

### Virtual Fields

- `hasExplanation`: Boolean indicating if explanation exists
- `testCount`: Number of tests containing this question

---

## Endpoints

### 1. Create Question

**POST** `/api/questions`

Create a new question.

#### Request Body

```json
{
  "title": "What is the SI unit of force?",
  "questionType": "single-select",
  "educatorId": "507f1f77bcf86cd799439011",
  "subject": ["Physics"],
  "specialization": ["IIT-JEE", "CBSE"],
  "class": [11, 12],
  "topics": ["Mechanics", "Newton's Laws"],
  "options": {
    "A": "Newton",
    "B": "Joule",
    "C": "Watt",
    "D": "Pascal"
  },
  "correctOptions": "A",
  "difficulty": "Easy",
  "marks": {
    "positive": 4,
    "negative": -1
  },
  "explanation": "The SI unit of force is Newton, named after Sir Isaac Newton.",
  "tags": ["units", "mechanics", "fundamentals"]
}
```

#### Multi-Select Example

```json
{
  "title": "Which of the following are greenhouse gases?",
  "questionType": "multi-select",
  "educatorId": "507f1f77bcf86cd799439011",
  "subject": ["Chemistry"],
  "specialization": ["NEET", "CBSE"],
  "class": [11, 12],
  "topics": ["Environmental Chemistry"],
  "options": {
    "A": "Carbon Dioxide (CO₂)",
    "B": "Nitrogen (N₂)",
    "C": "Methane (CH₄)",
    "D": "Water Vapor (H₂O)"
  },
  "correctOptions": ["A", "C", "D"],
  "difficulty": "Medium",
  "marks": {
    "positive": 4,
    "negative": -2
  },
  "explanation": "CO₂, CH₄, and H₂O are greenhouse gases. Nitrogen is not.",
  "tags": ["environment", "climate-change"]
}
```

#### Integer Type Example

```json
{
  "title": "If f(x) = x² + 3x + 2, what is f(5)?",
  "questionType": "integer",
  "educatorId": "507f1f77bcf86cd799439011",
  "subject": ["Mathematics"],
  "specialization": ["IIT-JEE"],
  "class": [11, 12],
  "topics": ["Functions", "Algebra"],
  "correctOptions": 42,
  "difficulty": "Easy",
  "marks": {
    "positive": 4,
    "negative": 0
  },
  "explanation": "f(5) = 5² + 3(5) + 2 = 25 + 15 + 2 = 42",
  "tags": ["functions", "algebra"]
}
```

#### Validation Rules

- `title`: 10-2000 characters
- `questionType`: Must be "single-select", "multi-select", or "integer"
- `options`: Required for single-select and multi-select, not allowed for integer
- `correctOptions`:
  - Single-select: Must be one of A, B, C, D
  - Multi-select: Array containing A, B, C, D (at least one)
  - Integer: Must be a number
- `marks.positive`: Must be positive number
- `marks.negative`: Must be negative or zero
- `subject`, `specialization`, `class`: Must be non-empty arrays
- `topics`: Must be non-empty array
- `difficulty`: Must be "Easy", "Medium", or "Hard"

#### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "What is the SI unit of force?",
    "slug": "what-is-the-si-unit-of-force",
    "questionType": "single-select",
    "subject": ["Physics"],
    "specialization": ["IIT-JEE", "CBSE"],
    "class": [11, 12],
    "topics": ["Mechanics", "Newton's Laws"],
    "options": {
      "A": "Newton",
      "B": "Joule",
      "C": "Watt",
      "D": "Pascal"
    },
    "correctOptions": "A",
    "difficulty": "Easy",
    "marks": {
      "positive": 4,
      "negative": -1
    },
    "explanation": "The SI unit of force is Newton...",
    "tags": ["units", "mechanics", "fundamentals"],
    "educatorId": "507f1f77bcf86cd799439011",
    "tests": [],
    "isActive": true,
    "hasExplanation": true,
    "testCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Questions

**GET** `/api/questions`

Retrieve all questions with optional filtering and pagination.

#### Query Parameters

- `page` (Number): Page number for pagination (default: 1)
- `limit` (Number): Number of items per page (default: 10)
- `subject` (String): Filter by subject
- `specialization` (String): Filter by specialization
- `class` (String): Filter by class
- `difficulty` (String): Filter by difficulty (Easy, Medium, Hard)
- `questionType` (String): Filter by question type
- `educatorId` (String): Filter by educator
- `topics` (String): Filter by topics (comma-separated)
- `tags` (String): Filter by tags (comma-separated)
- `isActive` (Boolean): Filter by active status (default: true)

#### Example Request

```
GET /api/questions?subject=Physics&difficulty=Medium&page=1&limit=10
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "count": 25,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "totalQuestions": 25
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "What is the SI unit of force?",
      "slug": "what-is-the-si-unit-of-force",
      "questionType": "single-select",
      "difficulty": "Medium",
      "subject": ["Physics"],
      "marks": {
        "positive": 4,
        "negative": -1
      },
      "hasExplanation": true,
      "testCount": 3,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
    // ... more questions
  ]
}
```

---

### 3. Get Question by ID

**GET** `/api/questions/:id`

Retrieve a specific question by its ID.

#### URL Parameters

- `id` (String, required): MongoDB ObjectId of the question

#### Example Request

```
GET /api/questions/507f1f77bcf86cd799439011
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "What is the SI unit of force?",
    "slug": "what-is-the-si-unit-of-force",
    "questionType": "single-select",
    "subject": ["Physics"],
    "specialization": ["IIT-JEE", "CBSE"],
    "class": [11, 12],
    "topics": ["Mechanics", "Newton's Laws"],
    "options": {
      "A": "Newton",
      "B": "Joule",
      "C": "Watt",
      "D": "Pascal"
    },
    "correctOptions": "A",
    "difficulty": "Easy",
    "marks": {
      "positive": 4,
      "negative": -1
    },
    "explanation": "The SI unit of force is Newton...",
    "tags": ["units", "mechanics", "fundamentals"],
    "educatorId": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "username": "johndoe"
    },
    "tests": [],
    "isActive": true,
    "hasExplanation": true,
    "testCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Get Question by Slug

**GET** `/api/questions/slug/:slug`

Retrieve a question by its slug.

#### URL Parameters

- `slug` (String, required): URL-friendly slug of the question

#### Example Request

```
GET /api/questions/slug/what-is-the-si-unit-of-force
```

#### Success Response (200 OK)

Same as Get Question by ID.

---

### 5. Update Question

**PUT** `/api/questions/:id`

Update an existing question. All fields are optional.

#### URL Parameters

- `id` (String, required): MongoDB ObjectId of the question

#### Request Body

```json
{
  "title": "Updated: What is the SI unit of force?",
  "difficulty": "Medium",
  "marks": {
    "positive": 5,
    "negative": -1
  },
  "explanation": "Updated explanation with more details...",
  "tags": ["units", "mechanics", "fundamentals", "si-units"]
}
```

#### Validation Rules

- All fields are optional
- If provided, must follow same validation rules as create
- Cannot change question from one type requiring options to integer (or vice versa) without providing appropriate data

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Updated: What is the SI unit of force?",
    // ... updated fields
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

---

### 6. Delete Question (Soft Delete)

**DELETE** `/api/questions/:id`

Soft delete a question by setting `isActive` to false.

#### URL Parameters

- `id` (String, required): MongoDB ObjectId of the question

#### Example Request

```
DELETE /api/questions/507f1f77bcf86cd799439011
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

---

### 7. Get Questions by Educator

**GET** `/api/questions/educator/:educatorId`

Retrieve all questions created by a specific educator.

#### URL Parameters

- `educatorId` (String, required): MongoDB ObjectId of the educator

#### Query Parameters

- `page`, `limit`: For pagination
- Other filters (subject, difficulty, etc.) also available

#### Example Request

```
GET /api/questions/educator/507f1f77bcf86cd799439011?page=1&limit=20
```

#### Success Response (200 OK)

Same structure as Get All Questions.

---

### 8. Get Questions by Subject

**GET** `/api/questions/subject/:subject`

Retrieve all questions for a specific subject.

#### URL Parameters

- `subject` (String, required): Subject name (Physics, Chemistry, Mathematics, Biology, English, etc.)

#### Example Request

```
GET /api/questions/subject/Physics
```

#### Success Response (200 OK)

Same structure as Get All Questions.

---

### 9. Get Questions by Specialization

**GET** `/api/questions/specialization/:specialization`

Retrieve all questions for a specific exam specialization.

#### URL Parameters

- `specialization` (String, required): Specialization name (IIT-JEE, NEET, CBSE)

#### Example Request

```
GET /api/questions/specialization/IIT-JEE
```

#### Success Response (200 OK)

Same structure as Get All Questions.

---

### 10. Get Questions by Difficulty

**GET** `/api/questions/difficulty/:difficulty`

Retrieve all questions of a specific difficulty level.

#### URL Parameters

- `difficulty` (String, required): Difficulty level (Easy, Medium, Hard)

#### Example Request

```
GET /api/questions/difficulty/Medium
```

#### Success Response (200 OK)

Same structure as Get All Questions.

---

### 11. Get Questions by Class

**GET** `/api/questions/class/:className`

Retrieve all questions for a specific class.

#### URL Parameters

- `className` (String, required): Class number (6, 7, 8, 9, 10, 11, 12)

#### Example Request

```
GET /api/questions/class/11
```

#### Success Response (200 OK)

Same structure as Get All Questions.

---

### 12. Get Questions by Topics

**GET** `/api/questions/topics`

Retrieve questions containing specific topics.

#### Query Parameters

- `topics` (String, required): Comma-separated list of topics

#### Example Request

```
GET /api/questions/topics?topics=Mechanics,Newton's Laws
```

#### Success Response (200 OK)

Same structure as Get All Questions.

---

### 13. Get Questions by Tags

**GET** `/api/questions/tags`

Retrieve questions with specific tags.

#### Query Parameters

- `tags` (String, required): Comma-separated list of tags

#### Example Request

```
GET /api/questions/tags?tags=units,fundamentals
```

#### Success Response (200 OK)

Same structure as Get All Questions.

---

### 14. Add Question to Test

**POST** `/api/questions/:id/add-to-test`

Add a question to a test.

#### URL Parameters

- `id` (String, required): MongoDB ObjectId of the question

#### Request Body

```json
{
  "testId": "507f1f77bcf86cd799439012"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Question added to test successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "What is the SI unit of force?",
    "tests": ["507f1f77bcf86cd799439012"],
    "testCount": 1
  }
}
```

---

### 15. Remove Question from Test

**DELETE** `/api/questions/:id/remove-from-test`

Remove a question from a test.

#### URL Parameters

- `id` (String, required): MongoDB ObjectId of the question

#### Request Body

```json
{
  "testId": "507f1f77bcf86cd799439012"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Question removed from test successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "What is the SI unit of force?",
    "tests": [],
    "testCount": 0
  }
}
```

---

### 16. Get Question Statistics

**GET** `/api/questions/statistics`

Get comprehensive statistics about questions in the database.

#### Example Request

```
GET /api/questions/statistics
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "totalQuestions": 1250,
    "activeQuestions": 1180,
    "inactiveQuestions": 70,
    "byQuestionType": [
      { "_id": "single-select", "count": 750 },
      { "_id": "multi-select", "count": 350 },
      { "_id": "integer", "count": 150 }
    ],
    "byDifficulty": [
      { "_id": "Easy", "count": 400 },
      { "_id": "Medium", "count": 550 },
      { "_id": "Hard", "count": 300 }
    ],
    "bySubject": [
      { "_id": "Physics", "count": 450 },
      { "_id": "Chemistry", "count": 380 },
      { "_id": "Mathematics", "count": 420 }
    ],
    "bySpecialization": [
      { "_id": "IIT-JEE", "count": 600 },
      { "_id": "NEET", "count": 450 },
      { "_id": "CBSE", "count": 200 }
    ],
    "byClass": [
      { "_id": 11, "count": 650 },
      { "_id": 12, "count": 600 }
    ],
    "questionsWithExplanation": 980,
    "questionsInTests": 850,
    "averageTestsPerQuestion": 2.3
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be between 10 and 2000 characters"
    },
    {
      "field": "correctOptions",
      "message": "For single-select questions, correctOptions must be one of: A, B, C, D"
    }
  ]
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Question not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Server error occurred",
  "error": "Error details..."
}
```

---

## Usage Examples

### Creating Different Question Types

#### 1. Single-Select MCQ

```javascript
// Physics question with one correct answer
POST /api/questions
{
  "title": "A body of mass 2 kg is moving with velocity 10 m/s. What is its kinetic energy?",
  "questionType": "single-select",
  "educatorId": "507f1f77bcf86cd799439011",
  "subject": ["Physics"],
  "specialization": ["IIT-JEE"],
  "class": [11],
  "topics": ["Mechanics", "Energy"],
  "options": {
    "A": "50 J",
    "B": "100 J",
    "C": "150 J",
    "D": "200 J"
  },
  "correctOptions": "B",
  "difficulty": "Medium",
  "marks": { "positive": 4, "negative": -1 },
  "explanation": "KE = 1/2 × m × v² = 1/2 × 2 × 10² = 100 J"
}
```

#### 2. Multi-Select MCQ

```javascript
// Chemistry question with multiple correct answers
POST /api/questions
{
  "title": "Which of the following are noble gases?",
  "questionType": "multi-select",
  "educatorId": "507f1f77bcf86cd799439011",
  "subject": ["Chemistry"],
  "specialization": ["NEET", "CBSE"],
  "class": [11, 12],
  "topics": ["Periodic Table", "Noble Gases"],
  "options": {
    "A": "Helium (He)",
    "B": "Oxygen (O)",
    "C": "Argon (Ar)",
    "D": "Neon (Ne)"
  },
  "correctOptions": ["A", "C", "D"],
  "difficulty": "Easy",
  "marks": { "positive": 4, "negative": -2 },
  "explanation": "He, Ar, and Ne are noble gases in Group 18. Oxygen is not."
}
```

#### 3. Integer Type

```javascript
// Mathematics integer answer question
POST /api/questions
{
  "title": "Find the number of real roots of the equation x² - 5x + 6 = 0",
  "questionType": "integer",
  "educatorId": "507f1f77bcf86cd799439011",
  "subject": ["Mathematics"],
  "specialization": ["IIT-JEE"],
  "class": [10, 11],
  "topics": ["Quadratic Equations", "Algebra"],
  "correctOptions": 2,
  "difficulty": "Easy",
  "marks": { "positive": 4, "negative": 0 },
  "explanation": "x² - 5x + 6 = 0 => (x-2)(x-3) = 0 => x = 2 or x = 3. Two real roots."
}
```

### Filtering Examples

```javascript
// Get all Medium difficulty Physics questions for IIT-JEE
GET /api/questions?subject=Physics&specialization=IIT-JEE&difficulty=Medium

// Get all questions on specific topics
GET /api/questions/topics?topics=Mechanics,Thermodynamics

// Get educator's questions filtered by difficulty
GET /api/questions/educator/507f1f77bcf86cd799439011?difficulty=Hard

// Get multi-select questions for Class 12
GET /api/questions?class=12&questionType=multi-select
```

---

## Best Practices

1. **Question Creation**:

   - Always provide clear, concise titles
   - For MCQs, ensure all options are plausible
   - Provide detailed explanations for complex questions
   - Use appropriate difficulty levels
   - Tag questions with relevant topics and tags for easy filtering

2. **Question Types**:

   - Use single-select for questions with one definitive answer
   - Use multi-select when multiple answers are correct
   - Use integer type for numerical calculations

3. **Marks Distribution**:

   - Positive marks should reflect question difficulty
   - Negative marks typically 1/4 to 1/2 of positive marks (for guessing penalty)
   - Integer type questions often have no negative marking

4. **Filtering**:

   - Use pagination for large result sets
   - Combine multiple filters for precise question selection
   - Use topics and tags for granular categorization

5. **Updates**:
   - Update questions carefully, especially if already in tests
   - Use soft delete to preserve question history
   - Track which tests contain the question before making major changes

---

## Notes

- All questions support soft delete (isActive flag)
- Questions are automatically populated with educator details when retrieved
- Slugs are automatically generated from titles
- Test count is calculated via virtual field
- Questions can be filtered by multiple criteria simultaneously
- Pagination is supported on all list endpoints
- All dates are in ISO 8601 format (UTC)
