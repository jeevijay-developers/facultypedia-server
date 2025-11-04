const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const {
    createWebinar,
    getAllWebinars,
    getWebinarById,
    getWebinarBySlug,
    updateWebinar,
    deleteWebinar,
    enrollStudent,
    unenrollStudent,
    getUpcomingWebinars,
    getWebinarsByEducator
} = require('../controllers/webinar-controller');

// Validation middleware for creating webinar
const createWebinarValidation = [
    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    
    body('description')
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    
    body('webinarType')
        .isIn(['one-to-one', 'one-to-all'])
        .withMessage('Webinar type must be either "one-to-one" or "one-to-all"'),
    
    body('timing')
        .isISO8601()
        .withMessage('Invalid date format for timing')
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('Webinar timing must be in the future');
            }
            return true;
        }),
    
    body('subject')
        .isArray({ min: 1 })
        .withMessage('At least one subject must be selected')
        .custom((subjects) => {
            const validSubjects = ['Physics', 'Biology', 'Mathematics', 'Chemistry', 'Hindi'];
            const invalidSubjects = subjects.filter(subject => !validSubjects.includes(subject));
            if (invalidSubjects.length > 0) {
                throw new Error(`Invalid subjects: ${invalidSubjects.join(', ')}`);
            }
            return true;
        }),
    
    body('fees')
        .isNumeric()
        .withMessage('Fees must be a number')
        .isFloat({ min: 0 })
        .withMessage('Fees must be greater than or equal to 0'),
    
    body('duration')
        .notEmpty()
        .withMessage('Duration is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Duration must be between 1 and 50 characters'),
    
    body('specialization')
        .isArray({ min: 1 })
        .withMessage('At least one specialization must be selected')
        .custom((specializations) => {
            const validSpecializations = ['IIT-JEE', 'NEET', 'CBSE'];
            const invalidSpecializations = specializations.filter(spec => !validSpecializations.includes(spec));
            if (invalidSpecializations.length > 0) {
                throw new Error(`Invalid specializations: ${invalidSpecializations.join(', ')}`);
            }
            return true;
        }),
    
    body('seatLimit')
        .isInt({ min: 1, max: 1000 })
        .withMessage('Seat limit must be between 1 and 1000'),
    
    body('class')
        .isArray({ min: 1 })
        .withMessage('At least one class must be selected')
        .custom((classes) => {
            const validClasses = [
                'Class 6th', 'Class 7th', 'Class 8th', 'Class 9th', 'Class 10th',
                'Class 11th', 'Class 12th', 'Dropper'
            ];
            const invalidClasses = classes.filter(cls => !validClasses.includes(cls));
            if (invalidClasses.length > 0) {
                throw new Error(`Invalid classes: ${invalidClasses.join(', ')}`);
            }
            return true;
        }),
    
    body('educatorID')
        .notEmpty()
        .withMessage('Educator ID is required')
        .isMongoId()
        .withMessage('Invalid educator ID format'),
    
    body('image')
        .optional()
        .isURL()
        .withMessage('Image must be a valid URL'),
    
    body('webinarLink')
        .optional()
        .isURL()
        .withMessage('Webinar link must be a valid URL'),
    
    body('assetsLink')
        .optional()
        .isArray()
        .withMessage('Assets link must be an array')
        .custom((links) => {
            if (links && links.length > 0) {
                const invalidLinks = links.filter(link => !/^https?:\/\/.+/.test(link));
                if (invalidLinks.length > 0) {
                    throw new Error('All asset links must be valid URLs');
                }
            }
            return true;
        })
];

// Validation middleware for updating webinar
const updateWebinarValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid webinar ID format'),
    
    body('title')
        .optional()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    
    body('description')
        .optional()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    
    body('webinarType')
        .optional()
        .isIn(['one-to-one', 'one-to-all'])
        .withMessage('Webinar type must be either "one-to-one" or "one-to-all"'),
    
    body('timing')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format for timing')
        .custom((value) => {
            if (value && new Date(value) <= new Date()) {
                throw new Error('Webinar timing must be in the future');
            }
            return true;
        }),
    
    body('subject')
        .optional()
        .isArray({ min: 1 })
        .withMessage('At least one subject must be selected')
        .custom((subjects) => {
            if (subjects) {
                const validSubjects = ['Physics', 'Biology', 'Mathematics', 'Chemistry', 'Hindi'];
                const invalidSubjects = subjects.filter(subject => !validSubjects.includes(subject));
                if (invalidSubjects.length > 0) {
                    throw new Error(`Invalid subjects: ${invalidSubjects.join(', ')}`);
                }
            }
            return true;
        }),
    
    body('fees')
        .optional()
        .isNumeric()
        .withMessage('Fees must be a number')
        .isFloat({ min: 0 })
        .withMessage('Fees must be greater than or equal to 0'),
    
    body('seatLimit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Seat limit must be between 1 and 1000')
];

// Validation middleware for MongoDB ObjectId parameters
const validateObjectId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format')
];

// Validation middleware for slug parameters
const validateSlug = [
    param('slug')
        .notEmpty()
        .withMessage('Slug is required')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Invalid slug format')
];

// Validation middleware for enrollment
const enrollmentValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid webinar ID format'),
    body('studentId')
        .notEmpty()
        .withMessage('Student ID is required')
        .isMongoId()
        .withMessage('Invalid student ID format')
];

// Routes

// GET /api/webinars - Get all webinars with filtering and pagination
router.get('/', getAllWebinars);

// GET /api/webinars/upcoming - Get upcoming webinars
router.get('/upcoming', getUpcomingWebinars);

// GET /api/webinars/educator/:educatorId - Get webinars by educator
router.get('/educator/:educatorId', 
    [param('educatorId').isMongoId().withMessage('Invalid educator ID format')],
    getWebinarsByEducator
);

// GET /api/webinars/:id - Get webinar by ID
router.get('/:id', validateObjectId, getWebinarById);

// GET /api/webinars/slug/:slug - Get webinar by slug
router.get('/slug/:slug', validateSlug, getWebinarBySlug);

// POST /api/webinars - Create new webinar
router.post('/', createWebinarValidation, createWebinar);

// PUT /api/webinars/:id - Update webinar
router.put('/:id', updateWebinarValidation, updateWebinar);

// DELETE /api/webinars/:id - Delete webinar (soft delete)
router.delete('/:id', validateObjectId, deleteWebinar);

// POST /api/webinars/:id/enroll - Enroll student in webinar
router.post('/:id/enroll', enrollmentValidation, enrollStudent);

// POST /api/webinars/:id/unenroll - Unenroll student from webinar
router.post('/:id/unenroll', enrollmentValidation, unenrollStudent);

module.exports = router;