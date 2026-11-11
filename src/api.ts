// Небольшой типизированный клиент REST API с единообразной обработкой ошибок.
import type {AuthResponse, HangarStatus, TradeActionType} from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

// Ошибка API: сервер присылает текст и код, чтобы интерфейс показал причину над кнопкой.
export class ApiError extends Error {
    readonly code: string;

    constructor(message: string, code = '') {
        super(message);
        this.name = 'ApiError';
        this.code = code;
    }
}

// Выполняет HTTP-запрос, добавляет токен авторизации и переводит ошибки API в ApiError.
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
        throw new ApiError(
            typeof payload.error === 'string' ? payload.error : 'Не удалось выполнить запрос.',
            typeof payload.code === 'string' ? payload.code : '',
        );
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

export interface TradeResponse {
    success: boolean;
    action: TradeActionType;
    credits: number;
    receipt?: Record<string, unknown>;
    hangar?: HangarStatus;
}

// Отправляет торговое действие на сервер: цены и доступность проверяет только он.
export function executeTrade(token: string, action: TradeActionType, payload: Record<string, unknown> = {}) {
    return request<TradeResponse>('/api/hangar/trade', {
        method: 'POST',
        body: JSON.stringify({action, ...payload}),
    }, token);
}

// Удаляет авторизованный аккаунт и его данные на сервере.
export function deleteAccount(token: string) {
    return request<{ success: true }>('/api/auth/account', {method: 'DELETE'}, token);
}

// Возвращает базовый адрес API для построения адреса WebSocket-соединения.
export function getApiUrl() {
    return API_URL;
}
