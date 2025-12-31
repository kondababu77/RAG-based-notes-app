/**
 * NVIDIA LLM Service
 * Handles all interactions with NVIDIA Large Language Models
 * Supports Nemotron and LLaMA-3 models via NVIDIA API
 */

const axios = require('axios');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    // Environment variables are read lazily via getters
  }

  // Getters to read env vars at runtime (after dotenv loads)
  get apiKey() {
    return process.env.NVIDIA_API_KEY;
  }

  get baseUrl() {
    return process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  }

  get model() {
    return process.env.NVIDIA_LLM_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct';
  }

  get maxTokens() {
    return parseInt(process.env.NVIDIA_MAX_TOKENS) || 1024;
  }

  get temperature() {
    return parseFloat(process.env.NVIDIA_TEMPERATURE) || 0.7;
  }

  /**
   * Check if NVIDIA API is configured
   */
  isConfigured() {
    const key = this.apiKey;
    return key && key !== 'your_nvidia_api_key_here' && key.startsWith('nvapi-');
  }

  /**
   * Make a request to NVIDIA LLM API
   */
  async makeRequest(messages, options = {}) {
    if (!this.isConfigured()) {
      logger.warn('NVIDIA API key not configured. Using mock responses.');
      return null;
    }

    try {
      // Ensure messages are properly formatted for NVIDIA API
      const formattedMessages = messages.map(msg => ({
        role: String(msg.role),
        content: String(msg.content)
      }));

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: formattedMessages,
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature ?? this.temperature,
          top_p: options.topP || 0.9,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return {
        content: response.data.choices[0].message.content,
        tokensUsed: response.data.usage?.total_tokens || 0
      };
    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      logger.error(`NVIDIA LLM Error: ${JSON.stringify(errorDetails)}`);
      logger.error(`Model: ${this.model}, URL: ${this.baseUrl}/chat/completions`);
      throw error;
    }
  }

  /**
   * Generate response with RAG context
   * @param {string} query - User's question
   * @param {Array} context - Retrieved notes context
   * @param {string} mode - 'qa' or 'chat'
   * @returns {Promise<{answer: string, tokensUsed: number}>}
   */
  async generateResponse(query, context, mode = 'qa') {
    // Build context string from retrieved notes
    const contextStr = context.map((note, i) => 
      `[Note ${i + 1}] Title: ${note.title}\nContent: ${note.content}`
    ).join('\n\n---\n\n');

    const systemPrompt = `You are an intelligent AI assistant powered by NVIDIA Nemotron, helping users with their personal notes. 
You have access to the user's notes which are provided as context.
Use the information from these notes to provide accurate, helpful responses.
If the answer cannot be found in the notes, say so clearly.
Always be concise and helpful.`;

    const userPrompt = `Context from user's notes:
${contextStr || 'No relevant notes found.'}

---

User's Question: ${query}

Please provide a helpful response based on the context from the user's notes.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const result = await this.makeRequest(messages);
      
      if (!result) {
        return this.getMockResponse(query, context, 'qa');
      }

      return {
        answer: result.content,
        tokensUsed: result.tokensUsed
      };
    } catch (error) {
      logger.error(`RAG Response Error: ${error.message}`);
      return this.getMockResponse(query, context, 'qa');
    }
  }

  /**
   * Generate summary for content
   * @param {string} content - Content to summarize
   * @param {string} length - 'short', 'medium', or 'long'
   * @returns {Promise<{summary: string, tokensUsed: number}>}
   */
  async generateSummary(content, length = 'medium') {
    const lengthGuide = {
      short: '2-3 sentences',
      medium: '1-2 paragraphs',
      long: '3-4 paragraphs with key details'
    };

    const messages = [
      { 
        role: 'system', 
        content: 'You are a skilled summarizer powered by NVIDIA AI. Create clear, concise summaries that capture the key points.' 
      },
      { 
        role: 'user', 
        content: `Please summarize the following content in ${lengthGuide[length] || lengthGuide.medium}:\n\n${content}\n\nSummary:` 
      }
    ];

    try {
      const result = await this.makeRequest(messages, { temperature: 0.5 });
      
      if (!result) {
        return this.getMockResponse(content, [], 'summarize');
      }

      return {
        summary: result.content,
        tokensUsed: result.tokensUsed
      };
    } catch (error) {
      logger.error(`Summarization Error: ${error.message}`);
      return this.getMockResponse(content, [], 'summarize');
    }
  }

  /**
   * Generate title for content
   * @param {string} content - Content to generate title for
   * @returns {Promise<{title: string, alternatives: string[], tokensUsed: number}>}
   */
  async generateTitle(content) {
    const messages = [
      { 
        role: 'system', 
        content: 'You are a creative assistant that generates clear, descriptive titles. Always respond with valid JSON only, no additional text.' 
      },
      { 
        role: 'user', 
        content: `Generate a concise, descriptive title for the following content. Also provide 2 alternative titles.

Content:
${content.substring(0, 2000)}

Respond in JSON format only:
{
  "title": "Main title here",
  "alternatives": ["Alternative 1", "Alternative 2"]
}` 
      }
    ];

    try {
      const result = await this.makeRequest(messages, { temperature: 0.7, maxTokens: 200 });
      
      if (!result) {
        return this.getMockResponse(content, [], 'title');
      }

      // Parse JSON response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title,
          alternatives: parsed.alternatives || [],
          tokensUsed: result.tokensUsed
        };
      }

      // Fallback if JSON parsing fails
      return {
        title: result.content.substring(0, 100),
        alternatives: [],
        tokensUsed: result.tokensUsed
      };
    } catch (error) {
      logger.error(`Title Generation Error: ${error.message}`);
      
      const fallbackTitle = content.split('\n')[0].substring(0, 50) || 'Untitled Note';
      return {
        title: fallbackTitle,
        alternatives: [],
        tokensUsed: 0
      };
    }
  }

  /**
   * Explain content in simple language
   * @param {string} content - Content to explain
   * @param {string} level - 'simple', 'detailed', or 'technical'
   * @returns {Promise<{explanation: string, tokensUsed: number}>}
   */
  async explainContent(content, level = 'simple') {
    const levelGuide = {
      simple: 'Explain this in simple terms that anyone can understand. Use everyday language and analogies.',
      detailed: 'Provide a detailed explanation with examples and context.',
      technical: 'Give a technical explanation suitable for experts in the field.'
    };

    const messages = [
      { 
        role: 'system', 
        content: 'You are a knowledgeable teacher powered by NVIDIA AI who excels at explaining complex topics clearly.' 
      },
      { 
        role: 'user', 
        content: `${levelGuide[level] || levelGuide.simple}\n\nContent to explain:\n${content}` 
      }
    ];

    try {
      const result = await this.makeRequest(messages, { temperature: 0.6 });
      
      if (!result) {
        return this.getMockResponse(content, [], 'explain');
      }

      return {
        explanation: result.content,
        tokensUsed: result.tokensUsed
      };
    } catch (error) {
      logger.error(`Explanation Error: ${error.message}`);
      return this.getMockResponse(content, [], 'explain');
    }
  }

  /**
   * Extract key points from content
   * @param {string} content - Content to analyze
   * @returns {Promise<{keyPoints: string[], tokensUsed: number}>}
   */
  async extractKeyPoints(content) {
    const messages = [
      { 
        role: 'system', 
        content: 'You are an analytical assistant powered by NVIDIA AI. Extract key points as a JSON array of strings.' 
      },
      { 
        role: 'user', 
        content: `Extract the main key points from the following content. Return ONLY a JSON array of strings.

Content:
${content}

Return format: ["point 1", "point 2", "point 3"]` 
      }
    ];

    try {
      const result = await this.makeRequest(messages, { temperature: 0.3 });
      
      if (!result) {
        return this.getMockResponse(content, [], 'keyPoints');
      }

      // Parse JSON array
      const jsonMatch = result.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const keyPoints = JSON.parse(jsonMatch[0]);
        return {
          keyPoints: Array.isArray(keyPoints) ? keyPoints : [keyPoints],
          tokensUsed: result.tokensUsed
        };
      }

      // Fallback: split by newlines
      return {
        keyPoints: result.content.split('\n').filter(line => line.trim()),
        tokensUsed: result.tokensUsed
      };
    } catch (error) {
      logger.error(`Key Points Extraction Error: ${error.message}`);
      return this.getMockResponse(content, [], 'keyPoints');
    }
  }

  /**
   * Chat with context
   * @param {Array} conversationHistory - Previous messages
   * @param {string} userMessage - Current user message
   * @param {Array} context - Retrieved notes context
   * @returns {Promise<{response: string, tokensUsed: number}>}
   */
  async chat(conversationHistory, userMessage, context = []) {
    const contextStr = Array.isArray(context) && context.length > 0
      ? `\n\nRelevant notes context:\n${context.map(n => `- ${n.title}: ${(n.content || '').substring(0, 200)}...`).join('\n')}`
      : '';

    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant powered by NVIDIA, helping users manage and understand their notes. Be conversational, helpful, and concise.${contextStr}`
    };

    // Ensure conversationHistory is an array
    const historyArray = Array.isArray(conversationHistory) ? conversationHistory : [];
    
    // Filter and format conversation history properly
    const formattedHistory = historyArray
      .slice(-10)
      .filter(msg => msg && msg.role && msg.content)
      .map(msg => ({
        role: String(msg.role),
        content: String(msg.content)
      }));

    const messages = [
      systemMessage,
      ...formattedHistory,
      { role: 'user', content: String(userMessage) }
    ];

    try {
      const result = await this.makeRequest(messages);
      
      if (!result) {
        return this.getMockResponse(userMessage, context, 'chat');
      }

      return {
        response: result.content,
        tokensUsed: result.tokensUsed
      };
    } catch (error) {
      logger.error(`Chat Error: ${error.message}`);
      return this.getMockResponse(userMessage, context, 'chat');
    }
  }

  /**
   * Generate insights about notes collection
   * @param {Array} notes - Array of notes
   * @returns {Promise<{insights: object, tokensUsed: number}>}
   */
  async generateInsights(notes) {
    const notesOverview = notes.map(n => ({
      title: n.title,
      category: n.category,
      tags: n.tags,
      wordCount: n.metadata?.wordCount || n.content?.split(' ').length || 0
    }));

    const messages = [
      { 
        role: 'system', 
        content: 'You are an analytical assistant powered by NVIDIA AI. Analyze notes and provide insights in JSON format.' 
      },
      { 
        role: 'user', 
        content: `Analyze these notes and provide insights. Return ONLY valid JSON.

Notes: ${JSON.stringify(notesOverview)}

Return format:
{
  "totalNotes": number,
  "topCategories": ["category1", "category2"],
  "suggestedTags": ["tag1", "tag2"],
  "contentTrends": "brief description of trends",
  "recommendations": ["recommendation 1", "recommendation 2"]
}` 
      }
    ];

    try {
      const result = await this.makeRequest(messages, { temperature: 0.5 });
      
      if (!result) {
        return this.getMockResponse(JSON.stringify(notesOverview), [], 'insights');
      }

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return {
          insights,
          tokensUsed: result.tokensUsed
        };
      }

      return {
        insights: { error: 'Could not parse insights' },
        tokensUsed: result.tokensUsed
      };
    } catch (error) {
      logger.error(`Insights Error: ${error.message}`);
      return this.getMockResponse(JSON.stringify(notes), [], 'insights');
    }
  }

  /**
   * Get mock response when API is not available
   */
  getMockResponse(content, context, type) {
    // Ensure content is a string
    const contentStr = typeof content === 'string' ? content : String(content || '');
    const mockResponses = {
      qa: {
        answer: context.length > 0
          ? `Based on your notes, I found ${context.length} relevant entries. The most relevant note "${context[0]?.title || 'Untitled'}" contains information that may help answer your question. [NVIDIA AI not configured - using mock response]`
          : 'I couldn\'t find any relevant notes to answer your question. Try adding more notes or rephrasing your query. [NVIDIA AI not configured - using mock response]',
        tokensUsed: 0
      },
      summarize: {
        summary: `This content discusses key topics and ideas. Main points include the central theme presented in the text. [NVIDIA AI not configured - configure NVIDIA_API_KEY for full AI features]`,
        tokensUsed: 0
      },
      title: {
        title: contentStr.split('\n')[0]?.substring(0, 50) || 'New Note',
        alternatives: ['Quick Note', 'My Notes'],
        tokensUsed: 0
      },
      explain: {
        explanation: 'This content explains a concept or topic. [NVIDIA AI not configured - configure NVIDIA_API_KEY for detailed explanations]',
        tokensUsed: 0
      },
      keyPoints: {
        keyPoints: [
          'Key point from the content',
          'Another important aspect',
          'Additional consideration'
        ],
        tokensUsed: 0
      },
      chat: {
        response: 'I\'m here to help you with your notes! [NVIDIA AI not configured - configure NVIDIA_API_KEY for full chat capabilities]',
        tokensUsed: 0
      },
      insights: {
        insights: {
          totalNotes: context.length || 0,
          topCategories: ['general'],
          suggestedTags: ['notes', 'ideas'],
          contentTrends: 'Unable to analyze without NVIDIA AI configuration',
          recommendations: ['Configure NVIDIA_API_KEY for full insights']
        },
        tokensUsed: 0
      }
    };

    return mockResponses[type] || { answer: 'Mock response', tokensUsed: 0 };
  }
}

// Export singleton instance
module.exports = new LLMService();
