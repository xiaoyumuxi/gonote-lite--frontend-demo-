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

export interface ShareConfig {
  isShared: boolean;
  permission: 'read' | 'edit';
  url?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
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
}

export interface User {
  id: string;
  username: string;
  token: string;
  avatarColor?: string;
}

export enum ViewMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  SPLIT = 'SPLIT'
}

export interface ArchitectureTip {
  title: string;
  content: string;
  code?: string;
}
