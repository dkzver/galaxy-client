// Форма входа и регистрации: режим, поля, ошибка и занятость — без разметки.
import {useState, type FormEvent} from 'react';
import {authenticate} from '../api';
import type {AuthResponse} from '../types';

export type AuthMode = 'login' | 'register';

export function useAuthForm(initialError: string, onAuthenticated: (result: AuthResponse) => void) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(initialError);
    const [busy, setBusy] = useState(false);

    // Отправляет форму входа или регистрации и показывает ответ сервера.
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            if (mode === 'register' && password !== confirmPassword) {
                setError('Пароли не совпадают.');
                return;
            }
            onAuthenticated(await authenticate(mode, email, password, confirmPassword));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Не удалось подключиться к серверу.');
        } finally {
            setBusy(false);
        }
    }

    // Меняет режим формы и сбрасывает временные ошибки и подтверждение пароля.
    function switchMode() {
        setMode((currentMode) => currentMode === 'login' ? 'register' : 'login');
        setConfirmPassword('');
        setError('');
    }

    return {
        mode,
        isRegister: mode === 'register',
        fields: {email, password, confirmPassword, setEmail, setPassword, setConfirmPassword},
        error,
        busy,
        submit,
        switchMode,
    };
}
