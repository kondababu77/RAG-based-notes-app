/**
 * AI Controller
 * Handles all AI-related operations including RAG
 */

const { Note, Embedding } = require('../models');
const embeddingService = require('../services/embeddingService');
const vectorStore = require('../services/vectorStore');
const llmService = require('../services/llmService');
const logger = require('../utils/logger');

/**
 * Ask AI a question with RAG
 * POST /api/ai/ask
 */
exports.askQuestion = async (req, res, next) => {
  try {
    const { query, topK = 5 } = req.body;

    // Generate embedding for the query
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Find similar notes using vector search
    const similarNotes = await vectorStore.search(queryEmbedding, parseInt(topK));

    // Get full note content for retrieved notes
    const noteIds = similarNotes.map(result => result.id);
    const notes = await Note.find({ _id: { $in: noteIds } }).lean();

    // Create context from retrieved notes
    const context = notes.map(note => ({
      title: note.title,
      content: note.content,
      category: note.category
    }));

    // Generate response using LLM with context
    const response = await llmService.generateResponse(query, context, 'qa');

    res.status(200).json({
      success: true,
      data: {
        answer: response.answer,
        sources: notes.map(note => ({
          id: note._id,
          title: note.title,
          category: note.category,
          preview: note.content.substring(0, 150) + '...'
        })),
        tokensUsed: response.tokensUsed
      }
    });
  } catch (error) {
    logger.error(`AI Question Error: ${error.message}`);
    next(error);
  }
};

/**
 * Summarize a note or content
 * POST /api/ai/summarize
 */
exports.summarizeNote = async (req, res, next) => {
  try {
    const { noteId, content: directContent, length = 'medium' } = req.body;

    let content;
    let note;

    if (noteId) {
      note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }
      content = note.content;
    } else if (directContent) {
      content = directContent;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either noteId or content is required'
      });
    }

    // Generate summary using LLM
    const response = await llmService.generateSummary(content, length);

    // Save summary to note if noteId was provided
    if (note) {
      note.aiGenerated.summary = response.summary;
      note.aiGenerated.lastProcessed = new Date();
      await note.save();
    }

    res.status(200).json({
      success: true,
      data: {
        summary: response.summary,
        originalLength: content.length,
        summaryLength: response.summary.length,
        compressionRatio: ((1 - response.summary.length / content.length) * 100).toFixed(1) + '%',
        tokensUsed: response.tokensUsed
      }
    });
  } catch (error) {
    logger.error(`Summarization Error: ${error.message}`);
    next(error);
  }
};

/**
 * Generate title for content
 * POST /api/ai/generate-title
 */
exports.generateTitle = async (req, res, next) => {
  try {
    const { content, noteId } = req.body;

    const response = await llmService.generateTitle(content);

    // Update note if noteId provided
    if (noteId) {
      const note = await Note.findById(noteId);
      if (note) {
        note.aiGenerated.suggestedTitle = response.title;
        note.aiGenerated.lastProcessed = new Date();
        await note.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        title: response.title,
        alternatives: response.alternatives || [],
        tokensUsed: response.tokensUsed
      }
    });
  } catch (error) {
    logger.error(`Title Generation Error: ${error.message}`);
    next(error);
  }
};

/**
 * Explain content in simple language
 * POST /api/ai/explain
 */
exports.explainContent = async (req, res, next) => {
  try {
    const { content, style = 'simple' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const response = await llmService.explainContent(content, style);

    res.status(200).json({
      success: true,
      data: {
        explanation: response.explanation,
        style,
        tokensUsed: response.tokensUsed
      }
    });
  } catch (error) {
    logger.error(`Explanation Error: ${error.message}`);
    next(error);
  }
};

/**
 * Extract key points from content
 * POST /api/ai/key-points
 */
exports.extractKeyPoints = async (req, res, next) => {
  try {
    const { content, noteId, maxPoints = 5 } = req.body;

    let targetContent = content;

    if (noteId && !content) {
      const note = await Note.findById(noteId);
      if (!note) {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }
      targetContent = note.content;
    }

    if (!targetContent) {
      return res.status(400).json({
        success: false,
        error: 'Content or noteId is required'
      });
    }

    const response = await llmService.extractKeyPoints(targetContent, maxPoints);

    res.status(200).json({
      success: true,
      data: {
        keyPoints: response.keyPoints,
        tokensUsed: response.tokensUsed
      }
    });
  } catch (error) {
    logger.error(`Key Points Extraction Error: ${error.message}`);
    next(error);
  }
};

/**
 * Chat with notes - conversational interface
 * POST /api/ai/chat
 */
exports.chatWithNotes = async (req, res, next) => {
  try {
    const { message, conversationHistory = [], topK = 5 } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Generate embedding for the message
    const messageEmbedding = await embeddingService.generateEmbedding(message);

    // Find similar notes
    const similarNotes = await vectorStore.search(messageEmbedding, parseInt(topK));
    const noteIds = similarNotes.map(result => result.id);
    const notes = await Note.find({ _id: { $in: noteIds } }).lean();

    // Create context
    const context = notes.map(note => ({
      title: note.title,
      content: note.content
    }));

    // Generate chat response (conversationHistory, userMessage, context)
    const response = await llmService.chat(conversationHistory, message, context);

    res.status(200).json({
      success: true,
      data: {
        response: response.response,
        sources: notes.map(note => ({
          id: note._id,
          title: note.title,
          preview: note.content.substring(0, 100) + '...'
        })),
        tokensUsed: response.tokensUsed
      }
    });
  } catch (error) {
    logger.error(`Chat Error: ${error.message}`);
    next(error);
  }
};

/**
 * Get AI insights for all notes
 * GET /api/ai/insights
 */
exports.getInsights = async (req, res, next) => {
  try {
    const notes = await Note.find({ isArchived: false }).lean();

    if (notes.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'No notes available for insights',
          insights: null
        }
      });
    }

    const response = await llmService.generateInsights(notes);

    res.status(200).json({
      success: true,
      data: {
        insights: response.insights,
        notesAnalyzed: notes.length,
        tokensUsed: response.tokensUsed
      }
    });
  } catch (error) {
    logger.error(`Insights Error: ${error.message}`);
    next(error);
  }
};

/**
 * Suggest related notes
 * GET /api/ai/related/:noteId
 */
exports.getRelatedNotes = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { limit = 5 } = req.query;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Get embedding for the note
    const embedding = await embeddingService.generateEmbedding(note.content);

    // Search for similar notes
    const similarNotes = await vectorStore.search(embedding, parseInt(limit) + 1);

    // Filter out the current note
    const relatedIds = similarNotes
      .filter(result => result.id !== noteId)
      .slice(0, parseInt(limit))
      .map(result => result.id);

    const relatedNotes = await Note.find({ _id: { $in: relatedIds } })
      .select('title content category tags updatedAt')
      .lean();

    res.status(200).json({
      success: true,
      data: relatedNotes.map(note => ({
        ...note,
        preview: note.content.substring(0, 150) + '...'
      }))
    });
  } catch (error) {
    logger.error(`Related Notes Error: ${error.message}`);
    next(error);
  }
};
