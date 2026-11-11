// Торговля: одно сообщение, занятость, подтверждение продажи и шесть действий сервера.
import {useState} from 'react';
import {ApiError, executeTrade} from '../api';
import type {HangarEquipmentInstance, HangarStatus, TradeActionType} from '../types';
import type {TradeIntent} from '../lib/selection';
import type {SelectionActions} from './useHangarSelection';

export type ConfirmState = {kind: 'ship'} | {kind: 'container'; instanceId: number};

type Options = {
    token: string;
    hangar: HangarStatus | null;
    onHangarUpdate?: (hangar: HangarStatus) => void;
    message: string;
    setMessage: (text: string) => void;
    actions: Pick<SelectionActions, 'applyTradeResult' | 'clear'>;
};

export function useTrade({token, hangar, onHangarUpdate, message, setMessage, actions}: Options) {
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);

    // Единственная точка отправки торговых действий: ответ сервера обновляет ангар и выбор.
    async function runTrade(action: TradeActionType, payload: Record<string, unknown> = {}) {
        if (!hangar || busy) return;
        setBusy(true);
        setMessage('');
        try {
            const response = await executeTrade(token, action, payload);
            if (response.hangar) onHangarUpdate?.(response.hangar);
            actions.applyTradeResult(action, response.receipt);
            setConfirm(null);
        } catch (cause) {
            setMessage(cause instanceof ApiError || cause instanceof Error
                ? cause.message
                : 'Не удалось выполнить действие.');
            setConfirm(null);
        } finally {
            setBusy(false);
        }
    }

    function buy(intent: TradeIntent | null) {
        if (!intent) return;
        void runTrade(intent.action, intent.payload);
    }

    // Продажа экземпляра: контейнер с грузом требует подтверждения и уходит вместе с грузом.
    function sellInstance(instance: HangarEquipmentInstance, shipId: string | number | undefined) {
        setMessage('');
        if (instance.cargo.length > 0) {
            setConfirm({kind: 'container', instanceId: instance.id});
            return;
        }
        void runTrade('sell_equipment', {userShipId: shipId, equipmentInstanceId: instance.id});
    }

    function confirmShip() {
        setMessage('');
        setConfirm({kind: 'ship'});
    }

    function closeConfirm() {
        setConfirm(null);
    }

    return {runTrade, buy, sellInstance, confirmShip, closeConfirm, confirm, message, busy, setMessage};
}
