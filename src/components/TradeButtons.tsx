import type {ButtonHTMLAttributes} from 'react';

type TradeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

// Кнопки торговли используют общую разметку и SVG-иконки из референса ангара.
export function BuyButton(props: TradeButtonProps) {
    return (
        <button {...props} className={`trade-button buy ${props.className || ''}`.trim()}>
            Купить
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"
                 stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
                <path d="M5 12h14m-5-5 5 5-5 5"/>
            </svg>
        </button>
    );
}

export function SellButton(props: TradeButtonProps) {
    return (
        <button {...props} className={`trade-button sell ${props.className || ''}`.trim()}>
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"
                 stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
                <path d="M19 12H5m5-5-5 5 5 5"/>
            </svg>
            Продать
        </button>
    );
}
