// Маршрутизация экранов: сессия пилота, ангар и космические сцены.
import {useEffect, useState} from 'react';
import {fetchHangar} from './api';
import AuthScreen from './components/auth/AuthScreen';
import HangarScreen from './components/hangar/HangarScreen';
import SpaceScene from './components/SpaceScene';
import {useSession} from './hooks/useSession';
import type {HangarStatus, SpaceZone} from './types';

export default function App() {
    const session = useSession();
    const [hangar, setHangar] = useState<HangarStatus | null>(null);
    const [zone, setZone] = useState<SpaceZone>('galaxy-map');

    // Проверяет сохранённую сессию и загружает состояние ангара при входе.
    useEffect(() => {
        if (!session.token) {
            setHangar(null);
            return;
        }
        fetchHangar(session.token)
            .then(setHangar)
            .catch((cause: Error) => session.expire(cause.message));
        // Запрос повторяется только при смене токена.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.token]);

    if (session.screen === 'auth') {
        return <AuthScreen onAuthenticated={session.login} initialError={session.error}/>;
    }
    if (session.screen === 'hangar') {
        return <HangarScreen token={session.token} hangar={hangar} onHangarUpdate={setHangar}
                             error={session.error} email={session.email}
                             onLaunch={() => {
                                 setZone('galaxy-map');
                                 session.setScreen('space');
                             }}
                             onLogout={session.logout}
                             onDeleteAccount={session.removeAccount}/>;
    }
    return <SpaceScene token={session.token} username={session.email} zone={zone}
                       onZoneChange={setZone} onReturn={() => session.setScreen('hangar')}/>;
}
