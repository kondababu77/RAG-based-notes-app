/**
 * Search Routes
 * API routes for semantic and keyword search
 */

const express = require('express');
const router = express.Router();
const { searchController } = require('../controllers');
const { searchValidation } = require('../middleware/validators');
const { protect } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Semantic search
router.get('/semantic', searchValidation.semantic, searchController.semanticSearch);

// Keyword search
router.get('/keyword', searchController.keywordSearch);

// Hybrid search (semantic + keyword)
router.get('/hybrid', searchController.hybridSearch);

// Search suggestions/autocomplete
router.get('/suggestions', searchController.getSuggestions);

// Reindex all notes (admin operation)
router.post('/reindex', searchController.reindexAll);

module.exports = router;
