import { World } from './world';
import {
    CLASSIC_BLACK_HOLE_RATIO, CLASSIC_HOME_METAL, CLASSIC_HOME_MINES, CLASSIC_HOME_POPULATION, CLASSIC_HOME_POPULATION_LIMIT,
    CLASSIC_INDUSTRY_WORLD_RATIO, CLASSIC_MAX_EXTRA_POPULATION_LIMIT, CLASSIC_MAX_MINES, CLASSIC_MAX_POPULATION,
    CLASSIC_MAX_START_METAL, CLASSIC_MIN_MINES, CLASSIC_MIN_POPULATION, CLASSIC_START_INDUSTRY
} from './classic-game-rules';

/**
 * Belegt die bereits verbundenen Welten (mit Heimatwelten und Flotten) mit den Werten des Classic Games:
 * Wirtschaft der Heimatwelten und der übrigen Welten sowie Schwarze Löcher.
 */
export class ClassicWorldFactory {
    constructor(private random: () => number = Math.random) { }

    private randomInt(min: number, max: number): number {
        return min + Math.floor(this.random() * (max - min + 1));
    }

    initWorlds(worlds: Array<World>) {
        const homeWorlds = worlds.filter(world => world.player !== null);
        for (const world of worlds) {
            if (world.player !== null) {
                this.initHomeWorld(world);
            } else {
                this.initOtherWorld(world);
            }
        }
        this.placeBlackHoles(worlds, homeWorlds);
        this.moveFleetsOffBlackHoles(worlds);
    }

    /** Die Flottenschlüssel liegen zu Spielbeginn nie in einem Schwarzen Loch. */
    moveFleetsOffBlackHoles(worlds: Array<World>) {
        const safeWorlds = worlds.filter(world => !world.blackHole && world.player === null);
        if (safeWorlds.length === 0) {
            return;
        }
        for (const world of worlds.filter(w => w.blackHole)) {
            for (const fleet of world.fleets.splice(0)) {
                safeWorlds[this.randomInt(0, safeWorlds.length - 1)].fleets.push(fleet);
            }
        }
    }

    initHomeWorld(world: World) {
        world.player.characterType = 'emperor';
        world.industry = CLASSIC_START_INDUSTRY;
        world.metal = CLASSIC_HOME_METAL;
        world.mines = CLASSIC_HOME_MINES;
        world.population = CLASSIC_HOME_POPULATION;
        world.populationLimit = CLASSIC_HOME_POPULATION_LIMIT;
        world.iShips = 1;
        world.pShips = 1;
        world.turnsOwned = 1;
    }

    initOtherWorld(world: World) {
        world.population = this.randomInt(CLASSIC_MIN_POPULATION, CLASSIC_MAX_POPULATION);
        world.populationLimit = world.population + this.randomInt(0, CLASSIC_MAX_EXTRA_POPULATION_LIMIT);
        world.mines = this.randomInt(CLASSIC_MIN_MINES, CLASSIC_MAX_MINES);
        world.metal = this.randomInt(0, CLASSIC_MAX_START_METAL);
        if (this.random() < CLASSIC_INDUSTRY_WORLD_RATIO) {
            world.industry = this.randomInt(1, 2);
        }
    }

    /**
     * Setzt Schwarze Löcher, nie auf Heimatwelten oder direkt daneben und nie so, dass Welten
     * vom Rest der Galaxie abgeschnitten werden.
     */
    placeBlackHoles(worlds: Array<World>, homeWorlds: Array<World>) {
        const target = Math.round(worlds.length * CLASSIC_BLACK_HOLE_RATIO);
        const forbidden = new Set<World>(homeWorlds);
        for (const home of homeWorlds) {
            for (const neighbor of home.port.worlds) {
                forbidden.add(neighbor);
            }
        }
        const candidates = worlds.filter(world => !forbidden.has(world));
        let placed = 0;
        while (placed < target && candidates.length > 0) {
            const world = candidates.splice(this.randomInt(0, candidates.length - 1), 1)[0];
            world.blackHole = true;
            if (this.isConnectedWithoutBlackHoles(worlds)) {
                this.clearEconomy(world);
                placed++;
            } else {
                world.blackHole = false;
            }
        }
    }

    private clearEconomy(world: World) {
        world.population = 0;
        world.populationLimit = 0;
        world.industry = 0;
        world.metal = 0;
        world.mines = 0;
    }

    isConnectedWithoutBlackHoles(worlds: Array<World>): boolean {
        const open = worlds.filter(world => !world.blackHole);
        if (open.length === 0) {
            return true;
        }
        const seen = new Set<World>([open[0]]);
        const queue = [open[0]];
        while (queue.length > 0) {
            const current = queue.pop();
            for (const neighbor of current.port.worlds) {
                if (!neighbor.blackHole && !seen.has(neighbor)) {
                    seen.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return seen.size === open.length;
    }
}
