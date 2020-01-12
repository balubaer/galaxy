export function createBracketAndCommarStringWithStringArray(aStringArray: Array<string>): string {
    let result = '(';
    let counter = 0;
    const maxCounter = aStringArray.length - 1;

    for (const string of aStringArray) {
        result += string
        if (counter < maxCounter) {
            result += ', '
        }
        counter++
    }
    result += ')';

    return result
}

export const TESTRESOUCESPATH = 'testResources';

export function isCharacterANumber(aCharacter: string): Boolean {

    return (aCharacter >= '0' && aCharacter <= '9');
}

export function extractNumberString(aString: string): string {
    let result = '';
    const aStringObject: String = String(aString);

    for (const aCharacter of aStringObject) {
        if (isCharacterANumber(aCharacter)) {
            result += aCharacter;
        }
    }
    return result;
}

export function extractCharsFromString(aString: string): string {
    let result = '';
    for (const aCharacter of aString) {
        if (isCharacterANumber(aCharacter) === false) {
            result += aCharacter;
        }
    }
    return result;
}

export function mapToObj(inputMap) {
    const obj: any = {};
    inputMap.forEach(function (value, key) {
        obj[key] = value;
    });

    return obj;
}

export function objToMap(obj) {
    const mp = new Map();
    Object.keys(obj).forEach(k => { mp.set(k, obj[k]) });
    return mp;
}
