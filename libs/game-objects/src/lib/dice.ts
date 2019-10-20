export class Dice {
    private sides: number;

    constructor() {
        this.sides = 0;
    }
  
    setSites(sides: number) {
        this.sides = sides;
    }

    roll(): number {
        return Math.floor(Math.random() * this.sides) + 1;;
    }
}
