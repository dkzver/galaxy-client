// Подтверждение продажи: корабль целиком или контейнер вместе с грузом.
import type {HangarEquipmentInstance, HangarShip} from '../../../types';
import {formatNumber} from '../../../lib/format';
import {instanceSalePrice} from '../../../lib/ship';
import type {ConfirmState} from '../../../hooks/useTrade';
import ErrorLine from '../../ui/ErrorLine';
import Modal from '../../ui/Modal';

type Props = {
    confirm: ConfirmState | null;
    confirmInstance: HangarEquipmentInstance | null;
    ship: HangarShip | null;
    shipPrice: number;
    equipmentPrice: number;
    cargoKg: number;
    cargoPrice: number;
    equipmentCount: number;
    message: string;
    busy: boolean;
    onClose: () => void;
    onSellShip: () => void;
    onSellContainer: (instance: HangarEquipmentInstance) => void;
};

export default function ConfirmSaleDialogs({
    confirm,
    confirmInstance,
    ship,
    shipPrice,
    equipmentPrice,
    cargoKg,
    cargoPrice,
    equipmentCount,
    message,
    busy,
    onClose,
    onSellShip,
    onSellContainer,
}: Props) {
    return (
        <Modal open={Boolean(confirm)} onClose={onClose}
               backdropClassName="slot-modal" dialogClassName="slot-dialog"
               ariaLabel="Подтверждение продажи">
            {confirm && (
                <>
                    <div className="slot-dialog-head">
                        <div>
                            <span className="eyebrow">ПРОДАЖА</span>
                            <h3>{confirm.kind === 'ship'
                                ? `«${ship?.name}» — вместе с содержимым`
                                : confirmInstance ? `«${confirmInstance.name}» — вместе с грузом` : ''}</h3>
                        </div>
                        <button className="slot-close" type="button" aria-label="Закрыть"
                                onClick={onClose}>×</button>
                    </div>
                    <div className="dialog-body">
                        {confirm.kind === 'ship' ? (
                            <>
                                <p className="dialog-text">Корабль продаётся вместе с оборудованием и грузом.</p>
                                <div className="dialog-lines">
                                    <div className="dialog-line cost"><span>Корабль</span>
                                        <b>{formatNumber(shipPrice)} ¤</b></div>
                                    <div className="dialog-line cost">
                                        <span>Оборудование · {equipmentCount} шт.</span>
                                        <b>{formatNumber(equipmentPrice)} ¤</b></div>
                                    <div className="dialog-line cost">
                                        <span>Груз · {formatNumber(cargoKg)} кг</span>
                                        <b>{formatNumber(cargoPrice)} ¤</b></div>
                                    <div className="dialog-line total"><span>Итого</span>
                                        <b>{formatNumber(shipPrice + equipmentPrice + cargoPrice)} ¤</b></div>
                                </div>
                                <ErrorLine text={message}/>
                                <div className="dialog-actions">
                                    <button className="trade-button sell" type="button" disabled={busy}
                                            onClick={onSellShip}>
                                        Продать корабль
                                    </button>
                                    <button className="trade-button ghost" type="button"
                                            onClick={onClose}>Отмена</button>
                                </div>
                            </>
                        ) : confirmInstance ? (
                            <>
                                <p className="dialog-text">Контейнер продаётся только вместе с грузом. Внутри:</p>
                                <div className="dialog-lines">
                                    {confirmInstance.cargo.map((line) => (
                                        <div className="dialog-line" key={line.resource_id}>
                                            <span>{line.name}</span>
                                            <b>{formatNumber(line.amount_kg)} кг</b>
                                            <small>{formatNumber(line.amount_kg * line.price_sale)} ¤</small>
                                        </div>
                                    ))}
                                    <div className="dialog-line total">
                                        <span>Итого</span>
                                        <b>{formatNumber(instanceSalePrice(confirmInstance))} ¤</b>
                                    </div>
                                </div>
                                <ErrorLine text={message}/>
                                <div className="dialog-actions">
                                    <button className="trade-button sell" type="button" disabled={busy}
                                            onClick={() => onSellContainer(confirmInstance)}>
                                        Продать вместе с грузом
                                    </button>
                                    <button className="trade-button ghost" type="button"
                                            onClick={onClose}>Отмена</button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </>
            )}
        </Modal>
    );
}
