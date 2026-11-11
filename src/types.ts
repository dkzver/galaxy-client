// Общие типы ответов API и состояния сцен браузерного клиента.
export interface AuthResponse {
    token: string;
    user: { id: number | string; email: string };
}

// Строка груза в контейнере: килограммы и цены за килограмм.
export interface HangarCargoLine {
    resource_id: number;
    name: string;
    icon: string;
    amount_kg: number;
    price_sale: number;
    price_buy: number;
}

// Массы корабля считает сервер: клиент только показывает.
export interface HangarMass {
    hull: number;
    equipment: number;
    cargo: number;
    total: number;
}

export interface HangarLocation {
    kind: 'slot' | 'hold';
    id: number;
    index: number | null;
}

// Экземпляр оборудования. Место хранения всегда одно: крепление либо трюм.
export interface HangarEquipmentInstance {
    id: number;
    instance_id: number;
    model_id: number;
    name: string;
    icon: string;
    mass: number;
    slot_id: number | null;
    hold_id: number | null;
    location: HangarLocation;
    is_container: boolean;
    capacity_kg: number;
    used_kg: number;
    free_kg: number;
    allowed: string[];
    cargo: HangarCargoLine[];
}

export interface HangarSlot {
    id: number | string;
    slot_index: number;
    slot_type_id: number;
    slot_type_name: string;
    instance_id: number | null;
    model_id: number | null;
    name?: string | null;
    icon?: string | null;
    mass: number;
    cargo?: HangarCargoLine[];
}

export interface HangarHold {
    id: number | string;
    hold_index: number;
    capacity_mass: number;
    used_mass: number;
    free_mass: number;
    equipment: HangarEquipmentInstance[];
}

export interface HangarShip {
    id: number | string;
    ship_model_id: number;
    name: string;
    status: number;
    health: number;
    shield: number;
    hangar_id: number;
    sol_id: number;
    mass: HangarMass;
    slots: HangarSlot[];
    holds: HangarHold[];
    containers: HangarEquipmentInstance[];
}

export interface HangarStatus {
    user_id: number | string;
    email: string;
    credits: string | number;
    ships: HangarShip[];
}

export interface SpacePlayer {
    id: string;
    username: string;
    x: number;
    z: number;
}

// Полный набор торговых действий: сервер поддерживает ровно эти шесть.
export type TradeActionType =
    | 'buy_ship'
    | 'sell_ship'
    | 'buy_equipment'
    | 'sell_equipment'
    | 'buy_resource'
    | 'sell_resource';

export type AppScreen = 'auth' | 'hangar' | 'space';
export type SpaceZone = 'galaxy-map' | 'sector-alpha';
