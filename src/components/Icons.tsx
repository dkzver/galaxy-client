// SVG-иконки интерфейса, повторяющие оригинальные контуры из проекта Galaxy.
import type {SVGProps} from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number;
}

// Общая SVG-оболочка использует тот же размер сетки и стиль обводки, что референс.
function Icon({size = 18, children, ...props}: IconProps) {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            height={size}
            viewBox="0 0 24 24"
            width={size}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            {...props}
        >
            {children}
        </svg>
    );
}

// Иконка email из auth/index.html в референсном проекте.
export function EmailIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </Icon>
    );
}

// Иконка пароля из auth/index.html в референсном проекте.
export function PasswordIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </Icon>
    );
}

// Иконка подтверждения пароля из HTML страницы входа.
export function PasswordConfirmIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
        </Icon>
    );
}

// Иконка авторизации из SVG, формируемого auth.js референсной страницы.
export function LoginIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
        </Icon>
    );
}

// Иконка регистрации пилота из SVG, формируемого auth.js референсной страницы.
export function RegisterIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
        </Icon>
    );
}

// Иконка корпуса корабля из общего SVG-каталога Galaxy.
export function HullIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z"/>
        </Icon>
    );
}

// Иконка двигателя из общего SVG-каталога Galaxy.
export function EngineIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
        </Icon>
    );
}

// Радиолокационная иконка из общего SVG-каталога Galaxy.
export function TargetIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="9"/>
            <circle cx="12" cy="12" r="4"/>
            <path d="m12 12 6-6"/>
        </Icon>
    );
}

// Иконка карты из HTML ангара Galaxy.
export function MapIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/>
            <path d="M9 3v15M15 6v15"/>
        </Icon>
    );
}

// Контур корабля из общего SVG-каталога Galaxy.
export function ShipIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="m12 3 5 7-1 8-4-2-4 2-1-8 5-7Z"/>
            <path d="M10 12h4M12 3v7"/>
        </Icon>
    );
}

// Иконка вылета из HTML ангара Galaxy.
export function LaunchIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M5 19c2.5-.2 4.5-1.2 5.8-3"/>
            <path d="M9 15 6 12c2.8-5.3 7-8 13-9-.8 6-3.5 10.2-9 13l-1-1"/>
            <circle cx="15" cy="8" r="1.5"/>
        </Icon>
    );
}

// Стрелка возврата из набора вспомогательных SVG-иконок ангара.
export function BackIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M19 12H5m5-5-5 5 5 5"/>
        </Icon>
    );
}
