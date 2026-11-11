// Выбор игрока и его производные: что показать в правой колонке и что покупать.
import type {
    HangarCargoLine,
    HangarEquipmentInstance,
    HangarShip,
    HangarSlot,
    HangarStatus,
    TradeActionType,
} from '../types';
import {
    catalog,
    itemsForTab,
    priceOf,
    type CatalogItem,
    type CatalogShipModel,
    type CatalogTab,
} from './catalog';
import {formatNumber} from './format';
import {
    catalogShipView,
    findInstance,
    resolveContainer,
    resolvePlacement,
    type ContainerChoice,
    type OwnedCargoSelection,
    type Placement,
    type ShipView,
} from './ship';

export type Selection = {
    tab: CatalogTab;
    categoryId: number | null;
    shipId: string | number | null;
    forSale: boolean;
    forSaleShipId: number | null;
    slotRowId: number | null;
    holdId: number | null;
    containerId: number | null;
    itemId: number | null;
    instanceId: number | null;
    cargo: OwnedCargoSelection | null;
};

export type SelectionView = {
    forSaleShip: CatalogShipModel | null;
    forSaleView: ShipView | null;
    item: CatalogItem | null;
    itemIsEquipment: boolean;
    slot: HangarSlot | null;
    container: HangarEquipmentInstance | null;
    instance: HangarEquipmentInstance | null;
    cargoContainer: HangarEquipmentInstance | null;
    cargoLine: HangarCargoLine | null;
    placement: Placement | null;
    containerChoice: ContainerChoice;
    buyPrice: number;
    blocker: string;
    canBuy: boolean;
};

// Всё, что правая колонка и кнопка покупки выводят из текущего выбора.
export function selectionView(
    selection: Selection,
    ship: HangarShip | null,
    hangar: HangarStatus | null,
    busy: boolean,
): SelectionView {
    const forSaleShip = selection.forSale
        ? catalog.ships.find((model) => model.id === selection.forSaleShipId) || null
        : null;
    const forSaleView = forSaleShip ? catalogShipView(forSaleShip) : null;
    const containers = ship?.containers ?? [];
    const slot = ship?.slots.find((row) => Number(row.id) === selection.slotRowId) || null;
    const container = containers.find((row) => row.id === selection.containerId) || null;
    const instance = findInstance(ship, selection.instanceId);
    const cargo = selection.cargo;
    const cargoContainer = cargo
        ? containers.find((row) => row.id === cargo.containerId) || null
        : null;
    const cargoLine = cargo && cargoContainer
        ? cargoContainer.cargo.find((line) => line.resource_id === cargo.resourceId) || null
        : null;

    const tabItems = itemsForTab(selection.tab);
    const item = selection.itemId !== null
        ? tabItems.find((entry) => entry.id === selection.itemId)
            ?? catalog.equipments.find((entry) => entry.id === selection.itemId)
            ?? catalog.resources.find((entry) => entry.id === selection.itemId)
            ?? null
        : null;
    const itemIsEquipment = Boolean(item && catalog.equipments.some((entry) => entry.id === item.id));

    const placement = item && itemIsEquipment && ship ? resolvePlacement(ship, item, selection.slotRowId) : null;
    const containerChoice = item && !itemIsEquipment
        ? resolveContainer(ship, item, selection.containerId)
        : {target: null, reason: 'none' as const};

    const offer = selection.forSale && forSaleShip;
    const buyPrice = offer
        ? priceOf(forSaleShip, 'price_buy')
        : item ? priceOf(item, 'price_buy') : 0;
    const credits = Number(hangar?.credits ?? 0);

    // Причина, по которой кнопка заблокирована: показывается над кнопкой, а не в модальном окне.
    let blocker = '';
    if (!hangar) {
        blocker = 'Ангар ещё не загружен.';
    } else if (offer) {
        if (credits < buyPrice) blocker = `Недостаточно кредитов: нужно ${formatNumber(buyPrice)} ¤, у вас ${formatNumber(credits)} ¤.`;
    } else if (item && itemIsEquipment) {
        if (!placement) blocker = 'Нет свободного крепления и места в трюме.';
        else if (credits < buyPrice) blocker = `Недостаточно кредитов: нужно ${formatNumber(buyPrice)} ¤, у вас ${formatNumber(credits)} ¤.`;
    } else if (item) {
        if (containerChoice.reason === 'none') blocker = 'Нет контейнера для этого ресурса.';
        else if (containerChoice.reason === 'full') blocker = 'В контейнере нет места.';
        else if (credits < buyPrice) blocker = `Недостаточно кредитов: нужно ${formatNumber(buyPrice)} ¤, у вас ${formatNumber(credits)} ¤.`;
    }

    return {
        forSaleShip,
        forSaleView,
        item,
        itemIsEquipment,
        slot,
        container,
        instance,
        cargoContainer,
        cargoLine,
        placement,
        containerChoice,
        buyPrice,
        blocker,
        canBuy: Boolean(hangar) && !blocker && (Boolean(offer) || Boolean(item)) && !busy,
    };
}

export type TradeIntent = {action: TradeActionType; payload: Record<string, unknown>};

// Что именно отправить на сервер при нажатии «Купить»: место и контейнер входят в запрос.
export function buyIntent(view: SelectionView, ship: HangarShip | null): TradeIntent | null {
    if (!view.canBuy) return null;
    if (view.forSaleShip) return {action: 'buy_ship', payload: {shipModelId: view.forSaleShip.id}};
    const item = view.item;
    if (!item || !ship) return null;

    if (view.itemIsEquipment) {
        const payload: Record<string, unknown> = {userShipId: ship.id, equipmentModelId: item.id};
        if (view.placement?.kind === 'slot') payload.slotId = view.placement.id;
        if (view.placement?.kind === 'hold') payload.holdId = view.placement.id;
        return {action: 'buy_equipment', payload};
    }

    const payload: Record<string, unknown> = {userShipId: ship.id, resourceId: item.id};
    if (view.containerChoice.target) payload.containerInstanceId = view.containerChoice.target.id;
    return {action: 'buy_resource', payload};
}
