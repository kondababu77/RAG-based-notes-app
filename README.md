# AI-Powered Notes Application

## 🤖 MERN Stack with Retrieval-Augmented Generation (RAG)

A full-stack intelligent notes management system that combines the power of the MERN stack with AI capabilities using Retrieval-Augmented Generation (RAG). This application provides context-aware summarization, personalized Q&A from your notes, and semantic search functionality.

![AI Notes App](https://img.shields.io/badge/AI-Powered-blue) ![MERN Stack](https://img.shields.io/badge/Stack-MERN-green) ![RAG](https://img.shields.io/badge/RAG-Enabled-purple)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [How RAG Works](#-how-rag-works)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Future Enhancements](#-future-enhancements)

---

## ✨ Features

### Core Notes Features
- ✅ Create, edit, and delete notes
- ✅ Rich text editing with Markdown support
- ✅ Pin important notes
- ✅ Archive notes
- ✅ Categorize notes with tags
- ✅ Color-coded notes
- ✅ Full-text search

### AI Features (RAG-Powered)
- 🤖 **Context-aware Q&A** - Ask questions about your notes
- 📝 **Smart Summarization** - Generate concise summaries
- 🏷️ **Auto Title Generation** - AI-suggested titles
- 🔍 **Semantic Search** - Find notes by meaning, not just keywords
- 💡 **Key Points Extraction** - Extract main ideas
- 🧠 **AI Insights** - Discover patterns in your notes
- 🔗 **Related Notes** - Find semantically similar notes

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React.js | UI Framework |
| Tailwind CSS | Styling |
| React Router | Navigation |
| Axios | HTTP Client |
| React Hot Toast | Notifications |
| HeadlessUI | UI Components |
| Heroicons | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| Winston | Logging |
| Helmet | Security |

### AI & RAG Components
| Technology | Purpose |
|------------|---------|
| Transformers.js | Embedding Generation |
| all-MiniLM-L6-v2 | Embedding Model |
| In-Memory Vector Store | Vector Database |
| OpenAI GPT | LLM for Generation |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React.js)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │  Dashboard  │ │ Note Editor │ │    AI Assistant        │ │
│  │   - List    │ │   - Edit    │ │  - Chat               │ │
│  │   - Filter  │ │   - Tags    │ │  - Q&A                │ │
│  │   - Stats   │ │   - AI Help │ │  - Insights           │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ REST API
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                       │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                       Routes                             ││
│  │  /api/notes    /api/ai    /api/search                   ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │                     Controllers                          ││
│  │  notesController  aiController  searchController        ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │                      Services                            ││
│  │  embeddingService  vectorStore  llmService              ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌──────────┐      ┌───────────────┐      ┌──────────┐
    │ MongoDB  │      │ Vector Store  │      │  OpenAI  │
    │ (Notes)  │      │ (Embeddings)  │      │   API    │
    └──────────┘      └───────────────┘      └──────────┘
```

---

## 🔄 How RAG Works

### Step 1: Note Creation & Indexing
```
User creates note → Store in MongoDB → Generate embedding → Store in Vector DB
```

### Step 2: Query Processing
```
User asks question → Generate query embedding → Find similar notes → Retrieve context
```

### Step 3: Response Generation
```
Query + Retrieved Notes → LLM Prompt → AI generates response → Return to user
```

### RAG vs Traditional AI

| Aspect | Traditional AI | RAG |
|--------|---------------|-----|
| Uses user data | ❌ No | ✅ Yes |
| Accuracy | Low | High |
| Personalization | ❌ | ✅ |
| Hallucinations | High | Reduced |
| Context-awareness | ❌ | ✅ |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB 6.0+ (local or Atlas)
- NVIDIA API Key ([Get one here](https://build.nvidia.com/))

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Ai-Notes-App
```

2. **Run setup script**
```bash
npm run setup
```

3. **Configure environment**
```bash
cd backend
cp .env.example .env
# Edit .env and add your OpenAI API key
```

4. **Install dependencies**
```bash
npm run install:all
```

5. **Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
```

6. **Start the application**
```bash
npm run dev
```

7. **Open your browser**
```
Frontend: http://localhost:3000
Backend:  http://localhost:5000
```

---

## 🐳 Production Deployment

### Option 1: Docker (Recommended)

1. **Configure production environment**
```bash
# Create production .env file
cp backend/.env.example backend/.env
# Edit with production values (see Configuration section)
```

2. **Build and run with Docker Compose**
```bash
# Start all services
npm run docker:up

# Or build first, then run
npm run docker:build
docker-compose up -d
```

3. **With nginx reverse proxy (production)**
```bash
docker-compose --profile production up -d
```

4. **View logs**
```bash
npm run docker:logs
```

5. **Stop services**
```bash
npm run docker:down
```

### Option 2: Manual Deployment

1. **Build the frontend**
```bash
npm run build
```

2. **Set environment variables**
```bash
export NODE_ENV=production
```

3. **Start the production server**
```bash
npm start
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| backend | 5000 | Express API & static frontend |
| mongodb | 27017 | MongoDB database |
| nginx | 80/443 | Reverse proxy (production profile) |

### Health Checks

- Backend: `GET /health`
- MongoDB: Built-in Docker healthcheck

---

## ⚙️ Configuration

### Environment Variables (backend/.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ai-notes-app

# NVIDIA AI API Configuration
NVIDIA_API_KEY=your_nvidia_api_key_here
NVIDIA_API_URL=https://integrate.api.nvidia.com/v1

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Vector Store Configuration
VECTOR_STORE_PATH=./data/faiss_index
TOP_K_RESULTS=5

# LLM Configuration
LLM_MODEL=meta/llama-3.1-8b-instruct
LLM_MAX_TOKENS=1000
LLM_TEMPERATURE=0.7
EMBEDDING_MODEL=nvidia/nv-embedqa-e5-v5
EMBEDDING_DIMENSIONS=1024
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `NVIDIA_API_KEY` | Your NVIDIA API key |
| `JWT_SECRET` | Secret key for JWT (min 32 characters) |

### Security Recommendations for Production

- Use a strong, random `JWT_SECRET` (64+ characters)
- Enable HTTPS with SSL certificates
- Use MongoDB Atlas or secured MongoDB instance
- Set `NODE_ENV=production`
- Configure proper CORS origins

---

## 📡 API Documentation

### Notes API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all notes |
| GET | `/api/notes/:id` | Get single note |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |
| PATCH | `/api/notes/:id/pin` | Toggle pin |
| PATCH | `/api/notes/:id/archive` | Toggle archive |
| GET | `/api/notes/stats` | Get statistics |
| GET | `/api/notes/categories` | Get categories |
| GET | `/api/notes/tags` | Get all tags |

### AI API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/ask` | Ask AI a question (RAG) |
| POST | `/api/ai/summarize` | Summarize content |
| POST | `/api/ai/generate-title` | Generate title |
| POST | `/api/ai/explain` | Explain in simple terms |
| POST | `/api/ai/key-points` | Extract key points |
| POST | `/api/ai/chat` | Chat with AI |
| GET | `/api/ai/insights` | Get AI insights |
| GET | `/api/ai/related/:noteId` | Get related notes |

### Search API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/semantic` | Semantic search |
| GET | `/api/search/keyword` | Keyword search |
| GET | `/api/search/hybrid` | Hybrid search |
| GET | `/api/search/suggestions` | Search suggestions |
| POST | `/api/search/reindex` | Reindex all notes |

---

## 📁 Project Structure

```
Ai-Notes-App/
├── backend/
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── controllers/
│   │   ├── aiController.js     # AI operations
│   │   ├── notesController.js  # Notes CRUD
│   │   └── searchController.js # Search operations
│   ├── middleware/
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validators.js       # Request validation
│   ├── models/
│   │   ├── Note.js             # Note schema
│   │   └── Embedding.js        # Embedding schema
│   ├── routes/
│   │   ├── ai.js               # AI routes
│   │   ├── notes.js            # Notes routes
│   │   └── search.js           # Search routes
│   ├── services/
│   │   ├── embeddingService.js # Embedding generation
│   │   ├── llmService.js       # LLM integration
│   │   └── vectorStore.js      # Vector database
│   ├── utils/
│   │   └── logger.js           # Winston logger
│   ├── server.js               # Express server
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js       # Main layout
│   │   │   ├── NoteCard.js     # Note card component
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── ConfirmDialog.js
│   │   │   └── EmptyState.js
│   │   ├── context/
│   │   │   └── NotesContext.js # State management
│   │   ├── pages/
│   │   │   ├── Dashboard.js    # Notes list
│   │   │   ├── NoteEditor.js   # Edit/Create note
│   │   │   ├── AIAssistant.js  # AI chat
│   │   │   └── Search.js       # Search page
│   │   ├── services/
│   │   │   └── api.js          # API client
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css           # Tailwind styles
│   ├── tailwind.config.js
│   └── package.json
├── scripts/
│   └── setup.js                # Setup script
├── package.json                # Root package.json
└── README.md
```

---

## 🔮 Future Enhancements

- [x] User authentication (JWT)
- [x] Multi-user support
- [ ] Voice-based notes
- [ ] Mobile application
- [ ] Offline embeddings update
- [x] Role-based access control
- [ ] Note collaboration
- [ ] Export to PDF/Markdown
- [ ] Dark mode
- [ ] Browser extension

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## ⭐ Resume-Ready One-Line

> Developed an AI-powered notes application using MERN stack integrated with Retrieval-Augmented Generation (RAG) for context-aware summarization and personalized knowledge retrieval.

---

## 🙏 Acknowledgments

- [NVIDIA AI](https://build.nvidia.com/) for LLM and Embeddings API
- [Tailwind CSS](https://tailwindcss.com) for styling
- [MongoDB](https://mongodb.com) for database

---

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth with httpOnly cookies
- **Rate Limiting**: Tiered rate limits (general, auth, AI endpoints)
- **Input Sanitization**: NoSQL injection prevention with mongo-sanitize
- **Security Headers**: Helmet.js with CSP
- **CORS**: Configurable origin restrictions
- **HPP**: HTTP Parameter Pollution prevention

---

Made with ❤️ using MERN Stack and NVIDIA AI
