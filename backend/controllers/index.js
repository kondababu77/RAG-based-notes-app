/**
 * Controllers Index
 * Export all controllers from a single entry point
 */

const notesController = require('./notesController');
const aiController = require('./aiController');
const searchController = require('./searchController');

module.exports = {
  notesController,
  aiController,
  searchController
};
