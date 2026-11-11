// Выделение в ангаре: вкладка, группа, корабль, крепление, трюм, контейнер, предмет и груз.
import {useEffect, useRef, useState} from 'react';
import type {
    HangarCargoLine,
    HangarEquipmentInstance,
    HangarHold,
    HangarSlot,
    HangarStatus,
    TradeActionType,
} from '../types';
import {
    catalog,
    categoryGroup,
    findCategory,
    inCategoryGroup,
    itemsForTab,
    type CatalogItem,
    type CatalogTab,
} from '../lib/catalog';
import {findInstance, type OwnedCargoSelection} from '../lib/ship';
import type {Selection} from '../lib/selection';

export type SelectionActions = {
    selectTab: (tab: CatalogTab) => void;
    selectCategory: (categoryId: number) => void;
    selectAllCategories: () => void;
    selectShip: (shipId: string | number) => void;
    selectForSaleShip: (shipId: number) => void;
    toggleFleet: () => void;
    selectSlot: (slot: HangarSlot) => void;
    selectHold: (hold: HangarHold) => void;
    selectContainer: (instance: HangarEquipmentInstance) => void;
    selectInstance: (instance: HangarEquipmentInstance) => void;
    selectItem: (item: CatalogItem) => void;
    selectCargo: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
    selectFirstItem: () => void;
    applyTradeResult: (action: TradeActionType, receipt?: Record<string, unknown>) => void;
    clear: () => void;
};

export function useHangarSelection(hangar: HangarStatus | null, clearMessage: () => void) {
    const [tab, setTab] = useState<CatalogTab>('all');
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [shipId, setShipId] = useState<string | number | null>(null);
    const [forSale, setForSale] = useState(false);
    const [forSaleShipId, setForSaleShipId] = useState<number | null>(catalog.ships[0]?.id ?? null);
    // Корабль, выбранный до входа в режим покупки: к нему возвращаемся при выходе.
    const [saleReturnShipId, setSaleReturnShipId] = useState<string | number | null>(null);
    const [slotRowId, setSlotRowId] = useState<number | null>(null);
    const [holdId, setHoldId] = useState<number | null>(null);
    const [containerId, setContainerId] = useState<number | null>(null);
    const [itemId, setItemId] = useState<number | null>(null);
    const [instanceId, setInstanceId] = useState<number | null>(null);
    const [cargo, setCargo] = useState<OwnedCargoSelection | null>(null);

    const ships = hangar?.ships ?? [];
    const ship = ships.find((row) => String(row.id) === String(shipId)) || ships[0] || null;

    function clear() {
        setHoldId(null);
        setSlotRowId(null);
        setContainerId(null);
        setItemId(null);
        setInstanceId(null);
        setCargo(null);
        clearMessage();
    }

    function selectTab(nextTab: CatalogTab) {
        setForSale(false);
        setTab(nextTab);
        setCategoryId(null);
        // Выбранный трюм сохраняется: третья колонка продолжает показывать его состав.
        setSlotRowId(null);
        setContainerId(null);
        setItemId(null);
        setInstanceId(null);
        setCargo(null);
        clearMessage();
    }

    function selectCategory(nextCategoryId: number) {
        setItemId(null);
        setCategoryId(nextCategoryId);
    }

    function selectAllCategories() {
        setCategoryId(null);
    }

    // Первый товар второй колонки: используется при входе и при выборе своего корабля.
    function selectFirstItem() {
        const tabItems = itemsForTab(tab);
        const byCategory = categoryId === null
            ? tabItems
            : tabItems.filter((item) => inCategoryGroup(item, categoryId));
        const first = byCategory[0] ?? tabItems[0];
        if (!first) return;

        setItemId(first.id);
        if (categoryId === null) {
            const group = categoryGroup(findCategory(first.categoryId));
            setCategoryId(group ? Number(group.id) : null);
        }
    }

    function selectShip(nextShipId: string | number) {
        setForSale(false);
        setShipId(nextShipId);
        clear();
        selectFirstItem();
    }

    function selectForSaleShip(nextShipId: number) {
        setForSaleShipId(nextShipId);
        setForSale(true);
    }

    // Кнопка дока: вход в режим покупки и возврат к своему кораблю.
    function toggleFleet() {
        if (forSale) {
            const restore = ships.find((row) => String(row.id) === String(saleReturnShipId))
                || ships.find((row) => String(row.id) === String(shipId))
                || ships[0]
                || null;
            setShipId(restore ? restore.id : null);
            setSaleReturnShipId(null);
            setForSale(false);
        } else {
            setSaleReturnShipId(ship ? ship.id : shipId);
            setForSale(true);
        }
        clear();
    }

    // Клик по креплению: пустое — показываем совместимое оборудование, занятое — сам предмет.
    function selectSlot(slot: HangarSlot) {
        setForSale(false);
        clearMessage();
        setHoldId(null);
        setCargo(null);
        setContainerId(null);
        if (slot.instance_id) {
            const instance = findInstance(ship, slot.instance_id);
            // Контейнер открывает свои ресурсы, обычный предмет — карточку продажи.
            if (instance?.is_container) {
                selectContainer(instance);
                return;
            }
            setSlotRowId(null);
            setItemId(null);
            setInstanceId(slot.instance_id);
            return;
        }
        const slotTypeId = Number(slot.slot_type_id);
        const compatible = catalog.equipments.filter((item) => Number(item.slotId ?? 0) === slotTypeId);
        setInstanceId(null);
        setSlotRowId(Number(slot.id));
        setTab('equipment');
        setCategoryId(null);
        setItemId(compatible[0]?.id ?? null);
    }

    // Клик по контейнеру: в списке остаются ресурсы, которые он принимает, справа — его карточка.
    function selectContainer(instance: HangarEquipmentInstance) {
        setForSale(false);
        clearMessage();
        setSlotRowId(null);
        setItemId(null);
        setInstanceId(null);
        setCargo(null);
        setHoldId(null);
        setContainerId(instance.id);
        setTab('resources');
        setCategoryId(null);
    }

    function selectInstance(instance: HangarEquipmentInstance) {
        setForSale(false);
        clearMessage();
        setSlotRowId(null);
        setContainerId(null);
        setItemId(null);
        setCargo(null);
        setInstanceId(instance.id);
    }

    function selectCargo(instance: HangarEquipmentInstance, line: HangarCargoLine) {
        setForSale(false);
        clearMessage();
        setSlotRowId(null);
        setContainerId(null);
        setItemId(null);
        setInstanceId(null);
        setTab('resources');
        setCargo({containerId: instance.id, resourceId: line.resource_id});
    }

    function selectItem(item: CatalogItem) {
        setForSale(false);
        clearMessage();
        setInstanceId(null);
        setCargo(null);
        setItemId(item.id);
    }

    // Клик по трюму выбирает его целиком; повторный клик снимает выбор.
    function selectHold(hold: HangarHold) {
        clearMessage();
        setSlotRowId(null);
        setContainerId(null);
        setItemId(null);
        setInstanceId(null);
        setCargo(null);
        setHoldId((current) => (current === Number(hold.id) ? null : Number(hold.id)));
    }

    // После ответа сервера выбранным становится то, что появилось или осталось.
    function applyTradeResult(action: TradeActionType, receipt?: Record<string, unknown>) {
        if (action === 'buy_ship') {
            // Купленный корабль появляется в доке, но выбранным остаётся прежний:
            // режим покупки закрывается, игрок возвращается к своему кораблю.
            setForSale(false);
            setSaleReturnShipId(null);
            clear();
        } else if (action === 'sell_ship') {
            setShipId(null);
            clear();
        } else if (action === 'buy_equipment') {
            const nextInstanceId = Number(receipt?.instanceId ?? 0);
            clear();
            if (nextInstanceId) setInstanceId(nextInstanceId);
        } else if (action === 'sell_equipment') {
            clear();
        } else if (action === 'buy_resource') {
            const nextContainerId = Number(receipt?.containerInstanceId ?? 0);
            if (nextContainerId) setContainerId(nextContainerId);
            setItemId(null);
        } else if (action === 'sell_resource') {
            const nextContainerId = Number(receipt?.containerInstanceId ?? 0);
            const left = Number(receipt?.leftKg ?? 0);
            if (left <= 0) {
                setCargo(null);
            } else {
                setCargo({containerId: nextContainerId, resourceId: Number(receipt?.resourceId ?? 0)});
            }
        }
    }

    // При первом входе в ангар выбираем корабль, первый товар второй колонки и его категорию.
    const initialSelectionDone = useRef(false);
    useEffect(() => {
        if (initialSelectionDone.current) return;
        const firstShip = hangar?.ships?.[0];
        if (!firstShip) return;

        initialSelectionDone.current = true;
        setShipId(firstShip.id);
        selectFirstItem();
        // Первый запуск после загрузки ангара: дальше выбор делает игрок.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hangar]);

    const selection: Selection = {
        tab,
        categoryId,
        shipId,
        forSale,
        forSaleShipId,
        slotRowId,
        holdId,
        containerId,
        itemId,
        instanceId,
        cargo,
    };

    const actions: SelectionActions = {
        selectTab,
        selectCategory,
        selectAllCategories,
        selectShip,
        selectForSaleShip,
        toggleFleet,
        selectSlot,
        selectHold,
        selectContainer,
        selectInstance,
        selectItem,
        selectCargo,
        selectFirstItem,
        applyTradeResult,
        clear,
    };

    return {selection, actions, ship, ships};
}
