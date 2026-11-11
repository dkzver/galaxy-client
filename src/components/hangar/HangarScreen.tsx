// Ангар: компоновка экрана. Цены, доступность места и снимок состояния считает сервер;
// клиент только показывает и подсказывает, куда встанет покупка.
import {useEffect, useState} from 'react';
import type {HangarStatus} from '../../types';
import {findShipModel, priceOf, visibleCatalogItems} from '../../lib/catalog';
import {buyIntent, selectionView} from '../../lib/selection';
import {dockShips, findInstance, saleBreakdown, shipInstances, shipView} from '../../lib/ship';
import {useDockGallery} from '../../hooks/useDockGallery';
import {useHangarSelection} from '../../hooks/useHangarSelection';
import {useTooltip} from '../../hooks/useTooltip';
import {useTrade} from '../../hooks/useTrade';
import TooltipLayer from '../ui/TooltipLayer';
import AccountDialog from './dialogs/AccountDialog';
import ConfirmSaleDialogs from './dialogs/ConfirmSaleDialogs';
import CatalogList from './CatalogList';
import CatalogPanel from './CatalogPanel';
import ContentsList from './ContentsList';
import HangarTopbar from './HangarTopbar';
import SelectionColumn from './SelectionColumn';
import ShipCard from './ship/ShipCard';
import ShipDock from './ShipDock';
import './hangar.css';

interface Props {
    token: string;
    hangar: HangarStatus | null;
    onHangarUpdate?: (hangar: HangarStatus) => void;
    error: string;
    email: string;
    onLaunch: () => void;
    onLogout: () => void;
    onDeleteAccount: () => Promise<void>;
}

export default function HangarScreen({
    token,
    hangar,
    onHangarUpdate,
    error,
    email,
    onLaunch,
    onLogout,
    onDeleteAccount,
}: Props) {
    const [message, setMessage] = useState('');
    const [accountOpen, setAccountOpen] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const {selection, actions, ship, ships} = useHangarSelection(hangar, () => setMessage(''));
    const trade = useTrade({token, hangar, onHangarUpdate, message, setMessage, actions});
    const tooltip = useTooltip();
    const view = selectionView(selection, ship, hangar, trade.busy);
    const dock = dockShips(selection.forSale, ships);
    const gallery = useDockGallery(dock.length);

    const instances = shipInstances(ship);
    const totals = saleBreakdown(ship);
    const shipPrice = priceOf(findShipModel(ship?.ship_model_id), 'price_sale');
    const shipCardView = ship ? shipView(ship) : null;
    const items = visibleCatalogItems(selection.tab, selection.categoryId, view.slot, view.container);
    const emptyText = view.slot
        ? 'Для этого крепления нет подходящего оборудования'
        : view.container
            ? 'Этот контейнер не принимает доступные ресурсы'
            : 'В выбранной категории пока нет объектов';
    const confirmInstance = trade.confirm?.kind === 'container'
        ? findInstance(ship, trade.confirm.instanceId)
        : null;

    // Escape: закрыть диалог, меню аккаунта или вылететь — как обещает подпись кнопки.
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== 'Escape' || deletingAccount) return;
            if (trade.confirm) {
                trade.closeConfirm();
                return;
            }
            if (accountOpen) {
                setAccountOpen(false);
                return;
            }
            event.preventDefault();
            onLaunch();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [trade, accountOpen, deletingAccount, onLaunch]);

    async function handleDeleteAccount() {
        setDeletingAccount(true);
        setDeleteError('');
        try {
            await onDeleteAccount();
        } catch (cause) {
            setDeleteError(cause instanceof Error ? cause.message : 'Не удалось удалить аккаунт.');
            setDeletingAccount(false);
        }
    }

    function sellCargo() {
        if (!view.cargoContainer || !view.cargoLine) return;
        void trade.runTrade('sell_resource', {
            userShipId: ship?.id,
            containerInstanceId: view.cargoContainer.id,
            resourceId: view.cargoLine.resource_id,
        });
    }

    return (
        <main className="app-shell hangar-screen">
            <div className="scanline"/>
            <HangarTopbar credits={hangar?.credits} email={email}
                          onLaunch={onLaunch} onAccount={() => setAccountOpen(true)}/>

            <div className="content">
                <section className="shop-view" id="view-shop">
                    <div className={`market-grid${selection.forSale ? ' no-cargo' : ''}`}>
                        <CatalogPanel activeTab={selection.tab} activeCategory={selection.categoryId}
                                      onSelectTab={actions.selectTab}
                                      onSelectCategory={actions.selectCategory}
                                      onSelectAll={actions.selectAllCategories}
                                      onShowTip={(target, content) => tooltip.showTip(target, content, 'above')}
                                      onHideTip={tooltip.hideTip}/>

                        {/* Колонка 1: корабль игрока. Выбор в доке меняет именно её. */}
                        <section className="inventory-panel panel-block glass ship-column" id="shipPanel">
                            <div className="ship-panel-body panel-body">
                                {shipCardView ? (
                                    <ShipCard key={shipCardView.id} view={shipCardView}
                                              selectedSlotId={selection.slotRowId}
                                              selectedInstanceId={selection.instanceId}
                                              selectedCargo={selection.cargo}
                                              selectedHoldId={selection.holdId}
                                              onSlotClick={actions.selectSlot}
                                              onInstanceClick={actions.selectInstance}
                                              onContainerClick={actions.selectContainer}
                                              onCargoClick={actions.selectCargo}
                                              onHoldClick={actions.selectHold}
                                              onShowTip={tooltip.showTip}
                                              onHideTip={tooltip.hideTip}/>
                                ) : (
                                    <div className="trade-empty">Корабль ангара ещё не загружен</div>
                                )}
                                {error && <p className="error-message" role="alert">{error}</p>}
                            </div>
                        </section>

                        {/* Колонка 2: что можно купить — с учётом выбранного крепления или контейнера. */}
                        <section className="inventory-panel panel-block glass market-column" id="shopPanel">
                            <CatalogList items={items} selectedItemId={selection.itemId}
                                         emptyText={emptyText} onItemClick={actions.selectItem}/>
                        </section>

                        {/* Колонка 3: содержимое выбранного купленного корабля. */}
                        {!selection.forSale && (
                            <section className="inventory-panel panel-block glass cargo-column" id="cargoPanel">
                                <ContentsList ship={ship}
                                              activeTab={selection.tab}
                                              categoryId={selection.categoryId}
                                              holdId={selection.holdId}
                                              containerId={selection.containerId ?? selection.cargo?.containerId ?? null}
                                              selectedInstanceId={selection.instanceId}
                                              selectedCargo={selection.cargo}
                                              onInstanceClick={actions.selectInstance}
                                              onContainerClick={actions.selectContainer}
                                              onCargoClick={actions.selectCargo}/>
                            </section>
                        )}

                        {/* Колонка 4: карточка выбранного объекта и кнопка действия. */}
                        <SelectionColumn selection={selection} view={view} ship={ship} ships={ships}
                                         prices={{...totals, shipPrice, credits: Number(hangar?.credits ?? 0), instancesCount: instances.length}}
                                         message={message} busy={trade.busy}
                                         onBuy={() => trade.buy(buyIntent(view, ship))}
                                         onSellInstance={(instance) => trade.sellInstance(instance, ship?.id)}
                                         onCargoClick={actions.selectCargo}
                                         onSellCargo={sellCargo}
                                         onSellShip={trade.confirmShip}
                                         onShowTip={tooltip.showTip}
                                         onHideTip={tooltip.hideTip}/>
                    </div>
                </section>

                <ShipDock ships={dock} forSale={selection.forSale}
                          forSaleShipId={selection.forSaleShipId}
                          selectedShipId={ship?.id ?? null}
                          gallery={gallery}
                          onSelectOwn={actions.selectShip}
                          onSelectForSale={(shipId) => {
                              setMessage('');
                              actions.selectForSaleShip(shipId);
                          }}
                          onToggleFleet={() => {
                              actions.toggleFleet();
                              gallery.reset();
                          }}/>
            </div>

            <ConfirmSaleDialogs confirm={trade.confirm} confirmInstance={confirmInstance} ship={ship}
                                shipPrice={shipPrice} equipmentPrice={totals.equipmentPrice}
                                cargoKg={totals.cargoKg} cargoPrice={totals.cargoPrice}
                                equipmentCount={instances.length}
                                message={message} busy={trade.busy}
                                onClose={trade.closeConfirm}
                                onSellShip={() => {
                                    if (ship) void trade.runTrade('sell_ship', {userShipId: ship.id});
                                }}
                                onSellContainer={(instance) => void trade.runTrade('sell_equipment', {
                                    userShipId: ship?.id,
                                    equipmentInstanceId: instance.id,
                                    withCargo: true,
                                })}/>

            <AccountDialog open={accountOpen} deleting={deletingAccount} deleteError={deleteError}
                           onClose={() => setAccountOpen(false)} onLogout={onLogout}
                           onDelete={handleDeleteAccount}/>

            <TooltipLayer content={tooltip.tip?.content ?? null} placed={tooltip.tipPlaced}
                          boxRef={tooltip.tipRef}/>
        </main>
    );
}
