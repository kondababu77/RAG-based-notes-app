/**
 * Search Controller
 * Handles semantic and keyword search operations
 */

const { Note, Embedding } = require('../models');
const embeddingService = require('../services/embeddingService');
const vectorStore = require('../services/vectorStore');
const logger = require('../utils/logger');

/**
 * Semantic search notes
 * GET /api/search/semantic
 */
exports.semanticSearch = async (req, res, next) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Generate embedding for search query
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Search vector store
    const searchResults = await vectorStore.search(queryEmbedding, parseInt(limit));

    if (searchResults.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No matching notes found'
      });
    }

    // Get full notes for results
    const noteIds = searchResults.map(result => result.id);
    const notes = await Note.find({ 
      _id: { $in: noteIds },
      isArchived: false 
    }).lean();

    // Map similarity scores to notes
    const notesWithScores = notes.map(note => {
      const result = searchResults.find(r => r.id === note._id.toString());
      return {
        ...note,
        similarityScore: result ? result.score : 0,
        preview: note.content.substring(0, 200) + '...'
      };
    });

    // Sort by similarity score
    notesWithScores.sort((a, b) => b.similarityScore - a.similarityScore);

    res.status(200).json({
      success: true,
      data: notesWithScores,
      query,
      resultsCount: notesWithScores.length
    });
  } catch (error) {
    logger.error(`Semantic Search Error: ${error.message}`);
    next(error);
  }
};

/**
 * Keyword/text search notes
 * GET /api/search/keyword
 */
exports.keywordSearch = async (req, res, next) => {
  try {
    const { q: query, limit = 20, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      includeArchived: false
    };

    const notes = await Note.searchNotes(query, options);

    res.status(200).json({
      success: true,
      data: notes.map(note => ({
        ...note.toObject(),
        preview: note.content.substring(0, 200) + '...'
      })),
      query,
      resultsCount: notes.length
    });
  } catch (error) {
    logger.error(`Keyword Search Error: ${error.message}`);
    next(error);
  }
};

/**
 * Hybrid search combining semantic and keyword search
 * GET /api/search/hybrid
 */
exports.hybridSearch = async (req, res, next) => {
  try {
    const { q: query, limit = 10, semanticWeight = 0.7 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const parsedLimit = parseInt(limit);
    const weight = parseFloat(semanticWeight);

    // Perform semantic search
    const queryEmbedding = await embeddingService.generateEmbedding(query);
    const semanticResults = await vectorStore.search(queryEmbedding, parsedLimit * 2);

    // Perform keyword search
    const keywordResults = await Note.searchNotes(query, { 
      limit: parsedLimit * 2, 
      includeArchived: false 
    });

    // Combine and score results
    const combinedScores = new Map();

    // Add semantic results
    semanticResults.forEach((result, index) => {
      const normalizedScore = 1 - (index / semanticResults.length);
      combinedScores.set(result.id, {
        id: result.id,
        semanticScore: normalizedScore * weight,
        keywordScore: 0
      });
    });

    // Add keyword results
    keywordResults.forEach((note, index) => {
      const id = note._id.toString();
      const normalizedScore = 1 - (index / keywordResults.length);
      
      if (combinedScores.has(id)) {
        combinedScores.get(id).keywordScore = normalizedScore * (1 - weight);
      } else {
        combinedScores.set(id, {
          id,
          semanticScore: 0,
          keywordScore: normalizedScore * (1 - weight)
        });
      }
    });

    // Calculate final scores and sort
    const scoredResults = Array.from(combinedScores.values())
      .map(item => ({
        ...item,
        totalScore: item.semanticScore + item.keywordScore
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, parsedLimit);

    // Get full notes
    const noteIds = scoredResults.map(r => r.id);
    const notes = await Note.find({ _id: { $in: noteIds } }).lean();

    // Map scores to notes
    const notesWithScores = scoredResults.map(result => {
      const note = notes.find(n => n._id.toString() === result.id);
      return note ? {
        ...note,
        scores: {
          total: result.totalScore.toFixed(3),
          semantic: result.semanticScore.toFixed(3),
          keyword: result.keywordScore.toFixed(3)
        },
        preview: note.content.substring(0, 200) + '...'
      } : null;
    }).filter(Boolean);

    res.status(200).json({
      success: true,
      data: notesWithScores,
      query,
      resultsCount: notesWithScores.length,
      searchType: 'hybrid',
      semanticWeight: weight
    });
  } catch (error) {
    logger.error(`Hybrid Search Error: ${error.message}`);
    next(error);
  }
};

/**
 * Search suggestions/autocomplete
 * GET /api/search/suggestions
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    const { q: query, limit = 5 } = req.query;

    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Search for matching titles
    const titleMatches = await Note.find(
      { 
        title: { $regex: query, $options: 'i' },
        isArchived: false 
      },
      { title: 1 }
    ).limit(parseInt(limit)).lean();

    // Search for matching tags
    const tagMatches = await Note.distinct('tags', {
      tags: { $regex: query, $options: 'i' },
      isArchived: false
    });

    const suggestions = [
      ...titleMatches.map(n => ({ type: 'title', value: n.title })),
      ...tagMatches.slice(0, parseInt(limit)).map(t => ({ type: 'tag', value: t }))
    ];

    res.status(200).json({
      success: true,
      data: suggestions.slice(0, parseInt(limit) * 2)
    });
  } catch (error) {
    logger.error(`Suggestions Error: ${error.message}`);
    next(error);
  }
};

/**
 * Reindex all notes
 * POST /api/search/reindex
 */
exports.reindexAll = async (req, res, next) => {
  try {
    logger.info('Starting full reindex...');

    // Get all notes
    const notes = await Note.find({}).lean();

    if (notes.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No notes to reindex'
      });
    }

    // Clear existing vector store
    await vectorStore.clear();

    // Process notes in batches
    const batchSize = 10;
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < notes.length; i += batchSize) {
      const batch = notes.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (note) => {
        try {
          const embedding = await embeddingService.generateEmbedding(note.content);
          await vectorStore.addVector(note._id.toString(), embedding);
          
          // Update embedding in database
          const crypto = require('crypto');
          const textHash = crypto.createHash('md5').update(note.content).digest('hex');
          
          await require('../models/Embedding').findOneAndUpdate(
            { noteId: note._id },
            {
              noteId: note._id,
              vector: embedding,
              dimension: embedding.length,
              textHash,
              model: 'all-MiniLM-L6-v2'
            },
            { upsert: true }
          );

          await Note.findByIdAndUpdate(note._id, { hasEmbedding: true });
          processed++;
        } catch (err) {
          logger.error(`Failed to reindex note ${note._id}: ${err.message}`);
          errors++;
        }
      }));
    }

    logger.info(`Reindex complete. Processed: ${processed}, Errors: ${errors}`);

    res.status(200).json({
      success: true,
      data: {
        totalNotes: notes.length,
        processed,
        errors
      },
      message: 'Reindexing complete'
    });
  } catch (error) {
    logger.error(`Reindex Error: ${error.message}`);
    next(error);
  }
};
