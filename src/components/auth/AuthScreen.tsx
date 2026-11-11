// Экран входа и регистрации: компоновка портала и поля формы.
import {useAuthForm} from '../../hooks/useAuthForm';
import type {AuthResponse} from '../../types';
import {
    EmailIcon,
    LoginIcon,
    PasswordConfirmIcon,
    PasswordIcon,
    RegisterIcon,
} from '../ui/Icons';
import AuthBackground from './AuthBackground';
import AuthField from './AuthField';
import AuthPanel from './AuthPanel';
import AuthSubmit from './AuthSubmit';
import AuthSwitch from './AuthSwitch';
import './auth.css';

interface Props {
    onAuthenticated: (result: AuthResponse) => void;
    initialError: string;
}

export default function AuthScreen({onAuthenticated, initialError}: Props) {
    const form = useAuthForm(initialError, onAuthenticated);
    const {fields, isRegister} = form;

    return (
        <main className="portal-auth">
            <AuthBackground/>
            <div className="portal-wrap">
                <AuthPanel>
                    <h1 className="portal-title">GALAXY</h1>
                    <p className="portal-sub">
                        Введите email и пароль для входа на карту космоса или создайте аккаунт нового пилота со
                        стартовым флотом.
                    </p>

                    <form onSubmit={form.submit} className="portal-auth-form">
                        <div className="portal-auth-fields">
                            <AuthField id="pilot-email" name="username"
                                       icon={<EmailIcon size={18}/>} label="EMAIL ПИЛОТА"
                                       type="email" required maxLength={254} autoComplete="username"
                                       value={fields.email} onChange={fields.setEmail}
                                       placeholder="pilot@galaxy.space"/>
                            <AuthField id="pilot-password" name="password"
                                       icon={<PasswordIcon size={18}/>} label="ПАРОЛЬ ДОСТУПА"
                                       type="password" required minLength={8} maxLength={72}
                                       autoComplete={isRegister ? 'new-password' : 'current-password'}
                                       value={fields.password} onChange={fields.setPassword}
                                       placeholder="От 8 до 72 символов"/>
                            {isRegister && (
                                <AuthField id="pilot-password-confirm" name="confirmPassword"
                                           icon={<PasswordConfirmIcon size={18}/>} label="ПОДТВЕРЖДЕНИЕ ПАРОЛЯ"
                                           type="password" required minLength={8} maxLength={72}
                                           autoComplete="new-password"
                                           value={fields.confirmPassword} onChange={fields.setConfirmPassword}
                                           placeholder="Повторите пароль"/>
                            )}
                        </div>

                        {form.error && (
                            <p className="portal-auth-message" role="status" aria-live="polite">
                                <span>{form.error}</span>
                            </p>
                        )}

                        <AuthSubmit
                            icon={isRegister ? <RegisterIcon size={20}/> : <LoginIcon size={20}/>}
                            title={isRegister ? 'Создать аккаунт' : 'Войти в игру'}
                            description={isRegister
                                ? 'Регистрация пилота и получение стартового корабля'
                                : 'Авторизация пилота по email и паролю'}
                            badge={isRegister ? 'стартовый флот' : undefined}
                            cta={isRegister ? 'Создать' : 'Войти'}
                            busy={form.busy}
                            register={isRegister}/>

                        <AuthSwitch hint={isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
                                    action={isRegister ? 'Войти в игру' : 'Зарегистрироваться'}
                                    disabled={form.busy}
                                    onClick={form.switchMode}/>
                    </form>
                </AuthPanel>
            </div>
        </main>
    );
}
