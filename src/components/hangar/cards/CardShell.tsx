// Единый каркас правой колонки: надзаголовок, строки, блок цен, ошибка и кнопка действия.
import type {ReactNode} from 'react';
import ErrorLine from '../../ui/ErrorLine';

export type CardRow = {label: ReactNode; value: ReactNode};

type Props = {
    eyebrow?: ReactNode;
    title?: ReactNode;
    rows?: CardRow[];
    priceRows?: CardRow[];
    total?: CardRow | null;
    note?: ReactNode;
    notice?: ReactNode;
    error?: string;
    action?: ReactNode;
    children?: ReactNode;
};

export default function CardShell({
    eyebrow,
    title,
    rows,
    priceRows,
    total,
    note,
    notice,
    error,
    action,
    children,
}: Props) {
    return (
        <>
            {eyebrow && <span className="ship-sub">{eyebrow}</span>}
            {title && <strong className="ship-title">{title}</strong>}
            {rows && rows.length > 0 && (
                <div className="ship-rows">
                    {rows.map((row, index) => (
                        <div className="ship-row" key={index}>
                            <span>{row.label}</span>
                            <b>{row.value}</b>
                        </div>
                    ))}
                </div>
            )}
            {children}
            {priceRows && priceRows.length > 0 && (
                <div className="ship-rows shop-price-rows">
                    {priceRows.map((row, index) => (
                        <div className="ship-row" key={index}>
                            <span>{row.label}</span>
                            <b>{row.value}</b>
                        </div>
                    ))}
                </div>
            )}
            {total && (
                <div className="trade-sale-total">
                    <span>{total.label}</span>
                    <b>{total.value}</b>
                </div>
            )}
            {notice}
            {note && <p className="shop-note">{note}</p>}
            <ErrorLine text={error ?? ''}/>
            {action && <div className="shop-actions">{action}</div>}
        </>
    );
}
