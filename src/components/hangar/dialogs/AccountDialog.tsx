// Меню аккаунта: выход и безвозвратное удаление пилота.
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
            <span className="eyebrow">УПРАВЛЕНИЕ АККАУНТОМ</span>
            <h2 id="hangar-account-title">Выйти из аккаунта?</h2>
            <p>Вы вернётесь на экран входа.</p>
            <div className="hangar-account-actions">
                <button className="trade-button ghost" type="button" disabled={deleting}
                        onClick={onClose}>Остаться</button>
                <button className="trade-button buy" type="button" disabled={deleting}
                        onClick={onLogout}>Выйти</button>
            </div>
            <div className="hangar-account-delete">
                <p>Удаление аккаунта безвозвратно удалит корабль и данные пилота.</p>
                {deleteError && <p className="error-message" role="alert">{deleteError}</p>}
                <button className="trade-button sell" type="button" disabled={deleting}
                        onClick={onDelete}>
                    {deleting ? 'УДАЛЕНИЕ АККАУНТА…' : 'УДАЛИТЬ АККАУНТ'}
                </button>
            </div>
        </Modal>
    );
}
