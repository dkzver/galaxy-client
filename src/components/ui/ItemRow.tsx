// Строка списка: одна разметка для каталога и содержимого корабля.
import type {ReactNode} from 'react';
import {HangarIcon} from './HangarIcon';

type Props = {
    icon?: string | null;
    name: ReactNode;
    subtitle?: ReactNode;
    meta?: ReactNode;
    selected?: boolean;
    onClick: () => void;
};

export default function ItemRow({icon, name, subtitle, meta, selected = false, onClick}: Props) {
    return (
        <button className={`item-row${selected ? ' selected' : ''}`} type="button" onClick={onClick}>
            <span className="item-icon"><HangarIcon name={icon} size={22}/></span>
            <span className="item-copy">
                <strong>{name}</strong>
                <span>{subtitle}</span>
            </span>
            <span className="item-meta">{meta}</span>
        </button>
    );
}
