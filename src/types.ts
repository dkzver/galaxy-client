// Общие типы ответов API и состояния сцен браузерного клиента.
export interface AuthResponse {
    token: string;
    user: { id: number | string; email: string };
}

export interface HangarStatus {
    user_id: number | string;
    email: string;
    ship_id: number | string | null;
    hull_type: string | null;
    credits: string | number;
    ships: HangarShip[];
}

export interface HangarShip {
    id: number | string;
    ship_id: number;
    status: number;
    health: number;
    shield: number;
    slots?: HangarShipSlot[];
    holds?: HangarShipHold[];
}

export interface HangarShipSlot {
    id: number | string;
    slot_index: number;
    slot_id: number;
    equipment_id: number | null;
}

export interface HangarShipHold {
    id: number | string;
    hold_index: number;
    capacity_mass: string | number;
    occupied_mass: string | number;
    source_equipment_id: number | string | null;
    source_equipment_model_id: number | null;
    equipment: HangarHoldEquipment[];
    resources: HangarHoldResource[];
}

export interface HangarHoldEquipment {
    id: number | string;
    equipment_id: number;
}

export interface HangarHoldResource {
    id: number | string;
    resource_id: number;
    amount: string | number;
}

export interface SpacePlayer {
    id: string;
    username: string;
    x: number;
    z: number;
}

export type AppScreen = 'auth' | 'hangar' | 'space';
export type SpaceZone = 'galaxy-map' | 'sector-alpha';
