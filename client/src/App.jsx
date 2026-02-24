import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import AuthPage from './components/AuthPage';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import * as api from './api';
import './App.css';

function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState('all');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [loading, setLoading] = useState(true);

  // ─── Auth ─────────────────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleAuth = async (mode, data) => {
    if (mode === 'login') {
      const result = await api.login(data);
      setUser(result.user);
    } else {
      const result = await api.register(data);
      setUser(result.user);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setNotes([]);
    setFolders([]);
    setActiveNote(null);
    setActiveNoteId(null);
    setActiveFolder('all');
  };

  // ─── Data Fetching ───────────────────────────────────

  const loadFolders = useCallback(async () => {
    try {
      const data = await api.fetchFolders();
      setFolders(data);
    } catch (err) {
      console.error('Error loading folders:', err);
    }
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      let folder = null;
      const isTrash = activeFolder === 'trash';

      if (activeFolder !== 'all' && activeFolder !== 'pinned' && activeFolder !== 'trash') {
        folder = activeFolder;
      }

      const data = await api.fetchNotes(folder, searchQuery, isTrash);

      if (activeFolder === 'pinned') {
        setNotes(data.filter((n) => n.isPinned));
      } else {
        setNotes(data);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  }, [activeFolder, searchQuery]);

  const loadActiveNote = useCallback(async (id) => {
    if (!id) {
      setActiveNote(null);
      return;
    }
    try {
      const data = await api.fetchNote(id);
      setActiveNote(data);
    } catch (err) {
      console.error('Error loading note:', err);
      setActiveNote(null);
    }
  }, []);

  // ─── Effects ─────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setLoading(true);
      await Promise.all([loadFolders(), loadNotes()]);
      setLoading(false);
    };
    init();
  }, [user]);

  useEffect(() => {
    if (user) loadNotes();
  }, [activeFolder, searchQuery]);

  useEffect(() => {
    loadActiveNote(activeNoteId);
  }, [activeNoteId]);

  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0]._id);
    } else if (notes.length === 0) {
      setActiveNoteId(null);
    }
  }, [notes]);

  // ─── Actions ─────────────────────────────────────────

  const handleNewNote = async () => {
    try {
      const folder =
        activeFolder !== 'all' && activeFolder !== 'pinned' && activeFolder !== 'trash'
          ? activeFolder
          : null;
      const newNote = await api.createNote({ folder });
      await loadNotes();
      await loadFolders();
      setActiveNoteId(newNote._id);
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const handleUpdateNote = async (id, data) => {
    try {
      setSaveStatus('saving');
      const updated = await api.updateNote(id, data);
      setActiveNote(updated);
      await loadNotes();
      await loadFolders();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error updating note:', err);
      setSaveStatus('idle');
    }
  };

  const handleTrashNote = async (id) => {
    try {
      await api.trashNote(id);
      const remainingNotes = notes.filter((n) => n._id !== id);
      setNotes(remainingNotes);
      setActiveNoteId(remainingNotes.length > 0 ? remainingNotes[0]._id : null);
      await loadFolders();
    } catch (err) {
      console.error('Error trashing note:', err);
    }
  };

  const handleRestoreNote = async (id) => {
    try {
      await api.restoreNote(id);
      await loadNotes();
      setActiveNoteId(null);
    } catch (err) {
      console.error('Error restoring note:', err);
    }
  };

  const handleDeletePermanent = async (id) => {
    try {
      await api.deleteNote(id);
      const remainingNotes = notes.filter((n) => n._id !== id);
      setNotes(remainingNotes);
      setActiveNoteId(remainingNotes.length > 0 ? remainingNotes[0]._id : null);
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handlePinNote = async (id, isPinned) => {
    await handleUpdateNote(id, { isPinned });
  };

  const handleNewFolder = async (data) => {
    try {
      await api.createFolder(data);
      await loadFolders();
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const handleRenameFolder = async (id, data) => {
    try {
      await api.updateFolder(id, data);
      await loadFolders();
    } catch (err) {
      console.error('Error renaming folder:', err);
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await api.deleteFolder(id);
      if (activeFolder === id) setActiveFolder('all');
      await loadFolders();
      await loadNotes();
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  };

  const handleFolderSelect = (folderId) => {
    setActiveFolder(folderId);
    setActiveNoteId(null);
  };

  const getFolderName = () => {
    if (activeFolder === 'all') return 'All Notes';
    if (activeFolder === 'pinned') return 'Pinned';
    if (activeFolder === 'trash') return 'Recently Deleted';
    const folder = folders.find((f) => f._id === activeFolder);
    return folder ? `${folder.icon} ${folder.name}` : 'Notes';
  };

  const isTrashView = activeFolder === 'trash';

  const handleMoveNoteToFolder = async (noteId, folderId) => {
    try {
      await api.updateNote(noteId, { folder: folderId });
      await loadNotes();
      await loadFolders();
    } catch (err) {
      console.error('Error moving note:', err);
    }
  };

  // Keyboard shortcuts — must be called before any early returns
  useKeyboardShortcuts({
    onNewNote: isTrashView ? null : handleNewNote,
    onForceSave: () => { },
    onDeleteNote: isTrashView ? handleDeletePermanent : handleTrashNote,
    onDeselectNote: () => setActiveNoteId(null),
    activeNoteId,
  });

  // ─── Render: Auth Check ──────────────────────────────

  if (authLoading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={handleAuth} />;
  }

  // ─── Render: Main App ────────────────────────────────

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }


  return (
    <div className="app">
      <Sidebar
        folders={folders}
        activeFolder={activeFolder}
        onFolderSelect={handleFolderSelect}
        onNewFolder={handleNewFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        totalNotes={notes.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        onLogout={handleLogout}
        onMoveNoteToFolder={handleMoveNoteToFolder}
      />
      <NoteList
        notes={notes}
        activeNoteId={activeNoteId}
        onNoteSelect={setActiveNoteId}
        onNewNote={handleNewNote}
        folderName={getFolderName()}
        isTrashView={isTrashView}
        searchQuery={searchQuery}
      />
      <NoteEditor
        note={activeNote}
        folders={folders}
        onUpdate={handleUpdateNote}
        onDelete={isTrashView ? handleDeletePermanent : handleTrashNote}
        onRestore={isTrashView ? handleRestoreNote : null}
        onPin={handlePinNote}
        saveStatus={saveStatus}
        isTrashView={isTrashView}
        onNoteChanged={loadNotes}
      />
    </div>
  );
}

export default App;
