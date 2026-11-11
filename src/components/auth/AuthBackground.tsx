// Декоративный фон портала: туманность, три слоя звёзд и астероиды.
export default function AuthBackground() {
    return (
        <>
            <div className="portal-nebula" aria-hidden="true"/>
            <div className="portal-stars portal-stars--fine" aria-hidden="true"/>
            <div className="portal-stars portal-stars--bright" aria-hidden="true"/>
            <div className="portal-stars portal-stars--diamond" aria-hidden="true"/>
            <div className="portal-asteroids" aria-hidden="true">
                <i className="portal-asteroid portal-asteroid--one"/>
                <i className="portal-asteroid portal-asteroid--two"/>
                <i className="portal-asteroid portal-asteroid--three"/>
                <i className="portal-asteroid portal-asteroid--four"/>
                <i className="portal-asteroid portal-asteroid--five"/>
            </div>
        </>
    );
}
