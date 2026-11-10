// Подключает клиента к игровой зоне, передаёт управление и хранит снимок игроков.
import {useCallback, useEffect, useRef, useState} from 'react';
import {getApiUrl} from '../api';
import type {SpacePlayer, SpaceZone} from '../types';

export function useSpaceSocket(token: string, username: string, zone: SpaceZone) {
    const [players, setPlayers] = useState<SpacePlayer[]>([]);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const socketRef = useRef<WebSocket | null>(null);

    // Подключается к выбранной зоне и закрывает соединение при смене зоны или экрана.
    useEffect(() => {
        const socketUrl = new URL('/ws', getApiUrl());
        socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        socketUrl.searchParams.set('token', token);
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;
        socket.onopen = () => {
            setConnected(true);
            setError('');
            socket.send(JSON.stringify({type: 'join', zone, username}));
        };
        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(String(event.data));
                if (message.type === 'snapshot' && Array.isArray(message.players)) setPlayers(message.players);
                if (message.type === 'error') setError(message.message || 'Ошибка игровой сети.');
            } catch {
                setError('Получено некорректное сообщение игровой сети.');
            }
        };
        socket.onerror = () => setError('Не удалось подключиться к игровой сети.');
        socket.onclose = () => setConnected(false);
        return () => {
            socket.close();
            socketRef.current = null;
        };
    }, [token, username, zone]);

    // Передаёт только направление ввода: конечную скорость рассчитывает сервер.
    const sendMovement = useCallback((x: number, z: number) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({type: 'move', x, z}));
        }
    }, []);

    return {players, connected, error, sendMovement};
}
