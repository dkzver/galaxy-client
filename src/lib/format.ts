// Форматирование чисел и подписи действий: одна точка правды для интерфейса.
import type {TradeActionType} from '../types';
import type {CatalogTab} from './catalog';

export function formatNumber(value: string | number | undefined | null) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString('ru-RU') : '—';
}

export const tabLabels: Record<CatalogTab, string> = {
    all: 'ВСЁ',
    equipment: 'ОБОРУДОВАНИЕ',
    resources: 'РЕСУРСЫ',
};

export const actionLabels: Record<TradeActionType, string> = {
    buy_ship: 'Купить корабль',
    sell_ship: 'Продать корабль',
    buy_equipment: 'Купить оборудование',
    sell_equipment: 'Продать оборудование',
    buy_resource: 'Купить ресурс',
    sell_resource: 'Продать ресурс',
};
