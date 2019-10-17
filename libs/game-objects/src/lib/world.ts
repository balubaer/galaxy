export class World {
    number: Number = 0
    name: String = `W${this.number}`;

    setNumber(aNumber:Number) {
        this.name = `W${this.number}`;
        this.number = aNumber;
    }
}
