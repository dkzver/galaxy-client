// Стеклянная панель портала: отдельная оболочка для содержимого входа и регистрации.
import type {ReactNode} from 'react';

export default function AuthPanel({children}: {children: ReactNode}) {
    return (
        <section className="portal-glass-panel" aria-label="Вход в Galaxy">
            <div className="portal-panel-body">{children}</div>
        </section>
    );
}
