// Колонка 2: что можно купить — подкатегории каталога и строки товаров.
import type {CatalogItem} from '../../lib/catalog';
import {groupByCategories, massOf, priceOf} from '../../lib/catalog';
import {formatNumber} from '../../lib/format';
import {HangarIcon} from '../ui/HangarIcon';
import ItemRow from '../ui/ItemRow';

type Props = {
    items: CatalogItem[];
    selectedItemId: number | null;
    emptyText: string;
    onItemClick: (item: CatalogItem) => void;
};

export default function CatalogList({items, selectedItemId, emptyText, onItemClick}: Props) {
    const groups = groupByCategories(items, (item) => item.categoryId);

    return (
        <div className="item-list panel-body">
            {groups.length ? groups.map((group) => (
                <div className="list-group" key={group.id}>
                    <div className="list-group-head">
                        <span className="list-group-icon"><HangarIcon name={group.icon} size={13}/></span>
                        <strong>{group.name}</strong><small>{group.items.length}</small>
                    </div>
                    {group.items.map((item) => (
                        <ItemRow key={item.id}
                                 icon={item.icon}
                                 name={item.name}
                                 subtitle={massOf(item) > 0
                                     ? `Масса ${formatNumber(massOf(item))} кг`
                                     : 'Единица груза'}
                                 selected={selectedItemId === item.id}
                                 onClick={() => onItemClick(item)}
                                 meta={<>
                                     <small>{group.name}</small>
                                     {priceOf(item, 'price_buy') > 0 && <b>{formatNumber(item.price_buy)} ¤</b>}
                                 </>}/>
                    ))}
                </div>
            )) : (
                <div className="list-empty">{emptyText}</div>
            )}
        </div>
    );
}
