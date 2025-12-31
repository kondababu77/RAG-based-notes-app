/**
 * Request Validation Middleware
 */

const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Note validation rules
const noteValidation = {
  create: [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters'),
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .trim()
      .isLength({ min: 1, max: 50000 })
      .withMessage('Content must be between 1 and 50000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Each tag must be less than 50 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters'),
    handleValidationErrors
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid note ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters'),
    body('content')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50000 })
      .withMessage('Content must be between 1 and 50000 characters'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Category must be less than 100 characters'),
    handleValidationErrors
  ],

  getById: [
    param('id')
      .isMongoId()
      .withMessage('Invalid note ID'),
    handleValidationErrors
  ],

  delete: [
    param('id')
      .isMongoId()
      .withMessage('Invalid note ID'),
    handleValidationErrors
  ]
};

// AI validation rules
const aiValidation = {
  query: [
    body('query')
      .notEmpty()
      .withMessage('Query is required')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Query must be between 1 and 1000 characters'),
    handleValidationErrors
  ],

  summarize: [
    body('noteId')
      .optional()
      .isMongoId()
      .withMessage('Invalid note ID'),
    body('content')
      .optional()
      .trim()
      .isLength({ min: 10, max: 50000 })
      .withMessage('Content must be between 10 and 50000 characters'),
    handleValidationErrors
  ],

  generateTitle: [
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .trim()
      .isLength({ min: 10, max: 50000 })
      .withMessage('Content must be between 10 and 50000 characters'),
    handleValidationErrors
  ]
};

// Search validation rules
const searchValidation = {
  semantic: [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Search query must be between 1 and 500 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    handleValidationErrors
  ]
};

module.exports = {
  noteValidation,
  aiValidation,
  searchValidation,
  handleValidationErrors
};
