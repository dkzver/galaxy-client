// Карточка контейнера: заполнено, свободно, что принимает и что внутри.
import type {HangarCargoLine, HangarEquipmentInstance} from '../../../types';
import {categoryOf, findEquipment} from '../../../lib/catalog';
import {formatNumber} from '../../../lib/format';
import {locationLabel} from '../../../lib/ship';
import {SellButton} from '../../TradeButtons';
import AllowedList from '../../ui/AllowedList';
import CardShell from './CardShell';

type Props = {
    container: HangarEquipmentInstance;
    message: string;
    busy: boolean;
    onCargoClick: (line: HangarCargoLine) => void;
    onSell: () => void;
};

export default function ContainerCard({container, message, busy, onCargoClick, onSell}: Props) {
    const model = findEquipment(container.model_id);
    return (
        <CardShell
            eyebrow={`${categoryOf(model, 'equipment')?.name || 'Контейнер'} · ${locationLabel(container)}`}
            title={container.name}
            rows={[
                {
                    label: 'Заполнено',
                    value: <>{formatNumber(container.used_kg)} / {formatNumber(container.capacity_kg)} кг</>,
                },
                {label: 'Свободно', value: <>{formatNumber(container.free_kg)} кг</>},
                {label: 'Принимает', value: `${container.allowed.length} вид(ов)`},
            ]}
            error={message}
            action={
                <SellButton type="button"
                            label={container.cargo.length > 0 ? 'Продать вместе с грузом' : 'Продать оборудование'}
                            disabled={busy} onClick={onSell}/>
            }>
            <span className="ship-sub">Груз в контейнере</span>
            {container.cargo.length > 0 ? (
                <div className="trade-cargo-list shop-cargo-list">
                    {container.cargo.map((line) => (
                        <button className="trade-cargo-row" type="button" key={line.resource_id}
                                onClick={() => onCargoClick(line)}>
                            <span className="trade-cargo-name">{line.name}</span>
                            <span className="trade-cargo-kg">{formatNumber(line.amount_kg)} кг</span>
                        </button>
                    ))}
                </div>
            ) : (
                <span className="hold-empty">Пусто</span>
            )}
            <span className="ship-sub">Можно положить</span>
            <AllowedList names={container.allowed}/>
        </CardShell>
    );
}
