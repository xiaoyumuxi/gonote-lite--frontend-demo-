import React, { useState, useEffect } from 'react';
import { Plus, Search, LogOut, ChevronRight, FileText, Settings, Menu, X, MoreHorizontal, Layout, Hash, Home, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { Note, Folder as FolderType, User, CalendarEvent, AppNotification } from './types';
import Editor from './components/Editor';

// Mock Data
const INITIAL_FOLDERS: FolderType[] = [
  { id: '1', name: 'Personal', icon: '👤' },
  { id: '2', name: 'Work', icon: '💼' },
  { id: '3', name: 'Ideas', icon: '💡' },
  { id: '4', name: 'Family Shared', icon: '🏠' }, // New Family Folder
];

const INITIAL_NOTE_FAMILY: Note = {
  id: 'family-passwords',
  title: 'Family Accounts & Passwords (Shared)',
  content: `# 🔐 Family Shared Accounts

> **IMPORTANT**: This document is strictly shared within our family group. Do not share this link publicly!

## 📶 Wi-Fi
**SSID**: OurHome_5G
**Password**: \`HappyFamily2026!\`

## 📺 Streaming Services
### Netflix
*   **Email**: family@gmail.com
*   **Password**: \`Movies4Life!\`
*   **Profiles**:
    *   Dad (PIN: 1234)
    *   Mom (PIN: 5678)
    *   Kids (Restrictions On)

### Spotify Family
*   **Manager**: Mom
*   **Address**: 123 Maple Street

## 🏦 Utility Accounts
| Service | Account # | Login |
| :--- | :--- | :--- |
| **Electricity** | 9988-7766 | user: dad / pass: \`PowerOn!\` |
| **Water** | 5544-3322 | user: mom / pass: \`WaterFlow!\` |
| **Internet** | 1122-3344 | user: fam / pass: \`FastNet!\` |

## 🏥 Emergency Contacts
*   **Grandma**: 555-0101
*   **Dr. Smith (Pediatrician)**: 555-0202
*   **Plumber (Joe)**: 555-0303
`,
  folderId: '4',
  attachments: [],
  comments: [],
  shareConfig: {
    isPublic: false, // STRICTLY PRIVATE
    publicPermission: 'read',
    collaborators: [
      { userId: 'u2', username: 'Mom', avatarColor: 'bg-green-500', permission: 'edit' },
      { userId: 'u3', username: 'Sis', avatarColor: 'bg-yellow-500', permission: 'read' }
    ]
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const INITIAL_NOTE: Note = {
  id: 'welcome-note',
  title: 'Welcome to GoNote',
  content: `# Welcome to GoNote
// ... (rest of content)`,
  folderId: '1',
  attachments: [],
  comments: [
    { id: 'c1', userId: 'u2', username: 'Alice', content: 'Love this new design!', quotedText: 'clean aesthetics of Notion', createdAt: Date.now() - 100000 }
  ],
  shareConfig: {
    isPublic: true,
    publicPermission: 'read',
    url: 'https://gonote.app/s/demo123',
    collaborators: [
      { userId: 'u2', username: 'Alice', avatarColor: 'bg-green-500', permission: 'edit' }
    ]
  },
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

  // State (Mock Data)
  const [folders, setFolders] = useState<FolderType[]>(INITIAL_FOLDERS);
  const [notes, setNotes] = useState<Note[]>([INITIAL_NOTE, INITIAL_NOTE_2, INITIAL_NOTE_FAMILY]);
  const [activeFolderId, setActiveFolderId] = useState<string>('1');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Removed showArchGuide state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Calendar State
  const [view, setView] = useState<'notes' | 'calendar'>('notes');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'n1', userId: 'u1', title: 'Dad\'s Birthday', message: 'Coming up in 3 days!', isRead: false, createdAt: Date.now(), type: 'reminder' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: 'e1', title: 'Weekly Family Dinner', date: Date.now(), type: 'solar', recurrence: 'weekly', notifyUsers: ['u1', 'u2'], showCountdown: true }
  ]);

  // Calendar Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const [currentDate, setCurrentDate] = useState(new Date());

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const dayCells = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      dayCells.push(<div key={`empty-${i}`} className="min-h-[120px] bg-notion-sidebar/10 border-b border-r border-notion-border/50"></div>);
    }

    // Day cells
    for (let d = 1; d <= days; d++) {
      const dateTs = new Date(year, month, d).getTime();
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
      const dayEvents = events.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getDate() === d && eDate.getMonth() === month && eDate.getFullYear() === year;
      });

      dayCells.push(
        <div key={d} className="min-h-[120px] bg-white border-b border-r border-notion-border/50 p-1 relative hover:bg-notion-hover/50 transition-colors group">
          <div className="flex justify-between items-start p-1">
            <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-red-500 text-white' : 'text-notion-dim/80'}`}>{d}</span>
            <button
              className="opacity-0 group-hover:opacity-100 hover:bg-notion-hover p-0.5 rounded text-notion-dim transition-all"
              onClick={() => setShowAddEvent(true)}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 mt-1 px-1">
            {dayEvents.map(ev => (
              <div key={ev.id} className="flex items-center gap-1.5 px-1.5 py-1 bg-white hover:bg-notion-sidebar border border-notion-border/60 shadow-sm rounded-[3px] cursor-pointer transition-all">
                <div className={`w-1.5 h-1.5 rounded-full ${ev.type === 'lunar' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                <span className="text-xs font-medium text-notion-text truncate flex-1">{ev.title}</span>
                {ev.showCountdown && <span className="text-[10px] text-notion-dim tabular-nums">3d</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-notion-border sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-notion-text flex items-center gap-2">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1 ml-4 bg-white border border-notion-border rounded-md shadow-sm">
              <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 hover:bg-notion-hover text-notion-text rounded-l-md border-r border-notion-border"><ChevronRight className="w-4 h-4 rotate-180" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="text-xs font-medium px-3 text-notion-text hover:bg-notion-hover">Today</button>
              <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 hover:bg-notion-hover text-notion-text rounded-r-md border-l border-notion-border"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-notion-dim flex items-center gap-1.5 px-2 py-1 bg-notion-sidebar/50 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Solar
            </span>
            <span className="text-xs text-notion-dim flex items-center gap-1.5 px-2 py-1 bg-notion-sidebar/50 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Lunar
            </span>
          </div>
        </div>

        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 border-b border-notion-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 pl-2 text-xs font-medium text-notion-dim/60 border-r border-notion-border/50 last:border-r-0">{day}</div>
          ))}
        </div>

        {/* Calendar Scroll Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-7 auto-rows-fr border-l border-notion-border/50">
            {dayCells}
          </div>
        </div>
      </div>
    );
  };

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
      shareConfig: { isPublic: false, publicPermission: 'read', collaborators: [] },
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
  // Main Render
  return (
    <div className="flex h-screen bg-white text-notion-text font-sans antialiased overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 bg-notion-sidebar border-r border-notion-border w-64 transform transition-transform duration-300 ease-in-out z-30
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col
      `}>
        {/* Workspace Switcher / Profile */}
        <div className="px-4 py-4 flex items-center justify-between shrink-0 hover:bg-notion-hover m-2 rounded-lg cursor-pointer transition-colors group">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-md ${user?.avatarColor || 'bg-notion-text'} text-white flex items-center justify-center text-xs font-bold`}>{user?.username[0].toUpperCase()}</div>
            <span className="font-medium text-sm truncate max-w-[120px]">{user?.username}'s GoNote</span>
          </div>
          <div className="flex gap-1">
            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-1 hover:bg-notion-dim/20 rounded relative">
                <Bell className="w-4 h-4 text-notion-dim" />
                {notifications.some(n => !n.isRead) && <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-notion-sidebar" />}
              </button>
              {showNotifications && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-notion-border rounded-lg shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 origin-top-left">
                  <h3 className="text-xs font-semibold text-notion-dim mb-2 uppercase px-2">Notifications</h3>
                  {notifications.map(n => (
                    <div key={n.id} className="p-2 hover:bg-notion-hover rounded cursor-pointer">
                      <p className="text-sm font-medium text-notion-text">{n.title}</p>
                      <p className="text-xs text-notion-dim">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleLogout} title="Logout" className="p-1 hover:bg-notion-dim/20 rounded"><LogOut className="w-4 h-4 text-notion-dim" /></button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          <div
            onClick={() => { setView('calendar'); setIsMobileMenuOpen(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors group ${view === 'calendar' ? 'bg-notion-hover text-notion-text font-medium' : 'text-notion-dim hover:bg-notion-hover hover:text-notion-text'}`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="truncate">Calendar & Reminders</span>
          </div>

          <div className="my-4 px-3 text-xs font-semibold text-notion-dim/60 uppercase tracking-wider">Note Folders</div>

          {folders.map(folder => (
            <div
              key={folder.id}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors group ${folder.id === activeFolderId && view === 'notes' ? 'bg-notion-hover text-notion-text font-medium' : 'text-notion-dim hover:bg-notion-hover hover:text-notion-text'}`}
              onClick={() => { setActiveFolderId(folder.id); setView('notes'); setIsMobileMenuOpen(false); }}
            >
              <div className="flex items-center justify-center w-5 h-5 text-lg opacity-80 group-hover:opacity-100 transition-opacity">{folder.icon}</div>
              <span className="truncate flex-1">{folder.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {view === 'calendar' ? renderCalendar() : (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-white">
          {/* Sidebar List (Notes List) - Only visible on MD+ or when no note active on Mobile */}
          <div className={`
              ${activeNoteId ? 'hidden md:flex' : 'flex'} 
              flex-col w-full md:w-64 lg:w-72 bg-notion-sidebar border-r border-notion-border h-full shrink-0 relative
            `}>
            {/* ... (Existing Note List UI) ... */}
            <div className="p-4 border-b border-notion-border sticky top-0 bg-notion-sidebar z-10">
              <div className="relative group">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-notion-dim group-hover:text-notion-text transition-colors" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-notion-dim/10 hover:bg-notion-dim/20 focus:bg-white border border-transparent focus:border-blue-400/50 rounded text-sm py-2 pl-9 pr-4 transition-all focus:outline-none placeholder:text-notion-dim/60"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  className={`group p-3 rounded-lg cursor-pointer transition-all border border-transparent ${activeNoteId === note.id ? 'bg-white shadow-sm border-notion-border/50' : 'hover:bg-notion-hover'}`}
                  onClick={() => handleNavigate(note.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className={`w-4 h-4 ${activeNoteId === note.id ? 'text-notion-text' : 'text-notion-dim group-hover:text-notion-text'}`} />
                    <h3 className={`text-sm font-medium truncate ${activeNoteId === note.id ? 'text-notion-text' : 'text-notion-text/80'}`}>{note.title || 'Untitled'}</h3>
                  </div>
                  <p className="text-xs text-notion-dim truncate pl-6 opacity-80">{note.content.substring(0, 50).replace(/[#*`]/g, '') || 'No content'}</p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-notion-border bg-notion-sidebar sticky bottom-0">
              <button
                onClick={handleCreateNote}
                className="w-full flex items-center justify-center gap-2 bg-notion-text hover:bg-black text-white py-2 rounded shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Page</span>
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className={`${!activeNoteId ? 'hidden md:flex' : 'flex'} flex-1 h-full bg-white relative`}>
            {activeNoteId ? (
              <>
                <div className="md:hidden absolute top-4 left-4 z-20">
                  <button onClick={() => setActiveNoteId(null)} className="p-2 bg-white rounded-full shadow-md border border-notion-border text-notion-text"><ChevronRight className="w-5 h-5 rotate-180" /></button>
                </div>
                <Editor
                  key={activeNoteId}
                  note={activeNote}
                  notes={notes}
                  onUpdate={updateNote}
                  onDelete={handleDeleteNote}
                  onNavigate={handleNavigate}
                  currentUser={user}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-notion-dim p-8 text-center animate-fade-in">
                <div className="w-16 h-16 bg-notion-sidebar rounded-full flex items-center justify-center mb-4"><Layout className="w-8 h-8 opacity-50" /></div>
                <p className="text-lg font-medium">Ready to write?</p>
                <p className="text-sm mt-2 opacity-70">Select a page or create a new one to get started.</p>
              </div>
            )}
          </div>
        </div>)}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add Family Event</h3>
              <button onClick={() => setShowAddEvent(false)} className="p-1 hover:bg-notion-hover rounded"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-notion-dim uppercase tracking-wider mb-1">Title</label>
                <input type="text" placeholder="e.g., Mom's Birthday" className="w-full border border-notion-border rounded p-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-notion-dim uppercase tracking-wider mb-1">Date Type</label>
                  <select className="w-full border border-notion-border rounded p-2 bg-white">
                    <option value="solar">Solar (公历)</option>
                    <option value="lunar">Lunar (农历)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-notion-dim uppercase tracking-wider mb-1">Time</label>
                  <input type="time" className="w-full border border-notion-border rounded p-2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-notion-dim uppercase tracking-wider mb-1">Recurrence</label>
                <select className="w-full border border-notion-border rounded p-2 bg-white">
                  <option value="none">One-time</option>
                  <option value="yearly">Yearly (e.g. Birthday)</option>
                  <option value="monthly">Monthly (e.g. Bills)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-notion-sidebar rounded-lg">
                <span className="text-sm font-medium">Show Countdown</span>
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
              </div>

              <button onClick={() => { alert('Event Saved!'); setShowAddEvent(false); }} className="w-full bg-notion-text text-white py-2.5 rounded-lg font-medium hover:bg-black transition-colors mt-2">
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
