// Ангар: каталог, содержимое корабля, консоль выбранного объекта и торговля.
// Цены, доступность места и снимок состояния считает сервер; клиент только показывает
// и подсказывает, куда встанет покупка.
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {ApiError, executeTrade} from '../api';
import type {
    HangarCargoLine,
    HangarEquipmentInstance,
    HangarHold,
    HangarShip,
    HangarSlot,
    HangarStatus,
    TradeActionType,
} from '../types';
import rawCatalog from '../data/catalog.json';

import {BuyButton, SellButton} from './TradeButtons';
import './hangar-reference.css';

type CatalogItem = {
    id: number;
    name: string;
    categoryId?: number;
    values?: Record<string, string>;
    price_buy?: string;
    price_sale?: string;
    icon?: string;
    slotId?: number | null;
    prop2?: string[];
};

type CatalogCategory = { id: number; name: string; icon?: string; parentId?: number | null };
type CatalogTab = 'all' | 'equipment' | 'resources';

type Catalog = {
    settings: {initialShipId: number; startingCredits: string; id_category_hold: number; id_propert_mass_value: number};
    properties: Array<{id: number; name: string; unit?: string}>;
    slots: Array<{id: number; name: string}>;
    ships: Array<{
        id: number;
        name: string;
        description?: string;
        values?: Record<string, string>;
        slots: Array<{slotId: number; itemId?: number}>;
        holds: Array<{capacity: string; itemId?: number}>;
        price_buy: string;
        price_sale: string;
        icon?: string;
    }>;
    equipments: CatalogItem[];
    resources: CatalogItem[];
    categoriesEquipment: CatalogCategory[];
    categoriesResource: CatalogCategory[];
};

const catalog = rawCatalog as unknown as Catalog;

const ALL_CATEGORIES: CatalogCategory[] = [...catalog.categoriesEquipment, ...catalog.categoriesResource];
const categoryById = new Map<number, CatalogCategory>(ALL_CATEGORIES.map((category) => [Number(category.id), category]));

function findCategory(id?: number | null) {
    return id == null ? null : categoryById.get(Number(id)) ?? null;
}

// Верхний уровень: для дочерней категории — её группа, для верхней — она сама.
function categoryGroup(category?: CatalogCategory | null) {
    if (!category) return null;
    return category.parentId == null ? category : findCategory(category.parentId);
}

function categoryIdsInGroup(groupId: number | null): number[] | null {
    if (groupId == null) return null;
    const group = findCategory(groupId);
    if (!group) return [Number(groupId)];
    return [Number(group.id), ...ALL_CATEGORIES
        .filter((category) => Number(category.parentId) === Number(group.id))
        .map((category) => Number(category.id))];
}

function inCategoryGroup(item: CatalogItem, groupId: number | null) {
    const ids = categoryIdsInGroup(groupId);
    return ids === null || ids.includes(Number(item.categoryId ?? 0));
}

function topCategories(kind: 'equipment' | 'resources') {
    const list = kind === 'equipment' ? catalog.categoriesEquipment : catalog.categoriesResource;
    return list.filter((category) => category.parentId == null);
}

type CategoryGroupView<T> = {
    id: number;
    name: string;
    icon: string;
    items: T[];
};

// Заголовки в списках — подкатегории: группы остаются только в фильтре.
function groupByCategories<T>(items: T[], categoryIdOf: (item: T) => number | null | undefined): CategoryGroupView<T>[] {
    const groups = new Map<number, CategoryGroupView<T>>();

    for (const item of items) {
        const category = findCategory(categoryIdOf(item));
        const id = category ? Number(category.id) : 0;
        if (!groups.has(id)) {
            groups.set(id, {id, name: category?.name ?? 'Прочее', icon: category?.icon ?? 'grid', items: []});
        }
        groups.get(id)!.items.push(item);
    }

    const order = new Map<number, number>(ALL_CATEGORIES.map((category, index) => [Number(category.id), index]));
    return [...groups.values()].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

const MASS_PROPERTY_ID = String(catalog.settings.id_propert_mass_value);
const CAPACITY_PROPERTY_ID = String(catalog.properties.find((property) => property.name === 'Вместимость')?.id ?? 12);

type Placement = { kind: 'slot' | 'hold'; id: number; index: number };

type OwnedCargoSelection = { containerId: number; resourceId: number };

type ConfirmState = {kind: 'ship'} | {kind: 'container'; instanceId: number} | null;

const tabLabels: Record<CatalogTab, string> = {
    all: 'ВСЁ',
    equipment: 'ОБОРУДОВАНИЕ',
    resources: 'РЕСУРСЫ',
};

const actionLabels: Record<TradeActionType, string> = {
    buy_ship: 'Купить корабль',
    sell_ship: 'Продать корабль',
    buy_equipment: 'Купить оборудование',
    sell_equipment: 'Продать оборудование',
    buy_resource: 'Купить ресурс',
    sell_resource: 'Продать ресурс',
};

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

function HangarIcon({name, size = 18}: {name?: string | null; size?: number}) {
    return (
        <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}
             stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}>
            {iconShapes[name || 'grid'] || iconShapes.grid}
        </svg>
    );
}


function formatNumber(value: string | number | undefined | null) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString('ru-RU') : '—';
}

function massOf(item?: CatalogItem | null) {
    const value = Number(item?.values?.[MASS_PROPERTY_ID]);
    return Number.isFinite(value) ? value : 0;
}

function capacityOf(item?: CatalogItem | null) {
    const value = Number(item?.values?.[CAPACITY_PROPERTY_ID]);
    return Number.isFinite(value) ? value : 0;
}

// Контейнер из каталога: есть вместимость и заполнен prop2 — то же правило, что на сервере.
function isCatalogContainer(item?: CatalogItem | null) {
    return capacityOf(item) > 0 && (item?.prop2?.length ?? 0) > 0;
}

function priceOf(item: CatalogItem | null | undefined, field: 'price_buy' | 'price_sale') {
    const value = Number(item?.[field]);
    return Number.isFinite(value) ? value : 0;
}

function categoryOf(item: CatalogItem | null | undefined, tab: CatalogTab) {
    const list = tab === 'resources' ? catalog.categoriesResource : catalog.categoriesEquipment;
    return list.find((category) => category.id === item?.categoryId);
}

function slotTypeName(slotTypeId: number) {
    return catalog.slots.find((slot) => slot.id === Number(slotTypeId))?.name || 'Крепление';
}

function locationLabel(instance: HangarEquipmentInstance) {
    return instance.location.kind === 'slot'
        ? `Крепление ${(instance.location.index ?? 0) + 1}`
        : `Трюм ${(instance.location.index ?? 0) + 1}`;
}

// Полный список экземпляров корабля без дублей: контейнеры приходят и в слотах, и в трюмах.
function shipInstances(ship: HangarShip | null): HangarEquipmentInstance[] {
    if (!ship) return [];
    const byId = new Map<number, HangarEquipmentInstance>();
    for (const container of ship.containers) byId.set(container.id, container);
    for (const hold of ship.holds) {
        for (const item of hold.equipment) if (!byId.has(item.id)) byId.set(item.id, item);
    }
    for (const slot of ship.slots) {
        if (!slot.instance_id || byId.has(slot.instance_id)) continue;
        byId.set(slot.instance_id, {
            id: slot.instance_id,
            instance_id: slot.instance_id,
            model_id: slot.model_id ?? 0,
            name: slot.name || 'Оборудование',
            icon: slot.icon || 'tool',
            mass: slot.mass,
            slot_id: Number(slot.id),
            hold_id: null,
            location: {kind: 'slot', id: Number(slot.id), index: slot.slot_index},
            is_container: false,
            capacity_kg: 0,
            used_kg: 0,
            free_kg: 0,
            allowed: [],
            cargo: slot.cargo ?? [],
        });
    }
    return [...byId.values()];
}

function findInstance(ship: HangarShip | null, instanceId: number | null) {
    if (!ship || instanceId === null) return null;
    return shipInstances(ship).find((instance) => instance.id === instanceId) ?? null;
}

// Куда встанет оборудование: явно выбранное крепление, иначе первый свободный слот, затем трюм.
function resolvePlacement(ship: HangarShip | null, item: CatalogItem, explicitSlotRowId: number | null): Placement | null {
    if (!ship) return null;
    const slotTypeId = Number(item.slotId ?? 0);
    const mass = massOf(item);

    if (explicitSlotRowId !== null) {
        const slot = ship.slots.find((row) => Number(row.id) === explicitSlotRowId);
        if (slot && !slot.instance_id && Number(slot.slot_type_id) === slotTypeId) {
            return {kind: 'slot', id: Number(slot.id), index: slot.slot_index};
        }
    }

    if (slotTypeId > 0) {
        const freeSlot = ship.slots.find((slot) => !slot.instance_id && Number(slot.slot_type_id) === slotTypeId);
        if (freeSlot) return {kind: 'slot', id: Number(freeSlot.id), index: freeSlot.slot_index};
    }

    const freeHold = ship.holds.find((hold) => hold.free_mass >= mass);
    if (freeHold) return {kind: 'hold', id: Number(freeHold.id), index: freeHold.hold_index};

    return null;
}

// Контейнер под ресурс: выбранный игроком либо первый принимающий со свободным местом.
function resolveContainer(ship: HangarShip | null, resource: CatalogItem | null, explicitId: number | null) {
    if (!ship || !resource) return {target: null, reason: 'none' as const};
    const name = resource.name.trim().toLowerCase();
    const accepting = ship.containers.filter((container) =>
        container.allowed.some((allowed) => allowed.trim().toLowerCase() === name));

    if (explicitId !== null) {
        const explicit = ship.containers.find((container) => container.id === explicitId);
        if (explicit && accepting.some((container) => container.id === explicit.id)) {
            return explicit.free_kg >= 1
                ? {target: explicit, reason: 'ok' as const}
                : {target: null, reason: 'full' as const};
        }
    }
    if (accepting.length === 0) return {target: null, reason: 'none' as const};
    const withSpace = accepting.find((container) => container.free_kg >= 1);
    return withSpace ? {target: withSpace, reason: 'ok' as const} : {target: null, reason: 'full' as const};
}

// Модель из каталога в форме корабля игрока: одна карточка рисует и свой корабль, и модель в продаже.
function catalogShipAsHangar(model: Catalog['ships'][number]): HangarShip {
    const slots = model.slots.map((slot, index) => {
        const item = Number(slot.itemId ?? 0) > 0
            ? catalog.equipments.find((entry) => entry.id === Number(slot.itemId)) ?? null
            : null;
        return {
            id: -1 - index,
            slot_index: index,
            slot_type_id: Number(slot.slotId),
            slot_type_name: slotTypeName(Number(slot.slotId)),
            instance_id: item ? -101 - index : null,
            model_id: item ? item.id : null,
            name: item ? item.name : null,
            icon: item ? item.icon ?? 'tool' : null,
            mass: item ? massOf(item) : 0,
            cargo: [] as HangarCargoLine[],
        };
    });

    const holds = model.holds.map((hold, index) => {
        const item = Number(hold.itemId ?? 0) > 0
            ? catalog.equipments.find((entry) => entry.id === Number(hold.itemId)) ?? null
            : null;
        const capacity = Number(hold.capacity);
        const instance: HangarEquipmentInstance | null = item ? {
            id: -201 - index,
            instance_id: -201 - index,
            model_id: item.id,
            name: item.name,
            icon: item.icon ?? 'tool',
            mass: massOf(item),
            slot_id: null,
            hold_id: -1 - index,
            location: {kind: 'hold', id: -1 - index, index},
            is_container: isCatalogContainer(item),
            capacity_kg: capacityOf(item),
            used_kg: 0,
            free_kg: capacityOf(item),
            allowed: item.prop2 ?? [],
            cargo: [],
        } : null;
        const used = instance ? instance.mass : 0;
        return {
            id: -301 - index,
            hold_index: index,
            capacity_mass: capacity,
            used_mass: used,
            free_mass: capacity - used,
            equipment: instance ? [instance] : [],
        };
    });

    const equipmentMass = slots.reduce((sum, slot) => sum + slot.mass, 0)
        + holds.reduce((sum, hold) => sum + hold.used_mass, 0);
    const hullMass = massOf(model);

    return {
        id: Number(model.id),
        ship_model_id: Number(model.id),
        name: model.name,
        status: 0,
        health: 0,
        shield: 0,
        hangar_id: 0,
        sol_id: 0,
        mass: {hull: hullMass, equipment: equipmentMass, cargo: 0, total: hullMass + equipmentMass},
        slots,
        holds,
        containers: holds.flatMap((hold) => hold.equipment).filter((instance) => instance.is_container),
    };
}

const noop = () => {};

/* ---------- Подсказки при наведении ---------- */

type TipRow = {icon: string; name: string; lines: string[]};
type TipContent = {title: string; rows: TipRow[]; note?: string};

function equipmentMeta(model: CatalogItem | null | undefined) {
    const category = categoryOf(model, 'equipment');
    const mass = massOf(model);
    return [category?.name, mass > 0 ? `${formatNumber(mass)} кг` : ''].filter(Boolean).join(' · ');
}

function cargoSummary(cargo: HangarCargoLine[]) {
    return cargo.map((line) => `${line.name} ${formatNumber(line.amount_kg)} кг`).join(', ');
}

// Подсказка над креплением: что установлено, масса и груз контейнера.
function slotTipContent(slot: HangarSlot, hasCompatible: boolean): TipContent {
    const title = slot.slot_type_name || 'Слот';
    if (!slot.instance_id) {
        return {
            title,
            rows: [],
            note: hasCompatible ? 'Слот пуст · нажмите — откроются совместимые товары' : 'Слот пуст',
        };
    }
    const model = catalog.equipments.find((entry) => entry.id === slot.model_id) ?? null;
    const cargo = slot.cargo ?? [];
    const lines = [equipmentMeta(model)].filter(Boolean);
    if (cargo.length > 0) lines.push(`груз: ${cargoSummary(cargo)}`);
    const capacity = capacityOf(model);
    if (capacity > 0) {
        const used = cargo.reduce((sum, line) => sum + line.amount_kg, 0);
        lines.push(`${formatNumber(used)} / ${formatNumber(capacity)} кг`);
    }
    return {title, rows: [{icon: slot.icon || 'tool', name: slot.name || 'Оборудование', lines}]};
}

// Подсказка над предметом в трюме: тот же вид, что у крепления.
function holdTipContent(hold: HangarHold, instance: HangarEquipmentInstance): TipContent {
    const model = catalog.equipments.find((entry) => entry.id === instance.model_id) ?? null;
    const lines = [equipmentMeta(model)].filter(Boolean);
    if (instance.cargo.length > 0) lines.push(`груз: ${cargoSummary(instance.cargo)}`);
    if (instance.capacity_kg > 0) {
        lines.push(`${formatNumber(instance.used_kg)} / ${formatNumber(instance.capacity_kg)} кг`);
    }
    return {
        title: instance.name,
        rows: [{icon: instance.icon, name: `Трюм ${hold.hold_index + 1}`, lines}],
    };
}

// Подсказка над значком груза: ресурс, контейнер, килограммы и цена.
function cargoTipContent(container: HangarEquipmentInstance, line: HangarCargoLine): TipContent {
    return {
        title: line.name,
        rows: [{
            icon: line.icon || 'crate',
            name: `Контейнер «${container.name}»`,
            lines: [
                `${formatNumber(line.amount_kg)} кг${line.price_sale > 0
                    ? ` · ${formatNumber(line.price_sale)} ¤/кг`
                    : ' · цена не задана'}`,
                'нажмите, чтобы продать 1 кг',
            ],
        }],
    };
}

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

export default function HangarScreen({token, hangar, onHangarUpdate, error, email, onLaunch, onLogout, onDeleteAccount}: Props) {
    const [activeTab, setActiveTab] = useState<CatalogTab>('all');
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [selectedShipId, setSelectedShipId] = useState<string | number | null>(null);
    const [showShipsForSale, setShowShipsForSale] = useState(false);
    const [selectedForSaleShipId, setSelectedForSaleShipId] = useState<number | null>(catalog.ships[0]?.id ?? null);
    // Корабль, выбранный до входа в режим покупки: к нему возвращаемся при выходе.
    const [saleReturnShipId, setSaleReturnShipId] = useState<string | number | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
    const [selectedContainerId, setSelectedContainerId] = useState<number | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
    const [selectedCargo, setSelectedCargo] = useState<OwnedCargoSelection | null>(null);
    const [selectedHoldId, setSelectedHoldId] = useState<number | null>(null);
    const [message, setMessage] = useState('');
    const [isTradeProcessing, setIsTradeProcessing] = useState(false);
    const [confirm, setConfirm] = useState<ConfirmState>(null);
    const [shipGalleryStart, setShipGalleryStart] = useState(0);
    const [visibleShipCount, setVisibleShipCount] = useState(1);
    const [accountOpen, setAccountOpen] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const shipListRef = useRef<HTMLDivElement>(null);
    const [tip, setTip] = useState<{content: TipContent; target: HTMLElement} | null>(null);
    const [tipPlaced, setTipPlaced] = useState(false);
    const tipRef = useRef<HTMLDivElement>(null);

    const ships = hangar?.ships ?? [];
    const ship = ships.find((row) => String(row.id) === String(selectedShipId)) || ships[0] || null;
    const credits = Number(hangar?.credits ?? 0);
    const forSaleShip = catalog.ships.find((model) => model.id === selectedForSaleShipId) || null;
    const forSaleView = forSaleShip ? catalogShipAsHangar(forSaleShip) : null;
    const containers = ship?.containers ?? [];
    const selectedSlot = ship?.slots.find((slot) => Number(slot.id) === selectedSlotId) || null;
    const selectedContainer = containers.find((container) => container.id === selectedContainerId) || null;
    const selectedInstance = findInstance(ship, selectedInstanceId);
    const selectedCargoContainer = selectedCargo
        ? containers.find((container) => container.id === selectedCargo.containerId) || null
        : null;
    const selectedCargoLine = selectedCargo && selectedCargoContainer
        ? selectedCargoContainer.cargo.find((line) => line.resource_id === selectedCargo.resourceId) || null
        : null;

    const allItems: CatalogItem[] = activeTab === 'resources'
        ? catalog.resources
        : activeTab === 'equipment' ? catalog.equipments : [...catalog.equipments, ...catalog.resources];

    // Клик по креплению оставляет в списке только совместимое оборудование,
    // клик по контейнеру — только ресурсы, которые он принимает.
    let visibleItems = allItems;
    if (selectedSlot) {
        visibleItems = catalog.equipments.filter((item) => Number(item.slotId ?? 0) === Number(selectedSlot.slot_type_id));
    } else if (selectedContainer) {
        const allowed = selectedContainer.allowed.map((name) => name.trim().toLowerCase());
        visibleItems = catalog.resources.filter((item) => allowed.includes(item.name.trim().toLowerCase()));
    }
    if (activeCategory !== null) {
        visibleItems = visibleItems.filter((item) => inCategoryGroup(item, activeCategory));
    }

    const selectedItem = selectedItemId !== null
        ? [...catalog.equipments, ...catalog.resources].find((item) => item.id === selectedItemId) || null
        : null;
    const selectedItemIsEquipment = Boolean(selectedItem && catalog.equipments.some((item) => item.id === selectedItem.id));

    const placement = selectedItem && selectedItemIsEquipment && ship
        ? resolvePlacement(ship, selectedItem, selectedSlotId)
        : null;
    const containerChoice = selectedItem && !selectedItemIsEquipment
        ? resolveContainer(ship, selectedItem, selectedContainerId)
        : {target: null, reason: 'none' as const};

    const offer = showShipsForSale && forSaleShip;
    const buyPrice = offer
        ? priceOf(forSaleShip, 'price_buy')
        : selectedItem ? priceOf(selectedItem, 'price_buy') : 0;

    // Причина, по которой кнопка заблокирована: показывается над кнопкой, а не в модальном окне.
    let blocker = '';
    if (!hangar) {
        blocker = 'Ангар ещё не загружен.';
    } else if (offer) {
        if (credits < buyPrice) blocker = `Недостаточно кредитов: нужно ${formatNumber(buyPrice)} ¤, у вас ${formatNumber(credits)} ¤.`;
    } else if (selectedItem && selectedItemIsEquipment) {
        if (!placement) blocker = 'Нет свободного крепления и места в трюме.';
        else if (credits < buyPrice) blocker = `Недостаточно кредитов: нужно ${formatNumber(buyPrice)} ¤, у вас ${formatNumber(credits)} ¤.`;
    } else if (selectedItem) {
        if (containerChoice.reason === 'none') blocker = 'Нет контейнера для этого ресурса.';
        else if (containerChoice.reason === 'full') blocker = 'В контейнере нет места.';
        else if (credits < buyPrice) blocker = `Недостаточно кредитов: нужно ${formatNumber(buyPrice)} ¤, у вас ${formatNumber(credits)} ¤.`;
    }

    const canBuy = Boolean(hangar) && !blocker && (offer || Boolean(selectedItem)) && !isTradeProcessing;

    // Оборудование и груз на выбранном корабле для третьей колонки и разбивки продажи.
    const instances = shipInstances(ship);
    const equipmentSalePrice = instances.reduce((total, instance) =>
        total + priceOf(catalog.equipments.find((model) => model.id === instance.model_id), 'price_sale'), 0);
    const cargoSalePrice = instances.reduce((total, instance) =>
        total + instance.cargo.reduce((sum, line) => sum + line.amount_kg * line.price_sale, 0), 0);
    const cargoKg = instances.reduce((total, instance) =>
        total + instance.cargo.reduce((sum, line) => sum + line.amount_kg, 0), 0);
    const shipSalePrice = priceOf(catalog.ships.find((model) => model.id === ship?.ship_model_id), 'price_sale');

    // Категории идут рядами: оборудование сверху, ресурсы снизу.
    const categoryRows: Array<{kind: 'equipment' | 'resources'; items: CatalogCategory[]; catalog: CatalogItem[]}> = [];
    if (activeTab !== 'resources') {
        categoryRows.push({kind: 'equipment', items: topCategories('equipment'), catalog: catalog.equipments});
    }
    if (activeTab !== 'equipment') {
        categoryRows.push({kind: 'resources', items: topCategories('resources'), catalog: catalog.resources});
    }

    const groups = groupByCategories(visibleItems, (item) => item.categoryId);

    // Галерея дока показывает столько карточек, сколько помещается по фактической ширине.
    useEffect(() => {
        const host = shipListRef.current;
        if (!host) return;
        const measure = () => {
            const styles = window.getComputedStyle(host);
            const cardWidth = Number.parseFloat(styles.getPropertyValue('--ship-gallery-card-width'));
            const gap = Number.parseFloat(styles.columnGap) || 0;
            if (!Number.isFinite(cardWidth) || cardWidth <= 0) return;
            setVisibleShipCount(Math.max(1, Math.floor((host.clientWidth + gap) / (cardWidth + gap))));
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(host);
        return () => observer.disconnect();
    }, []);

    const dockShips = showShipsForSale
        ? catalog.ships.map((model) => ({
            id: model.id as number | string,
            name: model.name,
            isForSale: true,
            price: priceOf(model, 'price_buy'),
            modelId: model.id,
        }))
        : ships.map((row) => ({
            id: row.id,
            name: row.name,
            isForSale: false,
            price: 0,
            modelId: row.ship_model_id,
        }));

    // При первом входе в ангар выбираем корабль, первый товар второй колонки и его категорию.
    const initialSelectionDone = useRef(false);
    useEffect(() => {
        if (initialSelectionDone.current) return;
        const firstShip = hangar?.ships?.[0];
        if (!firstShip) return;

        initialSelectionDone.current = true;
        setSelectedShipId(firstShip.id);
        selectFirstCatalogItem();
    }, [hangar]);

    useEffect(() => {
        setShipGalleryStart((start) => Math.min(start, Math.max(0, dockShips.length - visibleShipCount)));
    }, [dockShips.length, visibleShipCount]);

    // Escape: закрыть диалог, меню аккаунта или вылететь — как обещает подпись кнопки.
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape' || deletingAccount) return;
            if (confirm) {
                setConfirm(null);
                return;
            }
            if (accountOpen) {
                setAccountOpen(false);
                return;
            }
            event.preventDefault();
            onLaunch();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [confirm, accountOpen, deletingAccount, onLaunch]);

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

    function showTip(target: HTMLElement, content: TipContent) {
        setTipPlaced(false);
        setTip({target, content});
    }

    function hideTip() {
        setTip(null);
        setTipPlaced(false);
    }

    function clearSelection() {
        setSelectedHoldId(null);
        setSelectedSlotId(null);
        setSelectedContainerId(null);
        setSelectedItemId(null);
        setSelectedInstanceId(null);
        setSelectedCargo(null);
        setMessage('');
    }

    function selectTab(tab: CatalogTab) {
        setShowShipsForSale(false);
        setActiveTab(tab);
        setActiveCategory(null);
        // Выбранный трюм сохраняется: третья колонка продолжает показывать его состав.
        setSelectedSlotId(null);
        setSelectedContainerId(null);
        setSelectedItemId(null);
        setSelectedInstanceId(null);
        setSelectedCargo(null);
        setMessage('');
    }

    // Клик по креплению: пустое — показываем совместимое оборудование, занятое — сам предмет.
    function handleSlotClick(slot: HangarSlot) {
        setShowShipsForSale(false);
        setMessage('');
        setSelectedHoldId(null);
        setSelectedCargo(null);
        setSelectedContainerId(null);
        if (slot.instance_id) {
            const instance = findInstance(ship, slot.instance_id);
            // Контейнер открывает свои ресурсы, обычный предмет — карточку продажи.
            if (instance?.is_container) {
                handleContainerClick(instance);
                return;
            }
            setSelectedSlotId(null);
            setSelectedItemId(null);
            setSelectedInstanceId(slot.instance_id);
            return;
        }
        const slotTypeId = Number(slot.slot_type_id);
        const compatible = catalog.equipments.filter((item) => Number(item.slotId ?? 0) === slotTypeId);
        setSelectedInstanceId(null);
        setSelectedSlotId(Number(slot.id));
        setActiveTab('equipment');
        setActiveCategory(null);
        setSelectedItemId(compatible[0]?.id ?? null);
    }

    // Клик по контейнеру: в списке остаются ресурсы, которые он принимает, справа — его карточка.
    function handleContainerClick(instance: HangarEquipmentInstance) {
        setShowShipsForSale(false);
        setMessage('');
        setSelectedSlotId(null);
        setSelectedItemId(null);
        setSelectedInstanceId(null);
        setSelectedCargo(null);
        setSelectedHoldId(null);
        setSelectedContainerId(instance.id);
        setActiveTab('resources');
        setActiveCategory(null);
    }

    function handleInstanceClick(instance: HangarEquipmentInstance) {
        setShowShipsForSale(false);
        setMessage('');
        setSelectedSlotId(null);
        setSelectedContainerId(null);
        setSelectedItemId(null);
        setSelectedCargo(null);
        setSelectedInstanceId(instance.id);
    }

    function handleCargoClick(instance: HangarEquipmentInstance, line: HangarCargoLine) {
        setShowShipsForSale(false);
        setMessage('');
        setSelectedSlotId(null);
        setSelectedContainerId(null);
        setSelectedItemId(null);
        setSelectedInstanceId(null);
        setActiveTab('resources');
        setSelectedCargo({containerId: instance.id, resourceId: line.resource_id});
    }

    // Первый товар второй колонки: используется при входе и при выборе своего корабля.
    function selectFirstCatalogItem() {
        const tabItems = activeTab === 'resources'
            ? catalog.resources
            : activeTab === 'equipment'
                ? catalog.equipments
                : [...catalog.equipments, ...catalog.resources];
        const byCategory = activeCategory === null
            ? tabItems
            : tabItems.filter((item) => inCategoryGroup(item, activeCategory));
        const first = byCategory[0] ?? tabItems[0];
        if (!first) return;

        setSelectedItemId(first.id);
        if (activeCategory === null) {
            const group = categoryGroup(findCategory(first.categoryId));
            setActiveCategory(group ? Number(group.id) : null);
        }
    }

    // Клик по трюму выбирает его целиком; повторный клик снимает выбор.
    function handleHoldClick(hold: HangarHold) {
        setMessage('');
        setSelectedSlotId(null);
        setSelectedContainerId(null);
        setSelectedItemId(null);
        setSelectedInstanceId(null);
        setSelectedCargo(null);
        setSelectedHoldId((current) => (current === Number(hold.id) ? null : Number(hold.id)));
    }

    function handleItemClick(item: CatalogItem) {
        setShowShipsForSale(false);
        setMessage('');
        setSelectedInstanceId(null);
        setSelectedCargo(null);
        setSelectedItemId(item.id);
    }

    async function runTrade(action: TradeActionType, payload: Record<string, unknown>) {
        if (!hangar || isTradeProcessing) return;
        setIsTradeProcessing(true);
        setMessage('');
        try {
            const response = await executeTrade(token, action, payload);
            if (response.hangar) onHangarUpdate?.(response.hangar);

            if (action === 'buy_ship') {
                // Купленный корабль появляется в доке, но выбранным остаётся прежний:
                // режим покупки закрывается, игрок возвращается к своему кораблю.
                setShowShipsForSale(false);
                setSaleReturnShipId(null);
                clearSelection();
            } else if (action === 'sell_ship') {
                setSelectedShipId(null);
                clearSelection();
            } else if (action === 'buy_equipment') {
                const instanceId = Number(response.receipt?.instanceId ?? 0);
                clearSelection();
                if (instanceId) setSelectedInstanceId(instanceId);
            } else if (action === 'sell_equipment') {
                clearSelection();
            } else if (action === 'buy_resource') {
                const containerId = Number(response.receipt?.containerInstanceId ?? 0);
                setMessage('');
                if (containerId) setSelectedContainerId(containerId);
                setSelectedItemId(null);
            } else if (action === 'sell_resource') {
                const containerId = Number(response.receipt?.containerInstanceId ?? 0);
                const left = Number(response.receipt?.leftKg ?? 0);
                if (left <= 0) {
                    setSelectedCargo(null);
                } else {
                    setSelectedCargo({containerId, resourceId: Number(response.receipt?.resourceId ?? 0)});
                }
            }
            setConfirm(null);
        } catch (cause) {
            const text = cause instanceof ApiError || cause instanceof Error
                ? cause.message
                : 'Не удалось выполнить действие.';
            setMessage(text);
            setConfirm(null);
        } finally {
            setIsTradeProcessing(false);
        }
    }

    function handleBuy() {
        if (!canBuy) return;
        if (offer && forSaleShip) {
            void runTrade('buy_ship', {shipModelId: forSaleShip.id});
            return;
        }
        if (!selectedItem || !ship) return;
        if (selectedItemIsEquipment) {
            const payload: Record<string, unknown> = {
                userShipId: ship.id,
                equipmentModelId: selectedItem.id,
            };
            if (placement?.kind === 'slot') payload.slotId = placement.id;
            if (placement?.kind === 'hold') payload.holdId = placement.id;
            void runTrade('buy_equipment', payload);
            return;
        }
        const payload: Record<string, unknown> = {userShipId: ship.id, resourceId: selectedItem.id};
        if (containerChoice.target) payload.containerInstanceId = containerChoice.target.id;
        void runTrade('buy_resource', payload);
    }

    // Продажа экземпляра: контейнер с грузом требует подтверждения и уходит вместе с грузом.
    function sellInstance(instance: HangarEquipmentInstance) {
        setMessage('');
        if (instance.cargo.length > 0) setConfirm({kind: 'container', instanceId: instance.id});
        else void runTrade('sell_equipment', {userShipId: ship?.id, equipmentInstanceId: instance.id});
    }

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

    const confirmInstance = confirm?.kind === 'container' ? findInstance(ship, confirm.instanceId) : null;

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
                </div>
                <div className="station-status">
                    <span className="pulse"/>
                    <span id="noticeShop">ТОРГОВЫЙ ТЕРМИНАЛ ПОДКЛЮЧЁН</span>
                </div>
                <div className="hangar-header-actions">
                    <div className="balance" title="Баланс пилота">
                        <div><small>БАЛАНС</small><strong>{formatNumber(hangar?.credits)} <i>¤</i></strong></div>
                    </div>
                    <button className="map-link hangar-account-link" type="button"
                            onClick={() => setAccountOpen(true)} aria-label="Меню аккаунта"
                            title={`Аккаунт: ${email}`}>
                        <HangarIcon name="account" size={15}/><span className="map-link-label">АККАУНТ</span>
                    </button>
                </div>
            </header>

            <div className="content">
                <section className="shop-view" id="view-shop">
                    <div className={`market-grid${showShipsForSale ? ' no-cargo' : ''}`}>
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
                                    {categoryRows.map((row, rowIndex) => (
                                        <div className="catalog-category-row" key={row.kind}>
                                            {rowIndex === 0 && (
                                                <button className={`tab catalog-category${activeCategory === null ? ' active' : ''}`}
                                                        type="button" onClick={() => setActiveCategory(null)}>Все</button>
                                            )}
                                            {row.items.map((category) => {
                                                const count = row.catalog.filter((item) => inCategoryGroup(item, category.id)).length;
                                                return (
                                                    <button
                                                        className={`tab catalog-category${activeCategory === category.id ? ' active' : ''}`}
                                                        key={category.id} type="button"
                                                        onClick={() => {
                                                            setSelectedItemId(null);
                                                            setActiveCategory(category.id);
                                                        }}>
                                                        <HangarIcon name={category.icon} size={13}/>
                                                        <span className="catalog-category-copy"><span>{category.name}</span></span>
                                                        <small className="catalog-category-count">{count}</small>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Колонка 1: корабль игрока. Выбор в доке меняет именно её. */}
                        <section className="inventory-panel panel-block glass ship-column" id="shipPanel">
                            <div className="ship-panel-body panel-body">
                                {ship ? (
                                    <ShipCard key={ship.id} view={ship}
                                              subtitle={`Корабль #${ship.id} · ${ship.status === 1 ? 'разрушен' : 'в строю'} · масса ${formatNumber(ship.mass.total)} кг`}
                                              selectedSlotId={selectedSlotId}
                                              selectedInstanceId={selectedInstanceId}
                                              selectedCargo={selectedCargo}
                                              selectedHoldId={selectedHoldId}
                                              onSlotClick={handleSlotClick}
                                              onInstanceClick={handleInstanceClick}
                                              onContainerClick={handleContainerClick}
                                              onCargoClick={handleCargoClick}
                                              onHoldClick={handleHoldClick}
                                              onShowTip={showTip}
                                              onHideTip={hideTip}/>
                                ) : (
                                    <div className="trade-empty">Корабль ангара ещё не загружен</div>
                                )}
                                {error && <p className="error-message" role="alert">{error}</p>}
                            </div>
                        </section>

                        {/* Колонка 2: что можно купить — с учётом выбранного крепления или контейнера. */}
                        <section className="inventory-panel panel-block glass market-column" id="shopPanel">
                            <div className="item-list panel-body">
                                {groups.length ? groups.map((group) => (
                                    <div className="list-group" key={group.id}>
                                        <div className="list-group-head">
                                            <span className="list-group-icon"><HangarIcon name={group.icon} size={13}/></span>
                                            <strong>{group.name}</strong><small>{group.items.length}</small>
                                        </div>
                                        {group.items.map((item) => (
                                            <button
                                                className={`item-row${selectedItemId === item.id ? ' selected' : ''}`}
                                                key={item.id} type="button"
                                                onClick={() => handleItemClick(item)}>
                                                <span className="item-icon"><HangarIcon name={item.icon} size={22}/></span>
                                                <span className="item-copy">
                                                    <strong>{item.name}</strong>
                                                    <span>{massOf(item) > 0
                                                        ? `Масса ${formatNumber(massOf(item))} кг`
                                                        : 'Единица груза'}</span>
                                                </span>
                                                <span className="item-meta">
                                                    <small>{group.name}</small>
                                                    {priceOf(item, 'price_buy') > 0 && <b>{formatNumber(item.price_buy)} ¤</b>}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )) : (
                                    <div className="list-empty">
                                        {selectedSlot
                                            ? 'Для этого крепления нет подходящего оборудования'
                                            : selectedContainer
                                                ? 'Этот контейнер не принимает доступные ресурсы'
                                                : 'В выбранной категории пока нет объектов'}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Колонка 3: содержимое выбранного купленного корабля. */}
                        {!showShipsForSale && (
                            <section className="inventory-panel panel-block glass cargo-column" id="cargoPanel">
                                <div className="item-list panel-body">
                                    <ContentsList ship={ship}
                                                  activeTab={activeTab}
                                                  holdId={selectedHoldId}
                                                  containerId={selectedContainerId ?? selectedCargo?.containerId ?? null}
                                                  selectedInstanceId={selectedInstanceId}
                                                  selectedCargo={selectedCargo}
                                                  onInstanceClick={handleInstanceClick}
                                                  onContainerClick={handleContainerClick}
                                                  onCargoClick={handleCargoClick}/>
                                </div>
                            </section>
                        )}

                        {/* Колонка 4: карточка выбранного объекта и кнопка действия. */}
                        <section className="inventory-panel shop-panel panel-block glass selection-column">
                            <div className="ship-panel-body shop-panel-body panel-body">
                                {offer && forSaleShip && forSaleView ? (
                                    <>
                                        <ShipCard key={`sale-${forSaleView.id}`} view={forSaleView}
                                                  subtitle={`Корпус #${forSaleShip.id} · доступен для покупки · масса ${formatNumber(forSaleView.mass.total)} кг`}
                                                  selectedSlotId={null}
                                                  selectedInstanceId={null}
                                                  selectedCargo={null}
                                                  selectedHoldId={null}
                                                  onShowTip={showTip}
                                                  onHideTip={hideTip}/>
                                        <div className="ship-rows shop-price-rows">
                                            <div className="ship-row"><span>Цена покупки</span>
                                                <b>{formatNumber(priceOf(forSaleShip, 'price_buy'))} ¤</b></div>
                                            <div className="ship-row"><span>Цена продажи</span>
                                                <b>{formatNumber(priceOf(forSaleShip, 'price_sale'))} ¤</b></div>
                                        </div>
                                        <p className="shop-note">Ваш баланс: {formatNumber(credits)} ¤.</p>
                                        <TradeErrorLine text={message || blocker}/>
                                        <div className="shop-actions">
                                            <BuyButton type="button" label={actionLabels.buy_ship}
                                                       disabled={!canBuy || isTradeProcessing}
                                                       onClick={handleBuy}
                                                       title={blocker || `Купить ${forSaleShip.name}`}/>
                                        </div>
                                    </>
                                ) : selectedItem ? (
                                    <>
                                        <span className="ship-sub">
                                            {categoryOf(selectedItem, selectedItemIsEquipment ? 'equipment' : 'resources')?.name
                                                || tabLabels[selectedItemIsEquipment ? 'equipment' : 'resources']}
                                        </span>
                                        <strong className="ship-title">{selectedItem.name}</strong>
                                        <div className="ship-rows">
                                            {Object.entries(selectedItem.values ?? {}).map(([id, value]) => {
                                                const property = catalog.properties.find((entry) => entry.id === Number(id));
                                                if (!property) return null;
                                                return (
                                                    <div className="ship-row" key={id}>
                                                        <span>{property.name}</span>
                                                        <b>{formatNumber(value)} <small>{property.unit}</small></b>
                                                    </div>
                                                );
                                            })}
                                            {selectedItemIsEquipment ? (
                                                <div className="ship-row">
                                                    <span>Крепление</span>
                                                    <b>{catalog.slots.find((slot) => slot.id === Number(selectedItem.slotId))?.name || 'в трюм'}</b>
                                                </div>
                                            ) : null}
                                            <div className="ship-row">
                                                <span>{selectedItemIsEquipment ? 'Встанет в' : 'Контейнер'}</span>
                                                <b>
                                                    {selectedItemIsEquipment
                                                        ? placement
                                                            ? placement.kind === 'slot'
                                                                ? `Крепление ${placement.index + 1}`
                                                                : `Трюм ${placement.index + 1}`
                                                            : 'нет места'
                                                        : containerChoice.target
                                                            ? `${containerChoice.target.name} · свободно ${formatNumber(containerChoice.target.free_kg)} кг`
                                                            : containerChoice.reason === 'full' ? 'нет места' : 'нет контейнера'}
                                                </b>
                                            </div>
                                        </div>
                                        {selectedItemIsEquipment && isCatalogContainer(selectedItem) && (
                                            <>
                                                <span className="ship-sub">Можно положить</span>
                                                <AllowedList names={selectedItem.prop2 ?? []}/>
                                            </>
                                        )}
                                        <div className="ship-rows shop-price-rows">
                                            <div className="ship-row"><span>Цена покупки</span>
                                                <b>{formatNumber(buyPrice)} ¤{!selectedItemIsEquipment && <small> / кг</small>}</b></div>
                                            <div className="ship-row"><span>Цена продажи</span>
                                                <b>{formatNumber(priceOf(selectedItem, 'price_sale'))} ¤{!selectedItemIsEquipment && <small> / кг</small>}</b></div>
                                        </div>
                                        <p className="shop-note">
                                            {selectedSlot
                                                ? `Крепление ${selectedSlot.slot_index + 1}: показано только совместимое оборудование.`
                                                : selectedContainer
                                                    ? `Контейнер «${selectedContainer.name}»: показаны только принимаемые ресурсы.`
                                                    : 'Покупка идёт на выбранный корабль.'}
                                        </p>
                                        <TradeErrorLine text={message || blocker}/>
                                        <div className="shop-actions">
                                            <BuyButton type="button"
                                                       label={selectedItemIsEquipment ? actionLabels.buy_equipment : actionLabels.buy_resource}
                                                       disabled={!canBuy} onClick={handleBuy}
                                                       title={blocker || `Купить ${selectedItem.name}`}/>
                                        </div>
                                    </>
                                ) : selectedInstance ? (
                                    selectedInstance.is_container ? (
                                        <ContainerCard container={selectedInstance}
                                                       message={message || blocker}
                                                       busy={isTradeProcessing}
                                                       onCargoClick={(line) => handleCargoClick(selectedInstance, line)}
                                                       onSell={() => sellInstance(selectedInstance)}/>
                                    ) : (
                                        <InstanceCard instance={selectedInstance}
                                                      message={message || blocker}
                                                      busy={isTradeProcessing}
                                                      onSell={() => sellInstance(selectedInstance)}/>
                                    )
                                ) : selectedCargoLine && selectedCargoContainer ? (
                                    <CargoCard line={selectedCargoLine} container={selectedCargoContainer}
                                               message={message || blocker} busy={isTradeProcessing}
                                               onSell={() => void runTrade('sell_resource', {
                                                   userShipId: ship?.id,
                                                   containerInstanceId: selectedCargoContainer.id,
                                                   resourceId: selectedCargoLine.resource_id,
                                               })}/>
                                ) : selectedContainer ? (
                                    <ContainerCard container={selectedContainer} message={message || blocker}
                                                   busy={isTradeProcessing}
                                                   onCargoClick={(line) => handleCargoClick(selectedContainer, line)}
                                                   onSell={() => sellInstance(selectedContainer)}/>
                                ) : ship && selectedShipId !== null ? (
                                    <ShipSaleCard ship={ship}
                                                  equipmentCount={instances.length}
                                                  shipPrice={shipSalePrice}
                                                  equipmentPrice={equipmentSalePrice}
                                                  cargoKg={cargoKg}
                                                  cargoPrice={cargoSalePrice}
                                                  canSell={ships.length > 1}
                                                  message={message}
                                                  busy={isTradeProcessing}
                                                  onSell={() => {
                                                      setMessage('');
                                                      setConfirm({kind: 'ship'});
                                                  }}/>
                                ) : ship ? (
                                    <div className="trade-empty">
                                        Выберите корабль в доке, крепление, контейнер или объект в списке
                                    </div>
                                ) : (
                                    <div className="trade-empty">Выберите объект в каталоге</div>
                                )}
                            </div>
                        </section>
                    </div>
                </section>

                <section className="panel-block glass dock-panel">
                    <div className="panel-body dock-body">
                        <div className="ship-gallery">
                            <button
                                className={`ship-gallery-arrow${shipGalleryStart > 0 ? '' : ' unavailable'}`}
                                type="button" aria-label="Показать предыдущие корабли"
                                disabled={shipGalleryStart <= 0}
                                onClick={() => setShipGalleryStart((start) => Math.max(0, start - visibleShipCount))}>
                                <span style={{transform: 'scaleX(-1)'}}><HangarIcon name="chevron" size={18}/></span>
                            </button>
                            <div className="ship-list" ref={shipListRef}
                                 style={{'--ship-gallery-visible-count': visibleShipCount} as CSSProperties}
                                 aria-live="polite">
                                {dockShips.slice(shipGalleryStart, shipGalleryStart + visibleShipCount).map((row) => {
                                    const isSelected = row.isForSale
                                        ? selectedForSaleShipId === row.id
                                        : String(ship?.id) === String(row.id);
                                    return (
                                    <button
                                        className={`ship-card${isSelected ? ' selected' : ''}`}
                                        key={row.id} type="button"
                                        aria-current={isSelected}
                                        onClick={() => {
                                            setMessage('');
                                            if (row.isForSale) {
                                                setSelectedForSaleShipId(Number(row.id));
                                                setShowShipsForSale(true);
                                            } else {
                                                setShowShipsForSale(false);
                                                setSelectedShipId(row.id);
                                                clearSelection();
                                                selectFirstCatalogItem();
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
                                {dockShips.length === 0 && (
                                    <div className="ship-gallery-empty">Корабль ангара ещё не загружен</div>
                                )}
                            </div>
                            <button
                                className={`ship-gallery-arrow${shipGalleryStart + visibleShipCount < dockShips.length ? '' : ' unavailable'}`}
                                type="button" aria-label="Показать следующие корабли"
                                disabled={shipGalleryStart + visibleShipCount >= dockShips.length}
                                onClick={() => setShipGalleryStart((start) =>
                                    Math.min(dockShips.length - visibleShipCount, start + visibleShipCount))}>
                                <HangarIcon name="chevron" size={18}/>
                            </button>
                        </div>
                        <button className="ship-card ship-buy-card" type="button"
                                onClick={() => {
                                    if (showShipsForSale) {
                                        // Возврат к своим кораблям: показываем тот, что был выбран до входа.
                                        const restore = ships.find((row) => String(row.id) === String(saleReturnShipId))
                                            || ships.find((row) => String(row.id) === String(selectedShipId))
                                            || ships[0]
                                            || null;
                                        setSelectedShipId(restore ? restore.id : null);
                                        setSaleReturnShipId(null);
                                        setShowShipsForSale(false);
                                    } else {
                                        setSaleReturnShipId(ship ? ship.id : selectedShipId);
                                        setShowShipsForSale(true);
                                    }
                                    setShipGalleryStart(0);
                                    clearSelection();
                                }}
                                aria-label={showShipsForSale ? 'Показать мои корабли' : 'Показать корабли для продажи'}
                                title={showShipsForSale ? 'Показать мои корабли' : 'Показать корабли для продажи'}>
                            <span className="ship-buy-label">{showShipsForSale ? 'МОИ КОРАБЛИ' : 'КУПИТЬ КОРАБЛЬ'}</span>
                            <span className="ship-buy-hint">{showShipsForSale ? 'АНГАР ПИЛОТА' : 'КАТАЛОГ ФЛОТА'}</span>
                        </button>
                    </div>
                </section>
            </div>

            {confirm && (
                <div className="slot-modal" role="presentation"
                     onMouseDown={(event) => {
                         if (event.target === event.currentTarget) setConfirm(null);
                     }}>
                    <section className="slot-dialog" role="dialog" aria-modal="true"
                             aria-label="Подтверждение продажи">
                        <div className="slot-dialog-head">
                            <div>
                                <span className="eyebrow">ПРОДАЖА</span>
                                <h3>{confirm.kind === 'ship'
                                    ? `«${ship?.name}» — вместе с содержимым`
                                    : confirmInstance ? `«${confirmInstance.name}» — вместе с грузом` : ''}</h3>
                            </div>
                            <button className="slot-close" type="button" aria-label="Закрыть"
                                    onClick={() => setConfirm(null)}>×</button>
                        </div>
                        <div className="dialog-body">
                            {confirm.kind === 'ship' ? (
                                <>
                                    <p className="dialog-text">Корабль продаётся вместе с оборудованием и грузом.</p>
                                    <div className="dialog-lines">
                                        <div className="dialog-line cost"><span>Корабль</span>
                                            <b>{formatNumber(shipSalePrice)} ¤</b></div>
                                        <div className="dialog-line cost">
                                            <span>Оборудование · {instances.length} шт.</span>
                                            <b>{formatNumber(equipmentSalePrice)} ¤</b></div>
                                        <div className="dialog-line cost">
                                            <span>Груз · {formatNumber(cargoKg)} кг</span>
                                            <b>{formatNumber(cargoSalePrice)} ¤</b></div>
                                        <div className="dialog-line total"><span>Итого</span>
                                            <b>{formatNumber(shipSalePrice + equipmentSalePrice + cargoSalePrice)} ¤</b></div>
                                    </div>
                                    <TradeErrorLine text={message}/>
                                    <div className="dialog-actions">
                                        <button className="trade-button sell" type="button" disabled={isTradeProcessing}
                                                onClick={() => ship && void runTrade('sell_ship', {userShipId: ship.id})}>
                                            Продать корабль
                                        </button>
                                        <button className="trade-button ghost" type="button"
                                                onClick={() => setConfirm(null)}>Отмена</button>
                                    </div>
                                </>
                            ) : confirmInstance ? (
                                <>
                                    <p className="dialog-text">Контейнер продаётся только вместе с грузом. Внутри:</p>
                                    <div className="dialog-lines">
                                        {confirmInstance.cargo.map((line) => (
                                            <div className="dialog-line" key={line.resource_id}>
                                                <span>{line.name}</span>
                                                <b>{formatNumber(line.amount_kg)} кг</b>
                                                <small>{formatNumber(line.amount_kg * line.price_sale)} ¤</small>
                                            </div>
                                        ))}
                                        <div className="dialog-line total">
                                            <span>Итого</span>
                                            <b>{formatNumber(
                                                priceOf(catalog.equipments.find((m) => m.id === confirmInstance.model_id), 'price_sale')
                                                + confirmInstance.cargo.reduce((sum, line) => sum + line.amount_kg * line.price_sale, 0),
                                            )} ¤</b>
                                        </div>
                                    </div>
                                    <TradeErrorLine text={message}/>
                                    <div className="dialog-actions">
                                        <button className="trade-button sell" type="button" disabled={isTradeProcessing}
                                                onClick={() => void runTrade('sell_equipment', {
                                                    userShipId: ship?.id,
                                                    equipmentInstanceId: confirmInstance.id,
                                                    withCargo: true,
                                                })}>
                                            Продать вместе с грузом
                                        </button>
                                        <button className="trade-button ghost" type="button"
                                                onClick={() => setConfirm(null)}>Отмена</button>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </section>
                </div>
            )}

            {accountOpen && (
                <div className="hangar-account-backdrop"
                     onMouseDown={(event) => {
                         if (!deletingAccount && event.target === event.currentTarget) setAccountOpen(false);
                     }}>
                    <section className="hangar-account-dialog" role="dialog" aria-modal="true"
                             aria-labelledby="hangar-account-title">
                        <span className="eyebrow">УПРАВЛЕНИЕ АККАУНТОМ</span>
                        <h2 id="hangar-account-title">Выйти из аккаунта?</h2>
                        <p>Вы вернётесь на экран входа.</p>
                        <div className="hangar-account-actions">
                            <button className="trade-button ghost" type="button" disabled={deletingAccount}
                                    onClick={() => setAccountOpen(false)}>Остаться</button>
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
            {tip && createPortal(
                <div className="hangar-slot-tooltip" role="tooltip" ref={tipRef}
                     style={{left: 0, top: 0, visibility: tipPlaced ? 'visible' : 'hidden'}}>
                    <h4>{tip.content.title}</h4>
                    {tip.content.rows.length > 0 && (
                        <div className="tip-list">
                            {tip.content.rows.map((row, rowIndex) => (
                                <div className="tip-item" key={rowIndex}>
                                    <span className="tip-icon"><HangarIcon name={row.icon} size={16}/></span>
                                    <span className="tip-copy">
                                        <strong>{row.name}</strong>
                                        {row.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    {tip.content.note && <small>{tip.content.note}</small>}
                </div>,
                document.body,
            )}
        </main>
    );
}

/* ---------- Блоки ---------- */

function TradeErrorLine({text}: {text: string}) {
    if (!text) return null;
    return <p className="trade-error" role="alert">{text}</p>;
}

// Ресурс по имени: в prop2 контейнера хранятся названия материалов, а не ID.
function resourceByName(name: string) {
    const key = name.trim().toLowerCase();
    return catalog.resources.find((resource) => resource.name.trim().toLowerCase() === key) ?? null;
}

// «Можно положить»: каждая строка с иконкой ресурса, как в референсе ангара.
function AllowedList({names}: {names: string[]}) {
    if (names.length === 0) return null;
    return (
        <div className="trade-cargo-list shop-cargo-list">
            {names.map((name) => {
                const resource = resourceByName(name);
                return (
                    <div className="trade-cargo-row" key={name}>
                        <span className="trade-cargo-icon">
                            <HangarIcon name={resource?.icon || 'crate'} size={13}/>
                        </span>
                        <span className="trade-cargo-name">{resource?.name || name}</span>
                    </div>
                );
            })}
        </div>
    );
}

// Трюм: занятость по массе, плитки оборудования и груз контейнеров.
function HoldBlock({hold, selected, selectedInstanceId, selectedCargo, onInstanceClick, onContainerClick, onCargoClick, onHoldClick, onShowTip, onHideTip}: {
    hold: HangarHold;
    selected: boolean;
    selectedInstanceId: number | null;
    selectedCargo: OwnedCargoSelection | null;
    onInstanceClick: (instance: HangarEquipmentInstance) => void;
    onContainerClick: (instance: HangarEquipmentInstance) => void;
    onCargoClick: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
    onHoldClick: (hold: HangarHold) => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
}) {
    const capacity = Number(hold.capacity_mass);
    const used = Number(hold.used_mass);
    const percent = capacity > 0 ? Math.min(Math.round(used / capacity * 100), 100) : 0;

    return (
        <div className={`hold-row${selected ? ' selected' : ''}`}>
            <button className="hold-head" type="button" aria-pressed={selected}
                    onClick={() => onHoldClick(hold)}>
                <strong>Трюм {hold.hold_index + 1}</strong>
                <span>{formatNumber(used)} / {formatNumber(capacity)} кг</span>
            </button>
            <i className="hold-bar"><em style={{width: `${percent}%`}}/></i>
            {hold.equipment.length > 0 ? (
                <div className="slot-grid hold-grid">
                    {hold.equipment.map((instance) => (
                        <button key={instance.id} type="button"
                                className={`slot-tile hold-tile${selectedInstanceId === instance.id ? ' selected' : ''}`}
                                aria-label={`${instance.name}, ${formatNumber(instance.mass)} кг`}
                                onMouseEnter={(event) => onShowTip(event.currentTarget, holdTipContent(hold, instance))}
                                onMouseLeave={onHideTip}
                                onFocus={(event) => onShowTip(event.currentTarget, holdTipContent(hold, instance))}
                                onBlur={onHideTip}
                                onClick={() => instance.is_container
                                    ? onContainerClick(instance)
                                    : onInstanceClick(instance)}>
                            <HangarIcon name={instance.icon} size={22}/>
                            {instance.cargo.length > 0 && (
                                <span className="slot-cargo-chips">
                                    {instance.cargo.slice(0, 3).map((line) => (
                                        <span key={line.resource_id}
                                              className={`slot-cargo-chip${selectedCargo
                                                  && selectedCargo.containerId === instance.id
                                                  && selectedCargo.resourceId === line.resource_id ? ' selected' : ''}`}
                                              role="button"
                                              tabIndex={0}
                                              aria-label={`${line.name}, ${formatNumber(line.amount_kg)} кг`}
                                              onMouseEnter={(event) => onShowTip(event.currentTarget, cargoTipContent(instance, line))}
                                              onMouseLeave={(event) => {
                                                  const tile = event.currentTarget.closest('.slot-tile');
                                                  if (tile) onShowTip(tile as HTMLElement, holdTipContent(hold, instance));
                                                  else onHideTip();
                                              }}
                                              onFocus={(event) => onShowTip(event.currentTarget, cargoTipContent(instance, line))}
                                              onBlur={onHideTip}
                                              onClick={(event) => {
                                                  event.stopPropagation();
                                                  onCargoClick(instance, line);
                                              }}
                                              onKeyDown={(event) => {
                                                  if (event.key !== 'Enter' && event.key !== ' ') return;
                                                  event.preventDefault();
                                                  event.stopPropagation();
                                                  onCargoClick(instance, line);
                                              }}>
                                            <HangarIcon name={line.icon} size={11}/>
                                        </span>
                                    ))}
                                </span>
                            )}
                            {instance.mass > 0 && <span className="slot-qty">{formatNumber(instance.mass)} кг</span>}
                        </button>
                    ))}
                </div>
            ) : (
                <span className="hold-empty">Пусто</span>
            )}
        </div>
    );
}

// Карточка корабля: свойства, трюмы и крепления — отдельными вкладками.
// Одна и та же разметка рисует и свой корабль, и модель в продаже.
function ShipCard({view, subtitle, selectedSlotId, selectedInstanceId, selectedCargo, selectedHoldId,
                   onSlotClick, onInstanceClick, onContainerClick, onCargoClick, onHoldClick, onShowTip, onHideTip}: {
    view: HangarShip;
    subtitle: string;
    selectedSlotId: number | null;
    selectedInstanceId: number | null;
    selectedCargo: OwnedCargoSelection | null;
    selectedHoldId: number | null;
    onSlotClick?: (slot: HangarSlot) => void;
    onInstanceClick?: (instance: HangarEquipmentInstance) => void;
    onContainerClick?: (instance: HangarEquipmentInstance) => void;
    onCargoClick?: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
    onHoldClick?: (hold: HangarHold) => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
}) {
    const [tab, setTab] = useState<'props' | 'holds' | 'slots'>('props');
    const holds = view.holds;
    const slots = view.slots;
    // Если у корабля нет трюмов или креплений, соответствующая вкладка не показывается.
    const active = (tab === 'holds' && holds.length === 0) || (tab === 'slots' && slots.length === 0)
        ? 'props'
        : tab;
    const model = catalog.ships.find((entry) => entry.id === view.ship_model_id);

    return (
        <>
            <div className="tabs ship-tabs" role="tablist" aria-label="Разделы карточки корабля">
                <button className={`tab${active === 'props' ? ' active' : ''}`} type="button" role="tab"
                        aria-selected={active === 'props'} onClick={() => setTab('props')}>
                    {view.name}
                </button>
                {holds.length > 0 && (
                    <button className={`tab${active === 'holds' ? ' active' : ''}`} type="button" role="tab"
                            aria-selected={active === 'holds'} onClick={() => setTab('holds')}>
                        Трюмы <small>{holds.length}</small>
                    </button>
                )}
                {slots.length > 0 && (
                    <button className={`tab${active === 'slots' ? ' active' : ''}`} type="button" role="tab"
                            aria-selected={active === 'slots'} onClick={() => setTab('slots')}>
                        Крепления <small>{slots.length}</small>
                    </button>
                )}
            </div>

            {active === 'props' && (
                <>
                    <span className="ship-sub ship-meta-line">{subtitle}</span>
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
                        <div className="ship-row"><span>Оборудование</span>
                            <b>{formatNumber(view.mass.equipment)} <small>кг</small></b></div>
                        <div className="ship-row"><span>Груз</span>
                            <b>{formatNumber(view.mass.cargo)} <small>кг</small></b></div>
                    </div>
                </>
            )}

            {active === 'holds' && (
                <div className="hold-list">
                    {holds.map((hold) => (
                        <HoldBlock key={hold.id} hold={hold}
                                   selected={selectedHoldId === Number(hold.id)}
                                   selectedInstanceId={selectedInstanceId}
                                   selectedCargo={selectedCargo}
                                   onInstanceClick={onInstanceClick ?? noop}
                                   onContainerClick={onContainerClick ?? noop}
                                   onCargoClick={onCargoClick ?? noop}
                                   onHoldClick={onHoldClick ?? noop}
                                   onShowTip={onShowTip}
                                   onHideTip={onHideTip}/>
                    ))}
                </div>
            )}

            {active === 'slots' && (
                <div className="slot-grid">
                    {slots.map((slot) => {
                        const compatible = catalog.equipments
                            .some((item) => Number(item.slotId ?? 0) === Number(slot.slot_type_id));
                        const isEmpty = !slot.instance_id;
                        const slotInstance = slot.instance_id ? findInstance(view, slot.instance_id) : null;
                        return (
                            <button
                                key={`slot-${slot.id}`}
                                type="button"
                                className={`slot-tile${isEmpty ? ' empty' : ''}${isEmpty && compatible ? ' has-goods' : ''}`
                                    + (selectedSlotId === Number(slot.id) ? ' selected' : '')
                                    + (slot.instance_id && selectedInstanceId === slot.instance_id ? ' selected' : '')}
                                aria-label={`${slotTypeName(slot.slot_type_id)}: ${slot.name || 'пусто'}`}
                                onMouseEnter={(event) => onShowTip(event.currentTarget, slotTipContent(slot, compatible))}
                                onMouseLeave={onHideTip}
                                onFocus={(event) => onShowTip(event.currentTarget, slotTipContent(slot, compatible))}
                                onBlur={onHideTip}
                                onClick={onSlotClick ? () => onSlotClick(slot) : undefined}>
                                {slot.name ? <HangarIcon name={slot.icon || 'tool'} size={22}/> : null}
                                {slot.instance_id && (slot.cargo?.length ?? 0) > 0 && (
                                    <span className="slot-cargo-chips">
                                        {(slot.cargo ?? []).slice(0, 3).map((line) => (
                                            <span key={line.resource_id} className="slot-cargo-chip"
                                                  role="button"
                                                  tabIndex={0}
                                                  aria-label={`${line.name}, ${formatNumber(line.amount_kg)} кг`}
                                                  onMouseEnter={(event) => {
                                                      if (slotInstance) onShowTip(event.currentTarget, cargoTipContent(slotInstance, line));
                                                  }}
                                                  onMouseLeave={(event) => {
                                                      const tile = event.currentTarget.closest('.slot-tile');
                                                      if (tile) onShowTip(tile as HTMLElement, slotTipContent(slot, compatible));
                                                      else onHideTip();
                                                  }}
                                                  onFocus={(event) => {
                                                      if (slotInstance) onShowTip(event.currentTarget, cargoTipContent(slotInstance, line));
                                                  }}
                                                  onBlur={onHideTip}
                                                  onClick={(event) => {
                                                      event.stopPropagation();
                                                      if (slotInstance && onCargoClick) onCargoClick(slotInstance, line);
                                                  }}
                                                  onKeyDown={(event) => {
                                                      if (event.key !== 'Enter' && event.key !== ' ') return;
                                                      event.preventDefault();
                                                      event.stopPropagation();
                                                      if (slotInstance && onCargoClick) onCargoClick(slotInstance, line);
                                                  }}>
                                                <HangarIcon name={line.icon} size={11}/>
                                            </span>
                                        ))}
                                    </span>
                                )}
                                {slot.mass > 0 && <span className="slot-qty">{formatNumber(slot.mass)} кг</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    );
}

// Колонка содержимого: те же категории каталога, что и в списке товаров.
type ContentRow = {
    key: string;
    kind: 'equipment' | 'cargo';
    instance: HangarEquipmentInstance;
    line?: HangarCargoLine;
    model: CatalogItem | null;
};

function ContentsList({ship, activeTab, holdId, containerId, selectedInstanceId, selectedCargo, onInstanceClick, onContainerClick, onCargoClick}: {
    ship: HangarShip | null;
    activeTab: CatalogTab;
    holdId: number | null;
    containerId: number | null;
    selectedInstanceId: number | null;
    selectedCargo: OwnedCargoSelection | null;
    onInstanceClick: (instance: HangarEquipmentInstance) => void;
    onContainerClick: (instance: HangarEquipmentInstance) => void;
    onCargoClick: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
}) {
    if (!ship) return <div className="list-empty">Корабль не выбран</div>;

    const hold = holdId === null ? null : ship.holds.find((entry) => Number(entry.id) === holdId) ?? null;
    const inHold = holdId !== null;
    const inContainer = containerId !== null;
    // Выбранный контейнер показывает только своё содержимое, выбранный трюм — весь состав.
    const instances = shipInstances(ship).filter((instance) =>
        inContainer
            ? instance.id === containerId
            : (!inHold || Number(instance.hold_id) === holdId));
    const rows: ContentRow[] = [];
    for (const instance of instances) {
        // В выбранном трюме показываем весь состав: и оборудование, и груз контейнеров.
        if (!inContainer && (inHold || activeTab !== 'resources')) {
            rows.push({
                key: `e-${instance.id}`,
                kind: 'equipment',
                instance,
                model: catalog.equipments.find((entry) => entry.id === instance.model_id) ?? null,
            });
        }
        if (inHold || inContainer || activeTab !== 'equipment') {
            for (const line of instance.cargo) {
                rows.push({
                    key: `c-${instance.id}-${line.resource_id}`,
                    kind: 'cargo',
                    instance,
                    line,
                    model: catalog.resources.find((entry) => entry.id === line.resource_id) ?? null,
                });
            }
        }
    }

    if (rows.length === 0) {
        const emptyText = inContainer
            ? 'В этом контейнере пусто'
            : hold
            ? 'В этом трюме пусто'
            : activeTab === 'resources' ? 'Ресурсов на корабле нет' : 'Оборудования на корабле нет';
        return <div className="list-empty">{emptyText}</div>;
    }

    const groups = groupByCategories(rows, (row) => row.model?.categoryId);

    return (
        <>
            {groups.map((group) => (
                <div className="list-group" key={group.id}>
                    <div className="list-group-head">
                        <span className="list-group-icon"><HangarIcon name={group.icon} size={13}/></span>
                        <strong>{group.name}</strong><small>{group.items.length}</small>
                    </div>
                    {group.items.map((row) => {
                                if (row.kind === 'cargo' && row.line) {
                                    const line = row.line;
                                    return (
                                        <button key={row.key} type="button"
                                                className={`item-row${selectedCargo
                                                    && selectedCargo.containerId === row.instance.id
                                                    && selectedCargo.resourceId === line.resource_id ? ' selected' : ''}`}
                                                onClick={() => onCargoClick(row.instance, line)}>
                                            <span className="item-icon"><HangarIcon name={line.icon} size={22}/></span>
                                            <span className="item-copy">
                                                <strong>{line.name}</strong>
                                                <span>{row.instance.name} · {locationLabel(row.instance)}</span>
                                            </span>
                                            <span className="item-meta">
                                                <small>{formatNumber(line.amount_kg)} кг</small>
                                                <b>{formatNumber(line.price_sale)} ¤/кг</b>
                                            </span>
                                        </button>
                                    );
                                }
                                const instance = row.instance;
                                return (
                                    <button key={row.key} type="button"
                                            className={`item-row${selectedInstanceId === instance.id ? ' selected' : ''}`}
                                            onClick={() => instance.is_container
                                                ? onContainerClick(instance)
                                                : onInstanceClick(instance)}>
                                        <span className="item-icon"><HangarIcon name={instance.icon} size={22}/></span>
                                        <span className="item-copy">
                                            <strong>{instance.name}</strong>
                                            <span>{locationLabel(instance)}</span>
                                        </span>
                                        <span className="item-meta">
                                            <small>{formatNumber(instance.mass)} кг</small>
                                            {instance.is_container
                                                && <b>{formatNumber(instance.used_kg)} / {formatNumber(instance.capacity_kg)} кг</b>}
                                        </span>
                                    </button>
                                );
                    })}
                </div>
            ))}
        </>
    );
}

// Карточка продажи своего корабля: разбивка цены и единственная кнопка продажи.
function ShipSaleCard({ship, equipmentCount, shipPrice, equipmentPrice, cargoKg, cargoPrice, canSell, message, busy, onSell}: {
    ship: HangarShip;
    equipmentCount: number;
    shipPrice: number;
    equipmentPrice: number;
    cargoKg: number;
    cargoPrice: number;
    canSell: boolean;
    message: string;
    busy: boolean;
    onSell: () => void;
}) {
    return (
        <>
            <span className="ship-sub">Мой корабль · продажа</span>
            <strong className="ship-title">{ship.name}</strong>
            <div className="ship-rows shop-price-rows">
                <div className="ship-row"><span>Корабль</span><b>{formatNumber(shipPrice)} ¤</b></div>
                <div className="ship-row"><span>Оборудование · {equipmentCount} шт.</span>
                    <b>{formatNumber(equipmentPrice)} ¤</b></div>
                <div className="ship-row"><span>Груз · {formatNumber(cargoKg)} кг</span>
                    <b>{formatNumber(cargoPrice)} ¤</b></div>
            </div>
            <div className="trade-sale-total">
                <span>Итого</span>
                <b>{formatNumber(shipPrice + equipmentPrice + cargoPrice)} ¤</b>
            </div>
            {!canSell && <p className="trade-error">Нельзя продать единственный корабль.</p>}
            <TradeErrorLine text={message}/>
            <div className="shop-actions">
                <SellButton type="button" label="Продать корабль" disabled={!canSell || busy} onClick={onSell}/>
            </div>
        </>
    );
}

function InstanceCard({instance, message, busy, onSell}: {
    instance: HangarEquipmentInstance;
    message: string;
    busy: boolean;
    onSell: () => void;
}) {
    const model = catalog.equipments.find((entry) => entry.id === instance.model_id) ?? null;
    return (
        <>
            <span className="ship-sub">{categoryOf(model, 'equipment')?.name || 'Оборудование'}</span>
            <strong className="ship-title">{instance.name}</strong>
            <div className="ship-rows">
                <div className="ship-row"><span>Место</span><b>{locationLabel(instance)}</b></div>
                <div className="ship-row"><span>Масса</span><b>{formatNumber(instance.mass)} кг</b></div>
                {instance.is_container && (
                    <div className="ship-row"><span>Заполнено</span>
                        <b>{formatNumber(instance.used_kg)} / {formatNumber(instance.capacity_kg)} кг</b></div>
                )}
            </div>
            {instance.cargo.length > 0 && (
                <>
                    <span className="ship-sub">Груз в контейнере</span>
                    <div className="trade-cargo-list shop-cargo-list">
                        {instance.cargo.map((line) => (
                            <div className="trade-cargo-row" key={line.resource_id}>
                                <span className="trade-cargo-name">{line.name}</span>
                                <span className="trade-cargo-kg">{formatNumber(line.amount_kg)} кг</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
            <div className="ship-rows shop-price-rows">
                <div className="ship-row"><span>Цена продажи</span>
                    <b>{formatNumber(priceOf(model, 'price_sale')
                        + instance.cargo.reduce((sum, line) => sum + line.amount_kg * line.price_sale, 0))} ¤</b></div>
            </div>
            <TradeErrorLine text={message}/>
            <div className="shop-actions">
                <SellButton type="button"
                            label={instance.cargo.length > 0 ? 'Продать вместе с грузом' : actionLabels.sell_equipment}
                            disabled={busy} onClick={onSell}/>
            </div>
        </>
    );
}

function CargoCard({line, container, message, busy, onSell}: {
    line: HangarCargoLine;
    container: HangarEquipmentInstance;
    message: string;
    busy: boolean;
    onSell: () => void;
}) {
    return (
        <>
            <span className="ship-sub">Груз · {container.name}</span>
            <strong className="ship-title">{line.name}</strong>
            <div className="ship-rows">
                <div className="ship-row"><span>В контейнере</span><b>{formatNumber(line.amount_kg)} кг</b></div>
                <div className="ship-row"><span>Свободно</span><b>{formatNumber(container.free_kg)} кг</b></div>
            </div>
            <div className="ship-rows shop-price-rows">
                <div className="ship-row"><span>Цена продажи</span><b>{formatNumber(line.price_sale)} ¤ / кг</b></div>
                <div className="ship-row"><span>За 1 кг</span><b>{formatNumber(line.price_sale)} ¤</b></div>
            </div>
            <TradeErrorLine text={message}/>
            <div className="shop-actions">
                <SellButton type="button" label="Продать 1 кг" disabled={busy} onClick={onSell}/>
            </div>
        </>
    );
}

function ContainerCard({container, message, busy, onCargoClick, onSell}: {
    container: HangarEquipmentInstance;
    message: string;
    busy: boolean;
    onCargoClick: (line: HangarCargoLine) => void;
    onSell: () => void;
}) {
    const model = catalog.equipments.find((entry) => entry.id === container.model_id) ?? null;
    return (
        <>
            <span className="ship-sub">{categoryOf(model, 'equipment')?.name || 'Контейнер'} · {locationLabel(container)}</span>
            <strong className="ship-title">{container.name}</strong>
            <div className="ship-rows">
                <div className="ship-row"><span>Заполнено</span>
                    <b>{formatNumber(container.used_kg)} / {formatNumber(container.capacity_kg)} кг</b></div>
                <div className="ship-row"><span>Свободно</span><b>{formatNumber(container.free_kg)} кг</b></div>
                <div className="ship-row"><span>Принимает</span><b>{container.allowed.length} вид(ов)</b></div>
            </div>
            <span className="ship-sub">Груз в контейнере</span>
            {container.cargo.length > 0 ? (
                <div className="trade-cargo-list shop-cargo-list">
                    {container.cargo.map((line) => (
                        <button className="trade-cargo-row" type="button" key={line.resource_id}
                                onClick={() => onCargoClick(line)}>
                            <span className="trade-cargo-name">{line.name}</span>
                            <span className="trade-cargo-kg">{formatNumber(line.amount_kg)} кг</span>
                        </button>
                    ))}
                </div>
            ) : (
                <span className="hold-empty">Пусто</span>
            )}
            <span className="ship-sub">Можно положить</span>
            <AllowedList names={container.allowed}/>
            <TradeErrorLine text={message}/>
            <div className="shop-actions">
                <SellButton type="button"
                            label={container.cargo.length > 0 ? 'Продать вместе с грузом' : actionLabels.sell_equipment}
                            disabled={busy} onClick={onSell}/>
            </div>
        </>
    );
}
