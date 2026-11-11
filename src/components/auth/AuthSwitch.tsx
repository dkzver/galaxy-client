// Переключение вход ↔ регистрация.
type Props = {
    hint: string;
    action: string;
    disabled: boolean;
    onClick: () => void;
};

export default function AuthSwitch({hint, action, disabled, onClick}: Props) {
    return (
        <div className="portal-auth-switch">
            <span>{hint}</span>
            <button type="button" disabled={disabled} onClick={onClick}>
                {action}
            </button>
        </div>
    );
}
