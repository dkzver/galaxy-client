// Каталог: типы, категории двух уровней, цены и масса. Только чистые функции, без React.
import type {HangarEquipmentInstance, HangarSlot} from '../types';
import rawCatalog from '../data/catalog.json';

export type CatalogItem = {
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

export type CatalogCategory = {id: number; name: string; icon?: string; parentId?: number | null};

export type CatalogTab = 'all' | 'equipment' | 'resources';

export type CatalogProperty = {id: number; name: string; unit?: string};

export type CatalogSlotType = {id: number; name: string};

export type CatalogShipModel = {
    id: number;
    name: string;
    description?: string;
    values?: Record<string, string>;
    slots: Array<{slotId: number; itemId?: number}>;
    holds: Array<{capacity: string; itemId?: number}>;
    price_buy: string;
    price_sale: string;
    icon?: string;
};

export type Catalog = {
    settings: {initialShipId: number; startingCredits: string; id_category_hold: number; id_propert_mass_value: number};
    properties: CatalogProperty[];
    slots: CatalogSlotType[];
    ships: CatalogShipModel[];
    equipments: CatalogItem[];
    resources: CatalogItem[];
    categoriesEquipment: CatalogCategory[];
    categoriesResource: CatalogCategory[];
};

export const catalog = rawCatalog as unknown as Catalog;

export const ALL_CATEGORIES: CatalogCategory[] = [...catalog.categoriesEquipment, ...catalog.categoriesResource];

const categoryById = new Map<number, CatalogCategory>(
    ALL_CATEGORIES.map((category) => [Number(category.id), category]),
);

export function findCategory(id?: number | null) {
    return id == null ? null : categoryById.get(Number(id)) ?? null;
}

// Верхний уровень: для дочерней категории — её группа, для верхней — она сама.
export function categoryGroup(category?: CatalogCategory | null) {
    if (!category) return null;
    return category.parentId == null ? category : findCategory(category.parentId);
}

export function categoryIdsInGroup(groupId: number | null): number[] | null {
    if (groupId == null) return null;
    const group = findCategory(groupId);
    if (!group) return [Number(groupId)];
    return [Number(group.id), ...ALL_CATEGORIES
        .filter((category) => Number(category.parentId) === Number(group.id))
        .map((category) => Number(category.id))];
}

export function inCategoryGroup(item: CatalogItem, groupId: number | null) {
    const ids = categoryIdsInGroup(groupId);
    return ids === null || ids.includes(Number(item.categoryId ?? 0));
}

export function itemsInGroup(items: CatalogItem[], groupId: number | null) {
    return groupId === null ? items : items.filter((item) => inCategoryGroup(item, groupId));
}

export function topCategories(kind: 'equipment' | 'resources') {
    const list = kind === 'equipment' ? catalog.categoriesEquipment : catalog.categoriesResource;
    return list.filter((category) => category.parentId == null);
}

export type CategoryGroupView<T> = {
    id: number;
    name: string;
    icon: string;
    items: T[];
};

// Заголовки в списках — подкатегории: группы остаются только в фильтре.
export function groupByCategories<T>(items: T[], categoryIdOf: (item: T) => number | null | undefined): CategoryGroupView<T>[] {
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

export const MASS_PROPERTY_ID = String(catalog.settings.id_propert_mass_value);
export const CAPACITY_PROPERTY_ID = String(catalog.properties.find((property) => property.name === 'Вместимость')?.id ?? 12);

export function massOf(item?: CatalogItem | null) {
    const value = Number(item?.values?.[MASS_PROPERTY_ID]);
    return Number.isFinite(value) ? value : 0;
}

export function capacityOf(item?: CatalogItem | null) {
    const value = Number(item?.values?.[CAPACITY_PROPERTY_ID]);
    return Number.isFinite(value) ? value : 0;
}

// Контейнер из каталога: есть вместимость и заполнен prop2 — то же правило, что на сервере.
export function isCatalogContainer(item?: CatalogItem | null) {
    return capacityOf(item) > 0 && (item?.prop2?.length ?? 0) > 0;
}

export function priceOf(item: CatalogItem | null | undefined, field: 'price_buy' | 'price_sale') {
    const value = Number(item?.[field]);
    return Number.isFinite(value) ? value : 0;
}

export function categoryOf(item: CatalogItem | null | undefined, tab: CatalogTab) {
    const list = tab === 'resources' ? catalog.categoriesResource : catalog.categoriesEquipment;
    return list.find((category) => category.id === item?.categoryId);
}

export function slotTypeName(slotTypeId: number) {
    return catalog.slots.find((slot) => slot.id === Number(slotTypeId))?.name || 'Крепление';
}

export function findShipModel(id?: number | null) {
    return catalog.ships.find((model) => Number(model.id) === Number(id)) ?? null;
}

export function findEquipment(id?: number | null) {
    return catalog.equipments.find((entry) => Number(entry.id) === Number(id)) ?? null;
}

export function findResource(id?: number | null) {
    return catalog.resources.find((entry) => Number(entry.id) === Number(id)) ?? null;
}

// Все товары выбранной вкладки: «всё» склеивает оборудование и ресурсы.
export function itemsForTab(tab: CatalogTab): CatalogItem[] {
    if (tab === 'resources') return catalog.resources;
    if (tab === 'equipment') return catalog.equipments;
    return [...catalog.equipments, ...catalog.resources];
}

// Клик по креплению оставляет в списке только совместимое оборудование,
// клик по контейнеру — только ресурсы, которые он принимает.
export function visibleCatalogItems(
    tab: CatalogTab,
    categoryId: number | null,
    slot: HangarSlot | null,
    container: HangarEquipmentInstance | null,
): CatalogItem[] {
    let visible = itemsForTab(tab);
    if (slot) {
        visible = catalog.equipments.filter((item) => Number(item.slotId ?? 0) === Number(slot.slot_type_id));
    } else if (container) {
        const allowed = container.allowed.map((name) => name.trim().toLowerCase());
        visible = catalog.resources.filter((item) => allowed.includes(item.name.trim().toLowerCase()));
    }
    return itemsInGroup(visible, categoryId);
}

// Ресурс по имени: в prop2 контейнера хранятся названия материалов, а не ID.
export function resourceByName(name: string) {
    const key = name.trim().toLowerCase();
    return catalog.resources.find((resource) => resource.name.trim().toLowerCase() === key) ?? null;
}

export type PropertyRow = {id: string; name: string; value: string; unit?: string};

// Свойства товара для карточки: только те, что есть в справочнике свойств.
export function propertyRows(values?: Record<string, string>): PropertyRow[] {
    if (!values) return [];
    const rows: PropertyRow[] = [];
    for (const [id, value] of Object.entries(values)) {
        const property = catalog.properties.find((entry) => entry.id === Number(id));
        if (!property) continue;
        rows.push({id, name: property.name, value, unit: property.unit});
    }
    return rows;
}
