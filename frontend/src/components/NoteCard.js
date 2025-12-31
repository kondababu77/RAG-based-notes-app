import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  BookmarkIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { Menu } from '@headlessui/react';

function NoteCard({ note, onDelete, onTogglePin, onToggleArchive }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/note/${note._id}`);
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  // Get preview text
  const getPreview = (content) => {
    const maxLength = 150;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  // Get color class based on note color
  const getColorClass = (color) => {
    const colorMap = {
      '#ffffff': 'bg-white',
      '#fef3c7': 'bg-amber-50',
      '#dcfce7': 'bg-green-50',
      '#dbeafe': 'bg-blue-50',
      '#fce7f3': 'bg-pink-50',
      '#f3e8ff': 'bg-purple-50',
    };
    return colorMap[color] || 'bg-white';
  };

  return (
    <div
      onClick={handleClick}
      className={`card cursor-pointer group ${getColorClass(note.color)} hover:shadow-lg transition-all duration-200`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {note.isPinned && (
                <BookmarkSolidIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
              <h3 className="text-base font-semibold text-secondary-900 truncate">
                {note.title || 'Untitled Note'}
              </h3>
            </div>
            <p className="text-xs text-secondary-500">
              {format(new Date(note.updatedAt), 'MMM d, yyyy · h:mm a')}
            </p>
          </div>

          {/* Actions Menu */}
          <Menu as="div" className="relative">
            <Menu.Button
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 opacity-0 group-hover:opacity-100 transition-all"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-secondary-100">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => handleAction(e, () => navigate(`/note/${note._id}`))}
                      className={`${
                        active ? 'bg-secondary-50' : ''
                      } flex items-center gap-2 w-full px-4 py-2 text-sm text-secondary-700`}
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => handleAction(e, () => onTogglePin(note._id))}
                      className={`${
                        active ? 'bg-secondary-50' : ''
                      } flex items-center gap-2 w-full px-4 py-2 text-sm text-secondary-700`}
                    >
                      <BookmarkIcon className="w-4 h-4" />
                      {note.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => handleAction(e, () => onToggleArchive(note._id))}
                      className={`${
                        active ? 'bg-secondary-50' : ''
                      } flex items-center gap-2 w-full px-4 py-2 text-sm text-secondary-700`}
                    >
                      <ArchiveBoxIcon className="w-4 h-4" />
                      {note.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                  )}
                </Menu.Item>
              </div>
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={(e) => handleAction(e, () => onDelete(note._id))}
                      className={`${
                        active ? 'bg-red-50' : ''
                      } flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600`}
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>

        {/* Content Preview */}
        <p className="text-sm text-secondary-600 leading-relaxed mb-4">
          {getPreview(note.content)}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {note.tags?.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="badge-secondary text-xs"
              >
                {tag}
              </span>
            ))}
            {note.tags?.length > 3 && (
              <span className="text-xs text-secondary-400">
                +{note.tags.length - 3} more
              </span>
            )}
          </div>

          {/* Category */}
          {note.category && note.category !== 'General' && (
            <span className="badge-primary text-xs">
              {note.category}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-secondary-100 text-xs text-secondary-400">
          <span>{note.metadata?.wordCount || 0} words</span>
          <span>·</span>
          <span>{note.metadata?.readingTime || 1} min read</span>
          {note.hasEmbedding && (
            <>
              <span>·</span>
              <span className="text-primary-500">AI Ready</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteCard;
