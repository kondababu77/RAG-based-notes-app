// MongoDB initialization script
// Creates application user with appropriate permissions

db = db.getSiblingDB('ai-notes-app');

db.createUser({
  user: 'appuser',
  pwd: 'apppassword', // Change in production via environment variable
  roles: [
    {
      role: 'readWrite',
      db: 'ai-notes-app'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.notes.createIndex({ user: 1, createdAt: -1 });
db.notes.createIndex({ user: 1, isArchived: 1 });
db.notes.createIndex({ user: 1, category: 1 });
db.notes.createIndex({ user: 1, tags: 1 });
db.notes.createIndex({ user: 1, isPinned: -1, updatedAt: -1 });
db.notes.createIndex(
  { title: 'text', content: 'text' },
  { weights: { title: 10, content: 5 }, name: 'notes_text_search' }
);

db.embeddings.createIndex({ noteId: 1 }, { unique: true });

print('Database initialized successfully');
