// Фикстуры для тестов lib/: корабль, крепление, трюм, предмет и контейнер.
import type {
    HangarCargoLine,
    HangarEquipmentInstance,
    HangarHold,
    HangarShip,
    HangarSlot,
} from '../../types';
import {MASS_PROPERTY_ID, type CatalogItem} from '../catalog';

export function item(overrides: Partial<CatalogItem> = {}): CatalogItem {
    return {id: 1, name: 'Лазер M-1', icon: 'weapon', ...overrides};
}

export function withMass(mass: number, overrides: Partial<CatalogItem> = {}): CatalogItem {
    return item({values: {[MASS_PROPERTY_ID]: String(mass)}, ...overrides});
}

export function slot(overrides: Partial<HangarSlot> = {}): HangarSlot {
    return {
        id: 1,
        slot_index: 0,
        slot_type_id: 1,
        slot_type_name: 'Лазер',
        instance_id: null,
        model_id: null,
        name: null,
        icon: null,
        mass: 0,
        cargo: [],
        ...overrides,
    };
}

export function hold(overrides: Partial<HangarHold> = {}): HangarHold {
    return {
        id: 10,
        hold_index: 0,
        capacity_mass: 500,
        used_mass: 0,
        free_mass: 500,
        equipment: [],
        ...overrides,
    };
}

export function container(overrides: Partial<HangarEquipmentInstance> = {}): HangarEquipmentInstance {
    return {
        id: 100,
        instance_id: 100,
        model_id: 68,
        name: 'Грузовой отсек 500 кг',
        icon: 'crate',
        mass: 40,
        slot_id: null,
        hold_id: 10,
        location: {kind: 'hold', id: 10, index: 0},
        is_container: true,
        capacity_kg: 500,
        used_kg: 0,
        free_kg: 500,
        allowed: ['Камень'],
        cargo: [],
        ...overrides,
    };
}

export function ship(overrides: Partial<HangarShip> = {}): HangarShip {
    return {
        id: 1,
        ship_model_id: 1,
        name: 'Гром',
        status: 0,
        health: 100,
        shield: 50,
        hangar_id: 1,
        sol_id: 1,
        mass: {hull: 1000, equipment: 100, cargo: 0, total: 1100},
        slots: [],
        holds: [],
        containers: [],
        ...overrides,
    };
}

export function cargoLine(overrides: Partial<HangarCargoLine> = {}): HangarCargoLine {
    return {
        resource_id: 173,
        name: 'Камень',
        icon: 'gem',
        amount_kg: 100,
        price_sale: 2,
        price_buy: 3,
        ...overrides,
    };
}
