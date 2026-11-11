// Карточка товара из каталога: свойства, место установки, цены и кнопка покупки.
import {catalog, categoryOf, isCatalogContainer, priceOf, propertyRows, type CatalogItem} from '../../../lib/catalog';
import {actionLabels, formatNumber, tabLabels} from '../../../lib/format';
import type {ContainerChoice, Placement} from '../../../lib/ship';
import type {HangarEquipmentInstance, HangarSlot} from '../../../types';
import {BuyButton} from '../../TradeButtons';
import AllowedList from '../../ui/AllowedList';
import CardShell, {type CardRow} from './CardShell';

type Props = {
    item: CatalogItem;
    isEquipment: boolean;
    placement: Placement | null;
    containerChoice: ContainerChoice;
    slot: HangarSlot | null;
    container: HangarEquipmentInstance | null;
    buyPrice: number;
    blocker: string;
    message: string;
    canBuy: boolean;
    onBuy: () => void;
};

export default function ItemCard({
    item,
    isEquipment,
    placement,
    containerChoice,
    slot,
    container,
    buyPrice,
    blocker,
    message,
    canBuy,
    onBuy,
}: Props) {
    const rows: CardRow[] = propertyRows(item.values).map((row) => ({
        label: row.name,
        value: <>{formatNumber(row.value)} {row.unit && <small>{row.unit}</small>}</>,
    }));

    if (isEquipment) {
        rows.push({
            label: 'Крепление',
            value: catalog.slots.find((entry) => entry.id === Number(item.slotId))?.name || 'в трюм',
        });
    }
    rows.push({
        label: isEquipment ? 'Встанет в' : 'Контейнер',
        value: isEquipment
            ? placement
                ? placement.kind === 'slot' ? `Крепление ${placement.index + 1}` : `Трюм ${placement.index + 1}`
                : 'нет места'
            : containerChoice.target
                ? `${containerChoice.target.name} · свободно ${formatNumber(containerChoice.target.free_kg)} кг`
                : containerChoice.reason === 'full' ? 'нет места' : 'нет контейнера',
    });

    const note = slot
        ? `Крепление ${slot.slot_index + 1}: показано только совместимое оборудование.`
        : container
            ? `Контейнер «${container.name}»: показаны только принимаемые ресурсы.`
            : 'Покупка идёт на выбранный корабль.';

    return (
        <CardShell
            eyebrow={categoryOf(item, isEquipment ? 'equipment' : 'resources')?.name
                || tabLabels[isEquipment ? 'equipment' : 'resources']}
            title={item.name}
            rows={rows}
            priceRows={[
                {label: 'Цена покупки', value: <>{formatNumber(buyPrice)} ¤{!isEquipment && <small> / кг</small>}</>},
                {label: 'Цена продажи', value: <>{formatNumber(priceOf(item, 'price_sale'))} ¤{!isEquipment && <small> / кг</small>}</>},
            ]}
            note={note}
            error={message || blocker}
            action={
                <BuyButton type="button"
                           label={isEquipment ? actionLabels.buy_equipment : actionLabels.buy_resource}
                           disabled={!canBuy} onClick={onBuy}
                           title={blocker || `Купить ${item.name}`}/>
            }>
            {isEquipment && isCatalogContainer(item) && (
                <>
                    <span className="ship-sub">Можно положить</span>
                    <AllowedList names={item.prop2 ?? []}/>
                </>
            )}
        </CardShell>
    );
}
