import { Note, CalendarEvent } from '../types';

const API_BASE = 'http://localhost:8080/api';

// 获取存储的 token
const getToken = () => localStorage.getItem('gonote_token');

// 类型安全的 fetch 封装，自动带上 Authorization header
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `HTTP Error ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Auth - 登录
    login: async (username: string, password: string) => {
        return request<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    // Auth - 请求注册（获取验证码）
    registerRequest: async (username: string, password: string) => {
        return request<{ message: string; username: string }>('/auth/register/request', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    // Auth - 验证验证码完成注册
    registerVerify: async (username: string, code: string) => {
        return request<{ message: string; token: string; user: any }>('/auth/register/verify', {
            method: 'POST',
            body: JSON.stringify({ username, code }),
        });
    },

    // Events - 日历事件
    getEvents: async () => {
        return request<CalendarEvent[]>('/events');
    },

    createEvent: async (event: Partial<CalendarEvent>) => {
        return request<CalendarEvent>('/events', {
            method: 'POST',
            body: JSON.stringify(event),
        });
    },

    deleteEvent: async (id: string | number) => {
        return request<{ message: string }>(`/events/${id}`, {
            method: 'DELETE',
        });
    },

    // Notes - 笔记
    getNotes: async (folderId?: string) => {
        const query = folderId ? `?folderId=${folderId}` : '';
        return request<Note[]>(`/notes${query}`);
    },

    createNote: async (note: Partial<Note>) => {
        return request<Note>('/notes', {
            method: 'POST',
            body: JSON.stringify(note),
        });
    },

    updateNote: async (id: string, note: Partial<Note>) => {
        return request<Note>(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(note),
        });
    },

    deleteNote: async (id: string) => {
        return request<{ message: string }>(`/notes/${id}`, {
            method: 'DELETE',
        });
    },

    // Family - 家庭相关
    createFamily: async (name: string) => {
        return request<{ message: string; familyId: string; folder: any }>('/family/create', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    },

    joinFamily: async (familyId: string) => {
        return request<{ message: string; familyId: string }>('/family/join', {
            method: 'POST',
            body: JSON.stringify({ familyId }),
        });
    },

    leaveFamily: async () => {
        return request<{ message: string }>('/family/leave', {
            method: 'POST',
        });
    },

    getFamilyMembers: async () => {
        return request<{ familyId: string | null; members: any[] }>('/family/members');
    },

    getFamilyNotes: async () => {
        return request<Note[]>('/family/notes');
    },

    getFamilyEvents: async () => {
        return request<CalendarEvent[]>('/family/events');
    },
};
