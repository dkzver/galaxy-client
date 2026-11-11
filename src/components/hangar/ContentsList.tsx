// Колонка 3: содержимое выбранного корабля — те же категории каталога, что и в списке товаров.
import type {
    HangarCargoLine,
    HangarEquipmentInstance,
    HangarShip,
} from '../../types';
import {
    findEquipment,
    findResource,
    groupByCategories,
    type CatalogItem,
    type CatalogTab,
} from '../../lib/catalog';
import {formatNumber} from '../../lib/format';
import {locationLabel, shipInstances, type OwnedCargoSelection} from '../../lib/ship';
import {HangarIcon} from '../ui/HangarIcon';
import ItemRow from '../ui/ItemRow';

type ContentRow = {
    key: string;
    kind: 'equipment' | 'cargo';
    instance: HangarEquipmentInstance;
    line?: HangarCargoLine;
    model: CatalogItem | null;
};

type Props = {
    ship: HangarShip | null;
    activeTab: CatalogTab;
    holdId: number | null;
    containerId: number | null;
    selectedInstanceId: number | null;
    selectedCargo: OwnedCargoSelection | null;
    onInstanceClick: (instance: HangarEquipmentInstance) => void;
    onContainerClick: (instance: HangarEquipmentInstance) => void;
    onCargoClick: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
};

export default function ContentsList({
    ship,
    activeTab,
    holdId,
    containerId,
    selectedInstanceId,
    selectedCargo,
    onInstanceClick,
    onContainerClick,
    onCargoClick,
}: Props) {
    if (!ship) return <div className="list-empty">Корабль не выбран</div>;

    const hold = holdId === null ? null : ship.holds.find((entry) => Number(entry.id) === holdId) ?? null;
    const inHold = holdId !== null;
    const inContainer = containerId !== null;
    // Выбранный контейнер показывает только своё содержимое, выбранный трюм — весь состав.
    const instances = shipInstances(ship).filter((instance) =>
        inContainer
            ? instance.id === containerId
            : (!inHold || Number(instance.hold_id) === holdId));
    const rows: ContentRow[] = [];
    for (const instance of instances) {
        // В выбранном трюме показываем весь состав: и оборудование, и груз контейнеров.
        if (!inContainer && (inHold || activeTab !== 'resources')) {
            rows.push({
                key: `e-${instance.id}`,
                kind: 'equipment',
                instance,
                model: findEquipment(instance.model_id),
            });
        }
        if (inHold || inContainer || activeTab !== 'equipment') {
            for (const line of instance.cargo) {
                rows.push({
                    key: `c-${instance.id}-${line.resource_id}`,
                    kind: 'cargo',
                    instance,
                    line,
                    model: findResource(line.resource_id),
                });
            }
        }
    }

    if (rows.length === 0) {
        const emptyText = inContainer
            ? 'В этом контейнере пусто'
            : hold
                ? 'В этом трюме пусто'
                : activeTab === 'resources' ? 'Ресурсов на корабле нет' : 'Оборудования на корабле нет';
        return <div className="list-empty">{emptyText}</div>;
    }

    const groups = groupByCategories(rows, (row) => row.model?.categoryId);

    return (
        <div className="item-list panel-body">
            {groups.map((group) => (
                <div className="list-group" key={group.id}>
                    <div className="list-group-head">
                        <span className="list-group-icon"><HangarIcon name={group.icon} size={13}/></span>
                        <strong>{group.name}</strong><small>{group.items.length}</small>
                    </div>
                    {group.items.map((row) => {
                        if (row.kind === 'cargo' && row.line) {
                            const line = row.line;
                            const selected = Boolean(selectedCargo
                                && selectedCargo.containerId === row.instance.id
                                && selectedCargo.resourceId === line.resource_id);
                            return (
                                <ItemRow key={row.key}
                                         icon={line.icon}
                                         name={line.name}
                                         subtitle={`${row.instance.name} · ${locationLabel(row.instance)}`}
                                         selected={selected}
                                         onClick={() => onCargoClick(row.instance, line)}
                                         meta={<>
                                             <small>{formatNumber(line.amount_kg)} кг</small>
                                             <b>{formatNumber(line.price_sale)} ¤/кг</b>
                                         </>}/>
                            );
                        }
                        const instance = row.instance;
                        return (
                            <ItemRow key={row.key}
                                     icon={instance.icon}
                                     name={instance.name}
                                     subtitle={locationLabel(instance)}
                                     selected={selectedInstanceId === instance.id}
                                     onClick={() => instance.is_container
                                         ? onContainerClick(instance)
                                         : onInstanceClick(instance)}
                                     meta={<>
                                         <small>{formatNumber(instance.mass)} кг</small>
                                         {instance.is_container
                                             && <b>{formatNumber(instance.used_kg)} / {formatNumber(instance.capacity_kg)} кг</b>}
                                     </>}/>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
