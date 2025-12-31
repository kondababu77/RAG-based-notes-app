import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { searchAPI } from '../services/api';
import { LoadingScreen, LoadingDots } from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState('hybrid'); // 'semantic', 'keyword', 'hybrid'
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [semanticWeight, setSemanticWeight] = useState(0.7);

  const debouncedQuery = useDebounce(query, 300);

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      performSearch(debouncedQuery);
      loadSuggestions(debouncedQuery);
      setSearchParams({ q: debouncedQuery });
    } else {
      setResults([]);
      setSuggestions([]);
    }
  }, [debouncedQuery, searchType, semanticWeight]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      let response;
      
      switch (searchType) {
        case 'semantic':
          response = await searchAPI.semantic(searchQuery, 20);
          break;
        case 'keyword':
          response = await searchAPI.keyword(searchQuery, 20);
          break;
        case 'hybrid':
        default:
          response = await searchAPI.hybrid(searchQuery, 20, semanticWeight);
          break;
      }

      setResults(response.data.data || []);
    } catch (error) {
      toast.error('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async (searchQuery) => {
    try {
      const response = await searchAPI.suggestions(searchQuery, 5);
      setSuggestions(response.data.data || []);
    } catch (error) {
      setSuggestions([]);
    }
  };

  const handleReindex = async () => {
    if (reindexing) return;
    
    setReindexing(true);
    try {
      const response = await searchAPI.reindex();
      toast.success(`Reindexed ${response.data.data.processed} notes`);
    } catch (error) {
      toast.error('Failed to reindex notes');
    } finally {
      setReindexing(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.value);
  };

  const getSearchTypeDescription = () => {
    switch (searchType) {
      case 'semantic':
        return 'Finds notes with similar meaning, even if words differ';
      case 'keyword':
        return 'Matches exact words and phrases in your notes';
      case 'hybrid':
        return 'Combines semantic understanding with keyword matching';
      default:
        return '';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Search Notes</h1>
        <p className="text-secondary-500 mt-1">
          Find notes using AI-powered semantic search or keyword matching
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your notes..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-secondary-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            autoFocus
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <LoadingDots />
            </div>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && query && !loading && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="badge-secondary hover:bg-secondary-200 cursor-pointer transition-colors"
              >
                {suggestion.type === 'tag' && '#'}
                {suggestion.value}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Options */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Search Type Toggle */}
          <div className="flex bg-secondary-100 rounded-lg p-1">
            <button
              onClick={() => setSearchType('hybrid')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                searchType === 'hybrid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              <SparklesIcon className="w-4 h-4" />
              Hybrid
            </button>
            <button
              onClick={() => setSearchType('semantic')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                searchType === 'semantic'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Semantic
            </button>
            <button
              onClick={() => setSearchType('keyword')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                searchType === 'keyword'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Keyword
            </button>
          </div>

          {/* Filters Toggle */}
          {searchType === 'hybrid' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-ghost ${showFilters ? 'bg-secondary-100' : ''}`}
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="btn-secondary text-sm"
        >
          {reindexing ? <LoadingDots /> : 'Reindex All Notes'}
        </button>
      </div>

      {/* Search Type Description */}
      <p className="text-sm text-secondary-500 mb-4 flex items-center gap-2">
        <SparklesIcon className="w-4 h-4 text-primary-500" />
        {getSearchTypeDescription()}
      </p>

      {/* Hybrid Filter Options */}
      {showFilters && searchType === 'hybrid' && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-secondary-900">Semantic Weight</p>
              <p className="text-xs text-secondary-500">
                Higher values favor meaning similarity, lower values favor keyword matching
              </p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={semanticWeight}
                onChange={(e) => setSemanticWeight(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-medium text-secondary-700 w-12">
                {(semanticWeight * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading && results.length === 0 ? (
        <LoadingScreen message="Searching..." />
      ) : results.length === 0 && query.length >= 2 ? (
        <EmptyState
          type="search"
          title="No results found"
          message={`No notes matching "${query}" were found. Try different keywords or check your spelling.`}
        />
      ) : results.length > 0 ? (
        <>
          <p className="text-sm text-secondary-500 mb-4">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-4">
            {results.map((note) => (
              <div
                key={note._id}
                onClick={() => navigate(`/note/${note._id}`)}
                className="card p-5 cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">
                        {note.title || 'Untitled Note'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-secondary-500">
                        <ClockIcon className="w-3 h-3" />
                        {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                        {note.category && (
                          <>
                            <span>•</span>
                            <span>{note.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Similarity Score */}
                  {(note.similarityScore !== undefined || note.scores) && (
                    <div className="text-right">
                      {note.scores ? (
                        <div className="space-y-1">
                          <div className="badge-primary">
                            {(parseFloat(note.scores.total) * 100).toFixed(0)}% match
                          </div>
                          <div className="text-xs text-secondary-400">
                            S: {(parseFloat(note.scores.semantic) * 100).toFixed(0)}% | 
                            K: {(parseFloat(note.scores.keyword) * 100).toFixed(0)}%
                          </div>
                        </div>
                      ) : (
                        <div className="badge-primary">
                          {(note.similarityScore * 100).toFixed(0)}% match
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Preview */}
                <p className="text-sm text-secondary-600 line-clamp-2 ml-13">
                  {note.preview || note.content?.substring(0, 200)}
                </p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 ml-13">
                    {note.tags.slice(0, 5).map((tag, index) => (
                      <span key={index} className="badge-secondary text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
            <MagnifyingGlassIcon className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Start searching
          </h3>
          <p className="text-secondary-500 max-w-md mx-auto">
            Enter at least 2 characters to search through your notes using AI-powered semantic search.
          </p>
        </div>
      )}

      {/* Search Info */}
      <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-100">
        <h3 className="font-medium text-primary-900 mb-2 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5" />
          How AI Search Works
        </h3>
        <div className="text-sm text-secondary-600 space-y-2">
          <p>
            <strong>Semantic Search:</strong> Uses AI embeddings to understand the meaning of your query, finding notes with similar concepts even if they use different words.
          </p>
          <p>
            <strong>Keyword Search:</strong> Traditional text matching that finds exact words and phrases in your notes.
          </p>
          <p>
            <strong>Hybrid Search:</strong> Combines both methods for the best results, balancing meaning and exact matches.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Search;
