// Трёхмерная сцена Three.js с управлением кораблём и отображением соседних игроков.
import {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {useSpaceSocket} from '../hooks/useSpaceSocket';
import type {SpaceZone} from '../types';
import {BackIcon, MapIcon} from './ui/Icons';

interface Props {
    token: string;
    username: string;
    zone: SpaceZone;
    onZoneChange: (zone: SpaceZone) => void;
    onReturn: () => void;
}

export default function SpaceScene({token, username, zone, onZoneChange, onReturn}: Props) {
    const canvasHost = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const remoteShipsRef = useRef(new Map<string, THREE.Mesh>());
    const positionRef = useRef({x: 0, z: 0});
    const {players, connected, error, sendMovement} = useSpaceSocket(token, username, zone);

    // Создаёт WebGL-сцену один раз и освобождает ресурсы Three.js при размонтировании.
    useEffect(() => {
        const host = canvasHost.current;
        if (!host) return;

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color('#070b16');
        scene.fog = new THREE.FogExp2('#070b16', 0.006);
        const isGalaxyMap = zone === 'galaxy-map';
        const mapViewSize = 80;
        const aspect = host.clientWidth / host.clientHeight;
        const camera = isGalaxyMap
            ? new THREE.OrthographicCamera(-mapViewSize * aspect / 2, mapViewSize * aspect / 2, mapViewSize / 2, -mapViewSize / 2, 0.1, 1000)
            : new THREE.PerspectiveCamera(62, aspect, 0.1, 1000);
        camera.position.set(0, isGalaxyMap ? 60 : 12, isGalaxyMap ? 0.1 : 24);
        camera.lookAt(0, 0, 0);
        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false});
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(host.clientWidth, host.clientHeight);
        host.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight('#8fa8ff', 1.8));
        const keyLight = new THREE.PointLight('#86d8ff', 22, 100);
        keyLight.position.set(0, 15, 5);
        scene.add(keyLight);

        const grid = new THREE.GridHelper(400, 80, '#244060', '#142338');
        grid.position.y = -2;
        scene.add(grid);

        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(1800 * 3);
        for (let index = 0; index < starPositions.length; index += 3) {
            starPositions[index] = (Math.random() - 0.5) * 500;
            starPositions[index + 1] = (Math.random() - 0.5) * 200;
            starPositions[index + 2] = (Math.random() - 0.5) * 500;
        }
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({color: '#b8d7ff', size: 0.55}));
        scene.add(stars);

        const ship = new THREE.Mesh(
            new THREE.ConeGeometry(0.8, 2.8, 4),
            new THREE.MeshStandardMaterial({color: '#6be6ff', emissive: '#123948', metalness: 0.55, roughness: 0.32}),
        );
        ship.rotation.x = Math.PI / 2;
        ship.position.set(positionRef.current.x, 0, positionRef.current.z);
        scene.add(ship);

        const remoteShips = remoteShipsRef.current;
        remoteShips.clear();
        const pressedKeys = new Set<string>();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key.startsWith('Arrow')) event.preventDefault();
            pressedKeys.add(event.key.toLowerCase());
        };
        const onKeyUp = (event: KeyboardEvent) => {
            pressedKeys.delete(event.key.toLowerCase());
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        let animationFrame = 0;
        let lastInputAt = 0;
        // Отрисовывает кадры и отправляет ввод на сервер не чаще одного раза за тик.
        const animate = (now: number) => {
            animationFrame = requestAnimationFrame(animate);
            const x = Number(pressedKeys.has('d') || pressedKeys.has('arrowright')) - Number(pressedKeys.has('a') || pressedKeys.has('arrowleft'));
            const z = Number(pressedKeys.has('s') || pressedKeys.has('arrowdown')) - Number(pressedKeys.has('w') || pressedKeys.has('arrowup'));
            ship.position.x += x * 0.12;
            ship.position.z += z * 0.12;
            positionRef.current = {x: ship.position.x, z: ship.position.z};
            if (isGalaxyMap) {
                camera.position.set(ship.position.x, 60, ship.position.z + 0.1);
            } else {
                camera.position.x += (ship.position.x - camera.position.x) * 0.035;
                camera.position.z += (ship.position.z + 24 - camera.position.z) * 0.035;
            }
            camera.lookAt(ship.position.x, 0, ship.position.z);
            ship.rotation.z = -x * 0.15;
            if (now - lastInputAt >= 50) {
                sendMovement(x, z);
                lastInputAt = now;
            }
            renderer.render(scene, camera);
        };
        animationFrame = requestAnimationFrame(animate);

        const resizeObserver = new ResizeObserver(() => {
            if (!host.clientWidth || !host.clientHeight) return;
            const resizedAspect = host.clientWidth / host.clientHeight;
            if (camera instanceof THREE.PerspectiveCamera) {
                camera.aspect = resizedAspect;
            } else {
                camera.left = -mapViewSize * resizedAspect / 2;
                camera.right = mapViewSize * resizedAspect / 2;
                camera.top = mapViewSize / 2;
                camera.bottom = -mapViewSize / 2;
            }
            camera.updateProjectionMatrix();
            renderer.setSize(host.clientWidth, host.clientHeight);
        });
        resizeObserver.observe(host);

        return () => {
            cancelAnimationFrame(animationFrame);
            resizeObserver.disconnect();
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            renderer.dispose();
            starsGeometry.dispose();
            (stars.material as THREE.Material).dispose();
            grid.geometry.dispose();
            (grid.material as THREE.Material).dispose();
            ship.geometry.dispose();
            (ship.material as THREE.Material).dispose();
            for (const remoteShip of remoteShips.values()) {
                remoteShip.geometry.dispose();
                (remoteShip.material as THREE.Material).dispose();
            }
            remoteShips.clear();
            sceneRef.current = null;
            host.removeChild(renderer.domElement);
        };
    }, [sendMovement, zone]);

    // Создаёт, перемещает и удаляет 3D-модели других пилотов по сетевому снимку.
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        const remoteShips = remoteShipsRef.current;
        const currentIds = new Set(players.filter((player) => player.username !== username).map((player) => player.id));
        for (const player of players) {
            if (player.username === username) continue;
            let remoteShip = remoteShips.get(player.id);
            if (!remoteShip) {
                remoteShip = new THREE.Mesh(
                    new THREE.ConeGeometry(0.7, 2.4, 4),
                    new THREE.MeshStandardMaterial({
                        color: '#ffc56b',
                        emissive: '#38230d',
                        metalness: 0.4,
                        roughness: 0.45
                    }),
                );
                remoteShip.rotation.x = Math.PI / 2;
                scene.add(remoteShip);
                remoteShips.set(player.id, remoteShip);
            }
            remoteShip.position.set(player.x, 0, player.z);
        }
        for (const [id, remoteShip] of remoteShips) {
            if (!currentIds.has(id)) {
                scene.remove(remoteShip);
                remoteShip.geometry.dispose();
                (remoteShip.material as THREE.Material).dispose();
                remoteShips.delete(id);
            }
        }
    }, [players, username]);

    return (
        <main className="space-screen">
            <div className="space-toolbar">
                <button className="glass-button" onClick={onReturn}><BackIcon size={17}/> В ангар</button>
                <div className="zone-title"><span
                    className="eyebrow">ТЕКУЩАЯ ЗОНА</span><strong>{zone === 'galaxy-map' ? 'Глобальная карта' : 'Локальный инстанс · Альфа'}</strong>
                </div>
                <div className="connection-state"><span
                    className={connected ? 'online-text' : ''}>{connected ? 'СИНХРОНИЗАЦИЯ' : 'НЕТ СВЯЗИ'}</span></div>
            </div>
            <div className="space-canvas" ref={canvasHost}/>
            <aside className="space-overlay"><p className="eyebrow">ПИЛОТ</p><strong>{username}</strong><p
                className="muted">{players.length} в зоне · WASD / стрелки для движения</p>{error &&
                <p className="error-message" role="alert">{error}</p>}
                <div className="zone-actions">
                    <button className={zone === 'galaxy-map' ? 'selected' : ''}
                            onClick={() => onZoneChange('galaxy-map')}><MapIcon size={15}/> Карта
                    </button>
                    <button className={zone === 'sector-alpha' ? 'selected' : ''}
                            onClick={() => onZoneChange('sector-alpha')}>Войти в сектор
                    </button>
                </div>
            </aside>
        </main>
    );
}
