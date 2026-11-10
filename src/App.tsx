// Управляет переходами между авторизацией, ангаром и космическими сценами.
import {useEffect, useState} from 'react';
import {deleteAccount, fetchHangar} from './api';
import AuthScreen from './components/AuthScreen';
import HangarScreen from './components/HangarScreen';
import SpaceScene from './components/SpaceScene';
import type {AppScreen, AuthResponse, HangarStatus, SpaceZone} from './types';

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem('galaxy-token') || '');
    const [email, setEmail] = useState(() => localStorage.getItem('galaxy-email') || 'Пилот');
    const [screen, setScreen] = useState<AppScreen>(token ? 'hangar' : 'auth');
    const [hangar, setHangar] = useState<HangarStatus | null>(null);
    const [zone, setZone] = useState<SpaceZone>('galaxy-map');
    const [error, setError] = useState('');

    // Проверяет сохранённую сессию и загружает состояние ангара при входе.
    useEffect(() => {
        if (!token) return;
        fetchHangar(token)
            .then(setHangar)
            .catch((cause: Error) => {
                setError(cause.message);
                localStorage.removeItem('galaxy-token');
                setToken('');
                setScreen('auth');
            });
    }, [token]);

    // Сохраняет выданную сервером сессию и открывает ангар пилота.
    function onAuthenticated(result: AuthResponse) {
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
        setHangar(null);
        setScreen('auth');
    }

    // Удаляет аккаунт на сервере и только после успеха очищает локальную сессию.
    async function removeAccount() {
        await deleteAccount(token);
        logout();
    }

    if (screen === 'auth') {
        return <AuthScreen onAuthenticated={onAuthenticated} initialError={error}/>;
    }
    if (screen === 'hangar') {
        return <HangarScreen token={token} hangar={hangar} onHangarUpdate={setHangar} error={error} email={email} onLaunch={() => {
            setZone('galaxy-map');
            setScreen('space');
        }} onLogout={logout} onDeleteAccount={removeAccount}/>;
    }
    return <SpaceScene token={token} username={email} zone={zone} onZoneChange={setZone}
                       onReturn={() => setScreen('hangar')}/>;
}
