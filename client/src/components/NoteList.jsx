import { useState, useRef } from 'react';
import {
    HiOutlinePlus,
    HiOutlineStar,
    HiOutlineTrash,
    HiOutlineSortDescending,
    HiOutlineLockClosed,
} from 'react-icons/hi';

function NoteList({
    notes,
    activeNoteId,
    onNoteSelect,
    onNewNote,
    folderName,
    isTrashView,
    searchQuery,
    onDragNote,
}) {
    const [sortBy, setSortBy] = useState('updatedAt');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const dragNoteRef = useRef(null);

    // Sort notes
    const sortedNotes = [...notes].sort((a, b) => {
        if (sortBy === 'title') {
            return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'createdAt') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    const pinnedNotes = sortedNotes.filter((n) => n.isPinned);
    const unpinnedNotes = sortedNotes.filter((n) => !n.isPinned);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const oneDay = 86400000;

        if (diff < oneDay) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        }
        if (diff < 7 * oneDay) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    // Highlight search matches
    const highlightText = (text, query) => {
        if (!query || !text) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="search-highlight">{part}</mark>
            ) : (
                part
            )
        );
    };

    // Drag handlers
    const handleDragStart = (e, note) => {
        dragNoteRef.current = note._id;
        e.dataTransfer.setData('text/plain', note._id);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        dragNoteRef.current = null;
        e.currentTarget.classList.remove('dragging');
    };

    const renderNoteCard = (note) => (
        <div
            key={note._id}
            className={`note-card ${activeNoteId === note._id ? 'active' : ''} ${isTrashView ? 'trashed' : ''}`}
            onClick={() => onNoteSelect(note._id)}
            draggable={!isTrashView}
            onDragStart={(e) => handleDragStart(e, note)}
            onDragEnd={handleDragEnd}
        >
            <div className="note-card-title">
                {note.isPinned && !isTrashView && <HiOutlineStar className="pin-icon" />}
                {isTrashView && <HiOutlineTrash className="trash-card-icon" />}
                {note.isLocked && <HiOutlineLockClosed className="lock-icon" />}
                <span>{highlightText(note.title || 'New Note', searchQuery)}</span>
            </div>
            <div className="note-card-meta">
                <span className="note-card-date">{formatDate(note.updatedAt)}</span>
                {!note.isLocked && (
                    <span className="note-card-preview">
                        {highlightText(note.preview || 'No content', searchQuery)}
                    </span>
                )}
                {note.isLocked && (
                    <span className="note-card-preview locked-preview">🔒 Locked</span>
                )}
            </div>
            {note.tags && note.tags.length > 0 && (
                <div className="note-card-tags">
                    {note.tags.map((tag) => (
                        <span key={tag} className={`tag-dot tag-${tag}`} />
                    ))}
                </div>
            )}
        </div>
    );

    const sortLabel = {
        updatedAt: 'Date Modified',
        createdAt: 'Date Created',
        title: 'Title A-Z',
    };

    return (
        <div className="notelist">
            <div className="notelist-header">
                <div>
                    <h2>{folderName}</h2>
                    <span className="notelist-count">
                        {notes.length} note{notes.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="notelist-actions">
                    <div className="sort-dropdown-wrapper">
                        <button
                            className="sort-btn"
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            title={`Sort by: ${sortLabel[sortBy]}`}
                        >
                            <HiOutlineSortDescending />
                        </button>
                        {showSortMenu && (
                            <div className="sort-dropdown">
                                {Object.entries(sortLabel).map(([key, label]) => (
                                    <button
                                        key={key}
                                        className={`sort-option ${sortBy === key ? 'active' : ''}`}
                                        onClick={() => {
                                            setSortBy(key);
                                            setShowSortMenu(false);
                                        }}
                                    >
                                        {label}
                                        {sortBy === key && <span className="sort-check">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {!isTrashView && (
                        <button className="new-note-btn" onClick={onNewNote} title="New Note (Ctrl+N)">
                            <HiOutlinePlus />
                        </button>
                    )}
                </div>
            </div>

            <div className="notelist-items">
                {notes.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <div className="empty-icon">{isTrashView ? '🗑️' : '📝'}</div>
                        <h3>{isTrashView ? 'Trash is Empty' : 'No Notes'}</h3>
                        <p>
                            {isTrashView
                                ? 'Deleted notes will appear here'
                                : 'Create a new note to get started'}
                        </p>
                    </div>
                ) : (
                    <>
                        {!isTrashView && pinnedNotes.length > 0 && (
                            <>
                                <div className="notelist-section-label">
                                    <HiOutlineStar style={{ fontSize: '12px' }} /> Pinned
                                </div>
                                {pinnedNotes.map(renderNoteCard)}
                            </>
                        )}
                        {!isTrashView && unpinnedNotes.length > 0 && (
                            <>
                                {pinnedNotes.length > 0 && (
                                    <div className="notelist-section-label">Notes</div>
                                )}
                                {unpinnedNotes.map(renderNoteCard)}
                            </>
                        )}
                        {isTrashView && sortedNotes.map(renderNoteCard)}
                    </>
                )}
            </div>
        </div>
    );
}

export default NoteList;
