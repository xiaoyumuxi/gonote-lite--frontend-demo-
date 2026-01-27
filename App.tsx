import React, { useState, useEffect } from 'react';
import { Plus, Search, LogOut, ChevronRight, FileText, Settings, Menu, X, MoreHorizontal, Layout, Hash } from 'lucide-react';
import { Note, Folder as FolderType, User } from './types';
import Editor from './components/Editor';
// ... (removed ArchitectureGuide import)

// Mock Data
const INITIAL_FOLDERS: FolderType[] = [
  { id: '1', name: 'Personal', icon: '👤' },
  { id: '2', name: 'Work', icon: '💼' },
  { id: '3', name: 'Ideas', icon: '💡' },
];

const INITIAL_NOTE: Note = {
  id: 'welcome-note',
  title: 'Welcome to GoNote',
  content: `# Welcome to GoNote

This is a **lightweight**, *fast* Markdown note-taking application inspired by the clean aesthetics of Notion.

## Features 🚀

### 1. Collaboration (New!)
- [x] **@Mentions**: Type '@' to tag someone. Try it: @Alice
- [x] **Comments**: Select text, Right Click -> Comment.
- [x] **Sharing**: Click 'Share' top right to generate links.

### 2. Powerful Editing
> "Simplicity is the ultimate sophistication." - Leonardo da Vinci

Use the toolbar or right-click context menu to format your text.

## Code Example

\`\`\`go
package main
import "fmt"
func main() {
    fmt.Println("Hello, collaborative world!")
}
\`\`\`
`,
  folderId: '1',
  attachments: [],
  comments: [
    { id: 'c1', userId: 'u2', username: 'Alice', content: 'Love this new design!', quotedText: 'clean aesthetics of Notion', createdAt: Date.now() - 100000 }
  ],
  shareConfig: { isShared: true, permission: 'read', url: 'https://gonote.app/s/demo123' },
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const INITIAL_NOTE_2: Note = {
  id: 'ideas-note',
  title: 'Project Roadmap',
  content: `# Project Roadmap

Reference from [[Welcome to GoNote]]

### Phase 1: Core
- [ ] SQLite Integration
- [ ] File Uploads

### Phase 2: Design
- [x] Notion-like UI
- [x] Better Typography
`,
  folderId: '3',
  attachments: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // App Data State
  const [folders, setFolders] = useState<FolderType[]>(INITIAL_FOLDERS);
  const [notes, setNotes] = useState<Note[]>([INITIAL_NOTE, INITIAL_NOTE_2]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(INITIAL_NOTE.id);
  const [activeFolderId, setActiveFolderId] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  // Removed showArchGuide state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('gonote_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      // In a real app, verify credentials with API
      const newUser = { id: 'u1', username, token: 'mock-token', avatarColor: 'bg-blue-600' };
      localStorage.setItem('gonote_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      // In a real app, call Registration API
      alert(`Mock Registration Successful for ${username}`);
      const newUser = { id: Date.now().toString(), username, token: 'mock-token', avatarColor: 'bg-green-600' };
      localStorage.setItem('gonote_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gonote_user');
    setUser(null);
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      folderId: activeFolderId,
      attachments: [],
      comments: [],
      shareConfig: { isShared: false, permission: 'read' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    if (window.innerWidth < 768) setIsMobileMenuOpen(false);
  };

  const updateNote = (updatedNote: Note) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    if (activeNoteId === noteId) {
      const remainingInFolder = updatedNotes.filter(n => n.folderId === activeFolderId);
      setActiveNoteId(remainingInFolder.length > 0 ? remainingInFolder[0].id : null);
    }
  };

  const handleNavigate = (noteId: string) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (targetNote) {
      setActiveFolderId(targetNote.folderId);
      setActiveNoteId(noteId);
      if (window.innerWidth < 768) setIsMobileMenuOpen(false);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.folderId === activeFolderId &&
    (n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  if (loading) return null;

  // --- Login Screen (Simplified) ---
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-white p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-notion-text text-white rounded-xl mx-auto flex items-center justify-center mb-6 shadow-xl">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-notion-text tracking-tight">GoNote</h1>
            <p className="text-notion-dim mt-2">{isRegistering ? 'Create your account' : 'Sign in to continue'}</p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-notion-sidebar border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-dim/20 transition-all placeholder:text-notion-dim/50"
              placeholder="Username"
            />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-notion-sidebar border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-dim/20 transition-all placeholder:text-notion-dim/50"
              placeholder="Password"
            />
            <button
              type="submit"
              className="w-full bg-notion-text hover:bg-black text-white font-medium py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isRegistering ? 'Sign Up' : 'Continue'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-notion-dim hover:text-notion-text hover:underline transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main App ---
  return (
    <div className="flex h-screen w-full bg-notion-bg text-notion-text overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Notion Style */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-notion-sidebar border-r border-notion-border transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Workspace Switcher / Profile */}
        <div className="px-4 py-4 flex items-center justify-between shrink-0 hover:bg-notion-hover m-2 rounded-lg cursor-pointer transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-notion-dim/20 text-notion-text flex items-center justify-center font-bold text-xs">
              {user.username[0].toUpperCase()}
            </div>
            <span className="font-medium text-sm truncate">{user.username}'s GoNote</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onClick={handleLogout} title="Logout" className="p-1 hover:bg-notion-dim/20 rounded">
              <LogOut className="w-4 h-4 text-notion-dim" />
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="px-3 mb-2 space-y-1">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-notion-dim" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-transparent rounded-md text-sm text-notion-text placeholder:text-notion-dim/70 focus:bg-white focus:shadow-sm focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={handleCreateNote}
            className="w-full flex items-center gap-3 px-3 py-1.5 text-sm text-notion-dim hover:bg-notion-hover hover:text-notion-text rounded-md transition-colors"
          >
            <div className="w-4 h-4 bg-notion-dim/20 rounded-full flex items-center justify-center"><Plus className="w-3 h-3 text-notion-text" /></div>
            New Page
          </button>
        </div>

        {/* Folders Section */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="mb-4">
            <h3 className="px-3 text-xs font-semibold text-notion-dim mb-1 uppercase tracking-wider">Private</h3>
            {folders.map(folder => (
              <div key={folder.id} className="mb-1">
                <button
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors group ${activeFolderId === folder.id
                    ? 'bg-notion-hover font-medium text-notion-text'
                    : 'text-notion-text/80 hover:bg-notion-hover'
                    }`}
                >
                  <span className="opacity-70">{folder.icon || <ChevronRight className="w-4 h-4" />}</span>
                  {folder.name}
                </button>

                {/* Nested Notes for Active Folder (Simplified Tree View) */}
                {activeFolderId === folder.id && (
                  <div className="ml-2 pl-2 border-l border-notion-border mt-1 space-y-0.5">
                    {filteredNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => {
                          setActiveNoteId(note.id);
                          if (window.innerWidth < 768) setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors truncate ${activeNoteId === note.id
                          ? 'bg-white shadow-sm text-notion-text font-medium'
                          : 'text-notion-text/70 hover:bg-notion-hover'
                          }`}
                      >
                        <FileText className="w-3.5 h-3.5 opacity-50 shrink-0" />
                        <span className="truncate">{note.title || 'Untitled'}</span>
                      </button>
                    ))}
                    {filteredNotes.length === 0 && (
                      <div className="px-3 py-1 text-xs text-notion-dim italic">No pages inside</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white md:rounded-tl-xl md:shadow-[-2px_0_10px_rgba(0,0,0,0.02)] border-l border-transparent md:border-notion-border">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-notion-border bg-white sticky top-0 z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-notion-text">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm truncate">{activeNote?.title || 'GoNote'}</span>
          <button onClick={handleCreateNote} className="p-2 -mr-2 text-notion-text"><Plus className="w-5 h-5" /></button>
        </div>

        <Editor
          note={activeNote}
          notes={notes}
          onUpdate={updateNote}
          onNavigate={handleNavigate}
          onDelete={handleDeleteNote}
          currentUser={user}
        />
      </div>
    </div>
  );
};

export default App;
