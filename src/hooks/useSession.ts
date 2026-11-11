// Сессия пилота: токен, email, экран, вход, выход и удаление аккаунта.
import {useState} from 'react';
import {deleteAccount} from '../api';
import type {AppScreen, AuthResponse} from '../types';

export function useSession() {
    const [token, setToken] = useState(() => localStorage.getItem('galaxy-token') || '');
    const [email, setEmail] = useState(() => localStorage.getItem('galaxy-email') || 'Пилот');
    const [screen, setScreen] = useState<AppScreen>(token ? 'hangar' : 'auth');
    const [error, setError] = useState('');

    // Сохраняет выданную сервером сессию и открывает ангар пилота.
    function login(result: AuthResponse) {
        localStorage.setItem('galaxy-token', result.token);
        localStorage.setItem('galaxy-email', result.user.email);
        localStorage.removeItem('galaxy-username');
        setEmail(result.user.email);
        setToken(result.token);
        setError('');
        setScreen('hangar');
    }

    // Удаляет локальные данные сессии и возвращает пользователя на экран входа.
    function logout() {
        localStorage.removeItem('galaxy-token');
        localStorage.removeItem('galaxy-email');
        localStorage.removeItem('galaxy-username');
        setToken('');
        setScreen('auth');
    }

    // Сервер не принял сохранённую сессию: показываем причину и выходим на вход.
    function expire(message: string) {
        setError(message);
        localStorage.removeItem('galaxy-token');
        setToken('');
        setScreen('auth');
    }

    // Удаляет аккаунт на сервере и только после успеха очищает локальную сессию.
    async function removeAccount() {
        await deleteAccount(token);
        logout();
    }

    return {token, email, screen, error, setScreen, setError, login, logout, expire, removeAccount};
}
