// Корабль: экземпляры, места, размещение покупки, контейнеры и модель для карточки.
import type {HangarCargoLine, HangarEquipmentInstance, HangarHold, HangarShip, HangarSlot} from '../types';
import {
    catalog,
    capacityOf,
    findEquipment,
    findShipModel,
    isCatalogContainer,
    massOf,
    priceOf,
    propertyRows,
    slotTypeName,
    type CatalogItem,
    type CatalogShipModel,
} from './catalog';
import {formatNumber} from './format';

export type Placement = {kind: 'slot' | 'hold'; id: number; index: number};

export type OwnedCargoSelection = {containerId: number; resourceId: number};

export type ContainerChoice = {target: HangarEquipmentInstance | null; reason: 'ok' | 'full' | 'none'};

// Для поиска экземпляра достаточно любой формы корабля: снимка сервера или ShipView.
export type ShipLike = Pick<HangarShip, 'slots' | 'holds' | 'containers'>;

export function locationLabel(instance: HangarEquipmentInstance) {
    return instance.location.kind === 'slot'
        ? `Крепление ${(instance.location.index ?? 0) + 1}`
        : `Трюм ${(instance.location.index ?? 0) + 1}`;
}

// Полный список экземпляров корабля без дублей: контейнеры приходят и в слотах, и в трюмах.
export function shipInstances(ship: ShipLike | null): HangarEquipmentInstance[] {
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

export function findInstance(ship: ShipLike | null, instanceId: number | null) {
    if (!ship || instanceId === null) return null;
    return shipInstances(ship).find((instance) => instance.id === instanceId) ?? null;
}

// Куда встанет оборудование: явно выбранное крепление, иначе первый свободный слот, затем трюм.
export function resolvePlacement(ship: ShipLike | null, item: CatalogItem, explicitSlotRowId: number | null): Placement | null {
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
export function resolveContainer(ship: ShipLike | null, resource: CatalogItem | null, explicitId: number | null): ContainerChoice {
    if (!ship || !resource) return {target: null, reason: 'none'};
    const name = resource.name.trim().toLowerCase();
    const accepting = ship.containers.filter((container) =>
        container.allowed.some((allowed) => allowed.trim().toLowerCase() === name));

    if (explicitId !== null) {
        const explicit = ship.containers.find((container) => container.id === explicitId);
        if (explicit && accepting.some((container) => container.id === explicit.id)) {
            return explicit.free_kg >= 1
                ? {target: explicit, reason: 'ok'}
                : {target: null, reason: 'full'};
        }
    }
    if (accepting.length === 0) return {target: null, reason: 'none'};
    const withSpace = accepting.find((container) => container.free_kg >= 1);
    return withSpace ? {target: withSpace, reason: 'ok'} : {target: null, reason: 'full'};
}

export function cargoPrice(cargo: HangarCargoLine[]) {
    return cargo.reduce((sum, line) => sum + line.amount_kg * line.price_sale, 0);
}

export function cargoKg(cargo: HangarCargoLine[]) {
    return cargo.reduce((sum, line) => sum + line.amount_kg, 0);
}

// Цена продажи экземпляра: модель плюс груз внутри.
export function instanceSalePrice(instance: HangarEquipmentInstance) {
    return priceOf(findEquipment(instance.model_id), 'price_sale') + cargoPrice(instance.cargo);
}

export type ShipSaleBreakdown = {equipmentPrice: number; cargoKg: number; cargoPrice: number};

export type DockShip = {
    id: number | string;
    name: string;
    isForSale: boolean;
    price: number;
    modelId: number;
};

// Содержимое дока: свои корабли из ангара либо модели каталога в режиме покупки.
export function dockShips(forSale: boolean, ships: HangarShip[]): DockShip[] {
    return forSale
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
}

export function saleBreakdown(ship: ShipLike | null): ShipSaleBreakdown {
    const instances = shipInstances(ship);
    return {
        equipmentPrice: instances.reduce((total, instance) =>
            total + priceOf(findEquipment(instance.model_id), 'price_sale'), 0),
        cargoKg: instances.reduce((total, instance) => total + cargoKg(instance.cargo), 0),
        cargoPrice: instances.reduce((total, instance) => total + cargoPrice(instance.cargo), 0),
    };
}

/* ---------- ShipView: одна форма корабля для карточки ---------- */

export type ShipViewRow = {
    id: string;
    label: string;
    value: string | number | undefined | null;
    unit?: string;
};

export type ShipView = {
    id: number | string;
    title: string;
    subtitle: string;
    rows: ShipViewRow[];
    holds: HangarHold[];
    slots: HangarSlot[];
    containers: HangarEquipmentInstance[];
    mass: {hull: number; equipment: number; cargo: number; total: number};
};

function propertyViewRows(values?: Record<string, string>): ShipViewRow[] {
    return propertyRows(values).map((row) => ({
        id: `property-${row.id}`,
        label: row.name,
        value: row.value,
        unit: row.unit,
    }));
}

// Свой корабль: массы и свойства приходят с сервера, подпись собирается здесь же.
export function shipView(ship: HangarShip): ShipView {
    const model = findShipModel(ship.ship_model_id);
    return {
        id: ship.id,
        title: ship.name,
        subtitle: `Корабль #${ship.id} · ${ship.status === 1 ? 'разрушен' : 'в строю'} · масса ${formatNumber(ship.mass.total)} кг`,
        rows: [
            ...propertyViewRows(model?.values),
            {id: 'mass-equipment', label: 'Оборудование', value: ship.mass.equipment, unit: 'кг'},
            {id: 'mass-cargo', label: 'Груз', value: ship.mass.cargo, unit: 'кг'},
        ],
        holds: ship.holds,
        slots: ship.slots,
        containers: ship.containers,
        mass: ship.mass,
    };
}

// Модель из каталога в форме корабля игрока: одна карточка рисует и свой корабль, и модель в продаже.
export function catalogShipView(model: CatalogShipModel): ShipView {
    const slots: HangarSlot[] = model.slots.map((slot, index) => {
        const item = Number(slot.itemId ?? 0) > 0 ? findEquipment(slot.itemId) : null;
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

    const holds: HangarHold[] = model.holds.map((hold, index) => {
        const item = Number(hold.itemId ?? 0) > 0 ? findEquipment(hold.itemId) : null;
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
    const containers = holds.flatMap((hold) => hold.equipment).filter((instance) => instance.is_container);

    return {
        id: Number(model.id),
        title: model.name,
        subtitle: `Корпус #${model.id} · доступен для покупки · масса ${formatNumber(hullMass + equipmentMass)} кг`,
        rows: [
            ...propertyViewRows(model.values),
            {id: 'mass-equipment', label: 'Оборудование', value: equipmentMass, unit: 'кг'},
            {id: 'mass-cargo', label: 'Груз', value: 0, unit: 'кг'},
        ],
        holds,
        slots,
        containers,
        mass: {hull: hullMass, equipment: equipmentMass, cargo: 0, total: hullMass + equipmentMass},
    };
}
