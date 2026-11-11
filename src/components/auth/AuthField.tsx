// Поле формы: иконка, подпись и input — одна разметка на все три поля.
import type {ReactNode} from 'react';

type Props = {
    id: string;
    icon: ReactNode;
    label: string;
    value: string;
    onChange: (value: string) => void;
    name?: string;
    type?: string;
    placeholder?: string;
    autoComplete?: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
};

export default function AuthField({
    id,
    icon,
    label,
    value,
    onChange,
    name,
    type = 'text',
    placeholder,
    autoComplete,
    required,
    minLength,
    maxLength,
}: Props) {
    return (
        <div className="portal-auth-field">
            <span className="portal-field-icon" aria-hidden="true">{icon}</span>
            <div className="portal-input-wrap">
                <label htmlFor={id}>{label}</label>
                <input id={id} name={name} type={type} required={required}
                       minLength={minLength} maxLength={maxLength} autoComplete={autoComplete}
                       value={value}
                       onChange={(event) => onChange(event.target.value)}
                       placeholder={placeholder}/>
            </div>
        </div>
    );
}
