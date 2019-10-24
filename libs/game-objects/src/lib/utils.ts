export function createBracketAndCommarStringWithStringArray(aStringArray:Array <string>): string {
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
