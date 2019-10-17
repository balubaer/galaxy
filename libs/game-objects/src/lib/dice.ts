export class Dice {
    sides: number;
    roll(): number {
        return Math.floor(Math.random() * this.sides) + 1;;
    }
}
