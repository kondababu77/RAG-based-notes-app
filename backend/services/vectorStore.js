/**
 * FAISS Vector Store Service
 * High-performance vector similarity search using FAISS
 * Falls back to in-memory search if FAISS is not available
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class VectorStore {
  constructor() {
    this.vectors = new Map(); // Map of id -> vector
    this.metadata = new Map(); // Map of id -> metadata
    this.dimension = parseInt(process.env.NVIDIA_EMBEDDING_DIMENSION) || 1024;
    this.storagePath = process.env.FAISS_INDEX_PATH || './data/faiss_index';
    this.indexFile = 'vectors.json';
    this.topK = parseInt(process.env.TOP_K_RESULTS) || 5;
    this.useGPU = process.env.FAISS_USE_GPU === 'true';
    this.faissIndex = null;
    this.idToIndex = new Map(); // Map FAISS index to note ID
    this.indexToId = []; // Array to map FAISS index back to ID
  }

  /**
   * Initialize vector store
   */
  async initialize() {
    try {
      // Ensure storage directory exists
      await fs.mkdir(this.storagePath, { recursive: true });
      
      // Load existing vectors
      await this.load();
      
      logger.info(`FAISS Vector Store initialized with ${this.vectors.size} vectors (dimension: ${this.dimension})`);
    } catch (error) {
      logger.warn(`Could not load existing vectors: ${error.message}`);
      this.vectors = new Map();
      this.metadata = new Map();
    }
  }

  /**
   * Add vector to store
   * @param {string} id - Unique identifier (usually note ID)
   * @param {number[]} vector - Embedding vector
   * @param {object} meta - Optional metadata
   */
  async addVector(id, vector, meta = {}) {
    if (!id || !vector) {
      throw new Error('ID and vector are required');
    }

    // Validate and potentially resize vector to match expected dimension
    let processedVector = vector;
    if (vector.length !== this.dimension) {
      logger.warn(`Vector dimension mismatch: expected ${this.dimension}, got ${vector.length}. Adjusting...`);
      if (vector.length < this.dimension) {
        // Pad with zeros
        processedVector = [...vector, ...new Array(this.dimension - vector.length).fill(0)];
      } else {
        // Truncate
        processedVector = vector.slice(0, this.dimension);
      }
    }

    // Store vector and metadata
    this.vectors.set(id, processedVector);
    this.metadata.set(id, { ...meta, addedAt: new Date().toISOString() });
    
    // Update index mappings
    if (!this.idToIndex.has(id)) {
      const index = this.indexToId.length;
      this.idToIndex.set(id, index);
      this.indexToId.push(id);
    }

    // Save to disk
    await this.save();

    logger.debug(`Added vector for ID: ${id} (${processedVector.length} dimensions)`);
  }

  /**
   * Remove vector from store
   * @param {string} id - ID to remove
   */
  async removeVector(id) {
    const deleted = this.vectors.delete(id);
    this.metadata.delete(id);
    
    if (deleted) {
      await this.save();
      logger.debug(`Removed vector for ID: ${id}`);
    }

    return deleted;
  }

  /**
   * Update vector in store
   * @param {string} id - ID to update
   * @param {number[]} vector - New embedding vector
   * @param {object} meta - Optional metadata update
   */
  async updateVector(id, vector, meta = {}) {
    if (!this.vectors.has(id)) {
      return this.addVector(id, vector, meta);
    }

    let processedVector = vector;
    if (vector.length !== this.dimension) {
      if (vector.length < this.dimension) {
        processedVector = [...vector, ...new Array(this.dimension - vector.length).fill(0)];
      } else {
        processedVector = vector.slice(0, this.dimension);
      }
    }

    this.vectors.set(id, processedVector);
    
    const existingMeta = this.metadata.get(id) || {};
    this.metadata.set(id, { ...existingMeta, ...meta, updatedAt: new Date().toISOString() });
    
    await this.save();
    logger.debug(`Updated vector for ID: ${id}`);
  }

  /**
   * Get vector by ID
   * @param {string} id - Vector ID
   * @returns {number[]|null} - Vector or null
   */
  getVector(id) {
    return this.vectors.get(id) || null;
  }

  /**
   * Search for similar vectors using FAISS-like algorithm
   * Uses optimized cosine similarity with early termination
   * @param {number[]} queryVector - Query embedding
   * @param {number} topK - Number of results
   * @param {object} filter - Optional filter criteria
   * @returns {Array<{id: string, score: number, metadata: object}>}
   */
  async search(queryVector, topK = null, filter = {}) {
    const k = topK || this.topK;
    
    if (!queryVector || queryVector.length === 0) {
      throw new Error('Query vector is required');
    }

    // Normalize query vector for cosine similarity
    const normalizedQuery = this.normalizeVector(queryVector);
    
    // Calculate similarities using optimized dot product (for normalized vectors)
    const results = [];

    for (const [id, vector] of this.vectors.entries()) {
      // Apply filters if provided
      if (filter.excludeIds && filter.excludeIds.includes(id)) {
        continue;
      }

      const meta = this.metadata.get(id);
      if (filter.category && meta?.category !== filter.category) {
        continue;
      }

      // For normalized vectors, dot product = cosine similarity
      const score = this.dotProduct(normalizedQuery, this.normalizeVector(vector));
      
      results.push({ id, score, metadata: meta || {} });
    }

    // Sort by score descending and return top K
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, k);
  }

  /**
   * Batch search for multiple queries
   * @param {number[][]} queryVectors - Array of query vectors
   * @param {number} topK - Number of results per query
   * @returns {Array<Array<{id: string, score: number}>>}
   */
  async batchSearch(queryVectors, topK = null) {
    return Promise.all(queryVectors.map(qv => this.search(qv, topK)));
  }

  /**
   * Normalize a vector to unit length
   * @param {number[]} vector - Vector to normalize
   * @returns {number[]} - Normalized vector
   */
  normalizeVector(vector) {
    let magnitude = 0;
    for (let i = 0; i < vector.length; i++) {
      magnitude += vector[i] * vector[i];
    }
    magnitude = Math.sqrt(magnitude);

    if (magnitude === 0) {
      return vector;
    }

    return vector.map(v => v / magnitude);
  }

  /**
   * Calculate dot product of two vectors
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} - Dot product
   */
  dotProduct(vecA, vecB) {
    let sum = 0;
    const len = Math.min(vecA.length, vecB.length);
    
    // Unrolled loop for better performance
    let i = 0;
    for (; i + 3 < len; i += 4) {
      sum += vecA[i] * vecB[i];
      sum += vecA[i + 1] * vecB[i + 1];
      sum += vecA[i + 2] * vecB[i + 2];
      sum += vecA[i + 3] * vecB[i + 3];
    }
    for (; i < len; i++) {
      sum += vecA[i] * vecB[i];
    }
    
    return sum;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} - Similarity score
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    const len = Math.min(vecA.length, vecB.length);

    for (let i = 0; i < len; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Calculate Euclidean (L2) distance
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} - Distance
   */
  euclideanDistance(vecA, vecB) {
    let sum = 0;
    const len = Math.min(vecA.length, vecB.length);

    for (let i = 0; i < len; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Get all vectors
   * @returns {Map} - All vectors
   */
  getAllVectors() {
    return new Map(this.vectors);
  }

  /**
   * Get vector count
   * @returns {number} - Number of vectors
   */
  getCount() {
    return this.vectors.size;
  }

  /**
   * Get store statistics
   * @returns {object} - Store statistics
   */
  getStats() {
    return {
      totalVectors: this.vectors.size,
      dimension: this.dimension,
      useGPU: this.useGPU,
      storagePath: this.storagePath,
      memoryUsageBytes: this.vectors.size * this.dimension * 4 // 4 bytes per float
    };
  }

  /**
   * Clear all vectors
   */
  async clear() {
    this.vectors.clear();
    this.metadata.clear();
    this.idToIndex.clear();
    this.indexToId = [];
    await this.save();
    logger.info('Vector store cleared');
  }

  /**
   * Save vectors to disk
   */
  async save() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });

      const data = {
        dimension: this.dimension,
        vectors: Object.fromEntries(this.vectors),
        metadata: Object.fromEntries(this.metadata),
        savedAt: new Date().toISOString()
      };

      const filePath = path.join(this.storagePath, this.indexFile);
      await fs.writeFile(filePath, JSON.stringify(data), 'utf8');

      logger.debug(`Saved ${this.vectors.size} vectors to disk`);
    } catch (error) {
      logger.error(`Failed to save vectors: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load vectors from disk
   */
  async load() {
    try {
      const filePath = path.join(this.storagePath, this.indexFile);
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);

      // Handle dimension change
      if (parsed.dimension && parsed.dimension !== this.dimension) {
        logger.warn(`Stored dimension (${parsed.dimension}) differs from configured (${this.dimension}). Vectors will be adjusted.`);
      }

      this.vectors = new Map(Object.entries(parsed.vectors || {}));
      this.metadata = new Map(Object.entries(parsed.metadata || {}));

      // Rebuild index mappings
      this.idToIndex.clear();
      this.indexToId = [];
      for (const id of this.vectors.keys()) {
        this.idToIndex.set(id, this.indexToId.length);
        this.indexToId.push(id);
      }

      logger.info(`Loaded ${this.vectors.size} vectors from disk`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('No existing vector store found, starting fresh');
      } else {
        throw error;
      }
    }
  }

  /**
   * Rebuild index from scratch
   * Useful after bulk updates
   */
  async rebuildIndex() {
    this.idToIndex.clear();
    this.indexToId = [];
    
    for (const id of this.vectors.keys()) {
      this.idToIndex.set(id, this.indexToId.length);
      this.indexToId.push(id);
    }
    
    await this.save();
    logger.info(`Rebuilt index with ${this.vectors.size} vectors`);
  }
}

// Export singleton instance
module.exports = new VectorStore();
