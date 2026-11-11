// Подсказка при наведении: содержимое, позиция и портал.
import {useCallback, useLayoutEffect, useRef, useState} from 'react';
import type {TipContent} from '../lib/tips';

// 'right' — рядом с плиткой корабля, 'above' — над кнопкой фильтра.
export type TipPlacement = 'right' | 'above';

type TipState = {content: TipContent; target: HTMLElement; placement: TipPlacement};

export function useTooltip() {
    const [tip, setTip] = useState<TipState | null>(null);
    const [tipPlaced, setTipPlaced] = useState(false);
    const tipRef = useRef<HTMLDivElement>(null);

    // Подсказка ставится рядом с элементом: справа — если не влезает, слева;
    // над кнопкой — если сверху нет места, под ней.
    useLayoutEffect(() => {
        const box = tipRef.current;
        if (!tip || !box) return;

        const rect = tip.target.getBoundingClientRect();
        const width = box.offsetWidth;
        const height = box.offsetHeight;

        if (tip.placement === 'above') {
            const left = Math.max(8, Math.min(
                rect.left + rect.width / 2 - width / 2,
                window.innerWidth - width - 8,
            ));
            const above = rect.top - height - 8;
            const top = above >= 8
                ? above
                : Math.min(window.innerHeight - height - 8, rect.bottom + 8);
            box.style.left = `${left}px`;
            box.style.top = `${top}px`;
        } else {
            let left = rect.right + 10;
            if (left + width > window.innerWidth - 8) left = Math.max(8, rect.left - width - 10);
            const top = Math.min(window.innerHeight - height - 8, Math.max(8, rect.top));
            box.style.left = `${left}px`;
            box.style.top = `${top}px`;
        }
        setTipPlaced(true);
    }, [tip]);

    const showTip = useCallback((target: HTMLElement, content: TipContent, placement: TipPlacement = 'right') => {
        setTipPlaced(false);
        setTip({target, content, placement});
    }, []);

    const hideTip = useCallback(() => {
        setTip(null);
        setTipPlaced(false);
    }, []);

    return {showTip, hideTip, tip, tipRef, tipPlaced};
}
