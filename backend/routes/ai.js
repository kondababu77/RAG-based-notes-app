/**
 * AI Routes
 * API routes for AI-powered features using RAG
 */

const express = require('express');
const router = express.Router();
const { aiController } = require('../controllers');
const { aiValidation } = require('../middleware/validators');
const { protect } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Ask AI a question (RAG-powered Q&A)
router.post('/ask', aiValidation.query, aiController.askQuestion);

// Summarize content
router.post('/summarize', aiValidation.summarize, aiController.summarizeNote);

// Generate title for content
router.post('/generate-title', aiValidation.generateTitle, aiController.generateTitle);

// Explain content in simple language
router.post('/explain', aiController.explainContent);

// Extract key points
router.post('/key-points', aiController.extractKeyPoints);

// Chat with notes
router.post('/chat', aiController.chatWithNotes);

// Get AI insights for all notes
router.get('/insights', aiController.getInsights);

// Get related notes
router.get('/related/:noteId', aiController.getRelatedNotes);

module.exports = router;
