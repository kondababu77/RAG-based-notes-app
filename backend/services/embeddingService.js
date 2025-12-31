/**
 * NVIDIA Embedding Service
 * Generates vector embeddings using NVIDIA nv-embed models via API
 */

const axios = require('axios');
const logger = require('../utils/logger');

class EmbeddingService {
  constructor() {
    // Environment variables are read lazily via getters
    this._isInitialized = false;
  }

  // Getters to read env vars at runtime (after dotenv loads)
  get apiKey() {
    return process.env.NVIDIA_API_KEY;
  }

  get baseUrl() {
    return process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  }

  get model() {
    return process.env.NVIDIA_EMBEDDING_MODEL || 'nvidia/nv-embedqa-e5-v5';
  }

  get dimension() {
    return parseInt(process.env.NVIDIA_EMBEDDING_DIMENSION) || 1024;
  }

  /**
   * Check if service is properly configured
   */
  isConfigured() {
    const key = this.apiKey;
    return key && key !== 'your_nvidia_api_key_here' && key.startsWith('nvapi-');
  }

  /**
   * Initialize the embedding service
   */
  async initialize() {
    if (this._isInitialized) {
      return;
    }

    if (!this.isConfigured()) {
      logger.warn('NVIDIA API key not configured. Embeddings will use fallback mode.');
      this._isInitialized = true;
      return;
    }

    logger.info(`NVIDIA Embedding Service initialized with model: ${this.model}`);
    this._isInitialized = true;
  }

  /**
   * Generate embedding for text using NVIDIA API
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    await this.initialize();

    // Truncate text if too long
    const maxLength = 8000;
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) 
      : text;

    // If API not configured, use fallback embeddings (for development)
    if (!this.isConfigured()) {
      return this.generateFallbackEmbedding(truncatedText);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/embeddings`,
        {
          input: [truncatedText],
          model: this.model,
          encoding_format: 'float',
          input_type: 'query'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const embedding = response.data.data[0].embedding;
      logger.debug(`Generated NVIDIA embedding with ${embedding.length} dimensions`);
      
      return embedding;
    } catch (error) {
      logger.error(`NVIDIA Embedding Error: ${error.response?.data?.error || error.message}`);
      
      // Fallback to mock embedding on error
      logger.warn('Falling back to mock embedding generation');
      return this.generateFallbackEmbedding(truncatedText);
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async generateEmbeddings(texts) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    await this.initialize();

    // If API not configured, use fallback
    if (!this.isConfigured()) {
      return Promise.all(texts.map(text => this.generateFallbackEmbedding(text)));
    }

    try {
      // NVIDIA API supports batch embedding
      const truncatedTexts = texts.map(text => 
        text.length > 8000 ? text.substring(0, 8000) : text
      );

      const response = await axios.post(
        `${this.baseUrl}/embeddings`,
        {
          input: truncatedTexts,
          model: this.model,
          encoding_format: 'float',
          input_type: 'query'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      const embeddings = response.data.data.map(item => item.embedding);
      logger.debug(`Generated ${embeddings.length} NVIDIA embeddings`);
      
      return embeddings;
    } catch (error) {
      logger.error(`NVIDIA Batch Embedding Error: ${error.message}`);
      // Fallback to individual generation
      return Promise.all(texts.map(text => this.generateFallbackEmbedding(text)));
    }
  }

  /**
   * Generate fallback embedding (deterministic based on text content)
   * Used when NVIDIA API is not available
   * @param {string} text - Text to embed
   * @returns {number[]} - Mock embedding vector
   */
  generateFallbackEmbedding(text) {
    // Create a deterministic embedding based on text content
    // This allows semantic similarity to work somewhat even without API
    const embedding = new Array(this.dimension).fill(0);
    
    // Simple hash-based embedding for consistency
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (charCode * (i + 1)) % this.dimension;
      embedding[index] += Math.sin(charCode * 0.01) * 0.1;
    }

    // Normalize the vector
    let magnitude = 0;
    for (let i = 0; i < embedding.length; i++) {
      magnitude += embedding[i] * embedding[i];
    }
    magnitude = Math.sqrt(magnitude);
    
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    logger.debug(`Generated fallback embedding with ${this.dimension} dimensions`);
    return embedding;
  }

  /**
   * Get the embedding dimension
   * @returns {number} - Embedding dimension
   */
  getDimension() {
    return this.dimension;
  }

  /**
   * Get model name
   * @returns {string} - Model name
   */
  getModelName() {
    return this.model;
  }
}

// Export singleton instance
module.exports = new EmbeddingService();
