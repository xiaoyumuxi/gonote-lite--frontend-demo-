export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
  createdAt: string; // ISO String
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  quotedText?: string;
  createdAt: string; // ISO String
}

export interface Collaborator {
  noteId?: string;
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
  familyId?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  shareConfig?: ShareConfig;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  familyId?: string;
}

export interface User {
  id: string;
  username: string;
  token: string;
  avatarColor?: string;
  familyId?: string;
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
  date: string; // ISO String
  type: CalendarType;
  recurrence: RecurrenceType;
  notifyUsers: string[];
  showCountdown: boolean;
  description?: string;
  familyId?: string;
  isSystem?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO String
  type: 'reminder' | 'system' | 'mention';
}

export interface Family {
  id: string;
  name: string;
  creatorId: string;
  joinedAt?: string;
  role?: 'owner' | 'member';
}

export interface FamilyMember {
  userId: string;
  username: string;
  role: 'owner' | 'member';
  joinedAt: string;
}
