// Р—РЅР°С‡РєРё РіСЂСѓР·Р° РЅР° РїР»РёС‚РєРµ: РґРѕ С‚СЂС‘С… С€С‚СѓРє, СЃ РїРѕРґСЃРєР°Р·РєРѕР№ Рё РїРµСЂРµС…РѕРґРѕРј Рє РїСЂРѕРґР°Р¶Рµ.
import type {HangarCargoLine} from '../../../types';
import type {OwnedCargoSelection} from '../../../lib/ship';
import type {TipContent} from '../../../lib/tips';
import {formatNumber} from '../../../lib/format';
import {HangarIcon} from '../../ui/HangarIcon';

type Props = {
    lines: HangarCargoLine[];
    selected?: OwnedCargoSelection | null;
    tipFor: (line: HangarCargoLine) => TipContent | null;
    tileTip: (tile: HTMLElement) => void;
    onCargoClick: (line: HangarCargoLine) => void;
    onShowTip: (target: HTMLElement, content: TipContent) => void;
    onHideTip: () => void;
};

export default function CargoChips({lines, selected, tipFor, tileTip, onCargoClick, onShowTip, onHideTip}: Props) {
    if (lines.length === 0) return null;

    return (
        <span className="slot-cargo-chips">
            {lines.slice(0, 3).map((line) => {
                const isSelected = Boolean(selected
                    && selected.resourceId === line.resource_id);
                return (
                    <span key={line.resource_id}
                          className={`slot-cargo-chip${isSelected ? ' selected' : ''}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`${line.name}, ${formatNumber(line.amount_kg)} РєРі`}
                          onMouseEnter={(event) => {
                              const content = tipFor(line);
                              if (content) onShowTip(event.currentTarget, content);
                          }}
                          onMouseLeave={(event) => {
                              const tile = event.currentTarget.closest('.slot-tile');
                              if (tile) tileTip(tile as HTMLElement);
                              else onHideTip();
                          }}
                          onFocus={(event) => {
                              const content = tipFor(line);
                              if (content) onShowTip(event.currentTarget, content);
                          }}
                          onBlur={onHideTip}
                          onClick={(event) => {
                              event.stopPropagation();
                              onCargoClick(line);
                          }}
                          onKeyDown={(event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') return;
                              event.preventDefault();
                              event.stopPropagation();
                              onCargoClick(line);
                          }}>
                        <HangarIcon name={line.icon} size={11}/>
                    </span>
                );
            })}
        </span>
    );
}
