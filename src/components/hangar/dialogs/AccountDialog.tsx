// РњРµРЅСЋ Р°РєРєР°СѓРЅС‚Р°: РІС‹С…РѕРґ Рё Р±РµР·РІРѕР·РІСЂР°С‚РЅРѕРµ СѓРґР°Р»РµРЅРёРµ РїРёР»РѕС‚Р°.
import Modal from '../../ui/Modal';

type Props = {
    open: boolean;
    deleting: boolean;
    deleteError: string;
    onClose: () => void;
    onLogout: () => void;
    onDelete: () => void;
};

export default function AccountDialog({open, deleting, deleteError, onClose, onLogout, onDelete}: Props) {
    return (
        <Modal open={open} onClose={onClose}
               backdropClassName="hangar-account-backdrop"
               dialogClassName="hangar-account-dialog"
               labelledBy="hangar-account-title"
               closeOnBackdrop={!deleting}>
            <span className="eyebrow">РЈРџР РђР’Р›Р•РќРР• РђРљРљРђРЈРќРўРћРњ</span>
            <h2 id="hangar-account-title">Р’С‹Р№С‚Рё РёР· Р°РєРєР°СѓРЅС‚Р°?</h2>
            <p>Р’С‹ РІРµСЂРЅС‘С‚РµСЃСЊ РЅР° СЌРєСЂР°РЅ РІС…РѕРґР°.</p>
            <div className="hangar-account-actions">
                <button className="trade-button ghost" type="button" disabled={deleting}
                        onClick={onClose}>РћСЃС‚Р°С‚СЊСЃСЏ</button>
                <button className="trade-button buy" type="button" disabled={deleting}
                        onClick={onLogout}>Р’С‹Р№С‚Рё</button>
            </div>
            <div className="hangar-account-delete">
                <p>РЈРґР°Р»РµРЅРёРµ Р°РєРєР°СѓРЅС‚Р° Р±РµР·РІРѕР·РІСЂР°С‚РЅРѕ СѓРґР°Р»РёС‚ РєРѕСЂР°Р±Р»СЊ Рё РґР°РЅРЅС‹Рµ РїРёР»РѕС‚Р°.</p>
                {deleteError && <p className="error-message" role="alert">{deleteError}</p>}
                <button className="trade-button sell" type="button" disabled={deleting}
                        onClick={onDelete}>
                    {deleting ? 'РЈР”РђР›Р•РќРР• РђРљРљРђРЈРќРўРђвЂ¦' : 'РЈР”РђР›РРўР¬ РђРљРљРђРЈРќРў'}
                </button>
            </div>
        </Modal>
    );
}
