// РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РїСЂРѕРґР°Р¶Рё: РєРѕСЂР°Р±Р»СЊ С†РµР»РёРєРѕРј РёР»Рё РєРѕРЅС‚РµР№РЅРµСЂ РІРјРµСЃС‚Рµ СЃ РіСЂСѓР·РѕРј.
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
               ariaLabel="РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РїСЂРѕРґР°Р¶Рё">
            {confirm && (
                <>
                    <div className="slot-dialog-head">
                        <div>
                            <span className="eyebrow">РџР РћР”РђР–Рђ</span>
                            <h3>{confirm.kind === 'ship'
                                ? `В«${ship?.name}В» вЂ” РІРјРµСЃС‚Рµ СЃ СЃРѕРґРµСЂР¶РёРјС‹Рј`
                                : confirmInstance ? `В«${confirmInstance.name}В» вЂ” РІРјРµСЃС‚Рµ СЃ РіСЂСѓР·РѕРј` : ''}</h3>
                        </div>
                        <button className="slot-close" type="button" aria-label="Р—Р°РєСЂС‹С‚СЊ"
                                onClick={onClose}>Г—</button>
                    </div>
                    <div className="dialog-body">
                        {confirm.kind === 'ship' ? (
                            <>
                                <p className="dialog-text">РљРѕСЂР°Р±Р»СЊ РїСЂРѕРґР°С‘С‚СЃСЏ РІРјРµСЃС‚Рµ СЃ РѕР±РѕСЂСѓРґРѕРІР°РЅРёРµРј Рё РіСЂСѓР·РѕРј.</p>
                                <div className="dialog-lines">
                                    <div className="dialog-line cost"><span>РљРѕСЂР°Р±Р»СЊ</span>
                                        <b>{formatNumber(shipPrice)} В¤</b></div>
                                    <div className="dialog-line cost">
                                        <span>РћР±РѕСЂСѓРґРѕРІР°РЅРёРµ В· {equipmentCount} С€С‚.</span>
                                        <b>{formatNumber(equipmentPrice)} В¤</b></div>
                                    <div className="dialog-line cost">
                                        <span>Р“СЂСѓР· В· {formatNumber(cargoKg)} РєРі</span>
                                        <b>{formatNumber(cargoPrice)} В¤</b></div>
                                    <div className="dialog-line total"><span>РС‚РѕРіРѕ</span>
                                        <b>{formatNumber(shipPrice + equipmentPrice + cargoPrice)} В¤</b></div>
                                </div>
                                <ErrorLine text={message}/>
                                <div className="dialog-actions">
                                    <button className="trade-button sell" type="button" disabled={busy}
                                            onClick={onSellShip}>
                                        РџСЂРѕРґР°С‚СЊ РєРѕСЂР°Р±Р»СЊ
                                    </button>
                                    <button className="trade-button ghost" type="button"
                                            onClick={onClose}>РћС‚РјРµРЅР°</button>
                                </div>
                            </>
                        ) : confirmInstance ? (
                            <>
                                <p className="dialog-text">РљРѕРЅС‚РµР№РЅРµСЂ РїСЂРѕРґР°С‘С‚СЃСЏ С‚РѕР»СЊРєРѕ РІРјРµСЃС‚Рµ СЃ РіСЂСѓР·РѕРј. Р’РЅСѓС‚СЂРё:</p>
                                <div className="dialog-lines">
                                    {confirmInstance.cargo.map((line) => (
                                        <div className="dialog-line" key={line.resource_id}>
                                            <span>{line.name}</span>
                                            <b>{formatNumber(line.amount_kg)} РєРі</b>
                                            <small>{formatNumber(line.amount_kg * line.price_sale)} В¤</small>
                                        </div>
                                    ))}
                                    <div className="dialog-line total">
                                        <span>РС‚РѕРіРѕ</span>
                                        <b>{formatNumber(instanceSalePrice(confirmInstance))} В¤</b>
                                    </div>
                                </div>
                                <ErrorLine text={message}/>
                                <div className="dialog-actions">
                                    <button className="trade-button sell" type="button" disabled={busy}
                                            onClick={() => onSellContainer(confirmInstance)}>
                                        РџСЂРѕРґР°С‚СЊ РІРјРµСЃС‚Рµ СЃ РіСЂСѓР·РѕРј
                                    </button>
                                    <button className="trade-button ghost" type="button"
                                            onClick={onClose}>РћС‚РјРµРЅР°</button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </>
            )}
        </Modal>
    );
}
