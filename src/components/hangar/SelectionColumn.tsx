// Колонка 4: карточка выбранного объекта и кнопка действия.
import type {HangarCargoLine, HangarEquipmentInstance, HangarShip} from '../../types';
import type {Selection, SelectionView} from '../../lib/selection';
import type {ShipSaleBreakdown} from '../../lib/ship';
import type {TipContent} from '../../lib/tips';
import CargoCard from './cards/CargoCard';
import ContainerCard from './cards/ContainerCard';
import InstanceCard from './cards/InstanceCard';
import ItemCard from './cards/ItemCard';
import ShipOfferCard from './cards/ShipOfferCard';
import ShipSaleCard from './cards/ShipSaleCard';

type Props = {
    selection: Selection;
    view: SelectionView;
    ship: HangarShip | null;
    ships: HangarShip[];
    prices: ShipSaleBreakdown & {shipPrice: number; credits: number; instancesCount: number};
    message: string;
    busy: boolean;
    onBuy: () => void;
    onSellInstance: (instance: HangarEquipmentInstance) => void;
    onCargoClick: (instance: HangarEquipmentInstance, line: HangarCargoLine) => void;
    onSellCargo: () => void;
    onSellShip: () => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
};

export default function SelectionColumn({
    selection,
    view,
    ship,
    ships,
    prices,
    message,
    busy,
    onBuy,
    onSellInstance,
    onCargoClick,
    onSellCargo,
    onSellShip,
    onShowTip,
    onHideTip,
}: Props) {
    return (
        <section className="inventory-panel shop-panel panel-block glass selection-column">
            <div className="ship-panel-body shop-panel-body panel-body">
                {view.forSaleShip && view.forSaleView ? (
                    <ShipOfferCard view={view.forSaleView}
                                   model={view.forSaleShip}
                                   credits={prices.credits}
                                   message={message}
                                   blocker={view.blocker}
                                   canBuy={view.canBuy}
                                   onBuy={onBuy}
                                   onShowTip={onShowTip}
                                   onHideTip={onHideTip}/>
                ) : view.item ? (
                    <ItemCard item={view.item}
                              isEquipment={view.itemIsEquipment}
                              placement={view.placement}
                              containerChoice={view.containerChoice}
                              slot={view.slot}
                              container={view.container}
                              buyPrice={view.buyPrice}
                              blocker={view.blocker}
                              message={message}
                              canBuy={view.canBuy}
                              onBuy={onBuy}/>
                ) : view.instance ? (
                    view.instance.is_container ? (
                        <ContainerCard container={view.instance}
                                       message={message || view.blocker}
                                       busy={busy}
                                       onCargoClick={(line) => onCargoClick(view.instance!, line)}
                                       onSell={() => onSellInstance(view.instance!)}/>
                    ) : (
                        <InstanceCard instance={view.instance}
                                      message={message || view.blocker}
                                      busy={busy}
                                      onSell={() => onSellInstance(view.instance!)}/>
                    )
                ) : view.cargoLine && view.cargoContainer ? (
                    <CargoCard line={view.cargoLine} container={view.cargoContainer}
                               message={message || view.blocker} busy={busy}
                               onSell={onSellCargo}/>
                ) : view.container ? (
                    <ContainerCard container={view.container} message={message || view.blocker}
                                   busy={busy}
                                   onCargoClick={(line) => onCargoClick(view.container!, line)}
                                   onSell={() => onSellInstance(view.container!)}/>
                ) : ship && selection.shipId !== null ? (
                    <ShipSaleCard title={ship.name}
                                  equipmentCount={prices.instancesCount}
                                  shipPrice={prices.shipPrice}
                                  equipmentPrice={prices.equipmentPrice}
                                  cargoKg={prices.cargoKg}
                                  cargoPrice={prices.cargoPrice}
                                  canSell={ships.length > 1}
                                  message={message}
                                  busy={busy}
                                  onSell={onSellShip}/>
                ) : ship ? (
                    <div className="trade-empty">
                        Выберите корабль в доке, крепление, контейнер или объект в списке
                    </div>
                ) : (
                    <div className="trade-empty">Выберите объект в каталоге</div>
                )}
            </div>
        </section>
    );
}
