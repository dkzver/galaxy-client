// Стеклянная панель портала: отдельная оболочка для содержимого входа и регистрации.
import type {ReactNode} from 'react';

interface Props {
    children: ReactNode,
    // Слот заголовка панели: сейчас не выводится, оставлен для совместимости с экраном входа.
    header?: ReactNode
}

export default function AuthPanel({children}: Props) {
    return (
        <section className="portal-glass-panel" aria-label="Вход в Galaxy">
            <div className="portal-panel-body">{children}</div>
        </section>
    );
}
