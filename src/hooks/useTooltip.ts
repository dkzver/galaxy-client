// Подсказка при наведении: содержимое, позиция и портал.
import {useCallback, useLayoutEffect, useRef, useState} from 'react';
import type {TipContent} from '../lib/tips';

type TipState = {content: TipContent; target: HTMLElement};

export function useTooltip() {
    const [tip, setTip] = useState<TipState | null>(null);
    const [tipPlaced, setTipPlaced] = useState(false);
    const tipRef = useRef<HTMLDivElement>(null);

    // Подсказка ставится рядом с элементом: справа, а если не влезает — слева.
    useLayoutEffect(() => {
        const target = tip?.target;
        const box = tipRef.current;
        if (!target || !box) return;

        const rect = target.getBoundingClientRect();
        const width = box.offsetWidth;
        const height = box.offsetHeight;
        let left = rect.right + 10;
        if (left + width > window.innerWidth - 8) left = Math.max(8, rect.left - width - 10);
        const top = Math.min(window.innerHeight - height - 8, Math.max(8, rect.top));
        box.style.left = `${left}px`;
        box.style.top = `${top}px`;
        setTipPlaced(true);
    }, [tip]);

    const showTip = useCallback((target: HTMLElement, content: TipContent) => {
        setTipPlaced(false);
        setTip({target, content});
    }, []);

    const hideTip = useCallback(() => {
        setTip(null);
        setTipPlaced(false);
    }, []);

    return {showTip, hideTip, tip, tipRef, tipPlaced};
}
