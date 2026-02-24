import { useEffect } from 'react';

/**
 * Global keyboard shortcuts for the Notes app.
 *
 * Shortcuts:
 *   Ctrl+N          → New note
 *   Ctrl+S          → Force save (prevent browser save dialog)
 *   Ctrl+Shift+D    → Delete/trash current note
 *   Escape          → Deselect current note
 *   Ctrl+Shift+/    → Toggle shortcut help overlay (future)
 */
export default function useKeyboardShortcuts({
    onNewNote,
    onForceSave,
    onDeleteNote,
    onDeselectNote,
    activeNoteId,
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isCtrl = e.ctrlKey || e.metaKey;

            // Ctrl+N — New note
            if (isCtrl && e.key === 'n') {
                e.preventDefault();
                onNewNote?.();
                return;
            }

            // Ctrl+S — Force save (prevent browser dialog)
            if (isCtrl && e.key === 's') {
                e.preventDefault();
                onForceSave?.();
                return;
            }

            // Ctrl+Shift+D — Delete/trash note
            if (isCtrl && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                if (activeNoteId) {
                    onDeleteNote?.(activeNoteId);
                }
                return;
            }

            // Escape — Deselect note
            if (e.key === 'Escape') {
                // Don't deselect if user is typing in an input/textarea
                const tag = document.activeElement?.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA') return;
                onDeselectNote?.();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNewNote, onForceSave, onDeleteNote, onDeselectNote, activeNoteId]);
}
