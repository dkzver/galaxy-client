import type {ButtonHTMLAttributes} from 'react';

export interface TradeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
}

// Кнопки торговли используют общую разметку и SVG-иконки из референса ангара.
export function BuyButton({label = 'Купить', ...props}: TradeButtonProps) {
    return (
        <button {...props} className={`trade-button buy ${props.className || ''}`.trim()}>
            {label}
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"
                 stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
                <path d="M5 12h14m-5-5 5 5-5 5"/>
            </svg>
        </button>
    );
}

export function SellButton({label = 'Продать', ...props}: TradeButtonProps) {
    return (
        <button {...props} className={`trade-button sell ${props.className || ''}`.trim()}>
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"
                 stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
                <path d="M19 12H5m5-5-5 5 5 5"/>
            </svg>
            {label}
        </button>
    );
}
