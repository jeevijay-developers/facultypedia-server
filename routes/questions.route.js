const express = require('express');
const router = express.Router();

// Import question controller (when created)
// const questionController = require('../controllers/question.controller');

// Placeholder routes for questions
// GET /api/questions - Get all questions
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Questions route is working',
        data: []
    });
});

// POST /api/questions - Create new question
router.post('/', (req, res) => {
    res.json({
        success: true,
        message: 'Create question endpoint',
        data: req.body
    });
});

// GET /api/questions/:id - Get question by ID
router.get('/:id', (req, res) => {
    res.json({
        success: true,
        message: `Get question with ID: ${req.params.id}`,
        data: {}
    });
});

// PUT /api/questions/:id - Update question
router.put('/:id', (req, res) => {
    res.json({
        success: true,
        message: `Update question with ID: ${req.params.id}`,
        data: req.body
    });
});

// DELETE /api/questions/:id - Delete question
router.delete('/:id', (req, res) => {
    res.json({
        success: true,
        message: `Delete question with ID: ${req.params.id}`
    });
});

module.exports = router;