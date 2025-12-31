import React from 'react';
import { DocumentTextIcon, FolderIcon, HashtagIcon } from '@heroicons/react/24/outline';

function EmptyState({ type = 'notes', title, message, action }) {
  const configs = {
    notes: {
      icon: DocumentTextIcon,
      defaultTitle: 'No notes yet',
      defaultMessage: 'Create your first note to get started with AI-powered note management.',
    },
    search: {
      icon: FolderIcon,
      defaultTitle: 'No results found',
      defaultMessage: 'Try adjusting your search query or filters to find what you\'re looking for.',
    },
    category: {
      icon: FolderIcon,
      defaultTitle: 'No notes in this category',
      defaultMessage: 'Notes you add to this category will appear here.',
    },
    tags: {
      icon: HashtagIcon,
      defaultTitle: 'No tags found',
      defaultMessage: 'Add tags to your notes to organize them better.',
    },
  };

  const config = configs[type] || configs.notes;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-secondary-100 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-secondary-400" />
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
        {title || config.defaultTitle}
      </h3>
      <p className="text-secondary-500 max-w-md mb-6">
        {message || config.defaultMessage}
      </p>
      {action}
    </div>
  );
}

export default EmptyState;
