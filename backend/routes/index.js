/**
 * Routes Index
 * Export all routes from a single entry point
 */

const notesRoutes = require('./notes');
const aiRoutes = require('./ai');
const searchRoutes = require('./search');

module.exports = {
  notesRoutes,
  aiRoutes,
  searchRoutes
};
