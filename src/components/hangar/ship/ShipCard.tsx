// Карточка корабля: свойства, трюмы и крепления — отдельными вкладками.
// Одна и та же разметка рисует и свой корабль, и модель в продаже.
import {useState} from 'react';
import type {HangarCargoLine, HangarEquipmentInstance, HangarHold, HangarSlot} from '../../../types';
import {formatNumber} from '../../../lib/format';
import type {OwnedCargoSelection, ShipView} from '../../../lib/ship';
import type {TipContent} from '../../../lib/tips';
import HoldBlock from './HoldBlock';
import ShipTabs, {type ShipTab} from './ShipTabs';
import SlotGrid from './SlotGrid';

type Props = {
    view: ShipView;
    selectedSlotId: number | null;
    selectedInstanceId: number | null;
    selectedCargo: OwnedCargoSelection | null;
    selectedHoldId: number | null;
    onSlotClick?: (slot: HangarSlot) => void;
    onInstanceClick?: (instance: HangarEquipmentInstance) => void;
    onContainerClick?: (instance: HangarEquipmentInstance) => void;
    onCargoClick?: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
    onHoldClick?: (hold: HangarHold) => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
};

const noop = () => {};

export default function ShipCard({
    view,
    selectedSlotId,
    selectedInstanceId,
    selectedCargo,
    selectedHoldId,
    onSlotClick,
    onInstanceClick,
    onContainerClick,
    onCargoClick,
    onHoldClick,
    onShowTip,
    onHideTip,
}: Props) {
    const [tab, setTab] = useState<ShipTab>('props');
    const holds = view.holds;
    const slots = view.slots;
    // Если у корабля нет трюмов или креплений, соответствующая вкладка не показывается.
    const active = (tab === 'holds' && holds.length === 0) || (tab === 'slots' && slots.length === 0)
        ? 'props'
        : tab;

    return (
        <>
            <ShipTabs title={view.title} holds={holds.length} slots={slots.length}
                      active={active} onChange={setTab}/>

            {active === 'props' && (
                <>
                    <span className="ship-sub ship-meta-line">{view.subtitle}</span>
                    <div className="ship-rows">
                        {view.rows.map((row) => (
                            <div className="ship-row" key={row.id}>
                                <span>{row.label}</span>
                                <b>{formatNumber(row.value)} {row.unit && <small>{row.unit}</small>}</b>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {active === 'holds' && (
                <div className="hold-list">
                    {holds.map((hold) => (
                        <HoldBlock key={hold.id} hold={hold}
                                   selected={selectedHoldId === Number(hold.id)}
                                   selectedInstanceId={selectedInstanceId}
                                   selectedCargo={selectedCargo}
                                   onInstanceClick={onInstanceClick ?? noop}
                                   onContainerClick={onContainerClick ?? noop}
                                   onCargoClick={onCargoClick ?? noop}
                                   onHoldClick={onHoldClick ?? noop}
                                   onShowTip={onShowTip}
                                   onHideTip={onHideTip}/>
                    ))}
                </div>
            )}

            {active === 'slots' && (
                <SlotGrid view={view}
                          selectedSlotId={selectedSlotId}
                          selectedInstanceId={selectedInstanceId}
                          selectedCargo={selectedCargo}
                          onSlotClick={onSlotClick}
                          onCargoClick={onCargoClick}
                          onShowTip={onShowTip}
                          onHideTip={onHideTip}/>
            )}
        </>
    );
}
