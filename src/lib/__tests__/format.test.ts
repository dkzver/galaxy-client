// Форматирование чисел и подписи действий.
import {describe, expect, it} from 'vitest';
import {actionLabels, formatNumber, tabLabels} from '../format';

describe('formatNumber', () => {
    it('разделяет тысячи и дробную часть по-русски', () => {
        expect(formatNumber(1234.5)).toMatch(/^1\D234,5$/);
        expect(formatNumber('15000')).toMatch(/^15\D000$/);
        expect(formatNumber(0)).toBe('0');
    });

    it('пустое значение показывает прочерк', () => {
        expect(formatNumber(undefined)).toBe('—');
        expect(formatNumber('не число')).toBe('—');
        // Number(null) === 0: так же ведёт себя и прежний экран.
        expect(formatNumber(null)).toBe('0');
    });
});

describe('подписи', () => {
    it('вкладки и действия названы по-русски', () => {
        expect(tabLabels.all).toBe('ВСЁ');
        expect(tabLabels.equipment).toBe('ОБОРУДОВАНИЕ');
        expect(actionLabels.buy_ship).toBe('Купить корабль');
        expect(Object.keys(actionLabels)).toHaveLength(6);
    });
});
