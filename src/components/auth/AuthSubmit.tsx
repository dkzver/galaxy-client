// Карточка действия: иконка, заголовок, описание, значок и призыв к действию.
import type {ReactNode} from 'react';

type Props = {
    icon: ReactNode;
    title: string;
    description: string;
    cta: string;
    busy: boolean;
    badge?: string;
    register?: boolean;
};

export default function AuthSubmit({icon, title, description, cta, busy, badge, register = false}: Props) {
    return (
        <nav className="portal-menu" aria-label="Действие с аккаунтом">
            <button
                className={`portal-submit-card${register ? ' portal-submit-card--register' : ''}`}
                disabled={busy}
                type="submit"
            >
                <span className="portal-card-icon" aria-hidden="true">{icon}</span>
                <span className="portal-card-body">
                    <span className="portal-card-title">
                        {busy ? 'Подключение…' : title}
                        {badge && <span className="portal-card-badge">{badge}</span>}
                    </span>
                    <span className="portal-card-desc">{description}</span>
                </span>
                <span className="portal-card-cta">
                    {cta} <span aria-hidden="true">→</span>
                </span>
            </button>
        </nav>
    );
}
