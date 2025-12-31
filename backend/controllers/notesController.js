/**
 * Notes Controller
 * Handles all note-related business logic
 */

const { Note, Embedding } = require('../models');
const embeddingService = require('../services/embeddingService');
const vectorStore = require('../services/vectorStore');
const logger = require('../utils/logger');

/**
 * Get all notes
 * GET /api/notes
 */
exports.getAllNotes = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-updatedAt',
      category,
      tag,
      archived = 'false',
      pinned
    } = req.query;

    const query = { user: req.user._id };
    
    // Filter by archived status
    query.isArchived = archived === 'true';
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    // Filter by pinned status
    if (pinned !== undefined) {
      query.isPinned = pinned === 'true';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort
    };

    const notes = await Note.find(query)
      .sort(options.sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean();

    const total = await Note.countDocuments(query);

    res.status(200).json({
      success: true,
      data: notes,
      pagination: {
        current: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single note by ID
 * GET /api/notes/:id
 */
exports.getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new note
 * POST /api/notes
 */
exports.createNote = async (req, res, next) => {
  try {
    const { title, content, tags, category, color } = req.body;

    // Create the note
    const note = await Note.create({
      user: req.user._id,
      title: title || 'Untitled Note',
      content,
      tags: tags || [],
      category: category || 'General',
      color: color || '#ffffff'
    });

    // Generate embedding asynchronously
    generateNoteEmbedding(note._id, content).catch(err => {
      logger.error(`Failed to generate embedding for note ${note._id}: ${err.message}`);
    });

    res.status(201).json({
      success: true,
      data: note,
      message: 'Note created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update note
 * PUT /api/notes/:id
 */
exports.updateNote = async (req, res, next) => {
  try {
    const { title, content, tags, category, color, isPinned, isArchived } = req.body;

    let note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Track if content changed
    const contentChanged = content && content !== note.content;

    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (category !== undefined) note.category = category;
    if (color !== undefined) note.color = color;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (isArchived !== undefined) note.isArchived = isArchived;

    await note.save();

    // Regenerate embedding if content changed
    if (contentChanged) {
      generateNoteEmbedding(note._id, content).catch(err => {
        logger.error(`Failed to update embedding for note ${note._id}: ${err.message}`);
      });
    }

    res.status(200).json({
      success: true,
      data: note,
      message: 'Note updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete note
 * DELETE /api/notes/:id
 */
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Delete embedding from vector store
    try {
      await vectorStore.removeVector(note._id.toString());
      await Embedding.deleteByNoteId(note._id);
    } catch (embError) {
      logger.warn(`Failed to delete embedding for note ${note._id}: ${embError.message}`);
    }

    await Note.deleteOne({ _id: note._id });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle pin status
 * PATCH /api/notes/:id/pin
 */
exports.togglePin = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    await note.togglePin();

    res.status(200).json({
      success: true,
      data: note,
      message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Archive note
 * PATCH /api/notes/:id/archive
 */
exports.archiveNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    if (note.isArchived) {
      await note.unarchive();
    } else {
      await note.archive();
    }

    res.status(200).json({
      success: true,
      data: note,
      message: `Note ${note.isArchived ? 'archived' : 'unarchived'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories
 * GET /api/notes/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Note.distinct('category', { user: req.user._id, isArchived: false });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tags
 * GET /api/notes/tags
 */
exports.getTags = async (req, res, next) => {
  try {
    const tags = await Note.distinct('tags', { user: req.user._id, isArchived: false });

    res.status(200).json({
      success: true,
      data: tags.filter(tag => tag) // Filter out empty tags
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notes statistics
 * GET /api/notes/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Note.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          archivedNotes: {
            $sum: { $cond: ['$isArchived', 1, 0] }
          },
          pinnedNotes: {
            $sum: { $cond: ['$isPinned', 1, 0] }
          },
          totalWords: { $sum: '$metadata.wordCount' },
          avgWordCount: { $avg: '$metadata.wordCount' }
        }
      }
    ]);

    const categoryStats = await Note.aggregate([
      { $match: { user: req.user._id, isArchived: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalNotes: 0,
          archivedNotes: 0,
          pinnedNotes: 0,
          totalWords: 0,
          avgWordCount: 0
        },
        byCategory: categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to generate embedding for a note
 */
async function generateNoteEmbedding(noteId, content) {
  try {
    // Generate embedding
    const embedding = await embeddingService.generateEmbedding(content);
    
    // Create hash for content
    const crypto = require('crypto');
    const textHash = crypto.createHash('md5').update(content).digest('hex');

    // Save to database
    await Embedding.findOneAndUpdate(
      { noteId },
      {
        noteId,
        vector: embedding,
        dimension: embedding.length,
        textHash,
        model: 'all-MiniLM-L6-v2'
      },
      { upsert: true, new: true }
    );

    // Add to vector store
    await vectorStore.addVector(noteId.toString(), embedding);

    // Update note to indicate embedding exists
    await Note.findByIdAndUpdate(noteId, {
      hasEmbedding: true,
      embeddingId: noteId.toString()
    });

    logger.info(`Embedding generated for note ${noteId}`);
  } catch (error) {
    logger.error(`Error generating embedding for note ${noteId}: ${error.message}`);
    throw error;
  }
}
