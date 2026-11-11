// Подсказки при наведении: текст и строки собираются чистыми функциями.
import type {HangarCargoLine, HangarEquipmentInstance, HangarHold, HangarSlot} from '../types';
import {capacityOf, categoryOf, findEquipment, massOf, type CatalogItem} from './catalog';
import {formatNumber} from './format';

export type TipRow = {icon?: string; name: string; lines: string[]};
export type TipContent = {title: string; rows: TipRow[]; note?: string};

function equipmentMeta(model: CatalogItem | null | undefined) {
    const category = categoryOf(model, 'equipment');
    const mass = massOf(model);
    return [category?.name, mass > 0 ? `${formatNumber(mass)} кг` : ''].filter(Boolean).join(' · ');
}

function cargoSummary(cargo: HangarCargoLine[]) {
    return cargo.map((line) => `${line.name} ${formatNumber(line.amount_kg)} кг`).join(', ');
}

// Подсказка над креплением: что установлено, масса и груз контейнера.
export function slotTipContent(slot: HangarSlot, hasCompatible: boolean): TipContent {
    const title = slot.slot_type_name || 'Слот';
    if (!slot.instance_id) {
        return {
            title,
            rows: [],
            note: hasCompatible ? 'Слот пуст · нажмите — откроются совместимые товары' : 'Слот пуст',
        };
    }
    const model = findEquipment(slot.model_id);
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
export function holdTipContent(hold: HangarHold, instance: HangarEquipmentInstance): TipContent {
    const model = findEquipment(instance.model_id);
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
export function cargoTipContent(container: HangarEquipmentInstance, line: HangarCargoLine): TipContent {
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
