import { Fleet } from './fleet';
import { World } from './world';
import { Player } from './player';
import { capFleetMetal, loadedShips, overloadedShips } from './classic-trader';

/** Schiffe auf Flotten feuern je einen Schuss, überladene Schiffe eines Traders gar nicht. */
export function fleetShots(fleet: Fleet): number {
    return fleet.ships - overloadedShips(fleet);
}

/** I- und P-Schiffe feuern nur halb so stark: je zwei Schiffe ein Schuss (abgerundet). */
export function homeShipShots(ships: number): number {
    return Math.floor(ships / 2);
}

/**
 * Zerstört Schiffe einer Flotte: zwei Schuss je Schiff, beladene Schiffe fallen schon mit einem Schuss,
 * getroffen werden zuerst die unbeladenen, dann die mit einer Einheit Metall, zuletzt überladene (Trader, zwei Einheiten).
 * Gerundet wird je feuernder Flotte bzw. Gruppe (shotsPerShooter). Fliegt die Flotte weg, nimmt sie nur den
 * halben Schaden (abgerundet). Mit beladenen Schiffen geht ihr Metall verloren. Liefert die Zahl zerstörter Schiffe.
 */
export function destroyShips(fleet: Fleet, shotsPerShooter: Array<number>, moving: boolean): number {
    const overloaded = overloadedShips(fleet);
    let unloaded = fleet.ships - loadedShips(fleet);
    let loaded = loadedShips(fleet);
    let killedUnloaded = 0;
    let killedLoaded = 0;
    for (const shotsOfShooter of shotsPerShooter) {
        let shots = shotsOfShooter;
        const hitUnloaded = Math.min(unloaded, Math.floor(shots / 2));
        unloaded -= hitUnloaded;
        killedUnloaded += hitUnloaded;
        shots -= hitUnloaded * 2;
        const hitLoaded = Math.min(loaded, shots);
        loaded -= hitLoaded;
        killedLoaded += hitLoaded;
    }
    if (moving) {
        const total = Math.floor((killedUnloaded + killedLoaded) / 2);
        killedUnloaded = Math.min(killedUnloaded, total);
        killedLoaded = total - killedUnloaded;
    }
    const singleLoaded = loadedShips(fleet) - overloaded;
    const killedOverloaded = Math.max(0, killedLoaded - singleLoaded);
    fleet.ships -= killedUnloaded + killedLoaded;
    fleet.metal -= killedLoaded + killedOverloaded;
    capFleetMetal(fleet);
    return killedUnloaded + killedLoaded;
}

/** Hinterhalt: doppelter Schaden, jeder Schütze zerstört ein unbeladenes oder zwei beladene Schiffe. */
export function ambushDamage(fleet: Fleet, shooters: number): number {
    return destroyShips(fleet, [shooters * 2], false);
}

export function isAttackOf(world: World, attacker: Player, victim: Player): boolean {
    return world.attacks.some(a => a.attacker === attacker && a.victim === victim);
}

export function addAttack(world: World, attacker: Player, victim: Player | null) {
    if (victim !== null && victim !== attacker) {
        world.attacks.push({ attacker, victim });
    }
}

/**
 * Beschuss vom Orbit auf den Boden, je feuernder Flotte: I = I-Schiffe dann Industrie, P = P-Schiffe dann
 * Bevölkerung, H = I- und P-Schiffe; bleiben dabei mindestens zwei Schuss übrig, wird die Welt neutral.
 * Liefert eine Beschreibung für den Bericht und die Zahl getöteter Bevölkerung.
 */
export function applyGroundShots(world: World, shots: number, target: 'I' | 'P' | 'H'): { text: string; killed: number } {
    const hits = Math.floor(shots / 2);
    if (target === 'I') {
        const ships = Math.min(world.iShips, hits);
        const industry = Math.min(world.industry, hits - ships);
        world.iShips -= ships;
        world.industry -= industry;
        return { text: `${ships} I-Schiffe und ${industry} Industrie zerstört`, killed: 0 };
    }
    if (target === 'P') {
        const ships = Math.min(world.pShips, hits);
        const people = Math.min(world.population, hits - ships);
        world.pShips -= ships;
        world.population -= people;
        return { text: `${ships} P-Schiffe zerstört und ${people} Bevölkerung getötet`, killed: people };
    }
    const needed = (world.iShips + world.pShips) * 2;
    const iShips = Math.min(world.iShips, hits);
    const pShips = Math.min(world.pShips, hits - iShips);
    world.iShips -= iShips;
    world.pShips -= pShips;
    let text = `${iShips} I-Schiffe und ${pShips} P-Schiffe zerstört`;
    if (shots >= needed + 2 && world.player !== null) {
        text += `, Welt neutralisiert, vorher ${world.player.stringName()}`;
        world.player = null;
    }
    return { text, killed: 0 };
}

/** Planet Buster Bomb: alles Leben und alle Wirtschaft der Welt auf 0, Flotten im Orbit bleiben. */
export function dropPbb(world: World) {
    world.population = 0;
    world.populationLimit = 0;
    world.mines = 0;
    world.metal = 0;
    world.industry = 0;
    world.iShips = 0;
    world.pShips = 0;
}

/** Setzt den Kampfzustand der Runde zurück. */
export function resetCombatTurn(world: World) {
    world.iShipsFired = false;
    world.pShipsFired = false;
    world.groundShots = [];
    world.attacks = [];
    world.pbbDrops = [];
    for (const fleet of world.fleets) {
        fleet.incomingShots = [];
        fleet.conditionalFire = false;
        fleet.buildPbbBy = null;
    }
}
