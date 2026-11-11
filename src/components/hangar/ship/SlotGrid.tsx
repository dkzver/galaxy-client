// Сетка креплений корабля.
import type {HangarCargoLine, HangarEquipmentInstance, HangarSlot} from '../../../types';
import type {OwnedCargoSelection, ShipLike} from '../../../lib/ship';
import type {TipContent} from '../../../lib/tips';
import SlotTile from './SlotTile';

type Props = {
    view: ShipLike;
    selectedSlotId: number | null;
    selectedInstanceId: number | null;
    selectedCargo: OwnedCargoSelection | null;
    onSlotClick?: (slot: HangarSlot) => void;
    onCargoClick?: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
};

export default function SlotGrid(props: Props) {
    return (
        <div className="slot-grid">
            {props.view.slots.map((slot) => (
                <SlotTile key={`slot-${slot.id}`}
                          slot={slot}
                          view={props.view}
                          selectedSlotId={props.selectedSlotId}
                          selectedInstanceId={props.selectedInstanceId}
                          selectedCargo={props.selectedCargo}
                          onSlotClick={props.onSlotClick}
                          onCargoClick={props.onCargoClick}
                          onShowTip={props.onShowTip}
                          onHideTip={props.onHideTip}/>
            ))}
        </div>
    );
}
