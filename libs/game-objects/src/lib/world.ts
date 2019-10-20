import { Port } from './port';

export class World {
    number: number;
    name: string;
    port: Port;

    setNumber(aNumber: number) {
        this.name = `W${this.number}`;
        this.number = aNumber;
    }
}
