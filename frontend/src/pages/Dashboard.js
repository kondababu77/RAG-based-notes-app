import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArchiveBoxIcon,
  BookmarkIcon,
  ChartBarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useNotes } from '../context/NotesContext';
import NoteCard from '../components/NoteCard';
import { LoadingScreen } from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

function Dashboard() {
  const navigate = useNavigate();
  const {
    notes,
    loading,
    stats,
    categories,
    filters,
    fetchNotes,
    fetchStats,
    fetchCategories,
    deleteNote,
    togglePin,
    toggleArchive,
    setFilters,
  } = useNotes();

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, noteId: null });
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchNotes({ archived: showArchived });
    fetchStats();
    fetchCategories();
  }, [fetchNotes, fetchStats, fetchCategories, showArchived]);

  const handleDelete = async () => {
    if (deleteConfirm.noteId) {
      await deleteNote(deleteConfirm.noteId);
      setDeleteConfirm({ open: false, noteId: null });
    }
  };

  const handleCategoryFilter = (category) => {
    setFilters({ category: category === filters.category ? null : category });
    fetchNotes({ category: category === filters.category ? null : category, archived: showArchived });
  };

  // Separate pinned and unpinned notes
  const pinnedNotes = notes.filter(note => note.isPinned);
  const unpinnedNotes = notes.filter(note => !note.isPinned);

  // Filter by category if selected
  const filteredPinned = filters.category 
    ? pinnedNotes.filter(note => note.category === filters.category)
    : pinnedNotes;
  const filteredUnpinned = filters.category
    ? unpinnedNotes.filter(note => note.category === filters.category)
    : unpinnedNotes;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {showArchived ? 'Archived Notes' : 'My Notes'}
          </h1>
          <p className="text-secondary-500 mt-1">
            {showArchived 
              ? 'View and restore your archived notes'
              : 'Manage your notes with AI-powered assistance'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`btn ${showArchived ? 'btn-primary' : 'btn-secondary'}`}
          >
            <ArchiveBoxIcon className="w-5 h-5 mr-2" />
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
          <button
            onClick={() => navigate('/note/new')}
            className="btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Note
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!showArchived && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-900">
                  {stats.overview?.totalNotes || 0}
                </p>
                <p className="text-sm text-secondary-500">Total Notes</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <BookmarkIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-900">
                  {stats.overview?.pinnedNotes || 0}
                </p>
                <p className="text-sm text-secondary-500">Pinned</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-900">
                  {stats.overview?.totalWords?.toLocaleString() || 0}
                </p>
                <p className="text-sm text-secondary-500">Total Words</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-900">
                  {notes.filter(n => n.hasEmbedding).length}
                </p>
                <p className="text-sm text-secondary-500">AI-Indexed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <FunnelIcon className="w-5 h-5 text-secondary-400 flex-shrink-0" />
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`badge ${!filters.category ? 'badge-primary' : 'badge-secondary'} cursor-pointer hover:opacity-80`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryFilter(category)}
              className={`badge ${filters.category === category ? 'badge-primary' : 'badge-secondary'} cursor-pointer hover:opacity-80`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && notes.length === 0 ? (
        <LoadingScreen message="Loading your notes..." />
      ) : notes.length === 0 ? (
        <EmptyState
          type="notes"
          action={
            !showArchived && (
              <button onClick={() => navigate('/note/new')} className="btn-primary">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Note
              </button>
            )
          }
        />
      ) : (
        <>
          {/* Pinned Notes */}
          {filteredPinned.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <BookmarkIcon className="w-5 h-5 text-amber-500" />
                Pinned
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPinned.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onDelete={(id) => setDeleteConfirm({ open: true, noteId: id })}
                    onTogglePin={togglePin}
                    onToggleArchive={toggleArchive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes */}
          {filteredUnpinned.length > 0 && (
            <div>
              {filteredPinned.length > 0 && (
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                  {showArchived ? 'Archived' : 'Other Notes'}
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnpinned.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onDelete={(id) => setDeleteConfirm({ open: true, noteId: id })}
                    onTogglePin={togglePin}
                    onToggleArchive={toggleArchive}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, noteId: null })}
        onConfirm={handleDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}

export default Dashboard;
