// Плитка крепления: пустое подсвечивается, если есть совместимое оборудование, занятое — предмет и груз.
import type {HangarCargoLine, HangarEquipmentInstance, HangarSlot} from '../../../types';
import {catalog, slotTypeName} from '../../../lib/catalog';
import {formatNumber} from '../../../lib/format';
import {findInstance, type OwnedCargoSelection, type ShipLike} from '../../../lib/ship';
import {cargoTipContent, slotTipContent, type TipContent} from '../../../lib/tips';
import {HangarIcon} from '../../ui/HangarIcon';
import CargoChips from './CargoChips';

type Props = {
    slot: HangarSlot;
    view: ShipLike;
    selectedSlotId: number | null;
    selectedInstanceId: number | null;
    selectedCargo: OwnedCargoSelection | null;
    onSlotClick?: (slot: HangarSlot) => void;
    onCargoClick?: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
};

export default function SlotTile({
    slot,
    view,
    selectedSlotId,
    selectedInstanceId,
    selectedCargo,
    onSlotClick,
    onCargoClick,
    onShowTip,
    onHideTip,
}: Props) {
    const compatible = catalog.equipments
        .some((item) => Number(item.slotId ?? 0) === Number(slot.slot_type_id));
    const isEmpty = !slot.instance_id;
    const slotInstance = slot.instance_id ? findInstance(view, slot.instance_id) : null;

    return (
        <button
            type="button"
            className={`slot-tile${isEmpty ? ' empty' : ''}${isEmpty && compatible ? ' has-goods' : ''}`
                + (selectedSlotId === Number(slot.id) ? ' selected' : '')
                + (slot.instance_id && selectedInstanceId === slot.instance_id ? ' selected' : '')}
            aria-label={`${slotTypeName(slot.slot_type_id)}: ${slot.name || 'пусто'}`}
            onMouseEnter={(event) => onShowTip(event.currentTarget, slotTipContent(slot, compatible))}
            onMouseLeave={onHideTip}
            onFocus={(event) => onShowTip(event.currentTarget, slotTipContent(slot, compatible))}
            onBlur={onHideTip}
            onClick={onSlotClick ? () => onSlotClick(slot) : undefined}>
            {slot.name ? <HangarIcon name={slot.icon || 'tool'} size={22}/> : null}
            {slot.instance_id && (slot.cargo?.length ?? 0) > 0 && (
                <CargoChips lines={slot.cargo ?? []}
                            selected={selectedCargo}
                            tipFor={(line) => slotInstance ? cargoTipContent(slotInstance, line) : null}
                            tileTip={(tile) => onShowTip(tile, slotTipContent(slot, compatible))}
                            onCargoClick={(line) => {
                                if (slotInstance && onCargoClick) onCargoClick(slotInstance, line);
                            }}
                            onShowTip={onShowTip}
                            onHideTip={onHideTip}/>
            )}
            {slot.mass > 0 && <span className="slot-qty">{formatNumber(slot.mass)} кг</span>}
        </button>
    );
}
