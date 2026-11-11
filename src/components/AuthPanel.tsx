// Стеклянная панель портала: отдельная оболочка для содержимого входа и регистрации.
import type {ReactNode} from 'react';

interface Props {
    children: ReactNode,
    header: ReactNode
}

export default function AuthPanel({children, header}: Props) {
    return (
        <section className="portal-glass-panel" aria-label="Вход в Galaxy">
            <header className="portal-panel-head">
                {header}
            </header>
            <div className="portal-panel-body">{children}</div>
        </section>
    );
}
