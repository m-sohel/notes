import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import {
    HiOutlineStar,
    HiOutlineTrash,
    HiOutlineFolder,
    HiOutlineRefresh,
    HiOutlineLockClosed,
    HiOutlineLockOpen,
    HiOutlineDownload,
    HiOutlineTag,
    HiOutlineShare,
    HiOutlineClock,
    HiOutlineClipboard,
    HiOutlineXCircle,
} from 'react-icons/hi';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiStrikethrough,
    BiListUl,
    BiListOl,
    BiCheckSquare,
    BiImage,
} from 'react-icons/bi';
import { LuHeading1, LuHeading2, LuQuote } from 'react-icons/lu';
import * as api from '../api';

const TAG_COLORS = [
    { name: 'red', color: '#ff453a' },
    { name: 'orange', color: '#ff9f0a' },
    { name: 'yellow', color: '#ffd60a' },
    { name: 'green', color: '#30d158' },
    { name: 'blue', color: '#0a84ff' },
    { name: 'purple', color: '#bf5af2' },
    { name: 'pink', color: '#ff375f' },
];

function NoteEditor({
    note,
    folders,
    onUpdate,
    onDelete,
    onRestore,
    onPin,
    saveStatus,
    isTrashView,
    onNoteChanged,
}) {
    const contentRef = useRef(null);
    const titleRef = useRef(null);
    const [title, setTitle] = useState('');
    const debounceRef = useRef(null);
    const [contentText, setContentText] = useState('');
    const [showTagPicker, setShowTagPicker] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showVersionPanel, setShowVersionPanel] = useState(false);
    const [versions, setVersions] = useState([]);
    const [previewVersion, setPreviewVersion] = useState(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef(null);

    // Sync title when note changes
    useEffect(() => {
        if (note) {
            setTitle(note.title || '');
            if (contentRef.current && note.content !== undefined) {
                contentRef.current.innerHTML = note.content || '';
                setContentText(contentRef.current.innerText || '');
            }
        }
        setShowTagPicker(false);
        setShowExportMenu(false);
        setShowVersionPanel(false);
        setPreviewVersion(null);
        setCopied(false);
    }, [note?._id]);

    // Word / character count
    const wordCount = useMemo(() => {
        const text = contentText.trim();
        if (!text) return { words: 0, chars: 0, readTime: '0 min' };
        const words = text.split(/\s+/).filter(Boolean).length;
        const chars = text.length;
        const minutes = Math.max(1, Math.ceil(words / 200));
        return { words, chars, readTime: `${minutes} min read` };
    }, [contentText]);

    // Debounced save
    const debouncedSave = useCallback(
        (data) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                onUpdate(note._id, data);
            }, 800);
        },
        [note?._id, onUpdate]
    );

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        debouncedSave({ title: newTitle });
    };

    const handleContentChange = () => {
        if (contentRef.current) {
            const content = contentRef.current.innerHTML;
            setContentText(contentRef.current.innerText || '');
            debouncedSave({ content });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
        }
    };

    const execFormat = (command, value = null) => {
        document.execCommand(command, false, value);
        contentRef.current?.focus();
    };

    const insertChecklist = () => {
        const html = '<div class="checklist-item"><span class="checkbox" contenteditable="false">☐</span> <span>Task item</span></div>';
        document.execCommand('insertHTML', false, html);
        contentRef.current?.focus();
        setTimeout(() => handleContentChange(), 50);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                insertImageFile(file);
                return;
            }
        }
    };

    const insertImageFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = `< img src = "${e.target.result}" style = "max-width:100%;border-radius:8px;margin:8px 0;" /> `;
            document.execCommand('insertHTML', false, img);
            setTimeout(() => handleContentChange(), 50);
        };
        reader.readAsDataURL(file);
    };

    const handleImageClick = () => fileInputRef.current?.click();

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) insertImageFile(file);
        e.target.value = '';
    };

    const handleContentClick = (e) => {
        const target = e.target;
        if (target.classList.contains('checkbox')) {
            e.preventDefault();
            if (target.classList.contains('checked')) {
                target.classList.remove('checked');
                target.textContent = '☐';
            } else {
                target.classList.add('checked');
                target.textContent = '☑';
            }
            setTimeout(() => handleContentChange(), 50);
        }
    };

    const handleFolderChange = (e) => {
        onUpdate(note._id, { folder: e.target.value || null });
    };

    const toggleTag = (tagName) => {
        const tags = note.tags || [];
        const newTags = tags.includes(tagName) ? tags.filter((t) => t !== tagName) : [...tags, tagName];
        onUpdate(note._id, { tags: newTags });
    };

    const toggleLock = () => onUpdate(note._id, { isLocked: !note.isLocked });

    // ─── Version History ───────────────────────
    const loadVersions = async () => {
        try {
            const v = await api.fetchVersions(note._id);
            setVersions(v);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveVersion = async () => {
        try {
            await api.saveVersion(note._id);
            await loadVersions();
        } catch (err) {
            console.error(err);
        }
    };

    const handlePreviewVersion = async (versionId) => {
        try {
            const v = await api.fetchVersion(note._id, versionId);
            setPreviewVersion(v);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRestoreVersion = async (versionId) => {
        try {
            await api.restoreVersion(note._id, versionId);
            setPreviewVersion(null);
            onNoteChanged?.();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleVersionPanel = () => {
        if (!showVersionPanel) loadVersions();
        setShowVersionPanel(!showVersionPanel);
        setPreviewVersion(null);
    };

    // ─── Sharing ───────────────────────────────
    const handleToggleShare = async () => {
        setShareLoading(true);
        try {
            const updated = await api.toggleShare(note._id);
            onNoteChanged?.();
        } catch (err) {
            console.error(err);
        }
        setShareLoading(false);
    };

    const copyShareLink = () => {
        const link = `${window.location.origin} /shared/${note.shareToken} `;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ─── Export ────────────────────────────────
    const exportAsText = () => {
        const text = `${note.title || 'Untitled'} \n${'='.repeat(40)} \n\n${contentText} `;
        downloadFile(text, `${note.title || 'note'}.txt`, 'text/plain');
        setShowExportMenu(false);
    };

    const exportAsMarkdown = () => {
        let md = `# ${note.title || 'Untitled'} \n\n`;
        let content = note.content || '';
        content = content.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
        content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
        content = content.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        content = content.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
        content = content.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
        content = content.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
        content = content.replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__');
        content = content.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
        content = content.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');
        content = content.replace(/<br\s*\/?>/gi, '\n');
        content = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
        content = content.replace(/<[^>]*>/g, '');
        content = content.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        md += content.trim();
        downloadFile(md, `${note.title || 'note'}.md`, 'text/markdown');
        setShowExportMenu(false);
    };

    const exportAsHTML = () => {
        const html = `< !DOCTYPE html >
    <html><head><meta charset="utf-8"><title>${note.title || 'Note'}</title>
        <style>body{font - family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#333;line-height:1.6}h1{border - bottom:2px solid #eee;padding-bottom:10px}img{max - width:100%;border-radius:8px}</style>
    </head><body><h1>${note.title || 'Untitled'}</h1>${note.content || ''}</body></html>`;
        downloadFile(html, `${note.title || 'note'}.html`, 'text/html');
        setShowExportMenu(false);
    };

    const downloadFile = (content, filename, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatFullDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true,
        });

    const formatShortDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
        });

    /* ═══════════ RENDERS ═══════════ */

    if (!note) {
        return (
            <div className="editor">
                <div className="empty-state">
                    <div className="empty-icon">✏️</div>
                    <h3>No Note Selected</h3>
                    <p>Select a note from the list or create a new one to start editing</p>
                </div>
            </div>
        );
    }

    const currentFolder = folders.find((f) => f._id === note.folder);

    // Trash view
    if (isTrashView) {
        return (
            <div className="editor">
                <div className="trash-banner">
                    <span>🗑️ This note is in the trash</span>
                    <div className="trash-banner-actions">
                        {onRestore && (
                            <button className="trash-btn restore" onClick={() => onRestore(note._id)}>
                                <HiOutlineRefresh /> Restore
                            </button>
                        )}
                        <button
                            className="trash-btn delete-permanent"
                            onClick={() => {
                                if (confirm('Permanently delete this note? This cannot be undone.')) onDelete(note._id);
                            }}
                        >
                            <HiOutlineTrash /> Delete Forever
                        </button>
                    </div>
                </div>
                <div className="editor-meta"><span>{formatFullDate(note.updatedAt)}</span></div>
                <div className="editor-title">
                    <input type="text" placeholder="Title" value={note.title || ''} readOnly className="readonly" />
                </div>
                <div className="editor-content">
                    <div ref={contentRef} className="content-editable readonly" dangerouslySetInnerHTML={{ __html: note.content || '' }} />
                </div>
            </div>
        );
    }

    // Locked view
    if (note.isLocked) {
        return (
            <div className="editor">
                <div className="locked-banner">
                    <div className="locked-icon">🔒</div>
                    <h3>This Note is Locked</h3>
                    <p>Unlock to view and edit this note's content</p>
                    <button className="unlock-btn" onClick={toggleLock}>
                        <HiOutlineLockOpen /> Unlock Note
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="editor">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

            {/* Toolbar */}
            <div className="editor-toolbar">
                <div className="toolbar-group">
                    <button className="toolbar-btn" onClick={() => execFormat('bold')} title="Bold (Ctrl+B)"><BiBold /></button>
                    <button className="toolbar-btn" onClick={() => execFormat('italic')} title="Italic (Ctrl+I)"><BiItalic /></button>
                    <button className="toolbar-btn" onClick={() => execFormat('underline')} title="Underline (Ctrl+U)"><BiUnderline /></button>
                    <button className="toolbar-btn" onClick={() => execFormat('strikeThrough')} title="Strikethrough"><BiStrikethrough /></button>
                </div>
                <div className="toolbar-group">
                    <button className="toolbar-btn" onClick={() => execFormat('formatBlock', 'h1')} title="Heading 1"><LuHeading1 /></button>
                    <button className="toolbar-btn" onClick={() => execFormat('formatBlock', 'h2')} title="Heading 2"><LuHeading2 /></button>
                    <button className="toolbar-btn" onClick={() => execFormat('formatBlock', 'blockquote')} title="Quote"><LuQuote /></button>
                </div>
                <div className="toolbar-group">
                    <button className="toolbar-btn" onClick={() => execFormat('insertUnorderedList')} title="Bullet List"><BiListUl /></button>
                    <button className="toolbar-btn" onClick={() => execFormat('insertOrderedList')} title="Numbered List"><BiListOl /></button>
                    <button className="toolbar-btn" onClick={insertChecklist} title="Checklist"><BiCheckSquare /></button>
                    <button className="toolbar-btn" onClick={handleImageClick} title="Insert Image"><BiImage /></button>
                </div>

                <div className="toolbar-spacer" />

                <div className={`save - indicator ${saveStatus} `}>
                    <span className="save-dot" />
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'saved' && 'Saved'}
                </div>

                <div className="toolbar-actions">
                    <select className="folder-select" value={note.folder || ''} onChange={handleFolderChange} title="Move to folder">
                        <option value="">No Folder</option>
                        {folders.map((f) => (<option key={f._id} value={f._id}>{f.icon} {f.name}</option>))}
                    </select>

                    {/* Tags */}
                    <div className="tag-picker-wrapper">
                        <button className={`toolbar - btn ${(note.tags || []).length > 0 ? 'active' : ''} `} onClick={() => setShowTagPicker(!showTagPicker)} title="Color Tags"><HiOutlineTag /></button>
                        {showTagPicker && (
                            <div className="tag-picker-dropdown">
                                <div className="tag-picker-title">Color Tags</div>
                                <div className="tag-picker-grid">
                                    {TAG_COLORS.map((tag) => (
                                        <button key={tag.name} className={`tag - picker - item ${(note.tags || []).includes(tag.name) ? 'selected' : ''} `} style={{ '--tag-color': tag.color }} onClick={() => toggleTag(tag.name)} title={tag.name}>
                                            <span className="tag-picker-dot" />
                                            {(note.tags || []).includes(tag.name) && <span className="tag-check">✓</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Version history */}
                    <button className={`toolbar - btn ${showVersionPanel ? 'active' : ''} `} onClick={toggleVersionPanel} title="Version History"><HiOutlineClock /></button>

                    {/* Share */}
                    <button className={`toolbar - btn ${note.isShared ? 'active' : ''} `} onClick={handleToggleShare} disabled={shareLoading} title={note.isShared ? 'Disable sharing' : 'Enable sharing'}>
                        <HiOutlineShare />
                    </button>

                    <button className="toolbar-btn" onClick={toggleLock} title="Lock Note"><HiOutlineLockClosed /></button>

                    {/* Export */}
                    <div className="export-wrapper">
                        <button className="toolbar-btn" onClick={() => setShowExportMenu(!showExportMenu)} title="Export Note"><HiOutlineDownload /></button>
                        {showExportMenu && (
                            <div className="export-dropdown">
                                <button className="export-option" onClick={exportAsText}>📄 Plain Text (.txt)</button>
                                <button className="export-option" onClick={exportAsMarkdown}>📝 Markdown (.md)</button>
                                <button className="export-option" onClick={exportAsHTML}>🌐 HTML (.html)</button>
                            </div>
                        )}
                    </div>

                    <button className={`toolbar - btn ${note.isPinned ? 'active' : ''} `} onClick={() => onPin(note._id, !note.isPinned)} title={note.isPinned ? 'Unpin' : 'Pin'}><HiOutlineStar /></button>
                    <button className="toolbar-btn danger" onClick={() => onDelete(note._id)} title="Move to Trash"><HiOutlineTrash /></button>
                </div>
            </div>

            {/* Share banner */}
            {note.isShared && note.shareToken && (
                <div className="share-banner">
                    <HiOutlineShare />
                    <span>Shared via link</span>
                    <button className="copy-link-btn" onClick={copyShareLink}>
                        <HiOutlineClipboard /> {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
            )}

            {/* Active tags */}
            {(note.tags || []).length > 0 && (
                <div className="active-tags-bar">
                    {(note.tags || []).map((tag) => {
                        const info = TAG_COLORS.find((t) => t.name === tag);
                        return (
                            <span key={tag} className="active-tag-pill" style={{ '--tag-color': info?.color }} onClick={() => toggleTag(tag)}>
                                <span className="tag-pill-dot" />{tag}<span className="tag-pill-x">×</span>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Meta */}
            <div className="editor-meta">
                <span>{formatFullDate(note.updatedAt)}</span>
                {currentFolder && (<span className="folder-badge"><HiOutlineFolder /> {currentFolder.name}</span>)}
            </div>

            {/* Title */}
            <div className="editor-title">
                <input ref={titleRef} type="text" placeholder="Title" value={title} onChange={handleTitleChange} />
            </div>

            {/* Content area with optional version panel */}
            <div className="editor-body">
                <div className="editor-content">
                    {previewVersion ? (
                        <div className="version-preview">
                            <div className="version-preview-header">
                                <span>Previewing Version {previewVersion.versionNumber}</span>
                                <button onClick={() => setPreviewVersion(null)}><HiOutlineXCircle /> Close</button>
                            </div>
                            <div className="content-editable readonly" dangerouslySetInnerHTML={{ __html: previewVersion.content || '' }} />
                        </div>
                    ) : (
                        <div
                            ref={contentRef}
                            className="content-editable"
                            contentEditable
                            onInput={handleContentChange}
                            onKeyDown={handleKeyDown}
                            onClick={handleContentClick}
                            onPaste={handlePaste}
                            suppressContentEditableWarning
                        />
                    )}
                </div>

                {/* Version history panel */}
                {showVersionPanel && (
                    <div className="version-panel">
                        <div className="version-panel-header">
                            <h4>Version History</h4>
                            <button className="version-save-btn" onClick={handleSaveVersion}>Save Snapshot</button>
                        </div>
                        <div className="version-list">
                            {versions.length === 0 ? (
                                <div className="version-empty">
                                    <p>No versions saved yet</p>
                                    <small>Click "Save Snapshot" to save the current state</small>
                                </div>
                            ) : (
                                versions.map((v) => (
                                    <div key={v._id} className={`version - item ${previewVersion?._id === v._id ? 'active' : ''} `}>
                                        <div className="version-info">
                                            <span className="version-number">v{v.versionNumber}</span>
                                            <span className="version-title">{v.title || 'Untitled'}</span>
                                            <span className="version-date">{formatShortDate(v.createdAt)}</span>
                                        </div>
                                        <div className="version-actions">
                                            <button onClick={() => handlePreviewVersion(v._id)}>Preview</button>
                                            <button className="restore" onClick={() => handleRestoreVersion(v._id)}>Restore</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="editor-footer">
                <span className="word-count">{wordCount.words} words</span>
                <span className="char-count">{wordCount.chars} characters</span>
                <span className="read-time">{wordCount.readTime}</span>
            </div>
        </div>
    );
}

export default NoteEditor;
