import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  SparklesIcon,
  BookmarkIcon,
  TrashIcon,
  TagIcon,
  FolderIcon,
  ClockIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { useNotes } from '../context/NotesContext';
import { aiAPI } from '../services/api';
import { LoadingScreen, LoadingDots } from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

// Color options for notes
const colorOptions = [
  { value: '#ffffff', label: 'White', class: 'bg-white' },
  { value: '#fef3c7', label: 'Yellow', class: 'bg-amber-100' },
  { value: '#dcfce7', label: 'Green', class: 'bg-green-100' },
  { value: '#dbeafe', label: 'Blue', class: 'bg-blue-100' },
  { value: '#fce7f3', label: 'Pink', class: 'bg-pink-100' },
  { value: '#f3e8ff', label: 'Purple', class: 'bg-purple-100' },
];

function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    currentNote, 
    categories,
    fetchNote, 
    createNote, 
    updateNote, 
    deleteNote,
    togglePin,
    fetchCategories,
    clearCurrentNote 
  } = useNotes();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    category: 'General',
    color: '#ffffff',
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({
    title: null,
    summary: null,
    keyPoints: null,
  });

  const isEditing = Boolean(id);

  // Fetch note if editing
  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchNote(id).then(() => setLoading(false));
    } else {
      clearCurrentNote();
    }
    fetchCategories();
    
    return () => clearCurrentNote();
  }, [id, fetchNote, fetchCategories, clearCurrentNote]);

  // Update form when note is loaded
  useEffect(() => {
    if (currentNote && isEditing) {
      setFormData({
        title: currentNote.title || '',
        content: currentNote.content || '',
        tags: currentNote.tags || [],
        category: currentNote.category || 'General',
        color: currentNote.color || '#ffffff',
      });
      setAiSuggestions({
        title: currentNote.aiGenerated?.suggestedTitle || null,
        summary: currentNote.aiGenerated?.summary || null,
        keyPoints: null,
      });
    }
  }, [currentNote, isEditing]);

  // Track changes
  useEffect(() => {
    if (isEditing && currentNote) {
      const changed = 
        formData.title !== (currentNote.title || '') ||
        formData.content !== (currentNote.content || '') ||
        formData.category !== (currentNote.category || 'General') ||
        formData.color !== (currentNote.color || '#ffffff') ||
        JSON.stringify(formData.tags) !== JSON.stringify(currentNote.tags || []);
      setHasChanges(changed);
    } else if (!isEditing) {
      setHasChanges(formData.content.length > 0);
    }
  }, [formData, currentNote, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!formData.content.trim()) {
      toast.error('Note content is required');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateNote(id, formData);
      } else {
        const newNote = await createNote(formData);
        if (newNote) {
          navigate(`/note/${newNote._id}`, { replace: true });
        }
      }
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const success = await deleteNote(id);
    if (success) {
      navigate('/');
    }
  };

  const handleTogglePin = async () => {
    if (isEditing && currentNote) {
      await togglePin(id);
    }
  };

  // AI Features
  const generateTitle = async () => {
    if (!formData.content.trim()) {
      toast.error('Add some content first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await aiAPI.generateTitle(formData.content);
      setAiSuggestions(prev => ({ ...prev, title: response.data.data.title }));
      toast.success('Title suggestion generated!');
    } catch (error) {
      toast.error('Failed to generate title');
    } finally {
      setAiLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!formData.content.trim()) {
      toast.error('Add some content first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await aiAPI.summarize({ content: formData.content });
      setAiSuggestions(prev => ({ ...prev, summary: response.data.data.summary }));
      toast.success('Summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setAiLoading(false);
    }
  };

  const extractKeyPoints = async () => {
    if (!formData.content.trim()) {
      toast.error('Add some content first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await aiAPI.extractKeyPoints({ content: formData.content });
      setAiSuggestions(prev => ({ ...prev, keyPoints: response.data.data.keyPoints }));
      toast.success('Key points extracted!');
    } catch (error) {
      toast.error('Failed to extract key points');
    } finally {
      setAiLoading(false);
    }
  };

  const applyTitle = () => {
    if (aiSuggestions.title) {
      setFormData(prev => ({ ...prev, title: aiSuggestions.title }));
      setAiSuggestions(prev => ({ ...prev, title: null }));
      toast.success('Title applied!');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading note..." />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-secondary-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-secondary-900">
                  {isEditing ? 'Edit Note' : 'New Note'}
                </h1>
                {isEditing && currentNote && (
                  <p className="text-xs text-secondary-500 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Last updated {format(new Date(currentNote.updatedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isEditing && (
                <>
                  <button
                    onClick={handleTogglePin}
                    className={`p-2 rounded-lg transition-colors ${
                      currentNote?.isPinned 
                        ? 'text-amber-500 bg-amber-50' 
                        : 'text-secondary-400 hover:bg-secondary-100'
                    }`}
                  >
                    {currentNote?.isPinned ? (
                      <BookmarkSolidIcon className="w-5 h-5" />
                    ) : (
                      <BookmarkIcon className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="btn-primary"
              >
                {saving ? <LoadingDots /> : isEditing ? 'Save Changes' : 'Create Note'}
              </button>
            </div>
          </div>
        </header>

        {/* Editor Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Title Input */}
            <div>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Note title..."
                className="w-full text-2xl font-bold border-0 border-b border-transparent focus:border-primary-500 focus:ring-0 p-0 pb-2 placeholder-secondary-300 bg-transparent"
              />
            </div>

            {/* Content Textarea */}
            <div>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Start writing your note..."
                rows={20}
                className="w-full border-0 focus:ring-0 p-0 resize-none text-secondary-700 leading-relaxed placeholder-secondary-300 bg-transparent"
              />
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-secondary-200">
              {/* Category */}
              <div>
                <label className="label flex items-center gap-2">
                  <FolderIcon className="w-4 h-4" />
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Ideas">Ideas</option>
                  <option value="Study">Study</option>
                  <option value="Research">Research</option>
                  {categories
                    .filter(c => !['General', 'Work', 'Personal', 'Ideas', 'Study', 'Research'].includes(c))
                    .map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  }
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="label flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4" />
                  Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${color.class} ${
                        formData.color === color.value 
                          ? 'border-primary-500 ring-2 ring-primary-200' 
                          : 'border-secondary-200 hover:border-secondary-300'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className="label flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="badge-primary flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add a tag..."
                    className="input flex-1"
                  />
                  <button onClick={handleAddTag} className="btn-secondary">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Sidebar */}
      <aside className="w-80 border-l border-secondary-200 bg-secondary-50 flex flex-col">
        <div className="p-4 border-b border-secondary-200 bg-white">
          <h2 className="font-semibold text-secondary-900 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary-600" />
            AI Assistant
          </h2>
          <p className="text-xs text-secondary-500 mt-1">
            Get AI-powered suggestions for your note
          </p>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Generate Title */}
          <div className="card p-4">
            <h3 className="font-medium text-secondary-900 mb-2">Generate Title</h3>
            <p className="text-xs text-secondary-500 mb-3">
              Let AI suggest a title based on your content
            </p>
            <button
              onClick={generateTitle}
              disabled={aiLoading || !formData.content.trim()}
              className="btn-secondary w-full text-sm"
            >
              {aiLoading ? <LoadingDots /> : 'Generate Title'}
            </button>
            {aiSuggestions.title && (
              <div className="mt-3 p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-900 font-medium mb-2">
                  {aiSuggestions.title}
                </p>
                <button
                  onClick={applyTitle}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Apply this title →
                </button>
              </div>
            )}
          </div>

          {/* Generate Summary */}
          <div className="card p-4">
            <h3 className="font-medium text-secondary-900 mb-2">Summarize</h3>
            <p className="text-xs text-secondary-500 mb-3">
              Get a concise summary of your note
            </p>
            <button
              onClick={generateSummary}
              disabled={aiLoading || !formData.content.trim()}
              className="btn-secondary w-full text-sm"
            >
              {aiLoading ? <LoadingDots /> : 'Generate Summary'}
            </button>
            {aiSuggestions.summary && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-900">
                  {aiSuggestions.summary}
                </p>
              </div>
            )}
          </div>

          {/* Extract Key Points */}
          <div className="card p-4">
            <h3 className="font-medium text-secondary-900 mb-2">Key Points</h3>
            <p className="text-xs text-secondary-500 mb-3">
              Extract the main points from your note
            </p>
            <button
              onClick={extractKeyPoints}
              disabled={aiLoading || !formData.content.trim()}
              className="btn-secondary w-full text-sm"
            >
              {aiLoading ? <LoadingDots /> : 'Extract Key Points'}
            </button>
            {aiSuggestions.keyPoints && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                <ul className="text-sm text-amber-900 space-y-1">
                  {aiSuggestions.keyPoints.map((point, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-amber-600">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Note Stats */}
          {formData.content && (
            <div className="card p-4">
              <h3 className="font-medium text-secondary-900 mb-3">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Words</span>
                  <span className="font-medium">
                    {formData.content.trim().split(/\s+/).filter(w => w).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Characters</span>
                  <span className="font-medium">{formData.content.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Reading Time</span>
                  <span className="font-medium">
                    {Math.ceil(formData.content.trim().split(/\s+/).filter(w => w).length / 200)} min
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}

export default NoteEditor;
