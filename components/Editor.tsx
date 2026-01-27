import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Note, ViewMode, Attachment, Comment, ShareConfig, User, Collaborator } from '../types';
import {
  Wand2, RefreshCw,
  Bold, Italic, List, Heading, Code, FileText, Trash2,
  Paperclip, X, Highlighter, LayoutPanelLeft, Eye, Plus,
  Share, Globe, Link as LinkIcon, Lock, MessageSquare, Send, AtSign,
  Download, Image as ImageIcon, File as FileIcon, FileText as FileHeading
} from 'lucide-react';
import { polishContent } from '../services/aiService';

// Helper for file size
const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Mock Users for Mentions
const MOCK_USERS: User[] = [
  { id: 'u1', username: 'You', token: '', avatarColor: 'bg-blue-500' },
  { id: 'u2', username: 'Alice', token: '', avatarColor: 'bg-green-500' },
  { id: 'u3', username: 'Bob', token: '', avatarColor: 'bg-yellow-500' },
  { id: 'u4', username: 'Charlie', token: '', avatarColor: 'bg-red-500' },
];

interface EditorProps {
  note: Note | null;
  notes: Note[];
  onUpdate: (updatedNote: Note) => void;
  onNavigate: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  currentUser: User;
}

const Editor: React.FC<EditorProps> = ({ note, notes, onUpdate, onNavigate, onDelete, currentUser }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shareConfig, setShareConfig] = useState<ShareConfig>({ isPublic: false, publicPermission: 'read', collaborators: [] });

  // UI States
  const [showAttachments, setShowAttachments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [mentionMenu, setMentionMenu] = useState<{ x: number, y: number, filter: string } | null>(null);

  const [newComment, setNewComment] = useState('');
  const [activeQuote, setActiveQuote] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Scroll Sync Refs
  const editContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const handleEditScroll = () => {
    if (viewMode !== ViewMode.SPLIT) return;
    if (isSyncingScroll.current) {
      isSyncingScroll.current = false;
      return;
    }
    const editNode = editContainerRef.current;
    const previewNode = previewContainerRef.current;
    if (editNode && previewNode) {
      const percentage = editNode.scrollTop / (editNode.scrollHeight - editNode.clientHeight);
      const targetScrollTop = percentage * (previewNode.scrollHeight - previewNode.clientHeight);
      isSyncingScroll.current = true;
      previewNode.scrollTop = targetScrollTop;
    }
  };

  const handlePreviewScroll = () => {
    if (viewMode !== ViewMode.SPLIT) return;
    if (isSyncingScroll.current) {
      isSyncingScroll.current = false;
      return;
    }
    const editNode = editContainerRef.current;
    const previewNode = previewContainerRef.current;
    if (editNode && previewNode) {
      const percentage = previewNode.scrollTop / (previewNode.scrollHeight - previewNode.clientHeight);
      const targetScrollTop = percentage * (editNode.scrollHeight - editNode.clientHeight);
      isSyncingScroll.current = true;
      editNode.scrollTop = targetScrollTop;
    }
  };
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setTitle(note.title);
      setAttachments(note.attachments || []);
      setComments(note.comments || []);
      setComments(note.comments || []);
      setShareConfig(note.shareConfig || { isPublic: false, publicPermission: 'read', collaborators: [] });
    } else {
      setContent('');
      setTitle('');
      setAttachments([]);
      setComments([]);
      setShareConfig({ isPublic: false, publicPermission: 'read', collaborators: [] });
    }
  }, [note]);

  // Click outside handlers
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
      // Simple logic to close share popover if clicked outside
      const target = e.target as HTMLElement;
      if (!target.closest('.share-container')) {
        setShowSharePopover(false);
      }
      if (!target.closest('.mention-menu')) {
        setMentionMenu(null);
      }
    };

    // Bind global navigation for Wiki Links (since we render them as raw HTML strings)
    // In a real app with React Router, we would use a proper Link component in ReactMarkdown
    (window as any).navigate = (noteId: string) => {
      onNavigate(noteId);
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      delete (window as any).navigate;
    };
  }, [onNavigate]);

  const handleSave = (overrideContent?: string) => {
    if (!note) return;
    onUpdate({
      ...note,
      title,
      content: overrideContent !== undefined ? overrideContent : content,
      attachments,
      comments,
      shareConfig,
      updatedAt: Date.now(),
    });
  };

  const handlePolish = async () => {
    setIsAiProcessing(true);
    try {
      const polished = await polishContent(content);
      setContent(polished);
    } catch (e) {
      alert("AI Service Error");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = textarea.value;
    const selection = previousContent.substring(start, end);
    const newContent = previousContent.substring(0, start) + before + selection + after + previousContent.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  // --- Context Menu & Commenting ---
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const textarea = textareaRef.current;
    if (textarea) {
      const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selection) {
        setActiveQuote(selection);
      } else {
        setActiveQuote('');
      }
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const addComment = () => {
    setShowComments(true);
    setContextMenu(null);
  };

  const submitComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.username,
      content: newComment,
      quotedText: activeQuote,
      createdAt: Date.now()
    };
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment('');
    setActiveQuote('');
    if (note) onUpdate({ ...note, comments: updatedComments });
  };

  const applyColor = (color: string) => {
    insertText(`<span style="color: ${color}">`, `</span>`);
    setContextMenu(null);
  };

  // --- Mention Logic ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '@') {
      const textarea = e.currentTarget;
      const { selectionStart } = textarea;
      // Get exact coordinates for the menu (simplified approximation)
      const rect = textarea.getBoundingClientRect();
      const x = rect.left + 20; // Very rough approximation
      const y = rect.top + (selectionStart / 50) * 20; // Extremely rough approximation, in real app use generic-caret-coordinates
      setMentionMenu({ x, y, filter: '' });
    }
  };

  const insertMention = (username: string) => {
    // Replaces the '@' typed or inserts new
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Simple append for demo (improving caret logic requires more complex code)
    insertText(`@${username} `);
    setMentionMenu(null);
  };

  // --- Share Logic ---
  const togglePublicShare = () => {
    const newConfig = { ...shareConfig, isPublic: !shareConfig.isPublic };
    if (newConfig.isPublic && !newConfig.url) {
      newConfig.url = `https://gonote.app/s/${Math.random().toString(36).substring(7)}`;
    }
    setShareConfig(newConfig);
    if (note) onUpdate({ ...note, shareConfig: newConfig });
  };

  const handleInvite = (username: string) => {
    // Mock Invite
    const newCollab: Collaborator = {
      userId: Date.now().toString(),
      username: username,
      avatarColor: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'][Math.floor(Math.random() * 4)],
      permission: 'read'
    };
    const newConfig = { ...shareConfig, collaborators: [...shareConfig.collaborators, newCollab] };
    setShareConfig(newConfig);
    if (note) onUpdate({ ...note, shareConfig: newConfig });
  };

  const copyShareLink = () => {
    if (shareConfig.url) {
      navigator.clipboard.writeText(shareConfig.url);
      alert("Link copied to clipboard!");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Mock Upload
      const newAttachment: Attachment = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        data: URL.createObjectURL(file), // Mock URL
        createdAt: Date.now()
      };

      const newAttachments = [...attachments, newAttachment];
      setAttachments(newAttachments);
      if (note) onUpdate({ ...note, attachments: newAttachments });
      e.target.value = ''; // Reset input
    }
  };

  // --- Render ---

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center bg-white text-notion-dim">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-notion-sidebar rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-lg font-medium">Select or create a page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative group/editor">

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white/80 backdrop-blur-md z-20 border-b border-transparent hover:border-notion-border transition-colors">
        <div className="flex items-center gap-2 text-xs text-notion-dim overflow-hidden">
          <span className="truncate hover:text-notion-text cursor-pointer hover:underline">Personal</span>
          <span className="opacity-40">/</span>
          <span className="truncate font-medium text-notion-text">{title || 'Untitled'}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Collaborators (Fake) */}
          {/* Collaborators (Fake - Using real list now) */}
          {shareConfig.collaborators.length > 0 && (
            <div className="flex -space-x-2 mr-3">
              {shareConfig.collaborators.map(c => (
                <div key={c.userId} className={`w-6 h-6 rounded-full ${c.avatarColor} border-2 border-white flex items-center justify-center text-[8px] text-white`} title={c.username}>
                  {c.username[0].toUpperCase()}
                </div>
              ))}
            </div>
          )}

          <div className="relative share-container">
            <button onClick={() => setShowSharePopover(!showSharePopover)} className={`px-2 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${shareConfig.isPublic ? 'text-blue-600 bg-blue-50' : 'text-notion-dim hover:bg-notion-hover text-notion-text'}`}>
              {shareConfig.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Share className="w-3.5 h-3.5" />}
              Share
            </button>

            {/* Share Popover */}
            {showSharePopover && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-context border border-notion-border p-3 z-50 animate-fade-in text-left">
                {/* 1. Public Link Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe className={`w-4 h-4 ${shareConfig.isPublic ? 'text-blue-500' : 'text-notion-dim'}`} />
                    <div>
                      <p className="text-sm font-medium text-notion-text">Share to web</p>
                      <p className="text-xs text-notion-dim">Anyone with link can {shareConfig.publicPermission}</p>
                    </div>
                  </div>
                  <button
                    onClick={togglePublicShare}
                    className={`w-10 h-5 rounded-full relative transition-colors ${shareConfig.isPublic ? 'bg-blue-500' : 'bg-notion-dim/30'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${shareConfig.isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {shareConfig.isPublic && (
                  <div className="flex gap-2 mb-4">
                    <input readOnly value={shareConfig.url} className="flex-1 text-xs bg-notion-sidebar p-1.5 rounded border border-notion-border text-notion-dim truncate" />
                    <button onClick={copyShareLink} className="p-1.5 bg-white border border-notion-border rounded hover:bg-notion-hover text-notion-text text-xs font-medium">Copy</button>
                  </div>
                )}

                <div className="border-t border-notion-border my-2" />

                {/* 2. Invite People */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-notion-dim mb-2 uppercase tracking-wider">People with access</p>
                  <div className="flex gap-2 mb-3">
                    <input
                      placeholder="Add people by username..."
                      className="flex-1 text-sm border border-notion-border rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value;
                          if (val) handleInvite(val);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button className="text-xs bg-notion-text text-white px-2 py-1 rounded">Invite</button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {/* Owner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${currentUser.avatarColor || 'bg-notion-text'} text-white flex items-center justify-center text-[10px]`}>
                          {currentUser.username[0].toUpperCase()}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{currentUser.username}</span> <span className="text-notion-dim">(You)</span>
                        </div>
                      </div>
                      <span className="text-xs text-notion-dim">Owner</span>
                    </div>

                    {/* Collaborators */}
                    {shareConfig.collaborators.map(c => (
                      <div key={c.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${c.avatarColor} text-white flex items-center justify-center text-[10px]`}>
                            {c.username[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{c.username}</span>
                        </div>

                        <select
                          value={c.permission}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'remove') {
                              const newCollabs = shareConfig.collaborators.filter(u => u.userId !== c.userId);
                              setShareConfig({ ...shareConfig, collaborators: newCollabs });
                              if (note) onUpdate({ ...note, shareConfig: { ...shareConfig, collaborators: newCollabs } });
                            } else {
                              const newCollabs = shareConfig.collaborators.map(u => u.userId === c.userId ? { ...u, permission: val as 'read' | 'edit' } : u);
                              setShareConfig({ ...shareConfig, collaborators: newCollabs });
                              if (note) onUpdate({ ...note, shareConfig: { ...shareConfig, collaborators: newCollabs } });
                            }
                          }}
                          className="text-xs bg-transparent text-notion-dim hover:text-notion-text focus:outline-none cursor-pointer"
                        >
                          <option value="read">Can read</option>
                          <option value="edit">Can edit</option>
                          <option value="remove" className="text-red-500">Remove</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-notion-border mx-2" />

          <button onClick={() => setShowComments(!showComments)} className={`p-1.5 rounded transition-colors relative ${showComments ? 'text-blue-600 bg-blue-50' : 'text-notion-dim hover:bg-notion-hover hover:text-notion-text'}`} title="Comments">
            <MessageSquare className="w-4 h-4" />
            {comments.length > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />}
          </button>

          <div className="flex bg-notion-sidebar rounded-md p-0.5 ml-2">
            <button onClick={() => setViewMode(ViewMode.EDIT)} className={`p-1 rounded ${viewMode === ViewMode.EDIT ? 'bg-white shadow-sm text-notion-text' : 'text-notion-dim'}`} title="Edit Only"><FileText className="w-4 h-4" /></button>
            <button onClick={() => setViewMode(ViewMode.SPLIT)} className={`p-1 rounded ${viewMode === ViewMode.SPLIT ? 'bg-white shadow-sm text-notion-text' : 'text-notion-dim'}`} title="Split View"><LayoutPanelLeft className="w-4 h-4" /></button>
            <button onClick={() => setViewMode(ViewMode.PREVIEW)} className={`p-1 rounded ${viewMode === ViewMode.PREVIEW ? 'bg-white shadow-sm text-notion-text' : 'text-notion-dim'}`} title="Read Only"><Eye className="w-4 h-4" /></button>
          </div>

          <button onClick={handlePolish} disabled={isAiProcessing} className="ml-2 p-1.5 text-notion-dim hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="AI Polish">
            {isAiProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          </button>
          <button onClick={() => onDelete(note.id)} className="p-1.5 text-notion-dim hover:text-red-600 hover:bg-red-50 rounded transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden flex flex-row">

        {/* EDIT PANE */}
        {(viewMode === ViewMode.EDIT || viewMode === ViewMode.SPLIT) && (
          <div
            ref={editContainerRef}
            onScroll={handleEditScroll}
            className="flex-1 h-full overflow-y-auto px-6 md:px-12 py-8 scroll-smooth relative"
          >
            <div className="max-w-[800px] mx-auto min-h-[500px]">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSave()}
                placeholder="Untitled"
                className="w-full text-4xl md:text-5xl font-bold text-notion-text placeholder:text-notion-dim/30 bg-transparent border-none focus:outline-none mb-6 leading-tight"
              />

              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-notion-border sticky top-[-20px] bg-white z-10 opacity-60 hover:opacity-100 transition-opacity">
                <button onClick={() => insertText('**', '**')} className="p-1 hover:bg-notion-hover rounded text-notion-dim hover:text-notion-text"><Bold className="w-4 h-4" /></button>
                <button onClick={() => insertText('*', '*')} className="p-1 hover:bg-notion-hover rounded text-notion-dim hover:text-notion-text"><Italic className="w-4 h-4" /></button>
                <button onClick={() => insertText('### ')} className="p-1 hover:bg-notion-hover rounded text-notion-dim hover:text-notion-text"><Heading className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-notion-border" />
                <button onClick={() => insertText('- [ ] ')} className="p-1 hover:bg-notion-hover rounded text-notion-dim hover:text-notion-text"><List className="w-4 h-4" /></button>
                <button onClick={() => insertText('```\n', '\n```')} className="p-1 hover:bg-notion-hover rounded text-notion-dim hover:text-notion-text"><Code className="w-4 h-4" /></button>
                <button onClick={() => insertText('@')} className="p-1 hover:bg-notion-hover rounded text-notion-dim hover:text-notion-text"><AtSign className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-notion-border" />
                <button onClick={() => attachmentInputRef.current?.click()} className="p-1 hover:bg-notion-hover rounded text-notion-dim hover:text-notion-text" title="Upload File"><Paperclip className="w-4 h-4" /></button>
                <input
                  type="file"
                  ref={attachmentInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Attachments List (Enhanced) */}
              {attachments.length > 0 && (
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  {attachments.map(file => {
                    const isImage = file.type.startsWith('image/');
                    return (
                      <div key={file.id} className="group flex items-center gap-3 p-3 bg-white border border-notion-border rounded-lg shadow-sm hover:shadow-md hover:border-notion-dim/30 transition-all">
                        {/* Icon / Thumbnail */}
                        <div className="w-10 h-10 shrink-0 bg-notion-sidebar rounded-lg flex items-center justify-center overflow-hidden border border-notion-border">
                          {isImage ? (
                            <img src={file.data} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <FileHeading className="w-5 h-5 text-notion-dim" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-notion-text truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-notion-dim flex items-center gap-1">
                            {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <a
                            href={file.data}
                            download={file.name}
                            className="p-1.5 text-notion-dim hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => {
                              const newAttachments = attachments.filter(a => a.id !== file.id);
                              setAttachments(newAttachments);
                              if (note) onUpdate({ ...note, attachments: newAttachments });
                            }}
                            className="p-1.5 text-notion-dim hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={() => handleSave()}
                onKeyDown={handleKeyDown}
                onContextMenu={handleContextMenu}
                className="w-full h-full resize-none focus:outline-none text-base md:text-lg leading-relaxed text-notion-text bg-transparent font-sans placeholder:text-notion-dim/50"
                placeholder="Type '@' to mention, '/' for commands..."
                style={{ minHeight: '60vh' }}
              />
            </div>
          </div>
        )}

        {/* PREVIEW PANE */}
        {(viewMode === ViewMode.PREVIEW || viewMode === ViewMode.SPLIT) && (
          <div
            ref={previewContainerRef}
            onScroll={handlePreviewScroll}
            className={`flex-1 h-full overflow-y-auto px-8 py-10 bg-white ${viewMode === ViewMode.SPLIT ? 'border-l border-notion-border hidden lg:block' : ''}`}
          >
            <div className="max-w-[900px] mx-auto prose">
              {viewMode === ViewMode.PREVIEW && <h1 className="mb-8">{title}</h1>}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // Render Mentions
                  p: ({ children }) => {
                    // This is a rough way to catch text nodes, in production use a remark plugin for mentions
                    return <p>{children}</p>;
                  },
                  // We can attempt to style specific text patterns if we used a remark plugin,
                  // but for "GoNote Lite" we simply style the raw text containing @User in the markdown render
                  // by relying on the user to use bold/code or just plain text.
                  // However, we can use a simple regex replacement in the `content` prop before passing to ReactMarkdown
                  // OR simple text matching here if it was structured data.
                  // For this demo, let's just make the preview clean.
                }}
              >
                {/* Simple Client-side replacement for preview visualization of mentions AND WikiLinks */}
                {content
                  .replace(/@(\w+)/g, '<span class="mention-pill">@$1</span>')
                  .replace(/\[\[(.*?)\]\]/g, (match, p1) => {
                    // Find if note exists
                    const targetNote = notes.find(n => n.title === p1);
                    if (targetNote) {
                      return `<a href="#" onclick="event.preventDefault(); window.navigate('${targetNote.id}')" class="wiki-link text-notion-text border-b border-notion-text/30 hover:bg-notion-hover transition-colors font-medium">📄 ${p1}</a>`;
                    } else {
                      return `<span class="wiki-link-broken text-notion-dim/60 border-b border-dashed border-notion-dim/30 cursor-help" title="Page not created yet">📄 ${p1}</span>`;
                    }
                  })
                }
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* COMMENTS SIDEBAR */}
        {showComments && (
          <div className="w-80 bg-notion-sidebar border-l border-notion-border flex flex-col h-full animate-in slide-in-from-right duration-200 shadow-xl z-30">
            <div className="p-4 border-b border-notion-border flex justify-between items-center bg-white">
              <span className="font-semibold text-sm">Comments ({comments.length})</span>
              <button onClick={() => setShowComments(false)}><X className="w-4 h-4 text-notion-dim hover:text-notion-text" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 && (
                <div className="text-center text-notion-dim text-sm mt-10">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No comments yet.</p>
                  <p className="text-xs">Select text in editor to add one.</p>
                </div>
              )}
              {comments.map(c => (
                <div key={c.id} className="bg-white p-3 rounded-lg shadow-sm border border-notion-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center font-bold">
                      {c.username[0]}
                    </div>
                    <span className="font-semibold text-xs">{c.username}</span>
                    <span className="text-[10px] text-notion-dim ml-auto">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {c.quotedText && (
                    <div className="mb-2 pl-2 border-l-2 border-blue-200 text-xs text-notion-dim italic truncate">
                      "{c.quotedText}"
                    </div>
                  )}
                  <p className="text-sm text-notion-text">{c.content}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-white border-t border-notion-border">
              {activeQuote && (
                <div className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded mb-2 text-xs text-blue-600">
                  <span className="truncate max-w-[200px]">Replying to: "{activeQuote}"</span>
                  <button onClick={() => setActiveQuote('')}><X className="w-3 h-3" /></button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  placeholder={activeQuote ? "Add a reply..." : "Write a comment..."}
                  className="flex-1 text-sm bg-notion-sidebar border border-notion-border rounded px-2 focus:outline-none focus:border-blue-300 transition-colors"
                />
                <button onClick={submitComment} className="p-2 bg-notion-text text-white rounded hover:bg-black transition-colors">
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-context border border-notion-border py-1 w-48 z-50 animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {activeQuote && (
            <button onClick={addComment} className="w-full text-left px-3 py-1.5 text-sm text-notion-text hover:bg-notion-hover flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Comment
            </button>
          )}
          <div className="px-3 py-1.5 text-[10px] font-semibold text-notion-dim uppercase tracking-wider">Color</div>
          <button onClick={() => applyColor('#D44C47')} className="w-full text-left px-3 py-1.5 text-sm text-notion-text hover:bg-notion-hover flex items-center gap-2">
            <div className="w-4 h-4 rounded text-[#D44C47] font-bold text-center leading-4">A</div> Red
          </button>
          <button onClick={() => applyColor('#0B6E99')} className="w-full text-left px-3 py-1.5 text-sm text-notion-text hover:bg-notion-hover flex items-center gap-2">
            <div className="w-4 h-4 rounded text-[#0B6E99] font-bold text-center leading-4">A</div> Blue
          </button>
          <button onClick={() => { insertText(`<span style="background:#FDECC8">`, `</span>`); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-sm text-notion-text hover:bg-notion-hover flex items-center gap-2">
            <Highlighter className="w-3.5 h-3.5" /> Highlight
          </button>
        </div>
      )}

      {/* Mention Dropdown */}
      {mentionMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-context border border-notion-border py-1 w-48 z-50 animate-fade-in mention-menu"
          style={{ top: mentionMenu.y + 20, left: mentionMenu.x }}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-notion-dim uppercase tracking-wider">People</div>
          {MOCK_USERS.map(user => (
            <button key={user.id} onClick={() => insertMention(user.username)} className="w-full text-left px-3 py-1.5 text-sm text-notion-text hover:bg-notion-hover flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${user.avatarColor} text-white flex items-center justify-center text-[8px]`}>{user.username[0]}</div>
              {user.username}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Editor;