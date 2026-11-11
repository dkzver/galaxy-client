// Портал подсказки: рисуется поверх экрана и не обрезается панелями ангара.
import type {RefObject} from 'react';
import {createPortal} from 'react-dom';
import type {TipContent} from '../../lib/tips';
import {HangarIcon} from './HangarIcon';

type Props = {
    content: TipContent | null;
    placed: boolean;
    boxRef: RefObject<HTMLDivElement>;
};

export default function TooltipLayer({content, placed, boxRef}: Props) {
    if (!content) return null;
    return createPortal(
        <div className="hangar-slot-tooltip" role="tooltip" ref={boxRef}
             style={{left: 0, top: 0, visibility: placed ? 'visible' : 'hidden'}}>
            <h4>{content.title}</h4>
            {content.rows.length > 0 && (
                <div className="tip-list">
                    {content.rows.map((row, rowIndex) => (
                        <div className="tip-item" key={rowIndex}>
                            {row.icon && <span className="tip-icon"><HangarIcon name={row.icon} size={16}/></span>}
                            <span className="tip-copy">
                                <strong>{row.name}</strong>
                                {row.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            {content.note && <small>{content.note}</small>}
        </div>,
        document.body,
    );
}
