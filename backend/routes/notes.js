/**
 * Notes Routes
 * RESTful API routes for notes CRUD operations
 */

const express = require('express');
const router = express.Router();
const { notesController } = require('../controllers');
const { noteValidation } = require('../middleware/validators');
const { protect } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Get statistics (must be before :id routes)
router.get('/stats', notesController.getStats);

// Get all categories
router.get('/categories', notesController.getCategories);

// Get all tags
router.get('/tags', notesController.getTags);

// Get all notes
router.get('/', notesController.getAllNotes);

// Get single note
router.get('/:id', noteValidation.getById, notesController.getNoteById);

// Create new note
router.post('/', noteValidation.create, notesController.createNote);

// Update note
router.put('/:id', noteValidation.update, notesController.updateNote);

// Delete note
router.delete('/:id', noteValidation.delete, notesController.deleteNote);

// Toggle pin status
router.patch('/:id/pin', noteValidation.getById, notesController.togglePin);

// Archive/Unarchive note
router.patch('/:id/archive', noteValidation.getById, notesController.archiveNote);

module.exports = router;
