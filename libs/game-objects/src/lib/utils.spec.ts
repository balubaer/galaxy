import { isCharacterANumber, extractNumberString, createBracketAndCommarStringWithStringArray, extractCharsFromString } from "./utils";

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
});
