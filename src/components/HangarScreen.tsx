// Ангар-магазин: React-версия каталога, дока и панелей из HTML-референса.
import {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {executeTrade} from '../api';
import type {HangarShip, HangarShipHold, HangarShipSlot, HangarStatus, TradeActionType} from '../types';
import catalog from '../data/galaxy-admin-data.json';

import {BuyButton, SellButton} from './TradeButtons';
import './hangar-reference.css';

type CatalogItem = {
    id: number;
    name: string;
    categoryId?: number;
    values?: Record<string, string | number | undefined>;
    price_buy?: string | number;
    price_sale?: string | number;
    icon?: string;
    slotId?: number | null;
};

type CatalogCategory = {
    id: number;
    name: string;
    icon?: string;
    propIds?: number[];
};

type CatalogTab = 'all' | 'equipment' | 'resources';
type DockShip = {
    id: string | number;
    name: string;
    isForSale: boolean;
    price_buy?: string | number;
    modelId?: number;
};

type HoldDisplayItem = {
    key: string;
    modelId: number;
    kind: 'equipment' | 'resource';
    name: string;
    categoryName?: string;
    icon?: string;
    mass: number;
    salePrice?: string | number;
};

type HoveredTooltip =
    | {kind: 'slot'; index: number; target: HTMLButtonElement}
    | {kind: 'hold-item'; holdIndex: number; itemIndex: number; target: HTMLButtonElement};

interface Props {
    token: string;
    hangar: HangarStatus | null;
    onHangarUpdate?: (hangar: HangarStatus) => void;
    error: string;
    email: string;
    onLaunch: () => void;
    onLogout: () => void;
    onDeleteAccount: () => Promise<void>;
}

const catalogItems: Record<CatalogTab, CatalogItem[]> = {
    all: [...catalog.equipments, ...catalog.resources],
    equipment: catalog.equipments,
    resources: catalog.resources,
};

const catalogCategories: Record<CatalogTab, CatalogCategory[]> = {
    all: [],
    equipment: catalog.categoriesEquipment,
    resources: catalog.categoriesResource,
};

const tabLabels: Record<CatalogTab, string> = {
    all: 'ВСЁ',
    equipment: 'ОБОРУДОВАНИЕ',
    resources: 'РЕСУРСЫ',
};

const tradeActionLabels: Record<TradeActionType, string> = {
    buy_ship: 'Купить корабль',
    buy_equipment: 'Купить оборудование',
    buy_resource: 'Купить ресурс',
    sell_ship: 'Продать корабль',
    sell_equipment: 'Продать оборудование',
    sell_resource: 'Продать ресурс',
    install_equipment: 'Установить оборудование',
    uninstall_equipment: 'Снять оборудование',
};

const iconShapes: Record<string, ReactNode> = {
    ship: <><path d="m12 3 5 7-1 8-4-2-4 2-1-8 5-7Z"/><path d="M10 12h4M12 3v7"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    shipAdd: <><path d="m4 10 8-6 8 6-2 8H6l-2-8Z"/><path d="M4 10h16M8 14h2m4 0h2"/><path d="M19 3v6m-3-3h6"/></>,
    rocket: <><path d="M12 3c3 3 4.5 6 4.5 9L12 16l-4.5-4C7.5 9 9 6 12 3Z"/><path d="m9 17-2 4 4-2m4-2 2 4-4-2"/></>,
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

// Иконки из каталога рендерятся inline-SVG, как в исходном ангаре.
function HangarIcon({name, size = 18}: {name?: string; size?: number}) {
    return (
        <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}
             stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}>
            {iconShapes[name || 'grid'] || iconShapes.grid}
        </svg>
    );
}

// Плоский силуэт корабля повторяет графику карточек флота в референсе.
function ShipGlyph({compact = false}: {compact?: boolean}) {
    return (
        <svg className={`ship-glyph${compact ? ' compact' : ''}`} viewBox="0 0 220 100" fill="none"
             aria-hidden="true">
            <path d="M12 52 56 40 88 14h45l17 24 58 14-58 12-20 24H88L57 65 12 52Z"
                  fill="currentColor" opacity=".16"/>
            <path d="M13 52h195M57 40l31 12-31 13M88 14l14 38-14 36M133 14l-13 38 10 36M150 38l-30 14 30 12"
                  stroke="currentColor"/>
            <path d="M94 42h30l7 10-8 10H94l-8-10 8-10Z" fill="currentColor" opacity=".45"/>
            <path d="m45 45-20 7 20 7m114-16 33 9-33 8" stroke="currentColor" strokeWidth="2"/>
        </svg>
    );
}

function formatNumber(value: string | number | undefined) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString('ru-RU') : '—';
}

function getCatalogPropertyValue(item: CatalogItem | undefined, propertyId: number) {
    return item?.values?.[String(propertyId)];
}

const holdTitle: string = 'Трюм';

const slotIcons: Record<number, string> = {
    1: 'weapon',
    2: 'weapon',
    3: 'shield',
    4: 'engine',
    5: 'radar',
    6: 'gem',
    7: 'tool',
    8: 'tool',
    9: 'crate',
    10: 'grid',
    11: 'fuel',
};

function ShipInformation({
    name,
    meta,
    model,
    shipSlots,
    shipHolds,
    rows = [],
    onOpenSlot,
}: {
    name: string;
    meta: string;
    model?: typeof catalog.ships[number];
    shipSlots?: HangarShipSlot[];
    shipHolds?: HangarShipHold[];
    rows?: Array<{label: string; value: string}>;
    onOpenSlot?: (slotTypeId: number, slotRowId?: number, slotEquipmentId?: number | null) => void;
}) {
    const [hoveredTooltip, setHoveredTooltip] = useState<HoveredTooltip | null>(null);
    const tooltipId = useId();
    const tooltipRef = useRef<HTMLDivElement>(null);
    const slotViews = shipSlots
        ? shipSlots.map((slot) => ({id: slot.id, slotId: slot.slot_id, equipmentId: slot.equipment_id}))
        : model?.slots.map((slot, index) => ({id: index, slotId: slot.slotId, equipmentId: slot.itemId || null}));
    const holdViews = shipHolds
        ? shipHolds.map((hold) => ({
            id: hold.id,
            index: hold.hold_index,
            capacity: hold.capacity_mass,
            occupied: hold.occupied_mass,
            cargoMass: hold.resources.reduce((mass, resource) => mass + Number(resource.amount), 0),
            cargoBoxName: hold.source_equipment_model_id
                ? catalog.equipments.find((item) => item.id === hold.source_equipment_model_id)?.name
                : undefined,
            items: [
                ...hold.equipment.map((instance): HoldDisplayItem => {
                    const item = catalog.equipments.find((entry) => entry.id === instance.equipment_id);
                    return {
                        key: `equipment-${instance.id}`,
                        modelId: instance.equipment_id,
                        kind: 'equipment',
                        name: item?.name || `Оборудование ${instance.equipment_id}`,
                        categoryName: catalog.categoriesEquipment.find((category) =>
                            category.id === item?.categoryId)?.name,
                        icon: item?.icon || 'tool',
                        mass: Number(getCatalogPropertyValue(item, catalog.settings.id_propert_mass_value) || 0),
                        salePrice: item?.price_sale,
                    };
                }),
                ...hold.resources.map((instance): HoldDisplayItem => {
                    const item = catalog.resources.find((entry) => entry.id === instance.resource_id);
                    return {
                        key: `resource-${instance.id}`,
                        modelId: instance.resource_id,
                        kind: 'resource',
                        name: item?.name || `Ресурс ${instance.resource_id}`,
                        categoryName: catalog.categoriesResource.find((category) =>
                            category.id === item?.categoryId)?.name,
                        icon: item?.icon || 'gem',
                        mass: Number(instance.amount),
                        salePrice: item?.price_sale,
                    };
                }),
            ],
        }))
        : model?.holds.map((hold, index) => {
            const equipmentId = Number(hold.itemId || 0);
            const item = equipmentId > 0
                ? catalog.equipments.find((entry) => entry.id === equipmentId)
                : undefined;
            const mass = Number(getCatalogPropertyValue(item, catalog.settings.id_propert_mass_value) || 0);
            return {
                id: index,
                index,
                capacity: hold.capacity,
                occupied: mass,
                cargoMass: 0,
                cargoBoxName: undefined,
                items: item ? [{
                    key: `equipment-${equipmentId}`,
                    modelId: equipmentId,
                    kind: 'equipment' as const,
                    name: item.name,
                    categoryName: catalog.categoriesEquipment.find((category) =>
                        category.id === item.categoryId)?.name,
                    icon: item.icon || 'tool',
                    mass,
                    salePrice: item.price_sale,
                }] : [],
            };
        });

    function showSlotTooltip(target: HTMLButtonElement, index: number) {
        setHoveredTooltip({kind: 'slot', index, target});
    }

    function showHoldItemTooltip(target: HTMLButtonElement, holdIndex: number, itemIndex: number) {
        setHoveredTooltip({kind: 'hold-item', holdIndex, itemIndex, target});
    }

    useLayoutEffect(() => {
        if (!hoveredTooltip || !tooltipRef.current) return;

        const tooltip = tooltipRef.current;
        const placeTooltip = () => {
            if (!hoveredTooltip.target.isConnected) {
                setHoveredTooltip(null);
                return;
            }

            const bounds = hoveredTooltip.target.getBoundingClientRect();
            const left = bounds.right + tooltip.offsetWidth + 10 <= window.innerWidth - 8
                ? bounds.right + 10
                : Math.max(8, bounds.left - tooltip.offsetWidth - 10);
            const top = Math.min(
                window.innerHeight - tooltip.offsetHeight - 8,
                Math.max(8, bounds.top),
            );

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        };

        placeTooltip();
        window.addEventListener('resize', placeTooltip);
        window.addEventListener('scroll', placeTooltip, true);
        return () => {
            window.removeEventListener('resize', placeTooltip);
            window.removeEventListener('scroll', placeTooltip, true);
        };
    }, [hoveredTooltip, slotViews, holdViews]);

    return (
        <>
            <strong className="ship-title">{name}</strong>
            <span className="ship-sub ship-meta-line">{meta}</span>
            <div className="ship-rows">
                {model?.values && Object.entries(model.values).map(([id, value]) => {
                    const property = catalog.properties.find((entry) => entry.id === Number(id));
                    if (!property) return null;
                    return (
                        <div className="ship-row" key={id}>
                            <span>{property.name}</span>
                            <b>{formatNumber(value)} {property.unit && <small>{property.unit}</small>}</b>
                        </div>
                    );
                })}
                {rows.map((row) => (
                    <div className="ship-row" key={row.label}>
                        <span>{row.label}</span><b>{row.value}</b>
                    </div>
                ))}
                {!model && (
                    <div className="ship-row">
                        <span>Характеристики</span><b>Не загружены</b>
                    </div>
                )}
            </div>
            <span className="ship-sub">Трюмы · {holdViews ? holdViews.length : '—'}</span>
            {holdViews?.length ? (
                <div className="hold-list">
                    {holdViews.map((hold) => {
                        const capacity = Number(hold.capacity);
                        const occupied = Number(hold.occupied);
                        const percent = capacity > 0
                            ? Math.min(Math.round(occupied / capacity * 100), 100)
                            : 0;
                        return (
                            <div className="hold-row" key={`${holdTitle}-${hold.id}`}>
                                <div className="hold-head">
                                    <strong>{holdTitle} {hold.index + 1}</strong>
                                    <span>
                                        {formatNumber(occupied)} / {formatNumber(capacity)} кг
                                        {hold.cargoMass > 0
                                            && ` · груз ${formatNumber(hold.cargoMass)} кг`}
                                    </span>
                                </div>
                                <i className="hold-bar">
                                    <em style={{width: `${percent}%`}}/>
                                </i>
                                {hold.items.length > 0 ? (
                                    <div className="slot-grid hold-grid">
                                        {hold.items.map((item, itemIndex) => (
                                            <button
                                                key={item.key}
                                                type="button"
                                                className="slot-tile hold-tile"
                                                data-action="select-hold-item"
                                                data-hold={hold.index}
                                                data-item={itemIndex}
                                                aria-label={`${item.name}, ${formatNumber(item.mass)} кг, ${holdTitle.toLowerCase()} ${hold.index + 1}`}
                                                aria-describedby={hoveredTooltip?.kind === 'hold-item'
                                                    && hoveredTooltip.holdIndex === hold.index
                                                    && hoveredTooltip.itemIndex === itemIndex ? tooltipId : undefined}
                                                title={`${item.name} · ${formatNumber(item.mass)} кг`}
                                                onMouseEnter={(event) =>
                                                    showHoldItemTooltip(event.currentTarget, hold.index, itemIndex)}
                                                onMouseLeave={() => setHoveredTooltip(null)}
                                                onFocus={(event) =>
                                                    showHoldItemTooltip(event.currentTarget, hold.index, itemIndex)}
                                                onBlur={() => setHoveredTooltip(null)}
                                            >
                                                <HangarIcon
                                                    name={item.kind === 'resource' ? 'crate' : item.icon || 'tool'}
                                                    size={22}
                                                />
                                                {item.kind === 'resource' && (
                                                    <span className="slot-cargo-chips">
                                                        <span
                                                            className="slot-cargo-chip"
                                                            data-cargo-key={`cargo:hold:${hold.index}:${itemIndex}:${item.modelId}`}
                                                            data-cargo-id={item.modelId}
                                                            data-cargo-name={item.name}
                                                            data-cargo-box={hold.cargoBoxName || `${holdTitle} ${hold.index + 1}`}
                                                            data-cargo-kg={item.mass}
                                                            data-cargo-sale={item.salePrice || 0}
                                                            data-cargo-icon={item.icon || 'gem'}
                                                        >
                                                            <HangarIcon name={item.icon || 'gem'} size={11}/>
                                                        </span>
                                                    </span>
                                                )}
                                                <span className="slot-qty">{formatNumber(item.mass)} кг</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="hold-empty">Пусто</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="hold-empty">
                    {holdViews ? 'У этого корабля нет трюмов' : 'Данные о трюмах не загружены'}
                </div>
            )}
            <span className="ship-sub">Слоты · {slotViews ? slotViews.length : '—'}</span>
            {slotViews?.length ? (
                <div className="slot-grid">
                    {slotViews.map((slot, index) => {
                        const slotName = catalog.slots.find((entry) => entry.id === slot.slotId)?.name
                            || 'Неизвестный тип слота';
                        const installedItem = slot.equipmentId
                            ? catalog.equipments.find((item) => item.id === slot.equipmentId)
                            : null;
                        const isEmpty = !installedItem;
                        const compatibleGoods = catalog.equipments.filter((item) => item.slotId === slot.slotId);
                        return (
                            <button
                                className={`slot-tile${isEmpty ? ' empty' : ''}${isEmpty && compatibleGoods.length
                                    ? ' has-goods'
                                    : ''}`}
                                key={`${slot.slotId}-${index}`}
                                type="button"
                                data-action="open-slot"
                                data-index={index}
                                aria-label={`${slotName}: ${installedItem?.name || 'слот пуст'}`}
                                aria-describedby={hoveredTooltip?.kind === 'slot'
                                    && hoveredTooltip.index === index ? tooltipId : undefined}
                                onMouseEnter={(event) => showSlotTooltip(event.currentTarget, index)}
                                onMouseLeave={() => setHoveredTooltip(null)}
                                onFocus={(event) => showSlotTooltip(event.currentTarget, index)}
                                onBlur={() => setHoveredTooltip(null)}
                                onClick={() => {
                                    onOpenSlot?.(slot.slotId, Number(slot.id), slot.equipmentId);
                                }}
                            >
                                {installedItem
                                    ? <HangarIcon name={installedItem.icon || slotIcons[slot.slotId] || 'grid'} size={22}/>
                                    : null}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="hold-empty">
                    {slotViews ? 'У этого корабля нет креплений' : 'Данные о слотах не загружены'}
                </div>
            )}
            {hoveredTooltip && createPortal(
                <div
                    className="hangar-slot-tooltip"
                    id={tooltipId}
                    ref={tooltipRef}
                    role="tooltip"
                    style={{left: 0, top: 0}}
                >
                    {hoveredTooltip.kind === 'slot' && slotViews?.[hoveredTooltip.index] ? (
                        <>
                            <h4>
                                {catalog.slots.find((entry) =>
                                    entry.id === slotViews[hoveredTooltip.index].slotId)?.name
                                    || 'Неизвестный тип слота'}
                            </h4>
                            <small>
                                {slotViews[hoveredTooltip.index].equipmentId
                                    ? catalog.equipments.find((item) =>
                                        item.id === slotViews[hoveredTooltip.index].equipmentId)?.name
                                        || 'Установленное оборудование'
                                    : 'Слот пуст'}
                            </small>
                        </>
                    ) : hoveredTooltip.kind === 'hold-item' ? (() => {
                        const hold = holdViews?.find((entry) => entry.index === hoveredTooltip.holdIndex);
                        const item = hold?.items[hoveredTooltip.itemIndex];
                        if (!hold || !item) return null;
                        const details = [
                            item.categoryName,
                            item.kind === 'resource'
                                ? `${formatNumber(item.mass)} кг`
                                : item.mass > 0 ? `${formatNumber(item.mass)} кг` : undefined,
                        ].filter(Boolean);

                        return (
                            <>
                                <h4>{item.name}</h4>
                                <div className="tip-item">
                                    <span className="tip-icon"><HangarIcon name={item.icon} size={16}/></span>
                                    <span className="tip-copy">
                                        <strong>{holdTitle} {hold.index + 1}</strong>
                                        {details.length > 0 && <small>{details.join(' · ')}</small>}
                                        {item.kind === 'resource' && Number(item.salePrice) > 0 && (
                                            <small>{formatNumber(item.salePrice)} ¤/кг</small>
                                        )}
                                    </span>
                                </div>
                            </>
                        );
                    })() : null}
                </div>,
                document.body,
            )}
        </>
    );
}

export default function HangarScreen({token, hangar, onHangarUpdate, error, email, onLaunch, onLogout, onDeleteAccount}: Props) {
    const [activeTab, setActiveTab] = useState<CatalogTab>('all');
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
    const [shipGalleryStart, setShipGalleryStart] = useState(0);
    const [visibleShipCount, setVisibleShipCount] = useState(1);
    const [showShipsForSale, setShowShipsForSale] = useState(false);
    const [selectedForSaleShipId, setSelectedForSaleShipId] = useState(catalog.ships[0]?.id ?? null);
    const [selectedOwnedShipId, setSelectedOwnedShipId] = useState<string | number | null>(null);
    const [tradeAction, setTradeAction] = useState<TradeActionType | null>(null);
    const [isActionTriggered, setIsActionTriggered] = useState(false);
    const [isTradeProcessing, setIsTradeProcessing] = useState(false);
    const [selectedSlotRowId, setSelectedSlotRowId] = useState<number>(0);
    const shipListRef = useRef<HTMLDivElement>(null);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const credits = formatNumber(hangar?.credits);
    const userShips = hangar?.ships ?? [];
    const ownedShip: HangarShip | null = userShips.find((ship) =>
        String(ship.id) === String(selectedOwnedShipId),
    ) || userShips[0] || null;
    const legacyShipModel = catalog.ships.find((ship) =>
        ship.name.toLowerCase() === hangar?.hull_type?.toLowerCase()
        || String(ship.id) === hangar?.hull_type,
    );
    const ownedShipModel = catalog.ships.find((ship) => ship.id === ownedShip?.ship_id)
        || (!ownedShip ? legacyShipModel : undefined);
    const shipName = ownedShipModel?.name || hangar?.hull_type?.toUpperCase() || 'КОРАБЛЬ';
    const categories = catalogCategories[activeTab];
    const visibleItems = catalogItems[activeTab].filter((item) =>
        (activeCategory === null || item.categoryId === activeCategory)
        && (selectedSlotId === null || item.slotId === selectedSlotId),
    );
    const selectedItem = visibleItems.find((item) => item.id === selectedItemId) || visibleItems[0] || null;
    const selectedForSaleShip = catalog.ships.find((ship) => ship.id === selectedForSaleShipId) || null;

    useEffect(() => {
        if (showShipsForSale && selectedForSaleShip) {
            const shipPrice = Number(selectedForSaleShip.price_buy || 0);
            const userCredits = hangar ? Number(hangar.credits || 0) : 0;
            if (hangar != null && userCredits >= shipPrice) {
                setTradeAction('buy_ship');
                setIsActionTriggered(true);
            } else {
                setTradeAction(null);
                setIsActionTriggered(false);
            }
        } else if (selectedItem != null) {
            const itemPrice = Number(selectedItem.price_buy || 0);
            const userCredits = hangar ? Number(hangar.credits || 0) : 0;
            const isEquipment = catalog.equipments.some((entry) => entry.id === selectedItem.id);

            if (isEquipment) {
                const activeShip = hangar?.ships?.[0];
                const massPropId = catalog.settings.id_propert_mass_value;
                const equipmentMass = Number(getCatalogPropertyValue(selectedItem, massPropId) || 0);

                const hasFreeSlot = activeShip?.slots?.some(
                    (s) => Number(s.slot_id) === Number(selectedItem.slotId) && s.equipment_id == null
                );
                const hasFreeHold = activeShip?.holds?.some(
                    (h) => (Number(h.capacity_mass || 0) - Number(h.occupied_mass || 0)) >= equipmentMass
                );

                const canPlace = Boolean(hasFreeSlot || hasFreeHold);

                if (hangar != null && itemPrice > 0 && userCredits >= itemPrice && canPlace) {
                    setTradeAction('buy_equipment');
                    setIsActionTriggered(true);
                } else {
                    setTradeAction(null);
                    setIsActionTriggered(false);
                }
            } else {
                if (hangar != null && itemPrice > 0 && userCredits >= itemPrice) {
                    setTradeAction('buy_resource');
                    setIsActionTriggered(true);
                } else {
                    setTradeAction(null);
                    setIsActionTriggered(false);
                }
            }
        } else if (!showShipsForSale && userShips.length > 0 && selectedSlotRowId === 0) {
            if (userShips.length > 1) {
                setTradeAction('sell_ship');
                setIsActionTriggered(true);
            } else {
                setTradeAction(null);
                setIsActionTriggered(false);
            }
        } else {
            setTradeAction(null);
            setIsActionTriggered(false);
        }
    }, [showShipsForSale, selectedForSaleShip, selectedItemId, selectedItem, activeTab, hangar, userShips, selectedSlotRowId]);

    async function handleTradeButtonClick() {
        if (!isActionTriggered || !tradeAction || isTradeProcessing) {
            console.warn('Действие заблокировано: триггер не установлен или выполняет обработку');
            return;
        }

        let optimisticPrice = 0;
        let isSale = false;

        if (tradeAction === 'buy_ship' && selectedForSaleShip) {
            optimisticPrice = Number(selectedForSaleShip.price_buy || 0);
        } else if (tradeAction === 'sell_ship' && ownedShipModel) {
            optimisticPrice = Number(ownedShipModel.price_sale || 0);
            isSale = true;
        } else if (selectedItem) {
            optimisticPrice = Number(selectedItem.price_buy || 0);
        }

        if (optimisticPrice > 0 && hangar && onHangarUpdate) {
            const currentCreds = Number(hangar.credits || 0);
            const newCreds = isSale ? currentCreds + optimisticPrice : Math.max(0, currentCreds - optimisticPrice);
            onHangarUpdate({
                ...hangar,
                credits: newCreds,
            });
        }

        setIsTradeProcessing(true);
        try {
            let payload: Record<string, unknown> = {};
            if (tradeAction === 'buy_ship' && selectedForSaleShip) {
                payload = {shipModelId: selectedForSaleShip.id};
            } else if (tradeAction === 'sell_ship' && ownedShip) {
                payload = {userShipId: ownedShip.id};
            } else if (tradeAction === 'buy_equipment' && selectedItem) {
                payload = {equipmentModelId: selectedItem.id};
            }

            const response = await executeTrade(token, tradeAction, payload);
            console.log('[CLIENT TRADE RESPONSE]', response);

            if (response.hangar && onHangarUpdate) {
                onHangarUpdate(response.hangar);
            }
            if (response.boughtShip) {
                setSelectedOwnedShipId(response.boughtShip.id);
                setShowShipsForSale(false);
            } else if (tradeAction === 'sell_ship') {
                const remaining = response.hangar?.ships?.find((s) => String(s.id) !== String(ownedShip?.id));
                if (remaining) {
                    setSelectedOwnedShipId(remaining.id);
                }
            }
        } catch (cause) {
            console.error('Ошибка выполнения торгового действия:', cause);
            if (optimisticPrice > 0 && hangar && onHangarUpdate) {
                const currentCreds = Number(hangar.credits || 0);
                const restoredCreds = isSale ? Math.max(0, currentCreds - optimisticPrice) : currentCreds + optimisticPrice;
                onHangarUpdate({
                    ...hangar,
                    credits: restoredCreds,
                });
            }
        } finally {
            setIsTradeProcessing(false);
        }
    }
    const ownedShips: DockShip[] = userShips.length
        ? userShips.map((ship) => ({
            id: ship.id,
            name: catalog.ships.find((model) => model.id === ship.ship_id)?.name || `Корабль ${ship.ship_id}`,
            isForSale: false,
            modelId: ship.ship_id,
        }))
        : hangar?.ship_id
            ? [{id: String(hangar.ship_id), name: shipName, isForSale: false}]
            : [];
    const ownedShipRows = ownedShip
        ? [
            {label: 'Состояние', value: ownedShip.status === 1 ? 'РАЗРУШЕН' : 'В СТРОЮ'},
            {label: 'Прочность корпуса', value: formatNumber(ownedShip.health)},
            {label: 'Щиты', value: formatNumber(ownedShip.shield)},
            {label: 'Кредиты', value: `${credits} ¤`},
        ]
        : [
            {label: 'Пилот', value: email},
            {label: 'Состояние', value: 'ГОТОВ'},
            {label: 'Кредиты', value: `${credits} ¤`},
        ];
    const dockShips: DockShip[] = showShipsForSale
        ? catalog.ships.map((ship) => ({...ship, isForSale: true}))
        : ownedShips;
    const visibleDockShips = dockShips.slice(shipGalleryStart, shipGalleryStart + visibleShipCount);
    const canShowPreviousShips = shipGalleryStart > 0;
    const canShowNextShips = shipGalleryStart + visibleShipCount < dockShips.length;
    const selectedItemTab: CatalogTab = selectedItem && activeTab === 'all'
        ? catalog.equipments.some((equipment) => equipment === selectedItem) ? 'equipment' : 'resources'
        : activeTab;
    const selectedItemCategory = selectedItem
        ? catalogCategories[selectedItemTab].find((category) => category.id === selectedItem.categoryId)
        : undefined;
    const groupedItems = visibleItems.reduce<Array<{id: string; name: string; icon: string; items: CatalogItem[]}>>(
        (groups, item) => {
            const itemTab: CatalogTab = activeTab === 'all'
                ? catalog.equipments.some((equipment) => equipment === item) ? 'equipment' : 'resources'
                : activeTab;
            const category = catalogCategories[itemTab].find((entry) => entry.id === item.categoryId);
            const groupId = `${itemTab}:${category?.id ?? 'other'}`;
            let group = groups.find((entry) => entry.id === groupId);
            if (!group) {
                group = {
                    id: groupId,
                    name: category?.name || tabLabels[itemTab],
                    icon: category?.icon || 'grid',
                    items: [],
                };
                groups.push(group);
            }
            group.items.push(item);
            return groups;
        },
        [],
    );

    // Определяем вместимость галереи по её фактической ширине с уже зарезервированными стрелками.
    useEffect(() => {
        const shipList = shipListRef.current;
        if (!shipList) return;

        const updateVisibleShipCount = () => {
            const styles = window.getComputedStyle(shipList);
            const cardWidth = Number.parseFloat(styles.getPropertyValue('--ship-gallery-card-width'));
            const gap = Number.parseFloat(styles.columnGap) || 0;
            if (!Number.isFinite(cardWidth) || cardWidth <= 0) return;

            const count = Math.max(1, Math.floor((shipList.clientWidth + gap) / (cardWidth + gap)));
            setVisibleShipCount(count);
        };

        updateVisibleShipCount();
        const observer = new ResizeObserver(updateVisibleShipCount);
        observer.observe(shipList);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        setShipGalleryStart((start) => Math.min(start, Math.max(0, dockShips.length - visibleShipCount)));
    }, [dockShips.length, visibleShipCount]);

    // Escape открывает меню аккаунта, а в открытом меню закрывает его повторно.
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape' || deletingAccount) return;
            event.preventDefault();
            setLogoutDialogOpen((isOpen) => !isOpen);
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deletingAccount]);

    // Переключение типа каталога сбрасывает выбранную подкатегорию и товар.
    function selectTab(tab: CatalogTab) {
        setActiveTab(tab);
        setActiveCategory(null);
        setSelectedItemId(null);
        setSelectedSlotId(null);
        setSelectedSlotRowId(0);
    }

    // Показывает в торговом списке только оборудование, подходящее выбранному слоту, и подсвечивает категорию.
    function openCompatibleGoods(slotTypeId: number, slotRowId?: number) {
        const compatibleGoods = catalog.equipments.filter((item) => item.slotId === slotTypeId);
        const firstCompatible = compatibleGoods[0];

        if (slotRowId != null) {
            setSelectedSlotRowId(Number(slotRowId));
        }
        setActiveTab('equipment');
        setActiveCategory(firstCompatible?.categoryId ?? null);
        setSelectedSlotId(slotTypeId);
        setSelectedItemId(firstCompatible?.id ?? null);
    }

    function handleSlotSelect(slotTypeId: number, slotRowId?: number, slotEquipmentId?: number | null) {
        if (slotRowId != null) {
            setSelectedSlotRowId(Number(slotRowId));
        }
        if (slotEquipmentId != null) {
            const installedItem = catalog.equipments.find((item) => item.id === slotEquipmentId);
            setShowShipsForSale(false);
            setSelectedSlotId(slotTypeId);
            setSelectedItemId(slotEquipmentId);
            setActiveTab('equipment');
            setActiveCategory(installedItem?.categoryId ?? null);
            setTradeAction('sell_equipment');
            setIsActionTriggered(true);
        } else {
            openCompatibleGoods(slotTypeId, slotRowId);
        }
    }

    // Ошибка удаления остаётся в диалоге, чтобы пользователь мог повторить запрос.
    async function handleDeleteAccount() {
        setDeletingAccount(true);
        setDeleteError('');
        try {
            await onDeleteAccount();
        } catch (cause) {
            setDeleteError(cause instanceof Error ? cause.message : 'Не удалось удалить аккаунт.');
            setDeletingAccount(false);
        }
    }

    return (
        <main className="app-shell hangar-screen">
            <div className="scanline"/>
            <header className="topbar">
                <div className="brand">
                    <span className="brand-mark"><HangarIcon name="radar" size={23}/></span>
                    <div>
                        <strong id="baseName">ЗВЁЗДНАЯ БАЗА</strong>
                        <span id="baseLocation">БАЗА НЕ ВЫБРАНА</span>
                    </div>
                    <button className="map-link takeoff-link" type="button" onClick={onLaunch}
                            aria-label="Выйти в космос" title="Перейти к карте">
                        <HangarIcon name="launch" size={13}/>
                        <span className="map-link-label">ВЫЙТИ В КОСМОС <kbd>[Esc]</kbd></span>
                    </button>
                    <span className="build-badge">v22 · 02.11</span>
                </div>
                <div className="station-status">
                    <span className="pulse"/>
                    <span id="noticeShop">КАТАЛОГ // ПРЕДПРОСМОТР</span>
                    <span className="divider"/>СЕКТОР A-17
                </div>
                <div className="hangar-header-actions">
                    <div className="balance" title="Баланс пилота">
                        <span><HangarIcon name="credits" size={17}/></span>
                        <div><small>БАЛАНС</small><strong>{credits} <i>¤</i></strong></div>
                    </div>
                    <button className="map-link hangar-account-link" type="button"
                            onClick={() => setLogoutDialogOpen(true)} aria-label="Меню аккаунта"
                            title={`Аккаунт: ${email}`}>
                        <HangarIcon name="account" size={15}/><span className="map-link-label">АККАУНТ</span>
                    </button>
                </div>
            </header>

            <div className="content">
                <section className="shop-view" id="view-shop">
                    <div className="market-grid">
                        <section className="panel-block glass catalog-panel">
                            <div className="panel-body catalog-body">
                                <div className="tabs category-tabs" role="tablist" aria-label="Тип каталога">
                                    {(['all', 'equipment', 'resources'] as const).map((tab) => (
                                        <button className={`tab${activeTab === tab ? ' active' : ''}`} key={tab}
                                                type="button" role="tab" aria-selected={activeTab === tab}
                                                onClick={() => selectTab(tab)}>
                                            <HangarIcon name={tab === 'all' ? 'grid' : tab === 'equipment' ? 'tool' : 'crate'}
                                                        size={13}/>
                                            {tabLabels[tab]}
                                        </button>
                                    ))}
                                </div>
                                <div className="catalog-category-list" role="group" aria-label="Категории каталога">
                                    {categories.length === 0 ? (
                                        <span className="catalog-category-empty">Оборудование и ресурсы отображаются общим списком</span>
                                    ) : (
                                        <>
                                            <button className={`tab catalog-category${activeCategory === null ? ' active' : ''}`}
                                                    type="button" onClick={() => setActiveCategory(null)}>
                                                Все
                                            </button>
                                            {categories.map((category) => {
                                                const count = catalogItems[activeTab]
                                                    .filter((item) => item.categoryId === category.id).length;
                                                return (
                                                    <button
                                                        className={`tab catalog-category${activeCategory === category.id ? ' active' : ''}`}
                                                        key={category.id} type="button"
                                                        onClick={() => {
                                                            setActiveCategory(category.id);
                                                            setSelectedItemId(null);
                                                        }}
                                                    >
                                                        <HangarIcon name={category.icon} size={13}/>
                                                        <span className="catalog-category-copy"><span>{category.name}</span></span>
                                                        <small className="catalog-category-count">{count}</small>
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="inventory-panel panel-block glass ship-column" id="shipPanel">
                            <div className="ship-panel-body panel-body">
                                <ShipInformation
                                    name={shipName}
                                    meta={ownedShip
                                        ? `Корабль #${ownedShip.id} · ${ownedShip.status === 1 ? 'разрушен' : 'в строю'}`
                                        : 'Активный корабль · дата покупки недоступна'}
                                    model={ownedShipModel}
                                    shipSlots={ownedShip?.slots}
                                    shipHolds={ownedShip?.holds}
                                    rows={ownedShipRows}
                                    onOpenSlot={handleSlotSelect}
                                />
                                {error && <p className="error-message" role="alert">{error}</p>}
                            </div>
                        </section>

                        <section className="inventory-panel panel-block glass market-column" id="shopPanel">
                            <div className="item-list panel-body">
                                {groupedItems.length ? groupedItems.map((group) => (
                                    <div className="list-group" key={group.id ?? 'ships'}>
                                        <div className="list-group-head">
                                            <span className="list-group-icon"><HangarIcon name={group.icon} size={13}/></span>
                                            <strong>{group.name}</strong><small>{group.items.length}</small>
                                        </div>
                                        {group.items.map((item) => (
                                            <button className={`item-row${selectedItem?.id === item.id ? ' selected' : ''}`}
                                                    key={item.id} type="button"
                                                    onClick={() => {
                                                        setSelectedSlotRowId(0);
                                                        setSelectedItemId(item.id);
                                                    }}>
                                                <span className={`item-icon ${item.icon || ''}`}>
                                                    <HangarIcon name={item.icon} size={22}/>
                                                </span>
                                                <span className="item-copy">
                                                    <strong>{item.name}</strong>
                                                    <span>{item.values?.['3'] ? `Масса ${formatNumber(item.values['3'])} кг` : 'Единица груза'}</span>
                                                </span>
                                                <span className="item-meta">
                                                    <small>{group.name}</small>
                                                    {item.price_buy && <b>{formatNumber(item.price_buy)} ¤</b>}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )) : (
                                    <div className="list-empty">В выбранной категории пока нет объектов</div>
                                )}
                            </div>
                        </section>

                        <section className="inventory-panel panel-block glass cargo-column" id="cargoPanel">
                            <div className="item-list panel-body">
                                <div className="list-group-head">
                                    <span className="list-group-icon"><HangarIcon name="crate" size={13}/></span>
                                    <strong>ГРУЗ ПИЛОТА</strong><small>0</small>
                                </div>
                                <div className="list-empty">Грузовой инвентарь не подключён к данным аккаунта</div>
                            </div>
                        </section>

                        <section className="inventory-panel shop-panel panel-block glass selection-column">
                            <div className="ship-panel-body shop-panel-body panel-body">
                                {showShipsForSale && selectedForSaleShip ? (() => {
                                    const shipPrice = Number(selectedForSaleShip.price_buy || 0);
                                    const userCredits = hangar ? Number(hangar.credits || 0) : 0;
                                    const canAffordShip = hangar != null && userCredits >= shipPrice;

                                    return (
                                        <>
                                            <ShipInformation
                                                name={selectedForSaleShip.name}
                                                meta={`Корпус #${selectedForSaleShip.id} · доступен для покупки`}
                                                model={selectedForSaleShip}
                                                onOpenSlot={handleSlotSelect}
                                            />
                                            <div className="ship-rows shop-price-rows">
                                                <div className="ship-row">
                                                    <span>Цена покупки</span>
                                                    <b>{formatNumber(selectedForSaleShip.price_buy)} <small>¤</small></b>
                                                </div>
                                                <div className="ship-row">
                                                    <span>Цена продажи</span>
                                                    <b>{formatNumber(selectedForSaleShip.price_sale)} <small>¤</small></b>
                                                </div>
                                            </div>
                                            <p className="shop-note">
                                                {canAffordShip
                                                    ? `Ваш баланс: ${formatNumber(userCredits)} ¤. Достаточно средств.`
                                                    : `Недостаточно кредитов. Требуется ${formatNumber(shipPrice)} ¤ (у вас ${formatNumber(userCredits)} ¤).`}
                                            </p>
                                            <div className="shop-actions">
                                                <BuyButton
                                                    type="button"
                                                    label={tradeAction ? tradeActionLabels[tradeAction] : 'Купить корабль'}
                                                    disabled={!isActionTriggered || !canAffordShip || isTradeProcessing}
                                                    onClick={handleTradeButtonClick}
                                                    title={isTradeProcessing
                                                        ? 'Выполняется обработка...'
                                                        : canAffordShip
                                                        ? `Купить ${selectedForSaleShip.name} за ${formatNumber(shipPrice)} ¤`
                                                        : `Недостаточно кредитов для покупки (требуется ${formatNumber(shipPrice)} ¤)`}
                                                />
                                            </div>
                                        </>
                                    );
                                })() : !showShipsForSale && ownedShip ? (() => {
                                    const salePrice = Number(ownedShipModel?.price_sale || 0);
                                    const canSellShip = userShips.length > 1;

                                    return (
                                        <>
                                            <ShipInformation
                                                name={ownedShipModel?.name || `Корабль ${ownedShip.ship_id}`}
                                                meta={ownedShip ? `Корабль #${ownedShip.id} · ${ownedShip.status === 1 ? 'разрушен' : 'в строю'}` : 'Активный корабль'}
                                                model={ownedShipModel}
                                                shipSlots={ownedShip?.slots}
                                                shipHolds={ownedShip?.holds}
                                                rows={ownedShipRows}
                                                onOpenSlot={handleSlotSelect}
                                            />
                                            <div className="ship-rows shop-price-rows">
                                                <div className="ship-row">
                                                    <span>Цена продажи</span>
                                                    <b>{formatNumber(salePrice)} <small>¤</small></b>
                                                </div>
                                            </div>
                                            <p className="shop-note">
                                                {canSellShip
                                                    ? `Нажмите для продажи корабля за ${formatNumber(salePrice)} ¤.`
                                                    : `Невозможно продать единственный корабль во флоте.`}
                                            </p>
                                            <div className="shop-actions">
                                                <SellButton
                                                    type="button"
                                                    label={tradeAction ? tradeActionLabels[tradeAction] : 'Продать корабль'}
                                                    disabled={!canSellShip || isTradeProcessing}
                                                    onClick={handleTradeButtonClick}
                                                    title={isTradeProcessing
                                                        ? 'Выполняется обработка...'
                                                        : canSellShip
                                                        ? `Продать ${ownedShipModel?.name || 'корабль'} за ${formatNumber(salePrice)} ¤`
                                                        : 'Невозможно продать единственный корабль'}
                                                />
                                            </div>
                                        </>
                                    );
                                })() : selectedItem ? (
                                    <>
                                        <span className="ship-sub">
                                            {selectedItemCategory?.name || tabLabels[selectedItemTab]}
                                        </span>
                                        <strong className="ship-title">{selectedItem.name}</strong>
                                        <div className="ship-rows">
                                            {selectedItem.values && Object.entries(selectedItem.values).map(([id, value]) => {
                                                const property = catalog.properties.find((entry) => entry.id === Number(id));
                                                if (!property) return null;
                                                return (
                                                    <div className="ship-row" key={id}>
                                                        <span>{property.name}</span>
                                                        <b>{formatNumber(value)} <small>{property.unit}</small></b>
                                                    </div>
                                                );
                                            })}
                                            {selectedItem.slotId != null && (
                                                <div className="ship-row">
                                                    <span>Слот</span>
                                                    <b>{catalog.slots.find((slot) => slot.id === selectedItem.slotId)?.name || '—'}</b>
                                                </div>
                                            )}
                                            <div className="ship-row">
                                                <span>Место</span><b>Торговый терминал</b>
                                            </div>
                                        </div>
                                        <div className="ship-rows shop-price-rows">
                                            <div className="ship-row">
                                                <span>Цена покупки</span>
                                                <b>{formatNumber(selectedItem.price_buy)} <small>¤</small></b>
                                            </div>
                                            <div className="ship-row">
                                                <span>Цена продажи</span>
                                                <b>{formatNumber(selectedItem.price_sale)} <small>¤</small></b>
                                            </div>
                                        </div>
                                        <p className="shop-note">
                                            {isActionTriggered
                                                ? `Ваш баланс: ${formatNumber(hangar?.credits)} ¤. ${tradeAction === 'sell_equipment' ? 'Нажмите для продажи.' : 'Нажмите для покупки.'}`
                                                : `Выберите предмет или проверьте баланс кредитов.`}
                                        </p>
                                        <div className="shop-actions">
                                            {tradeAction === 'sell_equipment' || selectedSlotRowId !== 0 ? (
                                                <SellButton
                                                    type="button"
                                                    label={tradeAction ? tradeActionLabels[tradeAction] : 'Продать оборудование'}
                                                    disabled={!isActionTriggered || isTradeProcessing}
                                                    onClick={handleTradeButtonClick}
                                                    title={isActionTriggered
                                                        ? `Продать ${selectedItem.name} из слота #${selectedSlotRowId}`
                                                        : `Продажа недоступна`}
                                                />
                                            ) : (
                                                <BuyButton
                                                    type="button"
                                                    label={tradeAction ? tradeActionLabels[tradeAction] : 'Купить'}
                                                    disabled={!isActionTriggered || isTradeProcessing}
                                                    onClick={handleTradeButtonClick}
                                                    title={isActionTriggered
                                                        ? `Купить ${selectedItem.name} за ${formatNumber(selectedItem.price_buy)} ¤`
                                                        : `Покупка недоступна`}
                                                />
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="trade-empty">Выберите объект в каталоге</div>
                                )}
                            </div>
                        </section>
                    </div>
                </section>
                {/**/}
                <section className="panel-block glass dock-panel">
                    <div className="panel-body dock-body">
                        <div className="ship-gallery">
                            <button
                                className={`ship-gallery-arrow${canShowPreviousShips ? '' : ' unavailable'}`}
                                type="button"
                                aria-label="Показать предыдущие корабли"
                                disabled={!canShowPreviousShips}
                                onClick={() => setShipGalleryStart((start) => Math.max(0, start - visibleShipCount))}
                            >
                                <HangarIcon name="chevron" size={18}/>
                            </button>
                            <div
                                className="ship-list"
                                ref={shipListRef}
                                style={{'--ship-gallery-visible-count': visibleShipCount} as CSSProperties & {
                                    '--ship-gallery-visible-count': number;
                                }}
                                aria-live="polite"
                            >
                                {visibleDockShips.length > 0 ? visibleDockShips.map((ship) => (
                                    <button
                                        className={`ship-card${ship.isForSale
                                            ? selectedForSaleShipId === ship.id ? ' selected'
                                                : ''
                                            : ' active'}`}
                                        key={ship.id}
                                        type="button"
                                        aria-current={ship.isForSale
                                            ? undefined
                                            : String(ownedShip?.id ?? hangar?.ship_id) === String(ship.id)}
                                        onClick={() => {
                                            setSelectedSlotRowId(0);
                                            if (ship.isForSale) {
                                                setSelectedForSaleShipId(Number(ship.id));
                                            } else {
                                                console.log('[USER SHIP CLICKED]', ship.id);
                                                setSelectedOwnedShipId(ship.id);
                                            }
                                        }}
                                    >
                                        <div className="ship-visual">
                                            <ShipGlyph compact/>
                                            {!ship.isForSale && <span className="active-tag">ВЫБРАН</span>}
                                        </div>
                                        <div className="ship-meta">
                                            <strong>{ship.name}</strong>
                                            <span>
                                                {ship.isForSale
                                                    ? `ЦЕНА // ${formatNumber(ship.price_buy)} ¤`
                                                    : 'АКТИВНЫЙ КОРАБЛЬ'}
                                            </span>
                                        </div>
                                    </button>
                                )) : (
                                    <div className="ship-gallery-empty">
                                        {showShipsForSale ? 'Нет кораблей для продажи' : 'Корабль ангара ещё не загружен'}
                                    </div>
                                )}
                            </div>
                            <button
                                className={`ship-gallery-arrow${canShowNextShips ? '' : ' unavailable'}`}
                                type="button"
                                aria-label="Показать следующие корабли"
                                disabled={!canShowNextShips}
                                onClick={() => setShipGalleryStart((start) =>
                                    Math.min(dockShips.length - visibleShipCount, start + visibleShipCount))}
                            >
                                <HangarIcon name="chevron" size={18}/>
                            </button>
                        </div>
                        <button
                            className="ship-card ship-buy-card"
                            type="button"
                            onClick={() => {
                                setShowShipsForSale((showingSales) => !showingSales);
                                setShipGalleryStart(0);
                            }}
                            aria-label={showShipsForSale ? 'Показать мои корабли' : 'Показать корабли для продажи'}
                            title={showShipsForSale ? 'Показать мои корабли' : 'Показать корабли для продажи'}
                        >
                            <span className="ship-buy-visual">
                                <HangarIcon name={showShipsForSale ? 'ship' : 'shipAdd'} size={38}/>
                            </span>
                            <span className="ship-buy-label">
                                {showShipsForSale ? 'МОИ КОРАБЛИ' : 'КУПИТЬ КОРАБЛЬ'}
                            </span>
                            <span className="ship-buy-hint">
                                {showShipsForSale ? 'АНГАР ПИЛОТА' : 'КАТАЛОГ ФЛОТА'}
                            </span>
                        </button>
                    </div>
                </section>
            </div>

            {logoutDialogOpen && (
                <div className="hangar-account-backdrop"
                     onMouseDown={(event) => {
                         if (!deletingAccount && event.target === event.currentTarget) setLogoutDialogOpen(false);
                     }}>
                    <section className="hangar-account-dialog" role="dialog" aria-modal="true"
                             aria-labelledby="hangar-account-title">
                        <span className="eyebrow">УПРАВЛЕНИЕ АККАУНТОМ</span>
                        <h2 id="hangar-account-title">Выйти из аккаунта?</h2>
                        <p>Вы вернётесь на экран входа.</p>
                        <div className="hangar-account-actions">
                            <button className="trade-button ghost" type="button" disabled={deletingAccount}
                                    onClick={() => setLogoutDialogOpen(false)}>Остаться</button>
                            <button className="trade-button buy" type="button" disabled={deletingAccount}
                                    onClick={onLogout}>Выйти</button>
                        </div>
                        <div className="hangar-account-delete">
                            <p>Удаление аккаунта безвозвратно удалит корабль и данные пилота.</p>
                            {deleteError && <p className="error-message" role="alert">{deleteError}</p>}
                            <button className="trade-button sell" type="button" disabled={deletingAccount}
                                    onClick={handleDeleteAccount}>
                                {deletingAccount ? 'УДАЛЕНИЕ АККАУНТА…' : 'УДАЛИТЬ АККАУНТ'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}
