/**
 * Note Model
 * MongoDB Schema for Notes
 */

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Note must belong to a user'],
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    default: 'Untitled Note'
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true,
    maxlength: [50000, 'Content cannot exceed 50000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
    default: 'General'
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#ffffff',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  embeddingId: {
    type: String,
    default: null
  },
  hasEmbedding: {
    type: Boolean,
    default: false
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    characterCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number, // in minutes
      default: 0
    }
  },
  aiGenerated: {
    summary: {
      type: String,
      default: null
    },
    suggestedTitle: {
      type: String,
      default: null
    },
    lastProcessed: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });
noteSchema.index({ createdAt: -1 });
noteSchema.index({ updatedAt: -1 });
noteSchema.index({ category: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ isArchived: 1 });
noteSchema.index({ isPinned: -1, updatedAt: -1 });

// Pre-save middleware to calculate metadata
noteSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const content = this.content || '';
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    
    this.metadata.wordCount = words.length;
    this.metadata.characterCount = content.length;
    this.metadata.readingTime = Math.ceil(words.length / 200); // Average reading speed: 200 words/min
  }
  next();
});

// Virtual for formatted dates
noteSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Static method to find notes by tag
noteSchema.statics.findByTag = function(tag) {
  return this.find({ tags: { $in: [tag] }, isArchived: false });
};

// Static method to find notes by category
noteSchema.statics.findByCategory = function(category) {
  return this.find({ category, isArchived: false });
};

// Static method to search notes
noteSchema.statics.searchNotes = function(searchTerm, options = {}) {
  const { limit = 20, skip = 0, includeArchived = false } = options;
  
  const query = {
    $text: { $search: searchTerm }
  };
  
  if (!includeArchived) {
    query.isArchived = false;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit);
};

// Instance method to archive note
noteSchema.methods.archive = async function() {
  this.isArchived = true;
  return this.save();
};

// Instance method to unarchive note
noteSchema.methods.unarchive = async function() {
  this.isArchived = false;
  return this.save();
};

// Instance method to toggle pin
noteSchema.methods.togglePin = async function() {
  this.isPinned = !this.isPinned;
  return this.save();
};

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
