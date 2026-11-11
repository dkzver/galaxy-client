// Трюм: занятость по массе, плитки оборудования и груз контейнеров.
import type {HangarCargoLine, HangarEquipmentInstance, HangarHold} from '../../../types';
import {formatNumber} from '../../../lib/format';
import type {OwnedCargoSelection} from '../../../lib/ship';
import {cargoTipContent, holdTipContent, type TipContent} from '../../../lib/tips';
import {HangarIcon} from '../../ui/HangarIcon';
import CargoChips from './CargoChips';

type Props = {
    hold: HangarHold;
    selected: boolean;
    selectedInstanceId: number | null;
    selectedCargo: OwnedCargoSelection | null;
    onInstanceClick: (instance: HangarEquipmentInstance) => void;
    onContainerClick: (instance: HangarEquipmentInstance) => void;
    onCargoClick: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
    onHoldClick: (hold: HangarHold) => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
};

export default function HoldBlock({
    hold,
    selected,
    selectedInstanceId,
    selectedCargo,
    onInstanceClick,
    onContainerClick,
    onCargoClick,
    onHoldClick,
    onShowTip,
    onHideTip,
}: Props) {
    const capacity = Number(hold.capacity_mass);
    const used = Number(hold.used_mass);
    const percent = capacity > 0 ? Math.min(Math.round(used / capacity * 100), 100) : 0;

    return (
        <div className={`hold-row${selected ? ' selected' : ''}`}>
            <button className="hold-head" type="button" aria-pressed={selected}
                    onClick={() => onHoldClick(hold)}>
                <strong>Трюм {hold.hold_index + 1}</strong>
                <span>{formatNumber(used)} / {formatNumber(capacity)} кг</span>
            </button>
            <i className="hold-bar"><em style={{width: `${percent}%`}}/></i>
            {hold.equipment.length > 0 ? (
                <div className="slot-grid hold-grid">
                    {hold.equipment.map((instance) => (
                        <button key={instance.id} type="button"
                                className={`slot-tile hold-tile${selectedInstanceId === instance.id ? ' selected' : ''}`}
                                aria-label={`${instance.name}, ${formatNumber(instance.mass)} кг`}
                                onMouseEnter={(event) => onShowTip(event.currentTarget, holdTipContent(hold, instance))}
                                onMouseLeave={onHideTip}
                                onFocus={(event) => onShowTip(event.currentTarget, holdTipContent(hold, instance))}
                                onBlur={onHideTip}
                                onClick={() => instance.is_container
                                    ? onContainerClick(instance)
                                    : onInstanceClick(instance)}>
                            <HangarIcon name={instance.icon} size={22}/>
                            {instance.cargo.length > 0 && (
                                <CargoChips lines={instance.cargo}
                                            selected={selectedCargo?.containerId === instance.id ? selectedCargo : null}
                                            tipFor={(line) => cargoTipContent(instance, line)}
                                            tileTip={(tile) => onShowTip(tile, holdTipContent(hold, instance))}
                                            onCargoClick={(line) => onCargoClick(instance, line)}
                                            onShowTip={onShowTip}
                                            onHideTip={onHideTip}/>
                            )}
                            {instance.mass > 0 && <span className="slot-qty">{formatNumber(instance.mass)} кг</span>}
                        </button>
                    ))}
                </div>
            ) : (
                <span className="hold-empty">Пусто</span>
            )}
        </div>
    );
}
