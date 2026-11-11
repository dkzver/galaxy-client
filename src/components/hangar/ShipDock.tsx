// Док: галерея кораблей и карточка перехода в каталог флота.
import type {CSSProperties, Dispatch, RefObject, SetStateAction} from 'react';
import type {DockShip} from '../../lib/ship';
import {formatNumber} from '../../lib/format';
import {HangarIcon} from '../ui/HangarIcon';

type Gallery = {
    start: number;
    visible: number;
    listRef: RefObject<HTMLDivElement>;
    setStart: Dispatch<SetStateAction<number>>;
};

type Props = {
    ships: DockShip[];
    forSale: boolean;
    forSaleShipId: number | null;
    selectedShipId: string | number | null;
    gallery: Gallery;
    onSelectOwn: (shipId: string | number) => void;
    onSelectForSale: (shipId: number) => void;
    onToggleFleet: () => void;
};

export default function ShipDock({
    ships,
    forSale,
    forSaleShipId,
    selectedShipId,
    gallery,
    onSelectOwn,
    onSelectForSale,
    onToggleFleet,
}: Props) {
    const {start, visible, listRef, setStart} = gallery;

    return (
        <section className="panel-block glass dock-panel">
            <div className="panel-body dock-body">
                <div className="ship-gallery">
                    <button
                        className={`ship-gallery-arrow${start > 0 ? '' : ' unavailable'}`}
                        type="button" aria-label="Показать предыдущие корабли"
                        disabled={start <= 0}
                        onClick={() => setStart((current) => Math.max(0, current - visible))}>
                        <span style={{transform: 'scaleX(-1)'}}><HangarIcon name="chevron" size={18}/></span>
                    </button>
                    <div className="ship-list" ref={listRef}
                         style={{'--ship-gallery-visible-count': visible} as CSSProperties}
                         aria-live="polite">
                        {ships.slice(start, start + visible).map((row) => {
                            const isSelected = row.isForSale
                                ? forSaleShipId === row.id
                                : String(selectedShipId) === String(row.id);
                            return (
                                <button
                                    className={`ship-card${isSelected ? ' selected' : ''}`}
                                    key={row.id} type="button"
                                    aria-current={isSelected}
                                    onClick={() => {
                                        if (row.isForSale) {
                                            onSelectForSale(Number(row.id));
                                        } else {
                                            onSelectOwn(row.id);
                                        }
                                    }}>
                                    <div className="ship-visual">
                                        <span className="item-icon ship">
                                            <HangarIcon name="ship" size={22}/>
                                        </span>
                                        {isSelected && !row.isForSale
                                            && <span className="active-tag">ВЫБРАН</span>}
                                    </div>
                                    <div className="ship-meta">
                                        <strong>{row.name}</strong>
                                        <span>{row.isForSale
                                            ? `${formatNumber(row.price)} ¤`
                                            : 'В АНГАРЕ'}</span>
                                    </div>
                                </button>
                            );
                        })}
                        {ships.length === 0 && (
                            <div className="ship-gallery-empty">Корабль ангара ещё не загружен</div>
                        )}
                    </div>
                    <button
                        className={`ship-gallery-arrow${start + visible < ships.length ? '' : ' unavailable'}`}
                        type="button" aria-label="Показать следующие корабли"
                        disabled={start + visible >= ships.length}
                        onClick={() => setStart((current) =>
                            Math.min(ships.length - visible, current + visible))}>
                        <HangarIcon name="chevron" size={18}/>
                    </button>
                </div>
                <button className="ship-card ship-buy-card" type="button"
                        onClick={onToggleFleet}
                        aria-label={forSale ? 'Показать мои корабли' : 'Показать корабли для продажи'}
                        title={forSale ? 'Показать мои корабли' : 'Показать корабли для продажи'}>
                    <span className="ship-buy-label">{forSale ? 'МОИ КОРАБЛИ' : 'КУПИТЬ КОРАБЛЬ'}</span>
                    <span className="ship-buy-hint">{forSale ? 'АНГАР ПИЛОТА' : 'КАТАЛОГ ФЛОТА'}</span>
                </button>
            </div>
        </section>
    );
}
