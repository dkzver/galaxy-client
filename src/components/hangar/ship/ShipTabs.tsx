// Вкладки карточки корабля: свойства, трюмы и крепления.
export type ShipTab = 'props' | 'holds' | 'slots';

type Props = {
    title: string;
    holds: number;
    slots: number;
    active: ShipTab;
    onChange: (tab: ShipTab) => void;
};

export default function ShipTabs({title, holds, slots, active, onChange}: Props) {
    return (
        <div className="tabs ship-tabs" role="tablist" aria-label="Разделы карточки корабля">
            <button className={`tab${active === 'props' ? ' active' : ''}`} type="button" role="tab"
                    aria-selected={active === 'props'} onClick={() => onChange('props')}>
                {title}
            </button>
            {holds > 0 && (
                <button className={`tab${active === 'holds' ? ' active' : ''}`} type="button" role="tab"
                        aria-selected={active === 'holds'} onClick={() => onChange('holds')}>
                    Трюмы <small>{holds}</small>
                </button>
            )}
            {slots > 0 && (
                <button className={`tab${active === 'slots' ? ' active' : ''}`} type="button" role="tab"
                        aria-selected={active === 'slots'} onClick={() => onChange('slots')}>
                    Крепления <small>{slots}</small>
                </button>
            )}
        </div>
    );
}
