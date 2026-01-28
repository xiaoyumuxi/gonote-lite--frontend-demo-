import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, LogOut, ChevronRight, FileText, Settings, Menu, X, MoreHorizontal, Layout, Hash, Home, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { Note, Folder as FolderType, User, CalendarEvent, AppNotification } from './types';
import Editor from './components/Editor';
import { api } from './services/api';

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

  // State - 现在默认使用空数组，数据从后端加载
  const [folders, setFolders] = useState<FolderType[]>(INITIAL_FOLDERS);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>('1');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Calendar State
  const [view, setView] = useState<'notes' | 'calendar'>('notes');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'n1', userId: 'u1', title: 'Dad\'s Birthday', message: 'Coming up in 3 days!', isRead: false, createdAt: Date.now(), type: 'reminder' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Family State - 家庭相关状态
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [familyAction, setFamilyAction] = useState<'create' | 'join'>('create');
  const [familyInputValue, setFamilyInputValue] = useState('');
  const [familyError, setFamilyError] = useState<string | null>(null);

  // Calendar Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const [currentDate, setCurrentDate] = useState(new Date());

  // 从后端加载数据
  const loadDataFromBackend = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [notesData, eventsData, familyData] = await Promise.all([
        api.getNotes(),
        api.getEvents(),
        api.getFamilyMembers()
      ]);
      // 转换后端数据格式到前端格式
      const formattedNotes = notesData.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt).getTime(),
        updatedAt: new Date(n.updatedAt).getTime(),
        attachments: [],
        comments: [],
        shareConfig: {
          isPublic: n.isPublic || false,
          publicPermission: n.publicPermission || 'read',
          collaborators: []
        }
      }));
      setNotes(formattedNotes);

      const formattedEvents = eventsData.map((e: any) => ({
        ...e,
        id: String(e.id),
        date: new Date(e.date).getTime(),
        notifyUsers: e.notifyUsers ? JSON.parse(e.notifyUsers) : []
      }));
      setEvents(formattedEvents);

      // 设置家庭信息
      if (familyData.familyId) {
        setFamilyId(familyData.familyId);
        setFamilyMembers(familyData.members || []);
      } else {
        setFamilyId(null);
        setFamilyMembers([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // 如果加载失败，使用 mock 数据作为降级方案
      setNotes([INITIAL_NOTE, INITIAL_NOTE_2, INITIAL_NOTE_FAMILY]);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

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
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // 用户已登录时加载数据
      loadDataFromBackend();
    }
    setLoading(false);
  }, [loadDataFromBackend]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!username || !password) {
      setAuthError('请输入用户名和密码');
      return;
    }

    try {
      const data = await api.login(username, password);
      if (data.user) {
        localStorage.setItem('gonote_user', JSON.stringify(data.user));
        setUser(data.user);
        // 登录成功后加载数据
        await loadDataFromBackend();
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setAuthError(error.message || '登录失败，请检查用户名和密码');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!username || !password) {
      setAuthError('请输入用户名和密码');
      return;
    }

    if (username.length < 3) {
      setAuthError('用户名至少3个字符');
      return;
    }

    if (password.length < 6) {
      setAuthError('密码至少6个字符');
      return;
    }

    try {
      const data = await api.register(username, password);
      if (data.user) {
        localStorage.setItem('gonote_user', JSON.stringify(data.user));
        setUser(data.user);
        // 注册成功后加载数据（新用户一般没有数据）
        await loadDataFromBackend();
      }
    } catch (error: any) {
      console.error('Register failed:', error);
      setAuthError(error.message || '注册失败，请稍后重试');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gonote_user');
    setUser(null);
    setFamilyId(null);
    setFamilyMembers([]);
  };

  // 家庭管理函数
  const handleCreateFamily = async () => {
    if (!familyInputValue.trim()) {
      setFamilyError('请输入家庭名称');
      return;
    }
    try {
      const result = await api.createFamily(familyInputValue.trim());
      setFamilyId(result.familyId);
      setFamilyMembers([user]);
      setShowFamilyModal(false);
      setFamilyInputValue('');
      setFamilyError(null);
      // 重新加载数据以获取最新状态
      await loadDataFromBackend();
    } catch (error: any) {
      setFamilyError(error.message || '创建家庭失败');
    }
  };

  const handleJoinFamily = async () => {
    if (!familyInputValue.trim()) {
      setFamilyError('请输入家庭编号');
      return;
    }
    try {
      const result = await api.joinFamily(familyInputValue.trim());
      setFamilyId(result.familyId);
      setShowFamilyModal(false);
      setFamilyInputValue('');
      setFamilyError(null);
      // 重新加载数据以获取家庭成员和共享笔记
      await loadDataFromBackend();
    } catch (error: any) {
      setFamilyError(error.message || '加入家庭失败');
    }
  };

  const handleLeaveFamily = async () => {
    try {
      await api.leaveFamily();
      setFamilyId(null);
      setFamilyMembers([]);
      // 重新加载数据
      await loadDataFromBackend();
    } catch (error: any) {
      console.error('退出家庭失败:', error);
    }
  };

  // 动态生成文件夹列表，如果用户有家庭则包含家庭共享文件夹
  const displayFolders = familyId
    ? [...INITIAL_FOLDERS.slice(0, 3), { id: 'family', name: '🏠 家庭共享', icon: '🏠' }]
    : INITIAL_FOLDERS.slice(0, 3);

  const handleCreateNote = async () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled',
      content: '',
      folderId: activeFolderId === 'family' ? '' : activeFolderId,
      attachments: [],
      comments: [],
      shareConfig: { isPublic: false, publicPermission: 'read', collaborators: [] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 如果是家庭文件夹，添加 familyId
    const noteWithFamily = activeFolderId === 'family' && familyId
      ? { ...newNote, familyId }
      : newNote;

    // 先在前端显示，提供即时反馈
    setNotes([noteWithFamily, ...notes]);
    setActiveNoteId(newNote.id);
    if (window.innerWidth < 768) setIsMobileMenuOpen(false);

    // 异步保存到后端
    try {
      const savedNote = await api.createNote({
        id: newNote.id,
        title: newNote.title,
        content: newNote.content,
        folderId: newNote.folderId,
        ...(activeFolderId === 'family' && familyId ? { familyId } : {}),
      });
      // 更新前端状态使用后端返回的数据
      setNotes(prev => prev.map(n => n.id === newNote.id ? {
        ...noteWithFamily,
        ...savedNote,
        createdAt: new Date(savedNote.createdAt).getTime(),
        updatedAt: new Date(savedNote.updatedAt).getTime(),
      } : n));
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  // 使用防抖保存到后端
  const updateNote = async (updatedNote: Note) => {
    // 立即更新前端状态
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));

    // 异步同步到后端
    try {
      await api.updateNote(updatedNote.id, {
        title: updatedNote.title,
        content: updatedNote.content,
        updatedAt: updatedNote.updatedAt,
      });
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    // 立即更新前端状态
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    if (activeNoteId === noteId) {
      const remainingInFolder = updatedNotes.filter(n => n.folderId === activeFolderId);
      setActiveNoteId(remainingInFolder.length > 0 ? remainingInFolder[0].id : null);
    }

    // 异步从后端删除
    try {
      await api.deleteNote(noteId);
    } catch (error) {
      console.error('Failed to delete note:', error);
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

  // 过滤笔记：如果选中家庭文件夹，显示家庭共享笔记；否则按普通文件夹过滤
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFolderId === 'family') {
      // 家庭共享文件夹：显示有 familyId 的笔记
      return (n as any).familyId && matchesSearch;
    } else {
      // 普通文件夹：显示该文件夹且没有 familyId 的笔记
      return n.folderId === activeFolderId && !(n as any).familyId && matchesSearch;
    }
  });

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
            {/* 错误信息显示 */}
            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {authError}
              </div>
            )}
            <input
              type="text"
              required
              value={username}
              onChange={e => { setUsername(e.target.value); setAuthError(null); }}
              className="w-full px-4 py-3 bg-notion-sidebar border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-dim/20 transition-all placeholder:text-notion-dim/50"
              placeholder={isRegistering ? "用户名 (至少3个字符)" : "用户名"}
            />
            <input
              type="password"
              required
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError(null); }}
              className="w-full px-4 py-3 bg-notion-sidebar border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-dim/20 transition-all placeholder:text-notion-dim/50"
              placeholder={isRegistering ? "密码 (至少6个字符)" : "密码"}
            />
            <button
              type="submit"
              className="w-full bg-notion-text hover:bg-black text-white font-medium py-3 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isRegistering ? '注册' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }}
              className="text-sm text-notion-dim hover:text-notion-text hover:underline transition-colors"
            >
              {isRegistering ? '已有账号？点击登录' : '没有账号？点击注册'}
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

          <div className="my-4 px-3 text-xs font-semibold text-notion-dim/60 uppercase tracking-wider">笔记文件夹</div>

          {displayFolders.map(folder => (
            <div
              key={folder.id}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors group ${folder.id === activeFolderId && view === 'notes' ? 'bg-notion-hover text-notion-text font-medium' : 'text-notion-dim hover:bg-notion-hover hover:text-notion-text'}`}
              onClick={() => { setActiveFolderId(folder.id); setView('notes'); setIsMobileMenuOpen(false); }}
            >
              <div className="flex items-center justify-center w-5 h-5 text-lg opacity-80 group-hover:opacity-100 transition-opacity">{folder.icon}</div>
              <span className="truncate flex-1">{folder.name}</span>
              {folder.id === 'family' && familyMembers.length > 0 && (
                <span className="text-xs text-notion-dim bg-notion-dim/10 px-1.5 py-0.5 rounded">{familyMembers.length}人</span>
              )}
            </div>
          ))}

          {/* 家庭管理入口 */}
          <div className="mt-4 px-3">
            {familyId ? (
              <div className="space-y-2">
                <div className="text-xs text-notion-dim">
                  家庭编号: <span className="font-mono bg-notion-dim/10 px-1 rounded">{familyId}</span>
                </div>
                <button
                  onClick={handleLeaveFamily}
                  className="text-xs text-red-500 hover:underline"
                >
                  退出家庭
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowFamilyModal(true); setFamilyError(null); setFamilyInputValue(''); }}
                className="flex items-center gap-2 text-sm text-notion-dim hover:text-notion-text"
              >
                <Home className="w-4 h-4" />
                <span>创建/加入家庭</span>
              </button>
            )}
          </div>
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

      {/* 家庭管理 Modal */}
      {showFamilyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-notion-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">家庭共享</h3>
                <button onClick={() => setShowFamilyModal(false)} className="p-1 hover:bg-notion-dim/10 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* 切换创建/加入 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setFamilyAction('create'); setFamilyError(null); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${familyAction === 'create' ? 'bg-notion-text text-white' : 'bg-notion-dim/10 text-notion-dim hover:bg-notion-dim/20'}`}
                >
                  创建家庭
                </button>
                <button
                  onClick={() => { setFamilyAction('join'); setFamilyError(null); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${familyAction === 'join' ? 'bg-notion-text text-white' : 'bg-notion-dim/10 text-notion-dim hover:bg-notion-dim/20'}`}
                >
                  加入家庭
                </button>
              </div>

              {/* 错误提示 */}
              {familyError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {familyError}
                </div>
              )}

              {/* 输入框 */}
              <input
                type="text"
                value={familyInputValue}
                onChange={e => setFamilyInputValue(e.target.value)}
                placeholder={familyAction === 'create' ? '输入家庭名称，如：张家' : '输入家庭编号，如：family-xxxxxx'}
                className="w-full px-4 py-3 bg-notion-sidebar border border-notion-border rounded-lg focus:outline-none focus:ring-2 focus:ring-notion-dim/20 transition-all"
              />

              <p className="mt-2 text-xs text-notion-dim">
                {familyAction === 'create'
                  ? '创建后，你可以邀请家人通过家庭编号加入。'
                  : '请向家庭创建者索取家庭编号。'}
              </p>

              {/* 操作按钮 */}
              <button
                onClick={familyAction === 'create' ? handleCreateFamily : handleJoinFamily}
                className="w-full mt-4 bg-notion-text text-white py-2.5 rounded-lg font-medium hover:bg-black transition-colors"
              >
                {familyAction === 'create' ? '创建家庭' : '加入家庭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
