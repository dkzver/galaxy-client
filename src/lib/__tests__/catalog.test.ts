// Правила категорий и фильтров каталога: группы двух уровней, заголовки списков, витрина.
import {describe, expect, it} from 'vitest';
import {
    ALL_CATEGORIES,
    categoryGroup,
    categoryIdsInGroup,
    catalog,
    findCategory,
    groupByCategories,
    inCategoryGroup,
    itemsInGroup,
    topCategories,
    visibleCatalogItems,
} from '../catalog';
import {container, item, slot} from './fixtures';

describe('категории двух уровней', () => {
    it('пустой фильтр означает «все товары»', () => {
        expect(categoryIdsInGroup(null)).toBeNull();
    });

    it('группа верхнего уровня и её подкатегории попадают в один фильтр', () => {
        const group = topCategories('equipment')[0];
        const ids = categoryIdsInGroup(group.id)!;
        expect(ids[0]).toBe(Number(group.id));

        const child = ALL_CATEGORIES.find((category) => Number(category.parentId) === Number(group.id));
        if (child) {
            expect(ids).toContain(Number(child.id));
            expect(inCategoryGroup(item({categoryId: Number(child.id)}), Number(group.id))).toBe(true);
        }
        expect(categoryGroup(findCategory(child?.id ?? group.id))?.id).toBe(group.id);
    });

    it('товар другой группы не проходит фильтр', () => {
        const groups = topCategories('equipment');
        if (groups.length < 2) return;
        const foreign = ALL_CATEGORIES.find((category) => Number(category.parentId) === Number(groups[1].id));
        if (!foreign) return;
        expect(inCategoryGroup(item({categoryId: Number(foreign.id)}), Number(groups[0].id))).toBe(false);
    });

    it('верхний уровень содержит только группы', () => {
        for (const category of topCategories('equipment')) expect(category.parentId).toBeNull();
    });

    it('фильтр по группе не теряет товары своей группы', () => {
        const group = topCategories('equipment')[0];
        const all = itemsInGroup(catalog.equipments, Number(group.id));
        const expected = catalog.equipments.filter((entry) => inCategoryGroup(entry, Number(group.id)));
        expect(all.length).toBe(expected.length);
    });
});

describe('заголовки списков', () => {
    it('группирует по подкатегориям в порядке каталога', () => {
        const first = topCategories('equipment')[0];
        const child = ALL_CATEGORIES.find((category) => Number(category.parentId) === Number(first.id));
        if (!child) return;
        const other = ALL_CATEGORIES.find((category) =>
            Number(category.parentId) === Number(first.id) && Number(category.id) !== Number(child.id));

        const groups = groupByCategories([
            item({id: 1, categoryId: Number((other ?? child).id)}),
            item({id: 2, categoryId: Number(child.id)}),
        ], (entry) => entry.categoryId);

        expect(groups).toHaveLength(other ? 2 : 1);
        expect(groups[0].name).toBe(child.name);
        expect(groups[0].items[0].id).toBe(2);
    });

    it('неизвестная категория уходит в «Прочее»', () => {
        const groups = groupByCategories([item({id: 7})], (entry) => entry.categoryId);
        expect(groups).toHaveLength(1);
        expect(groups[0].name).toBe('Прочее');
        expect(groups[0].icon).toBe('grid');
    });
});

describe('витрина каталога', () => {
    it('выбранное крепление оставляет только совместимое оборудование', () => {
        const model = catalog.equipments.find((entry) => Number(entry.slotId ?? 0) > 0);
        if (!model) return;
        const rows = visibleCatalogItems('equipment', null, slot({slot_type_id: Number(model.slotId)}), null);
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) expect(Number(row.slotId ?? 0)).toBe(Number(model.slotId));
    });

    it('выбранный контейнер оставляет только принимаемые ресурсы', () => {
        const resource = catalog.resources[0];
        const rows = visibleCatalogItems('resources', null, null, container({allowed: [resource.name]}));
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) expect(row.name.trim().toLowerCase()).toBe(resource.name.trim().toLowerCase());
    });

    it('фильтр группы применяется и к витрине', () => {
        const group = topCategories('resources')[0];
        const rows = visibleCatalogItems('resources', Number(group.id), null, null);
        for (const row of rows) expect(inCategoryGroup(row, Number(group.id))).toBe(true);
    });
});
