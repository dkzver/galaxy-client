// Правила правой колонки: что показать, чем заблокировать покупку и что отправить на сервер.
import {describe, expect, it} from 'vitest';
import {catalog} from '../catalog';
import {buyIntent, selectionView, type Selection} from '../selection';
import {container, hold, ship, slot} from './fixtures';
import type {HangarStatus} from '../../types';

const emptySelection: Selection = {
    tab: 'all',
    categoryId: null,
    shipId: 1,
    forSale: false,
    forSaleShipId: null,
    slotRowId: null,
    holdId: null,
    containerId: null,
    itemId: null,
    instanceId: null,
    cargo: null,
};

const hangar = (credits: string | number): HangarStatus => ({
    user_id: 1,
    email: 'pilot@galaxy.space',
    credits,
    ships: [],
});

const equipment = catalog.equipments[0];
const equipmentWithSlot = catalog.equipments.find((entry) => Number(entry.slotId ?? 0) > 0)!;
const resource = catalog.resources[0];

describe('вид правой колонки', () => {
    it('товар без места в трюме блокирует покупку', () => {
        const view = selectionView({...emptySelection, itemId: equipment.id},
            ship({holds: [], slots: []}), hangar(10000000), false);
        expect(view.item?.id).toBe(equipment.id);
        expect(view.blocker).toBe('Нет свободного крепления и места в трюме.');
        expect(view.canBuy).toBe(false);
    });

    it('нехватка кредитов названа в причине', () => {
        const view = selectionView({...emptySelection, itemId: equipment.id},
            ship({holds: [hold({free_mass: 100000})], slots: []}), hangar(0), false);
        expect(view.blocker).toContain('Недостаточно кредитов');
        expect(view.canBuy).toBe(false);
    });

    it('ресурс без принимающего контейнера блокируется отдельной причиной', () => {
        const view = selectionView({...emptySelection, itemId: resource.id},
            ship({containers: []}), hangar(10000000), false);
        expect(view.itemIsEquipment).toBe(false);
        expect(view.blocker).toBe('Нет контейнера для этого ресурса.');
    });

    it('покупка доступна при месте и балансе', () => {
        const view = selectionView({...emptySelection, itemId: equipment.id},
            ship({holds: [hold({free_mass: 100000})], slots: []}), hangar(10000000), false);
        expect(view.canBuy).toBe(true);
        expect(view.blocker).toBe('');
    });

    it('занятость блокирует кнопку, пока идёт запрос', () => {
        const view = selectionView({...emptySelection, itemId: equipment.id},
            ship({holds: [hold({free_mass: 100000})], slots: []}), hangar(10000000), true);
        expect(view.canBuy).toBe(false);
    });
});

describe('запрос на покупку', () => {
    it('оборудование несёт крепление, в которое встанет', () => {
        const slotRow = slot({id: 5, slot_type_id: Number(equipmentWithSlot.slotId)});
        const view = selectionView({...emptySelection, itemId: equipmentWithSlot.id},
            ship({slots: [slotRow]}), hangar(10000000), false);
        const intent = buyIntent(view, ship({slots: [slotRow]}));
        expect(intent?.action).toBe('buy_equipment');
        expect(intent?.payload).toMatchObject({equipmentModelId: equipmentWithSlot.id, slotId: 5});
    });

    it('ресурс несёт контейнер', () => {
        const target = container({allowed: [resource.name]});
        const view = selectionView({...emptySelection, itemId: resource.id},
            ship({containers: [target]}), hangar(10000000), false);
        const intent = buyIntent(view, ship({containers: [target]}));
        expect(intent?.action).toBe('buy_resource');
        expect(intent?.payload).toMatchObject({resourceId: resource.id, containerInstanceId: target.id});
    });

    it('заблокированная покупка не порождает запрос', () => {
        const view = selectionView({...emptySelection, itemId: equipment.id}, null, null, false);
        expect(buyIntent(view, null)).toBeNull();
    });
});
