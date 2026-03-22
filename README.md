# ✏️ Papyr

A modern, full-featured note-taking app built with React + Node.js + MongoDB.

![Dark Theme](https://img.shields.io/badge/Theme-Dark%20%2F%20Light-yellow)
![JWT Auth](https://img.shields.io/badge/Auth-JWT-blue)
![MongoDB](https://img.shields.io/badge/DB-MongoDB-green)

## ✨ Features

### Core
- **JWT Authentication** — Secure register/login with token-based auth
- **Rich Text Editor** — Bold, italic, underline, strikethrough, headings, quotes, lists
- **Folders** — Organize notes with custom emoji icons
- **Pin & Trash** — Pin important notes, soft-delete with recovery
- **Search** — Full-text search with result highlighting
- **Keyboard Shortcuts** — `Ctrl+N` new note, `Ctrl+S` save, `Del` delete

### Advanced
- **Color Tags** — 7-color tagging system for note categorization
- **Note Locking** — Lock notes to prevent accidental edits
- **Export** — Download notes as `.txt`, `.md`, or `.html`
- **Image Embedding** — Paste from clipboard or pick files
- **Drag & Drop** — Move notes between folders via drag-and-drop

### Premium
- **Version History** — Save snapshots, preview old versions, restore
- **Note Sharing** — Generate public links to share notes
- **Dark / Light Theme** — Toggle with localStorage persistence
- **3D UI Effects** — Neumorphic inputs, 3D buttons, card lift animations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Setup

```bash
# Clone
git clone https://github.com/m-sohel/notes.git
cd notes

# Install dependencies
npm install
cd client && npm install && cd ..

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/papyr` |
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | JWT signing secret | — |

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Styling | Vanilla CSS with CSS Variables |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| Icons | react-icons |

## 📁 Project Structure

```
notes/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Sidebar, NoteList, NoteEditor, AuthPage
│   │   ├── hooks/       # useKeyboardShortcuts
│   │   ├── api.js       # API client
│   │   └── index.css    # Design system
│   └── index.html
├── server/              # Express backend
│   ├── models/          # User, Note, Folder, Version
│   ├── routes/          # auth, notes, folders, shared
│   ├── middleware/       # authMiddleware
│   └── index.js         # Server entry
└── package.json         # Root scripts (concurrently)
```


