import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { notesAPI } from '../services/api';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  notes: [],
  currentNote: null,
  loading: false,
  error: null,
  stats: null,
  categories: [],
  tags: [],
  pagination: {
    current: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {
    category: null,
    tag: null,
    archived: false,
    pinned: null,
  },
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_NOTES: 'SET_NOTES',
  SET_CURRENT_NOTE: 'SET_CURRENT_NOTE',
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  SET_STATS: 'SET_STATS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_TAGS: 'SET_TAGS',
  SET_PAGINATION: 'SET_PAGINATION',
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
function notesReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ACTIONS.SET_NOTES:
      return { ...state, notes: action.payload, loading: false };
    
    case ACTIONS.SET_CURRENT_NOTE:
      return { ...state, currentNote: action.payload };
    
    case ACTIONS.ADD_NOTE:
      return { 
        ...state, 
        notes: [action.payload, ...state.notes],
        loading: false 
      };
    
    case ACTIONS.UPDATE_NOTE:
      return {
        ...state,
        notes: state.notes.map(note =>
          note._id === action.payload._id ? action.payload : note
        ),
        currentNote: state.currentNote?._id === action.payload._id 
          ? action.payload 
          : state.currentNote,
        loading: false,
      };
    
    case ACTIONS.DELETE_NOTE:
      return {
        ...state,
        notes: state.notes.filter(note => note._id !== action.payload),
        currentNote: state.currentNote?._id === action.payload ? null : state.currentNote,
        loading: false,
      };
    
    case ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };
    
    case ACTIONS.SET_CATEGORIES:
      return { ...state, categories: action.payload };
    
    case ACTIONS.SET_TAGS:
      return { ...state, tags: action.payload };
    
    case ACTIONS.SET_PAGINATION:
      return { ...state, pagination: { ...state.pagination, ...action.payload } };
    
    case ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    default:
      return state;
  }
}

// Create context
const NotesContext = createContext(null);

// Provider component
export function NotesProvider({ children }) {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  // Fetch all notes
  const fetchNotes = useCallback(async (params = {}) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await notesAPI.getAll({
        ...state.filters,
        ...params,
      });
      dispatch({ type: ACTIONS.SET_NOTES, payload: response.data.data });
      dispatch({ type: ACTIONS.SET_PAGINATION, payload: response.data.pagination });
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      toast.error('Failed to fetch notes');
    }
  }, [state.filters]);

  // Fetch single note
  const fetchNote = useCallback(async (id) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await notesAPI.getById(id);
      dispatch({ type: ACTIONS.SET_CURRENT_NOTE, payload: response.data.data });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      return response.data.data;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      toast.error('Failed to fetch note');
      return null;
    }
  }, []);

  // Create note
  const createNote = useCallback(async (data) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await notesAPI.create(data);
      dispatch({ type: ACTIONS.ADD_NOTE, payload: response.data.data });
      toast.success('Note created successfully');
      return response.data.data;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      toast.error('Failed to create note');
      return null;
    }
  }, []);

  // Update note
  const updateNote = useCallback(async (id, data) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const response = await notesAPI.update(id, data);
      dispatch({ type: ACTIONS.UPDATE_NOTE, payload: response.data.data });
      toast.success('Note updated successfully');
      return response.data.data;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      toast.error('Failed to update note');
      return null;
    }
  }, []);

  // Delete note
  const deleteNote = useCallback(async (id) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      await notesAPI.delete(id);
      dispatch({ type: ACTIONS.DELETE_NOTE, payload: id });
      toast.success('Note deleted successfully');
      return true;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      toast.error('Failed to delete note');
      return false;
    }
  }, []);

  // Toggle pin
  const togglePin = useCallback(async (id) => {
    try {
      const response = await notesAPI.togglePin(id);
      dispatch({ type: ACTIONS.UPDATE_NOTE, payload: response.data.data });
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to toggle pin');
    }
  }, []);

  // Toggle archive
  const toggleArchive = useCallback(async (id) => {
    try {
      const response = await notesAPI.toggleArchive(id);
      dispatch({ type: ACTIONS.UPDATE_NOTE, payload: response.data.data });
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to toggle archive');
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await notesAPI.getStats();
      dispatch({ type: ACTIONS.SET_STATS, payload: response.data.data });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await notesAPI.getCategories();
      dispatch({ type: ACTIONS.SET_CATEGORIES, payload: response.data.data });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const response = await notesAPI.getTags();
      dispatch({ type: ACTIONS.SET_TAGS, payload: response.data.data });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }, []);

  // Set filters
  const setFilters = useCallback((filters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  // Clear current note
  const clearCurrentNote = useCallback(() => {
    dispatch({ type: ACTIONS.SET_CURRENT_NOTE, payload: null });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    ...state,
    fetchNotes,
    fetchNote,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    fetchStats,
    fetchCategories,
    fetchTags,
    setFilters,
    clearCurrentNote,
    clearError,
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

// Custom hook to use notes context
export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}

export default NotesContext;
