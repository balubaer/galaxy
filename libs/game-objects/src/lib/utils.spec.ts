import { isCharacterANumber, extractNumberString, createBracketAndCommarStringWithStringArray, extractCharsFromString, mapToObj, objToMap } from './utils';
import { writeFileSync } from 'fs';

describe('utils', () => {
    it('test createBracketAndCommarStringWithStringArray', () => {
        const testString: string = createBracketAndCommarStringWithStringArray(['A', 'B', 'C']);
        expect(testString).toBe('(A, B, C)');
    });
    it('test isCharacterANumber', () => {
        expect(isCharacterANumber('A')).toBeFalsy();
        expect(isCharacterANumber('b')).toBeFalsy();
        expect(isCharacterANumber('z')).toBeFalsy();
        expect(isCharacterANumber('0')).toBeTruthy();
        expect(isCharacterANumber('1')).toBeTruthy();
        expect(isCharacterANumber('2')).toBeTruthy();
        expect(isCharacterANumber('3')).toBeTruthy();
        expect(isCharacterANumber('4')).toBeTruthy();
        expect(isCharacterANumber('5')).toBeTruthy();
        expect(isCharacterANumber('6')).toBeTruthy();
        expect(isCharacterANumber('7')).toBeTruthy();
        expect(isCharacterANumber('8')).toBeTruthy();
        expect(isCharacterANumber('9')).toBeTruthy();
    });
    it('test extractNumberString', () => {
       
        expect(extractNumberString('Zb3')).toBe('3');
        expect(extractNumberString('F23W66')).toBe('2366');
    });

    it('test extractCharsFromString', () => {
        expect(extractCharsFromString('Zb3')).toBe('Zb');
        expect(extractCharsFromString('F23W66')).toBe('FW');
    });

    it('test mapToObj', () => {
        const colorMap = new Map();
        colorMap.set('#277553', 'rgba( 39,117, 83,1)');
        colorMap.set('#23D186', 'rgba( 35,209,134,1)');
        colorMap.set('#289E6B', 'rgba( 40,158,107,1)');
        colorMap.set('#1F4B38', 'rgba( 31, 75, 56,1)');
        colorMap.set('#11221B', 'rgba( 17, 34, 27,1)');
        const obj = mapToObj(colorMap);
        
        const gameprefdata = JSON.stringify(obj);
        writeFileSync('color.json', gameprefdata);
        expect(obj['#277553']).toBe('rgba( 39,117, 83,1)');
    });

    it('test objToMap', () => {
        const ob = {
            "#277553": "rgba( 39,117, 83,1)",
            "#23D186": "rgba( 35,209,134,1)",
            "#289E6B": "rgba( 40,158,107,1)",
            "#1F4B38": "rgba( 31, 75, 56,1)",
            "#11221B": "rgba( 17, 34, 27,1)"
        }
        const colorMap = objToMap(ob);
        expect(colorMap.get('#277553')).toBe('rgba( 39,117, 83,1)');
    });
});
