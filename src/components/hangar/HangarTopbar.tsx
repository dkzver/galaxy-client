// Шапка ангара: база, статус терминала, баланс и вход в меню аккаунта.
import {formatNumber} from '../../lib/format';
import {HangarIcon} from '../ui/HangarIcon';

type Props = {
    credits: string | number | undefined;
    email: string;
    onLaunch: () => void;
    onAccount: () => void;
};

export default function HangarTopbar({credits, email, onLaunch, onAccount}: Props) {
    return (
        <header className="topbar">
            <div className="brand">
                <span className="brand-mark"><HangarIcon name="radar" size={23}/></span>
                <div>
                    <strong id="baseName">ЗВЁЗДНАЯ БАЗА</strong>
                    <span id="baseLocation">БАЗА НЕ ВЫБРАНА</span>
                </div>
                <button className="map-link takeoff-link" type="button" onClick={onLaunch}
                        aria-label="Выйти в космос" title="Перейти к карте">
                    <HangarIcon name="launch" size={13}/>
                    <span className="map-link-label">ВЫЙТИ В КОСМОС <kbd>[Esc]</kbd></span>
                </button>
            </div>
            <div className="station-status">
                <span className="pulse"/>
                <span id="noticeShop">ТОРГОВЫЙ ТЕРМИНАЛ ПОДКЛЮЧЁН</span>
            </div>
            <div className="hangar-header-actions">
                <div className="balance" data-action="add-credits" title="Начислить 1 000 ¤"
                     role="button" tabIndex={0}>
                    <span><HangarIcon name="credits" size={17}/></span>
                    <div>
                        <small>Баланс</small>
                        <strong id="creditsValue">{formatNumber(credits)} <i>¤</i></strong>
                    </div>
                </div>
                <button className="map-link hangar-account-link" type="button"
                        onClick={onAccount} aria-label="Меню аккаунта"
                        title={`Аккаунт: ${email}`}>
                    <HangarIcon name="account" size={15}/><span className="map-link-label">АККАУНТ</span>
                </button>
            </div>
        </header>
    );
}
