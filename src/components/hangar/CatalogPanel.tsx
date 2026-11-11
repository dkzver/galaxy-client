// Панель каталога: вкладки типа и чипы групп верхнего уровня со счётчиками.
import type {FocusEvent, MouseEvent} from 'react';
import {catalog, inCategoryGroup, topCategories, type CatalogCategory, type CatalogItem, type CatalogTab} from '../../lib/catalog';
import {tabLabels} from '../../lib/format';
import type {TipContent} from '../../lib/tips';
import {HangarIcon} from '../ui/HangarIcon';

type Props = {
    activeTab: CatalogTab;
    activeCategory: number | null;
    onSelectTab: (tab: CatalogTab) => void;
    onSelectCategory: (categoryId: number) => void;
    onSelectAll: () => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
};

const TAB_ICONS: Record<CatalogTab, string> = {all: 'grid', equipment: 'tool', resources: 'crate'};

export default function CatalogPanel({
    activeTab,
    activeCategory,
    onSelectTab,
    onSelectCategory,
    onSelectAll,
    onShowTip,
    onHideTip,
}: Props) {
    // Категории идут рядами: оборудование сверху, ресурсы снизу.
    const categoryRows: Array<{kind: 'equipment' | 'resources'; items: CatalogCategory[]; catalog: CatalogItem[]}> = [];
    if (activeTab !== 'resources') {
        categoryRows.push({kind: 'equipment', items: topCategories('equipment'), catalog: catalog.equipments});
    }
    if (activeTab !== 'equipment') {
        categoryRows.push({kind: 'resources', items: topCategories('resources'), catalog: catalog.resources});
    }

    // Подсказка над кнопкой: только название и число позиций, без иконки.
    const tipProps = (title: string) => ({
        onMouseEnter: (event: MouseEvent<HTMLButtonElement>) =>
            onShowTip(event.currentTarget, {title, rows: []}),
        onMouseLeave: onHideTip,
        onFocus: (event: FocusEvent<HTMLButtonElement>) =>
            onShowTip(event.currentTarget, {title, rows: []}),
        onBlur: onHideTip,
    });

    return (
        <section className="panel-block glass catalog-panel">
            <div className="panel-body catalog-body">
                <div className="tabs category-tabs" role="tablist" aria-label="Тип каталога">
                    {(['all', 'equipment', 'resources'] as const).map((tab) => (
                        <button className={`tab${activeTab === tab ? ' active' : ''}`} key={tab}
                                type="button" role="tab" aria-selected={activeTab === tab}
                                {...tipProps(tabLabels[tab])}
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
                                        type="button" onClick={onSelectAll}
                                        aria-label="Все категории"
                                        {...tipProps('Все категории')}>
                                    <HangarIcon name="grid" size={13}/>
                                </button>
                            )}
                            {row.items.map((category) => {
                                const count = row.catalog.filter((item) => inCategoryGroup(item, category.id)).length;
                                return (
                                    <button
                                        className={`tab catalog-category${activeCategory === category.id ? ' active' : ''}`}
                                        key={category.id} type="button"
                                        aria-label={category.name}
                                        {...tipProps(`${category.name} · ${count}`)}
                                        onClick={() => onSelectCategory(category.id)}>
                                        <HangarIcon name={category.icon} size={13}/>
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
