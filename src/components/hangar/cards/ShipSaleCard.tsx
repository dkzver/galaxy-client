// Карточка продажи своего корабля: разбивка цены и единственная кнопка продажи.
import {formatNumber} from '../../../lib/format';
import {SellButton} from '../../TradeButtons';
import CardShell from './CardShell';

type Props = {
    title: string;
    equipmentCount: number;
    shipPrice: number;
    equipmentPrice: number;
    cargoKg: number;
    cargoPrice: number;
    canSell: boolean;
    message: string;
    busy: boolean;
    onSell: () => void;
};

export default function ShipSaleCard({
    title,
    equipmentCount,
    shipPrice,
    equipmentPrice,
    cargoKg,
    cargoPrice,
    canSell,
    message,
    busy,
    onSell,
}: Props) {
    return (
        <CardShell
            eyebrow="Мой корабль · продажа"
            title={title}
            priceRows={[
                {label: 'Корабль', value: <>{formatNumber(shipPrice)} ¤</>},
                {label: `Оборудование · ${equipmentCount} шт.`, value: <>{formatNumber(equipmentPrice)} ¤</>},
                {label: `Груз · ${formatNumber(cargoKg)} кг`, value: <>{formatNumber(cargoPrice)} ¤</>},
            ]}
            total={{
                label: 'Итого',
                value: <>{formatNumber(shipPrice + equipmentPrice + cargoPrice)} ¤</>,
            }}
            notice={!canSell ? <p className="trade-error">Нельзя продать единственный корабль.</p> : null}
            error={message}
            action={<SellButton type="button" label="Продать корабль" disabled={!canSell || busy} onClick={onSell}/>}/>
    );
}
