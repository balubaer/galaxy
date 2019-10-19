export class Dice {
    private sides: number;

    constructor(diceSides: number) {
        this.sides = diceSides;
    }

    roll(): number {
        return Math.floor(Math.random() * this.sides) + 1;;
    }
}
