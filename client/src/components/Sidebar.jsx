import { useState, useEffect, useRef } from 'react';
import {
    HiOutlineDocumentText,
    HiOutlineFolder,
    HiOutlinePlus,
    HiOutlineSearch,
    HiOutlineStar,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineLogout,
    HiOutlineSun,
    HiOutlineMoon,
} from 'react-icons/hi';

// Emoji options for folder icons
const EMOJI_OPTIONS = [
    '📁', '📂', '📝', '📒', '📓', '📔', '📕', '📗', '📘', '📙',
    '💼', '🏠', '🎯', '🎨', '🎵', '🎬', '📷', '🔬', '🧪', '💡',
    '🚀', '⭐', '❤️', '🔥', '💎', '🏆', '🎁', '🌟', '🧠', '💻',
    '📱', '🌍', '✈️', '🏋️', '🍕', '☕', '📚', '🎓', '💰', '🔒',
    '🛒', '🏗️', '🎮', '🧩', '🌱', '🎤', '📌', '🔔', '💬', '📊',
];

function Sidebar({
    folders,
    activeFolder,
    onFolderSelect,
    onNewFolder,
    onRenameFolder,
    onDeleteFolder,
    totalNotes,
    searchQuery,
    onSearchChange,
    user,
    onLogout,
    onMoveNoteToFolder,
}) {
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderIcon, setNewFolderIcon] = useState('📁');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [dragOverFolder, setDragOverFolder] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('notes_theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('notes_theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    // Context menu state
    const [contextMenu, setContextMenu] = useState(null);
    const contextMenuRef = useRef(null);

    // Rename state
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    // Close context menu on outside click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            onNewFolder({ name: newFolderName.trim(), icon: newFolderIcon });
            setNewFolderName('');
            setNewFolderIcon('📁');
            setShowNewFolder(false);
            setShowEmojiPicker(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleCreateFolder();
        if (e.key === 'Escape') {
            setShowNewFolder(false);
            setShowEmojiPicker(false);
        }
    };

    const handleContextMenu = (e, folder) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, folder });
    };

    const handleStartRename = (folder) => {
        setRenamingId(folder._id);
        setRenameValue(folder.name);
        setContextMenu(null);
    };

    const handleRenameSubmit = () => {
        if (renameValue.trim() && renamingId) {
            onRenameFolder(renamingId, { name: renameValue.trim() });
        }
        setRenamingId(null);
        setRenameValue('');
    };

    const handleRenameKeyDown = (e) => {
        if (e.key === 'Enter') handleRenameSubmit();
        if (e.key === 'Escape') {
            setRenamingId(null);
            setRenameValue('');
        }
    };

    const handleDelete = (folder) => {
        setContextMenu(null);
        if (confirm(`Delete folder "${folder.name}"? Notes inside will be moved to All Notes.`)) {
            onDeleteFolder(folder._id);
        }
    };

    const handleCancelCreate = () => {
        setShowNewFolder(false);
        setShowEmojiPicker(false);
        setNewFolderName('');
        setNewFolderIcon('📁');
    };

    // Drag & drop handlers for folders
    const handleFolderDragOver = (e, folderId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverFolder(folderId);
    };

    const handleFolderDragLeave = () => {
        setDragOverFolder(null);
    };

    const handleFolderDrop = (e, folderId) => {
        e.preventDefault();
        setDragOverFolder(null);
        const noteId = e.dataTransfer.getData('text/plain');
        if (noteId && onMoveNoteToFolder) {
            onMoveNoteToFolder(noteId, folderId);
        }
    };

    // Get user initials for avatar
    const getInitials = () => {
        if (!user?.name) return '?';
        return user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="sidebar">
            {/* User profile section */}
            {user && (
                <div className="sidebar-user">
                    <div className="user-avatar">{getInitials()}</div>
                    <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-email">{user.email}</span>
                    </div>
                    <button className="logout-btn" onClick={onLogout} title="Sign Out">
                        <HiOutlineLogout />
                    </button>
                    <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                        {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
                    </button>
                </div>
            )}

            <div className="sidebar-search">
                <div className="search-wrapper">
                    <HiOutlineSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-title">iCloud</div>

                <button
                    className={`sidebar-item ${activeFolder === 'all' ? 'active' : ''} ${dragOverFolder === null && dragOverFolder !== undefined ? '' : dragOverFolder === 'all' ? 'drag-over' : ''}`}
                    onClick={() => onFolderSelect('all')}
                    onDragOver={(e) => handleFolderDragOver(e, 'all')}
                    onDragLeave={handleFolderDragLeave}
                    onDrop={(e) => handleFolderDrop(e, null)}
                >
                    <span className="icon"><HiOutlineDocumentText /></span>
                    <span className="label">All Notes</span>
                    <span className="count">{totalNotes}</span>
                </button>

                <button
                    className={`sidebar-item ${activeFolder === 'pinned' ? 'active' : ''}`}
                    onClick={() => onFolderSelect('pinned')}
                >
                    <span className="icon"><HiOutlineStar /></span>
                    <span className="label">Pinned</span>
                </button>

                <button
                    className={`sidebar-item ${activeFolder === 'trash' ? 'active' : ''}`}
                    onClick={() => onFolderSelect('trash')}
                >
                    <span className="icon trash-icon"><HiOutlineTrash /></span>
                    <span className="label">Recently Deleted</span>
                </button>
            </div>

            {folders.length > 0 && (
                <div className="sidebar-section">
                    <div className="sidebar-section-title">Folders</div>
                    {folders.map((folder) => (
                        <button
                            key={folder._id}
                            className={`sidebar-item ${activeFolder === folder._id ? 'active' : ''} ${dragOverFolder === folder._id ? 'drag-over' : ''}`}
                            onClick={() => onFolderSelect(folder._id)}
                            onContextMenu={(e) => handleContextMenu(e, folder)}
                            onDragOver={(e) => handleFolderDragOver(e, folder._id)}
                            onDragLeave={handleFolderDragLeave}
                            onDrop={(e) => handleFolderDrop(e, folder._id)}
                        >
                            <span className="icon">{folder.icon}</span>
                            {renamingId === folder._id ? (
                                <input
                                    className="rename-input"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={handleRenameKeyDown}
                                    onBlur={handleRenameSubmit}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="label">{folder.name}</span>
                            )}
                            <span className="count">{folder.noteCount || 0}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="sidebar-footer">
                {showNewFolder ? (
                    <div className="new-folder-form">
                        <div className="folder-form-row">
                            <button
                                className="emoji-picker-trigger"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                title="Choose icon"
                            >
                                {newFolderIcon}
                            </button>
                            <input
                                type="text"
                                className="folder-name-input"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Folder name"
                                autoFocus
                            />
                        </div>

                        {showEmojiPicker && (
                            <div className="emoji-grid">
                                {EMOJI_OPTIONS.map((emoji, i) => (
                                    <button
                                        key={i}
                                        className={`emoji-option ${newFolderIcon === emoji ? 'selected' : ''}`}
                                        onClick={() => {
                                            setNewFolderIcon(emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={handleCancelCreate}>
                                Cancel
                            </button>
                            <button className="modal-btn primary" onClick={handleCreateFolder}>
                                Create
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        className="new-folder-btn"
                        onClick={() => setShowNewFolder(true)}
                    >
                        <HiOutlinePlus />
                        <span>New Folder</span>
                    </button>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        className="context-menu-item"
                        onClick={() => handleStartRename(contextMenu.folder)}
                    >
                        <HiOutlinePencil /> Rename
                    </button>
                    <div className="context-menu-divider" />
                    <button
                        className="context-menu-item danger"
                        onClick={() => handleDelete(contextMenu.folder)}
                    >
                        <HiOutlineTrash /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export default Sidebar;
