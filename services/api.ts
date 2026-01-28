import { Note, CalendarEvent } from '../types';

const API_BASE = 'http://localhost:8080/api';

// 类型安全的 fetch 封装
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `HTTP Error ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Auth - 登录认证
    login: async (username: string, password: string) => {
        return request<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    // Auth - 注册
    register: async (username: string, password: string) => {
        return request<{ message: string; token: string; user: any }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
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
};
