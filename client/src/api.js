const API_BASE = 'http://localhost:5000/api';

// ─── Token Management ───────────────────────────────
function getToken() {
    return localStorage.getItem('notes_token');
}

function setToken(token) {
    localStorage.setItem('notes_token', token);
}

export function clearToken() {
    localStorage.removeItem('notes_token');
}

function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Auth API ────────────────────────────────────────
export async function register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    setToken(json.token);
    return json;
}

export async function login(data) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    setToken(json.token);
    return json;
}

export async function getMe() {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...authHeaders() },
    });
    if (!res.ok) {
        clearToken();
        return null;
    }
    return res.json();
}

export function logout() {
    clearToken();
}

export function isLoggedIn() {
    return !!getToken();
}

// ─── Notes API ───────────────────────────────────────
export async function fetchNotes(folder = null, search = '', trashed = false) {
    const params = new URLSearchParams();
    if (folder) params.append('folder', folder);
    if (search) params.append('search', search);
    if (trashed) params.append('trashed', 'true');
    const url = `${API_BASE}/notes${params.toString() ? '?' + params : ''}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
}

export async function fetchNote(id) {
    const res = await fetch(`${API_BASE}/notes/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch note');
    return res.json();
}

export async function createNote(data = {}) {
    const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create note');
    return res.json();
}

export async function updateNote(id, data) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update note');
    return res.json();
}

export async function trashNote(id) {
    const res = await fetch(`${API_BASE}/notes/${id}/trash`, {
        method: 'PUT',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trash note');
    return res.json();
}

export async function restoreNote(id) {
    const res = await fetch(`${API_BASE}/notes/${id}/restore`, {
        method: 'PUT',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to restore note');
    return res.json();
}

export async function deleteNote(id) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete note');
    return res.json();
}

// ─── Folders API ─────────────────────────────────────
export async function fetchFolders() {
    const res = await fetch(`${API_BASE}/folders`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch folders');
    return res.json();
}

export async function createFolder(data) {
    const res = await fetch(`${API_BASE}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create folder');
    return res.json();
}

export async function updateFolder(id, data) {
    const res = await fetch(`${API_BASE}/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update folder');
    return res.json();
}

export async function deleteFolder(id) {
    const res = await fetch(`${API_BASE}/folders/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete folder');
    return res.json();
}

// ─── Version History API ─────────────────────────────────
export async function saveVersion(noteId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}/versions`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to save version');
    return res.json();
}

export async function fetchVersions(noteId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}/versions`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
}

export async function fetchVersion(noteId, versionId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}/versions/${versionId}`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch version');
    return res.json();
}

export async function restoreVersion(noteId, versionId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}/versions/${versionId}/restore`, {
        method: 'PUT',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to restore version');
    return res.json();
}

// ─── Sharing API ─────────────────────────────────────────
export async function toggleShare(noteId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}/share`, {
        method: 'PUT',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle sharing');
    return res.json();
}

export async function fetchSharedNote(token) {
    const res = await fetch(`${API_BASE}/shared/${token}`);
    if (!res.ok) throw new Error('Shared note not found');
    return res.json();
}

