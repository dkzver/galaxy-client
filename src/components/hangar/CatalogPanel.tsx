// Панель каталога: вкладки типа и чипы групп верхнего уровня со счётчиками.
import {catalog, inCategoryGroup, topCategories, type CatalogCategory, type CatalogItem, type CatalogTab} from '../../lib/catalog';
import {tabLabels} from '../../lib/format';
import {HangarIcon} from '../ui/HangarIcon';

type Props = {
    activeTab: CatalogTab;
    activeCategory: number | null;
    onSelectTab: (tab: CatalogTab) => void;
    onSelectCategory: (categoryId: number) => void;
    onSelectAll: () => void;
};

const TAB_ICONS: Record<CatalogTab, string> = {all: 'grid', equipment: 'tool', resources: 'crate'};

export default function CatalogPanel({
    activeTab,
    activeCategory,
    onSelectTab,
    onSelectCategory,
    onSelectAll,
}: Props) {
    // Категории идут рядами: оборудование сверху, ресурсы снизу.
    const categoryRows: Array<{kind: 'equipment' | 'resources'; items: CatalogCategory[]; catalog: CatalogItem[]}> = [];
    if (activeTab !== 'resources') {
        categoryRows.push({kind: 'equipment', items: topCategories('equipment'), catalog: catalog.equipments});
    }
    if (activeTab !== 'equipment') {
        categoryRows.push({kind: 'resources', items: topCategories('resources'), catalog: catalog.resources});
    }

    return (
        <section className="panel-block glass catalog-panel">
            <div className="panel-body catalog-body">
                <div className="tabs category-tabs" role="tablist" aria-label="Тип каталога">
                    {(['all', 'equipment', 'resources'] as const).map((tab) => (
                        <button className={`tab${activeTab === tab ? ' active' : ''}`} key={tab}
                                type="button" role="tab" aria-selected={activeTab === tab}
                                onClick={() => onSelectTab(tab)}>
                            <HangarIcon name={TAB_ICONS[tab]} size={13}/>
                            {tabLabels[tab]}
                        </button>
                    ))}
                </div>
                <div className="catalog-category-list" role="group" aria-label="Категории каталога">
                    {categoryRows.map((row, rowIndex) => (
                        <div className="catalog-category-row" key={row.kind}>
                            {rowIndex === 0 && (
                                <button className={`tab catalog-category${activeCategory === null ? ' active' : ''}`}
                                        type="button" onClick={onSelectAll}>Все</button>
                            )}
                            {row.items.map((category) => {
                                const count = row.catalog.filter((item) => inCategoryGroup(item, category.id)).length;
                                return (
                                    <button
                                        className={`tab catalog-category${activeCategory === category.id ? ' active' : ''}`}
                                        key={category.id} type="button"
                                        onClick={() => onSelectCategory(category.id)}>
                                        <HangarIcon name={category.icon} size={13}/>
                                        <span className="catalog-category-copy"><span>{category.name}</span></span>
                                        <small className="catalog-category-count">{count}</small>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
