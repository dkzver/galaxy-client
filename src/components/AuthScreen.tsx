// Экран входа и регистрации с проверкой полей и сообщениями REST API.
import {useState, type FormEvent} from 'react';
import {authenticate} from '../api';
import type {AuthResponse} from '../types';
import AuthPanel from './AuthPanel';
import {
    EmailIcon,
    LoginIcon,
    PasswordConfirmIcon,
    PasswordIcon,
    RegisterIcon,
} from './Icons';
import './auth.css';
import Header from './header';

interface Props {
    onAuthenticated: (result: AuthResponse) => void;
    initialError: string;
}

export default function AuthScreen({onAuthenticated, initialError}: Props) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
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

    const isRegister = mode === 'register';

    return (
        <main className="portal-auth">
            <div className="portal-nebula" aria-hidden="true"/>
            <div className="portal-stars portal-stars--fine" aria-hidden="true"/>
            <div className="portal-stars portal-stars--bright" aria-hidden="true"/>
            <div className="portal-stars portal-stars--diamond" aria-hidden="true"/>
            <div className="portal-asteroids" aria-hidden="true">
                <i className="portal-asteroid portal-asteroid--one"/>
                <i className="portal-asteroid portal-asteroid--two"/>
                <i className="portal-asteroid portal-asteroid--three"/>
                <i className="portal-asteroid portal-asteroid--four"/>
                <i className="portal-asteroid portal-asteroid--five"/>
            </div>
            <div className="portal-wrap">
                <AuthPanel header={<Header label="ЦЕНТР УПРАВЛЕНИЯ" header="GALAXY" project="КОСМИЧЕСКАЯ СЕТЬ"/>}>
                    <p className="portal-eyebrow">Центр управления</p>
                    <h1 className="portal-title">GALAXY</h1>
                    <p className="portal-sub">
                        Введите email и пароль для входа на карту космоса или создайте аккаунт нового пилота со
                        стартовым флотом.
                    </p>

                    <form onSubmit={submit} className="portal-auth-form">
                        <div className="portal-auth-fields">
                            <div className="portal-auth-field">
                                <span className="portal-field-icon" aria-hidden="true"><EmailIcon size={18}/></span>
                                <div className="portal-input-wrap">
                                    <label htmlFor="pilot-email">EMAIL ПИЛОТА</label>
                                    <input id="pilot-email" name="username" type="email" required maxLength={254}
                                           autoComplete="username" value={email}
                                           onChange={(event) => setEmail(event.target.value)}
                                           placeholder="pilot@galaxy.space"/>
                                </div>
                            </div>
                            <div className="portal-auth-field">
                                <span className="portal-field-icon" aria-hidden="true"><PasswordIcon size={18}/></span>
                                <div className="portal-input-wrap">
                                    <label htmlFor="pilot-password">ПАРОЛЬ ДОСТУПА</label>
                                    <input id="pilot-password" name="password" type="password" required minLength={8}
                                           maxLength={72}
                                           autoComplete={isRegister ? 'new-password' : 'current-password'}
                                           value={password} onChange={(event) => setPassword(event.target.value)}
                                           placeholder="От 8 до 72 символов"/>
                                </div>
                            </div>
                            {isRegister && (
                                <div className="portal-auth-field">
                                    <span className="portal-field-icon" aria-hidden="true"><PasswordConfirmIcon
                                        size={18}/></span>
                                    <div className="portal-input-wrap">
                                        <label htmlFor="pilot-password-confirm">ПОДТВЕРЖДЕНИЕ ПАРОЛЯ</label>
                                        <input id="pilot-password-confirm" name="confirmPassword" type="password"
                                               required minLength={8} maxLength={72} autoComplete="new-password"
                                               value={confirmPassword}
                                               onChange={(event) => setConfirmPassword(event.target.value)}
                                               placeholder="Повторите пароль"/>
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="portal-auth-message" role="status" aria-live="polite">
                            {error && <span>{error}</span>}
                        </p>

                        <nav className="portal-menu" aria-label="Действие с аккаунтом">
                            <button
                                className={`portal-submit-card ${isRegister ? 'portal-submit-card--register' : ''}`}
                                disabled={busy}
                                type="submit"
                            >
                                <span className="portal-card-icon" aria-hidden="true">
                                    {isRegister ? <RegisterIcon size={20}/> : <LoginIcon size={20}/>}
                                </span>
                                <span className="portal-card-body">
                                    <span className="portal-card-title">
                                        {busy ? 'Подключение…' : isRegister ? 'Создать аккаунт' : 'Войти в игру'}
                                        {isRegister && <span className="portal-card-badge">стартовый флот</span>}
                                    </span>
                                    <span className="portal-card-desc">
                                        {isRegister
                                            ? 'Регистрация пилота и получение стартового корабля'
                                            : 'Авторизация пилота по email и паролю'}
                                    </span>
                                </span>
                                <span className="portal-card-cta">
                                    {isRegister ? 'Создать' : 'Войти'} <span aria-hidden="true">→</span>
                                </span>
                            </button>
                        </nav>

                        <div className="portal-auth-switch">
                            <span>{isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}</span>
                            <button type="button" disabled={busy} onClick={switchMode}>
                                {isRegister ? 'Войти в игру' : 'Зарегистрироваться'}
                            </button>
                        </div>
                    </form>
                </AuthPanel>
            </div>
        </main>
    );
}
