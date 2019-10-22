export class Port {
    worldNumbers: number[];
    private worldNumber: number;

    description: string;

    constructor(worldNumbers: number[], worldNumber: number) {
        this.worldNumbers = worldNumbers;
        this.worldNumber = worldNumber;
        this.description = this.makeDiscription(this.worldNumbers, this.worldNumber);
    }

    makeDiscription(worldNumbers: number[], worldNumber: number): string {
        let result: string;
        const connectionCount = worldNumbers.length;

        result = `W${worldNumber}`;

        if (connectionCount > 0) {
            result += '(';
            for (const aWorldNumber of worldNumbers){
                result += `${aWorldNumber},`;
            }
            result = result.substring(0, result.length - 1);
            result += ')';
        }
        return result;
    }

    hasConnectionToWorld(worldNumber: number): boolean {
        return (this.worldNumbers.indexOf(worldNumber) > -1);
    }

}
