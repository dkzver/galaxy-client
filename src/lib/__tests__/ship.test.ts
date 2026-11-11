// Правила корабля: экземпляры, размещение покупки, контейнер и ShipView.
import {describe, expect, it} from 'vitest';
import {catalog} from '../catalog';
import {
    catalogShipView,
    dockShips,
    findInstance,
    instanceSalePrice,
    resolveContainer,
    resolvePlacement,
    saleBreakdown,
    shipInstances,
    shipView,
} from '../ship';
import {cargoLine, container, hold, item, ship, slot, withMass} from './fixtures';

describe('экземпляры корабля', () => {
    it('собирает оборудование из трюмов и креплений без дублей', () => {
        const loaded = container();
        const view = ship({
            containers: [loaded],
            holds: [hold({equipment: [loaded]})],
            slots: [slot({id: 5, instance_id: 77, model_id: 13, name: 'Лазер M-1', mass: 25})],
        });
        const instances = shipInstances(view);
        expect(instances.map((entry) => entry.id).sort((a, b) => a - b)).toEqual([77, 100]);
        expect(findInstance(view, 77)?.name).toBe('Лазер M-1');
        expect(findInstance(view, null)).toBeNull();
    });
});

describe('куда встанет оборудование', () => {
    const target = item({id: 13, name: 'Лазер M-1', slotId: 2});

    it('занимает свободное крепление нужного типа', () => {
        const view = ship({slots: [slot({id: 5, slot_type_id: 2})]});
        expect(resolvePlacement(view, withMass(25, {slotId: 2}), null)).toEqual({kind: 'slot', id: 5, index: 0});
    });

    it('уважает явно выбранное крепление, если оно подходит', () => {
        const view = ship({
            slots: [slot({id: 5, slot_type_id: 2}), slot({id: 6, slot_index: 1, slot_type_id: 2})],
        });
        expect(resolvePlacement(view, target, 6)).toEqual({kind: 'slot', id: 6, index: 1});
    });

    it('пропускает занятое крепление и ищет следующее свободное', () => {
        const view = ship({
            slots: [slot({id: 5, slot_type_id: 2, instance_id: 77, model_id: 13}), slot({id: 6, slot_index: 1, slot_type_id: 2})],
        });
        expect(resolvePlacement(view, target, 5)).toEqual({kind: 'slot', id: 6, index: 1});
    });

    it('без подходящего крепления кладёт предмет в трюм', () => {
        const view = ship({holds: [hold({id: 10, hold_index: 2, free_mass: 500})]});
        expect(resolvePlacement(view, withMass(25), null)).toEqual({kind: 'hold', id: 10, index: 2});
    });

    it('без места возвращает null', () => {
        const view = ship({holds: [hold({free_mass: 10})]});
        expect(resolvePlacement(view, withMass(600), null)).toBeNull();
        expect(resolvePlacement(null, withMass(1), null)).toBeNull();
    });
});

describe('контейнер под ресурс', () => {
    const stone = item({id: 173, name: 'Камень'});

    it('выбирает первый принимающий контейнер со свободным местом', () => {
        const view = ship({containers: [
            container({id: 1, allowed: ['Камень'], free_kg: 0}),
            container({id: 2, allowed: ['Камень'], free_kg: 10}),
        ]});
        const choice = resolveContainer(view, stone, null);
        expect(choice.reason).toBe('ok');
        expect(choice.target?.id).toBe(2);
    });

    it('явно выбранный полный контейнер даёт отказ «full»', () => {
        const view = ship({containers: [container({id: 1, allowed: ['Камень'], free_kg: 0})]});
        expect(resolveContainer(view, stone, 1)).toEqual({target: null, reason: 'full'});
    });

    it('ни один контейнер не принимает ресурс — «none»', () => {
        const view = ship({containers: [container({allowed: ['Железо']})]});
        expect(resolveContainer(view, stone, null)).toEqual({target: null, reason: 'none'});
    });

    it('без корабля или ресурса размещать некуда', () => {
        expect(resolveContainer(null, stone, null)).toEqual({target: null, reason: 'none'});
        expect(resolveContainer(ship(), null, null)).toEqual({target: null, reason: 'none'});
    });
});

describe('ShipView', () => {
    it('свой корабль: подпись, строки масс и содержимое', () => {
        const view = shipView(ship({
            name: 'Гром',
            mass: {hull: 1000, equipment: 100, cargo: 25, total: 1125},
            containers: [container()],
        }));
        expect(view.title).toBe('Гром');
        expect(view.subtitle).toContain('в строю');
        expect(view.rows.find((row) => row.id === 'mass-cargo')?.value).toBe(25);
        expect(view.rows.find((row) => row.id === 'mass-equipment')?.value).toBe(100);
        expect(view.containers).toHaveLength(1);
    });

    it('разрушенный корабль отмечен в подписи', () => {
        expect(shipView(ship({status: 1})).subtitle).toContain('разрушен');
    });

    it('модель каталога собирается в ту же форму', () => {
        const view = catalogShipView({
            id: 900,
            name: 'Тестовый корпус',
            slots: [{slotId: 1}],
            holds: [{capacity: '500'}],
            price_buy: '1000',
            price_sale: '500',
        });
        expect(view.title).toBe('Тестовый корпус');
        expect(view.subtitle).toContain('доступен для покупки');
        expect(view.slots).toHaveLength(1);
        expect(view.holds).toHaveLength(1);
        expect(view.rows.map((row) => row.label)).toContain('Оборудование');
        expect(view.mass.total).toBe(view.mass.hull + view.mass.equipment);
    });
});

describe('продажа и док', () => {
    it('груз учитывается в разбивке продажи', () => {
        const loaded = container({cargo: [cargoLine({amount_kg: 100, price_sale: 2})]});
        const totals = saleBreakdown(ship({containers: [loaded]}));
        expect(totals.cargoKg).toBe(100);
        expect(totals.cargoPrice).toBe(200);
        expect(totals.equipmentPrice).toBeGreaterThanOrEqual(0);
    });

    it('цена экземпляра включает груз', () => {
        const loaded = container({cargo: [cargoLine({amount_kg: 10, price_sale: 3})]});
        const model = catalog.equipments.find((entry) => entry.id === loaded.model_id);
        const base = model ? Number(model.price_sale) : 0;
        expect(instanceSalePrice(loaded)).toBe(base + 30);
    });

    it('док показывает свои корабли или модели каталога', () => {
        const own = dockShips(false, [ship({id: 1, name: 'Гром'}), ship({id: 2, name: 'Вихрь'})]);
        expect(own.map((row) => row.name)).toEqual(['Гром', 'Вихрь']);
        expect(own.every((row) => !row.isForSale)).toBe(true);

        const sale = dockShips(true, []);
        expect(sale).toHaveLength(catalog.ships.length);
        expect(sale.every((row) => row.isForSale)).toBe(true);
    });
});
