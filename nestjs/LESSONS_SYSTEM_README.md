# Lessons System Documentation

## Overview

The Lessons System is a comprehensive educational platform that provides structured learning paths for C and C++ programming languages. It supports multiple languages (Turkish and English) and includes chapters, topics, lessons, tests, and a reward system.

## Architecture

### Collections Structure
The system uses 4 MongoDB collections:
- `lessons_c_tr` - C lessons in Turkish
- `lessons_c_en` - C lessons in English  
- `lessons_cpp_tr` - C++ lessons in Turkish
- `lessons_cpp_en` - C++ lessons in English

### Entity Types
Each collection contains 5 entity types:
1. **Chapter** - Main learning sections
2. **Topic** - Subsections within chapters
3. **Lesson** - Individual learning units
4. **ChapterTest** - Tests at the end of each chapter (20 questions, 70% passing)
5. **UserLessonProgress** - User progress tracking

### Rich Content Types
Lessons support various content types:
- **Text** - Regular text content
- **Video** - YouTube/Vimeo embedded videos
- **Code** - Syntax-highlighted code blocks
- **Image** - Images with captions
- **Warning** - Important notices
- **Quiz** - Interactive quizzes
- **Interactive** - Code editors and exercises
- **Exercise** - Practice problems

## Badge System

### Milestone Badges
- `ilk_adim` - First lesson entry
- `ilk_dersim` - First lesson completed
- `ilk_testim` - First test passed

### Achievement Badges
- `lesson_explorer` - 5 lessons completed
- `lesson_enthusiast` - 10 lessons completed
- `lesson_champion` - 25 lessons completed
- `test_taker` - 3 tests passed
- `test_master` - 5 tests passed

### Mastery Badges
- `introduction_master` - Introduction chapter completed
- `data_types_variables_master` - Data Types chapter completed
- And more based on chapter slugs...

## API Endpoints

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Chapter Endpoints
```
GET /lessons/chapters?language=c&locale=tr
GET /lessons/chapters/:id?language=c&locale=tr
GET /lessons/chapters/:chapterId/topics?language=c&locale=tr
GET /lessons/chapters/:chapterId/test?language=c&locale=tr
```

### Topic Endpoints
```
GET /lessons/topics/:id?language=c&locale=tr
GET /lessons/topics/:topicId/lessons?language=c&locale=tr
```

### Lesson Endpoints
```
GET /lessons/lessons/:id?language=c&locale=tr
GET /lessons/lessons/:id/can-access?language=c&locale=tr
POST /lessons/lessons/complete
```

### Test Endpoints
```
POST /lessons/tests/submit
```

### Progress Endpoints
```
GET /lessons/progress?language=c&locale=tr
GET /lessons/progress/lessons/:lessonId?language=c&locale=tr
GET /lessons/progress/statistics?language=c&locale=tr
GET /lessons/progress/next-lesson?language=c&locale=tr
```

### Learning Path Endpoints
```
GET /lessons/learning-path?language=c&locale=tr
```

### Batch Operations
```
GET /lessons/batch/chapters-with-topics?language=c&locale=tr
GET /lessons/batch/topics-with-lessons?chapterId=xxx&language=c&locale=tr
GET /lessons/batch/user-progress-summary?language=c&locale=tr
```

### Admin Endpoints
```
GET /lessons/admin/collections
GET /lessons/admin/collection-stats?language=c&locale=tr
```

## Usage Examples

### Complete a Lesson
```javascript
POST /lessons/lessons/complete
{
  "lessonId": "lesson_id_here",
  "language": "c",
  "locale": "tr"
}
```

### Submit a Test
```javascript
POST /lessons/tests/submit
{
  "testId": "test_id_here",
  "answers": [1, 0, 2, 1, 0], // Array of selected answer indices
  "language": "c",
  "locale": "tr"
}
```

### Get User Progress Summary
```javascript
GET /lessons/batch/user-progress-summary?language=c&locale=tr

Response:
{
  "chapters": [
    {
      "_id": "chapter_id",
      "title": "C Programlamaya Giriş",
      "progress": {
        "completedLessons": 3,
        "passedTests": 1
      }
    }
  ],
  "statistics": {
    "completedLessons": 5,
    "totalLessons": 20,
    "passedTests": 2,
    "totalTests": 5,
    "progressPercentage": 25,
    "testSuccessRate": 40
  },
  "nextLesson": {
    "_id": "next_lesson_id",
    "title": "Next Lesson Title"
  }
}
```

## Database Schema

### Chapter Schema
```typescript
{
  entityType: 'chapter',
  title: string,
  slug: string,
  description: string,
  order: number,
  estimatedDuration: number, // minutes
  createdAt: Date,
  updatedAt: Date
}
```

### Lesson Schema
```typescript
{
  entityType: 'lesson',
  topicId: string,
  chapterId: string,
  title: string,
  slug: string,
  order: number,
  estimatedDuration: number,
  content: RichContent[],
  prerequisites: string[],
  learningObjectives: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### UserLessonProgress Schema
```typescript
{
  entityType: 'userLessonProgress',
  userId: number,
  lessonId?: string,
  testId?: string,
  topicId?: string,
  chapterId: string,
  completed?: boolean,
  completedAt?: Date,
  score?: number,
  passed?: boolean,
  answers?: number[],
  passedTests: string[],
  createdAt: Date,
  updatedAt: Date
}
```

## Setup and Installation

### 1. Database Migration
Run the PostgreSQL migration to add lesson statistics to User entity:
```bash
npm run migration:run
```

### 2. Seed Lessons Data
Populate the MongoDB collections with sample lesson data:
```bash
npm run seed:lessons
```

### 3. Verify Installation
Check if the system is working:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/lessons/admin/collections"
```

## Dependencies

### User Entity Updates
The User entity now includes:
- `totalCompletedLessons: number` - Count of completed lessons
- `totalPassedTests: number` - Count of passed tests

### Badge Integration
The system integrates with the existing BadgeService to award lesson-related badges automatically.

### MongoDB Collections
All lesson data is stored in MongoDB with dynamic collection selection based on language and locale.

## Learning Path Logic

### Sequential Learning
- Lessons must be completed in order within each topic
- Users can only access the next lesson after completing the previous one
- Tests become available after completing all lessons in a chapter

### Progress Tracking
- Real-time progress updates
- Milestone detection for badge awards
- Statistics calculation for user dashboard

### Content Delivery
- Rich content rendering for React Native
- Video embed support for YouTube/Vimeo
- Interactive code editors and exercises
- Responsive design for mobile learning

## Error Handling

### Common Error Responses
- `400 Bad Request` - Invalid language/locale combination
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - Lesson/chapter/topic not found
- `409 Conflict` - Lesson already completed

### Validation
- Language must be 'c' or 'cpp'
- Locale must be 'tr' or 'en'
- All required fields validated via DTOs
- Sequential access validation for lessons

## Performance Considerations

### Batch Operations
Use batch endpoints for better performance when loading multiple related entities.

### Caching
Consider implementing Redis caching for frequently accessed data like chapter lists.

### Indexing
MongoDB collections are indexed on:
- `entityType` + `chapterId`
- `entityType` + `topicId`
- `entityType` + `userId`

## Future Enhancements

### Planned Features
- Video progress tracking
- Code execution sandbox
- Peer review system
- Advanced analytics
- Adaptive learning paths
- Offline content support

### Scalability
- Horizontal scaling via MongoDB sharding
- CDN integration for video content
- Microservices architecture for high load 