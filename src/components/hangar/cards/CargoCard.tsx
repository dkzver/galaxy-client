// Карточка груза: килограммы в контейнере, свободное место и продажа одного килограмма.
import type {HangarCargoLine, HangarEquipmentInstance} from '../../../types';
import {formatNumber} from '../../../lib/format';
import {SellButton} from '../../TradeButtons';
import CardShell from './CardShell';

type Props = {
    line: HangarCargoLine;
    container: HangarEquipmentInstance;
    message: string;
    busy: boolean;
    onSell: () => void;
};

export default function CargoCard({line, container, message, busy, onSell}: Props) {
    return (
        <CardShell
            eyebrow={`Груз · ${container.name}`}
            title={line.name}
            rows={[
                {label: 'В контейнере', value: <>{formatNumber(line.amount_kg)} кг</>},
                {label: 'Свободно', value: <>{formatNumber(container.free_kg)} кг</>},
            ]}
            priceRows={[
                {label: 'Цена продажи', value: <>{formatNumber(line.price_sale)} ¤ / кг</>},
                {label: 'За 1 кг', value: <>{formatNumber(line.price_sale)} ¤</>},
            ]}
            error={message}
            action={<SellButton type="button" label="Продать 1 кг" disabled={busy} onClick={onSell}/>}/>
    );
}
