/**
 * Embedding Model
 * MongoDB Schema for Vector Embeddings
 */

const mongoose = require('mongoose');

const embeddingSchema = new mongoose.Schema({
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true,
    unique: true
  },
  vector: {
    type: [Number],
    required: true
  },
  dimension: {
    type: Number,
    required: true,
    default: 384 // all-MiniLM-L6-v2 produces 384-dimensional vectors
  },
  textHash: {
    type: String,
    required: true
  },
  model: {
    type: String,
    default: 'all-MiniLM-L6-v2'
  },
  chunkIndex: {
    type: Number,
    default: 0
  },
  chunkCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes (noteId already has unique: true which creates an index)
embeddingSchema.index({ textHash: 1 });
embeddingSchema.index({ createdAt: -1 });

// Static method to find embedding by note ID
embeddingSchema.statics.findByNoteId = function(noteId) {
  return this.findOne({ noteId });
};

// Static method to delete embedding by note ID
embeddingSchema.statics.deleteByNoteId = async function(noteId) {
  return this.deleteMany({ noteId });
};

// Static method to get all embeddings for vector search
embeddingSchema.statics.getAllVectors = async function() {
  return this.find({}, { noteId: 1, vector: 1 }).lean();
};

const Embedding = mongoose.model('Embedding', embeddingSchema);

module.exports = Embedding;
