// Каркас модального окна: затемнение, выход по клику вне окна и роль dialog.
import type {ReactNode} from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    backdropClassName: string;
    dialogClassName: string;
    ariaLabel?: string;
    labelledBy?: string;
    closeOnBackdrop?: boolean;
    children: ReactNode;
};

export default function Modal({
    open,
    onClose,
    backdropClassName,
    dialogClassName,
    ariaLabel,
    labelledBy,
    closeOnBackdrop = true,
    children,
}: Props) {
    if (!open) return null;
    return (
        <div className={backdropClassName} role="presentation"
             onMouseDown={(event) => {
                 if (closeOnBackdrop && event.target === event.currentTarget) onClose();
             }}>
            <section className={dialogClassName} role="dialog" aria-modal="true"
                     aria-label={ariaLabel} aria-labelledby={labelledBy}>
                {children}
            </section>
        </div>
    );
}
