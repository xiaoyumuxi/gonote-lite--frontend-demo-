export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  quotedText?: string; // For annotations/context
  createdAt: number;
}

export interface Collaborator {
  userId: string;
  username: string;
  avatarColor: string;
  permission: 'read' | 'edit';
}

export interface ShareConfig {
  isPublic: boolean;
  publicPermission: 'read' | 'edit';
  url?: string;
  collaborators: Collaborator[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  familyId?: string; // 家庭共享笔记的家庭编号
  attachments?: Attachment[];
  comments?: Comment[];
  shareConfig?: ShareConfig;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  familyId?: string; // 家庭共享文件夹
}

export interface User {
  id: string;
  username: string;
  token: string;
  avatarColor?: string;
  familyId?: string; // 用户所属的家庭编号
}

export enum ViewMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  SPLIT = 'SPLIT'
}

export interface ArchitectureTip {
  title: string;
  description: string;
  icon: string;
  details: string[];
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type CalendarType = 'solar' | 'lunar';

export interface CalendarEvent {
  id: string;
  title: string;
  date: number; // Timestamp
  type: CalendarType;
  recurrence: RecurrenceType;
  notifyUsers: string[]; // User IDs
  showCountdown: boolean;
  description?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  type: 'reminder' | 'system' | 'mention';
}
