// Небольшой типизированный клиент REST API с единообразной обработкой ошибок.
import type {AuthResponse, HangarStatus} from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

// Выполняет HTTP-запрос, добавляет токен авторизации и переводит ошибки API в текст.
async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
            ...options.headers,
        },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Не удалось выполнить запрос.');
    }
    return payload as T;
}

export function authenticate(mode: 'login' | 'register', email: string, password: string, confirmPassword?: string) {
    return request<AuthResponse>(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({email, password, ...(mode === 'register' ? {confirmPassword} : {})}),
    });
}

export function fetchHangar(token: string) {
    return request<HangarStatus>('/api/hangar/status', {}, token);
}

// Удаляет авторизованный аккаунт и его данные на сервере.
export function deleteAccount(token: string) {
    return request<{success: true}>('/api/auth/account', {method: 'DELETE'}, token);
}

// Возвращает базовый адрес API для построения адреса WebSocket-соединения.
export function getApiUrl() {
    return API_URL;
}
