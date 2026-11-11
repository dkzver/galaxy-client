// Галерея дока: старт, число видимых карточек по фактической ширине и сброс.
import {useEffect, useRef, useState} from 'react';

export function useDockGallery(itemCount: number) {
    const [start, setStart] = useState(0);
    const [visible, setVisible] = useState(1);
    const listRef = useRef<HTMLDivElement>(null);

    // Карточек помещается столько, сколько влезает в ширину списка.
    useEffect(() => {
        const host = listRef.current;
        if (!host) return;
        const measure = () => {
            const styles = window.getComputedStyle(host);
            const cardWidth = Number.parseFloat(styles.getPropertyValue('--ship-gallery-card-width'));
            const gap = Number.parseFloat(styles.columnGap) || 0;
            if (!Number.isFinite(cardWidth) || cardWidth <= 0) return;
            setVisible(Math.max(1, Math.floor((host.clientWidth + gap) / (cardWidth + gap))));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(host);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        setStart((current) => Math.min(current, Math.max(0, itemCount - visible)));
    }, [itemCount, visible]);

    return {start, setStart, visible, listRef, reset: () => setStart(0)};
}
