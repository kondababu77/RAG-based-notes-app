import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { aiAPI } from '../services/api';
import { LoadingDots } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

function AIAssistant() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('chat'); // 'chat' or 'qa'
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message on mount
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `👋 Hi! I'm your AI assistant powered by RAG (Retrieval-Augmented Generation). 

I can help you with:
- **Ask questions** about your notes
- **Find information** across all your notes
- **Summarize** specific topics from your notes
- **Get insights** about your knowledge base

Just type your question below to get started!`,
        sources: [],
      }
    ]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      let response;
      
      if (mode === 'qa') {
        response = await aiAPI.ask(userMessage, 5);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.data.answer,
          sources: response.data.data.sources || [],
          tokensUsed: response.data.data.tokensUsed,
        }]);
      } else {
        // Chat mode with conversation history
        const history = messages
          .filter(m => m.role !== 'system')
          .slice(-6)
          .map(m => ({ role: m.role, content: m.content }));
        
        response = await aiAPI.chat(userMessage, history);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.data.response,
          sources: response.data.data.sources || [],
          tokensUsed: response.data.data.tokensUsed,
        }]);
      }
    } catch (error) {
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await aiAPI.getInsights();
      setInsights(response.data.data.insights);
    } catch (error) {
      toast.error('Failed to load insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  const clearConversation = () => {
    setMessages([{
      role: 'assistant',
      content: 'Conversation cleared! How can I help you?',
    }]);
  };

  const quickQuestions = [
    "Summarize my recent notes",
    "What topics do I write about most?",
    "Find notes about...",
    "Explain my notes on...",
  ];

  return (
    <div className="flex h-screen">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-secondary-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-secondary-900">AI Assistant</h1>
                <p className="text-xs text-secondary-500">Powered by RAG using your notes</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex bg-secondary-100 rounded-lg p-1">
                <button
                  onClick={() => setMode('chat')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    mode === 'chat'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-1.5" />
                  Chat
                </button>
                <button
                  onClick={() => setMode('qa')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    mode === 'qa'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-secondary-600 hover:text-secondary-900'
                  }`}
                >
                  <LightBulbIcon className="w-4 h-4 inline mr-1.5" />
                  Q&A
                </button>
              </div>

              <button
                onClick={clearConversation}
                className="btn-ghost"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl px-5 py-4 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : message.isError
                    ? 'bg-red-50 text-red-900 border border-red-200'
                    : 'bg-white text-secondary-700 shadow-sm border border-secondary-200'
                }`}
              >
                {message.role === 'assistant' ? (
                  <>
                    <div className="prose-notes">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    
                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-secondary-200">
                        <p className="text-xs font-medium text-secondary-500 mb-2">
                          Sources from your notes:
                        </p>
                        <div className="space-y-2">
                          {message.sources.map((source, i) => (
                            <button
                              key={i}
                              onClick={() => navigate(`/note/${source.id}`)}
                              className="block w-full text-left p-2 rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
                            >
                              <p className="text-sm font-medium text-secondary-900 truncate">
                                {source.title}
                              </p>
                              <p className="text-xs text-secondary-500 truncate">
                                {source.preview}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-secondary-200">
                <div className="flex items-center gap-2 text-secondary-500">
                  <LoadingDots />
                  <span className="text-sm">Searching your notes...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-secondary-500 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="badge-secondary hover:bg-secondary-200 cursor-pointer transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="border-t border-secondary-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'qa' 
                  ? "Ask a question about your notes..." 
                  : "Chat with AI about your notes..."
                }
                className="input flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-secondary-400 mt-2 text-center">
              {mode === 'qa' 
                ? 'Answers are generated using relevant context from your notes (RAG)'
                : 'Chat maintains conversation history for context-aware responses'
              }
            </p>
          </form>
        </div>
      </div>

      {/* Insights Sidebar */}
      <aside className="w-80 border-l border-secondary-200 bg-secondary-50 flex flex-col">
        <div className="p-4 border-b border-secondary-200 bg-white">
          <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-amber-500" />
            AI Insights
          </h2>
          <p className="text-xs text-secondary-500 mt-1">
            Patterns and insights from your notes
          </p>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!insights ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <LightBulbIcon className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-sm text-secondary-600 mb-4">
                Analyze your notes to discover patterns and insights
              </p>
              <button
                onClick={loadInsights}
                disabled={loadingInsights}
                className="btn-primary"
              >
                {loadingInsights ? <LoadingDots /> : 'Generate Insights'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main Topics */}
              <div className="card p-4">
                <h3 className="font-medium text-secondary-900 mb-2">Main Topics</h3>
                <div className="flex flex-wrap gap-1.5">
                  {insights.mainTopics?.map((topic, index) => (
                    <span key={index} className="badge-primary">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="card p-4">
                <h3 className="font-medium text-secondary-900 mb-2">Overview</h3>
                <p className="text-sm text-secondary-600">{insights.summary}</p>
              </div>

              {/* Patterns */}
              {insights.patterns?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-medium text-secondary-900 mb-2">Patterns</h3>
                  <ul className="text-sm text-secondary-600 space-y-1">
                    {insights.patterns.map((pattern, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-primary-500">•</span>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {insights.suggestions?.length > 0 && (
                <div className="card p-4">
                  <h3 className="font-medium text-secondary-900 mb-2">Suggestions</h3>
                  <ul className="text-sm text-secondary-600 space-y-1">
                    {insights.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-green-500">→</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={loadInsights}
                disabled={loadingInsights}
                className="btn-secondary w-full"
              >
                {loadingInsights ? <LoadingDots /> : 'Refresh Insights'}
              </button>
            </div>
          )}
        </div>

        {/* RAG Info */}
        <div className="p-4 border-t border-secondary-200 bg-white">
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100">
            <p className="text-xs text-secondary-600">
              <strong className="text-primary-700">How it works:</strong> Your questions are matched against your notes using semantic search, and relevant context is sent to the AI for accurate, personalized responses.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AIAssistant;
