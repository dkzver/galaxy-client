// Карточка экземпляра оборудования: место, масса, груз контейнера и продажа.
import type {HangarEquipmentInstance} from '../../../types';
import {categoryOf, findEquipment} from '../../../lib/catalog';
import {formatNumber} from '../../../lib/format';
import {instanceSalePrice, locationLabel} from '../../../lib/ship';
import {SellButton} from '../../TradeButtons';
import CardShell, {type CardRow} from './CardShell';

type Props = {
    instance: HangarEquipmentInstance;
    message: string;
    busy: boolean;
    onSell: () => void;
};

export default function InstanceCard({instance, message, busy, onSell}: Props) {
    const model = findEquipment(instance.model_id);
    const rows: CardRow[] = [
        {label: 'Место', value: locationLabel(instance)},
        {label: 'Масса', value: <>{formatNumber(instance.mass)} кг</>},
    ];
    if (instance.is_container) {
        rows.push({
            label: 'Заполнено',
            value: <>{formatNumber(instance.used_kg)} / {formatNumber(instance.capacity_kg)} кг</>,
        });
    }

    return (
        <CardShell
            eyebrow={categoryOf(model, 'equipment')?.name || 'Оборудование'}
            title={instance.name}
            rows={rows}
            priceRows={[{label: 'Цена продажи', value: <>{formatNumber(instanceSalePrice(instance))} ¤</>}]}
            error={message}
            action={
                <SellButton type="button"
                            label={instance.cargo.length > 0 ? 'Продать вместе с грузом' : 'Продать оборудование'}
                            disabled={busy} onClick={onSell}/>
            }>
            {instance.cargo.length > 0 && (
                <>
                    <span className="ship-sub">Груз в контейнере</span>
                    <div className="trade-cargo-list shop-cargo-list">
                        {instance.cargo.map((line) => (
                            <div className="trade-cargo-row" key={line.resource_id}>
                                <span className="trade-cargo-name">{line.name}</span>
                                <span className="trade-cargo-kg">{formatNumber(line.amount_kg)} кг</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </CardShell>
    );
}
