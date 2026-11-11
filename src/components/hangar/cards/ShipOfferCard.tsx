// Карточка модели в продаже: та же карточка корабля плюс цены и покупка.
import type {CatalogShipModel} from '../../../lib/catalog';
import {priceOf} from '../../../lib/catalog';
import {actionLabels, formatNumber} from '../../../lib/format';
import type {ShipView} from '../../../lib/ship';
import type {TipContent} from '../../../lib/tips';
import {BuyButton} from '../../TradeButtons';
import ShipCard from '../ship/ShipCard';
import CardShell from './CardShell';

type Props = {
    view: ShipView;
    model: CatalogShipModel;
    credits: number;
    message: string;
    blocker: string;
    canBuy: boolean;
    onBuy: () => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
};

export default function ShipOfferCard({
    view,
    model,
    credits,
    message,
    blocker,
    canBuy,
    onBuy,
    onShowTip,
    onHideTip,
}: Props) {
    return (
        <>
            <ShipCard view={view}
                      selectedSlotId={null}
                      selectedInstanceId={null}
                      selectedCargo={null}
                      selectedHoldId={null}
                      onShowTip={onShowTip}
                      onHideTip={onHideTip}/>
            <CardShell
                priceRows={[
                    {label: 'Цена покупки', value: <>{formatNumber(priceOf(model, 'price_buy'))} ¤</>},
                    {label: 'Цена продажи', value: <>{formatNumber(priceOf(model, 'price_sale'))} ¤</>},
                ]}
                note={`Ваш баланс: ${formatNumber(credits)} ¤.`}
                error={message || blocker}
                action={
                    <BuyButton type="button" label={actionLabels.buy_ship}
                               disabled={!canBuy}
                               onClick={onBuy}
                               title={blocker || `Купить ${model.name}`}/>
                }/>
        </>
    );
}
