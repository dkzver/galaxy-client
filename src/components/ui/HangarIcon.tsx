// Иконки ангара: именованные контуры, которые приходят из каталога строкой.
import type {ReactNode} from 'react';

const iconShapes: Record<string, ReactNode> = {
    ship: <><path d="m12 3 5 7-1 8-4-2-4 2-1-8 5-7Z"/><path d="M10 12h4M12 3v7"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    shipAdd: <><path d="m4 10 8-6 8 6-2 8H6l-2-8Z"/><path d="M4 10h16M8 14h2m4 0h2"/><path d="M19 3v6m-3-3h6"/></>,
    weapon: <><path d="m5 19 4-4m2-2 8-8v5l-8 8H6v-5l8-8h5"/><path d="m14 10 3 3"/></>,
    shield: <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z"/>,
    engine: <><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></>,
    fuel: <><path d="M7 21V4h7v17M7 9h7"/><path d="M14 7h3l2 3v6a2 2 0 0 1-4 0v-3"/></>,
    crate: <><rect x="3" y="7" width="18" height="13" rx="1"/><path d="M3 11h18M9 7v13"/></>,
    gem: <><path d="m6 4 12 0 3 5-9 11L3 9l3-5Z"/><path d="M3 9h18M9 4l-1 5 4 11 4-11-1-5"/></>,
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>,
    radar: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m12 12 6-6"/></>,
    tool: <><path d="m14.7 6.3 3 3M5 21l8.4-8.4M8 4l3-1 2 2-1 3-3 1-2-2 1-3Zm8 8 3-1 2 2-1 3-3 1-2-2 1-3Z"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    map: <><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></>,
    launch: <><path d="M5 19c2.5-.2 4.5-1.2 5.8-3"/><path d="M9 15 6 12c2.8-5.3 7-8 13-9-.8 6-3.5 10.2-9 13l-1-1"/><circle cx="15" cy="8" r="1.5"/></>,
    credits: <><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.6-1-1.5-1.5-3-1.5-2 0-3 1-3 2.2 0 3.1 6 1 6 4 0 1.2-1 2.3-3 2.3-1.5 0-2.6-.5-3.2-1.5M12 6v2m0 8.5V19"/></>,
    account: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
};

export function HangarIcon({name, size = 18}: {name?: string | null; size?: number}) {
    return (
        <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}
             stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}>
            {iconShapes[name || 'grid'] || iconShapes.grid}
        </svg>
    );
}
