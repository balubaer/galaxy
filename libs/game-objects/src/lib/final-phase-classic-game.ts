import { FinalPhaseCoreGame } from './final-phase-core-game';
import { World } from './world';
import { Player } from './player';
import { classicLog } from './classic-log';
import { Fleet } from './fleet';
import { ambushDamage, applyGroundShots, destroyShips, dropPbb, resetCombatTurn } from './classic-combat';
import { PBB_MIN_SHIPS, PBB_SHIP_COST } from './classic-combat-commands';
import { CLASSIC_PLUNDER_RECOVERY, CLASSIC_POPULATION_GROWTH, CLASSIC_TURNS_OWNED_CYCLE, resetEconomyTurn } from './classic-economy';
import { PENALTY_PER_PBB, PENALTY_PER_PLUNDER, PENALTY_PER_POPULATION_KILLED, addPenalty, turnPoints } from './classic-scoring';

/**
 * Rundenende des Classic Games: Kampf, Flüge und Besitzwechsel wie im Core Game, danach die Wirtschaft
 * (Besitzdauer, Minen, Bevölkerung), Plünderungen und die Punkte je Charakter (bisher Emperor) samt Strafen.
 */
export class FinalPhaseClassicGame extends FinalPhaseCoreGame {
    private ownerAtStart: Map<World, Player> = new Map();

    constructor(worlds: Array<World>, allPlayerDict: Map<string, Player>, private random: () => number = Math.random) {
        super(worlds, allPlayerDict);
    }

    /**
     * Kampfergebnisse: Schüsse auf Flotten (beladene Schiffe fallen schneller, fliegende nehmen halben Schaden),
     * Beschuss des Bodens und abgeworfene PBBs (nur wenn die Flotte den Kampf überlebt).
     */
    override checkFireResults(world: World) {
        for (const fleet of world.fleets) {
            if (fleet.incomingShots.length > 0) {
                const lost = destroyShips(fleet, fleet.incomingShots, fleet.fleetMovements.length > 0);
                if (lost > 0) {
                    world.addEvent(`${fleet.name()} verliert ${lost} Schiffe`);
                }
            }
        }
        for (const attack of world.groundShots) {
            const owner = world.player;
            const result = applyGroundShots(world, attack.shots, attack.target);
            world.addReportPlayer(owner);
            world.addEvent(`Beschuss durch ${attack.player.stringName()}: ${result.text}`);
            this.penalize(attack.player, result.killed * PENALTY_PER_POPULATION_KILLED, `${result.killed} Bevölkerung auf ${world.name} getötet`);
        }
        for (const fleet of world.pbbDrops) {
            if (fleet.ships > 0 && fleet.pbb) {
                const killed = world.population;
                dropPbb(world);
                this.penalize(fleet.player, PENALTY_PER_PBB + killed * PENALTY_PER_POPULATION_KILLED,
                    `PBB auf ${world.name}, ${killed} Bevölkerung getötet`);
                world.addEvent(`PBB von ${fleet.name()} zerstört alles Leben auf ${world.name}`);
            }
            fleet.pbb = false;
        }
        for (const fleet of world.fleets) {
            if (fleet.ships === 0 && fleet.pbb) {
                // Eine zerstörte Flotte verliert ihre PBB.
                fleet.pbb = false;
            }
        }
    }

    /** Hinterhalt durch I- und P-Schiffe, die in dieser Runde nicht gefeuert haben (volle Stärke). */
    override getFirePowerForAmbushworld(world: World): number {
        const shooters = (world.iShipsFired ? 0 : world.iShips) + (world.pShipsFired ? 0 : world.pShips);
        if (shooters > 0) {
            world.dShipsAmbush = true;
        }
        return shooters;
    }

    override applyAmbushDamage(fleet: Fleet, shooters: number) {
        ambushDamage(fleet, shooters);
        if (fleet.ships === 0) {
            fleet.pbb = false;
        }
    }

    /** Schwarzes Loch: Schiffe und Metall sind verloren, der leere Schlüssel taucht auf einer zufälligen Welt auf. */
    override afterFleetArrived(fleet: Fleet, world: World): boolean {
        if (world.blackHole === false) {
            return false;
        }
        world.addReportPlayer(fleet.player);
        world.addEvent(`${fleet.name()} ist im Schwarzen Loch verschwunden (${fleet.ships} Schiffe)`);
        fleet.ships = 0;
        fleet.metal = 0;
        fleet.pbb = false;
        const safeWorlds = this.worlds.filter(w => w.blackHole === false);
        if (safeWorlds.length > 0) {
            world.fleets.splice(world.fleets.indexOf(fleet), 1);
            safeWorlds[Math.floor(this.random() * safeWorlds.length)].fleets.push(fleet);
        }
        return true;
    }

    /** Wechselt eine Flotte den Besitzer, verschwindet ihre PBB. */
    override changeFleetOwner(world: World, fleet: Fleet, player: Player) {
        if (fleet.player !== player) {
            fleet.pbb = false;
        }
        super.changeFleetOwner(world, fleet, player);
    }

    /** PBB-Bau am Rundenende, wenn die Flotte noch dem Besteller gehört und genug Schiffe hat. */
    buildPbbs() {
        for (const world of this.worlds) {
            for (const fleet of world.fleets) {
                if (fleet.buildPbbBy !== null && fleet.player === fleet.buildPbbBy && fleet.ships >= PBB_MIN_SHIPS) {
                    fleet.ships -= PBB_SHIP_COST;
                    fleet.metal = Math.min(fleet.metal, fleet.ships);
                    fleet.pbb = true;
                    world.addEvent(`${fleet.name()} hat eine PBB gebaut`);
                }
            }
        }
    }

    // Punkte gibt es im Classic Game je nach Charakter, nicht pauschal je Welt.
    override calculatePoints(world: World) {
        return;
    }

    private penalize(player: Player | null, points: number, reason: string) {
        if (player !== null && points > 0) {
            addPenalty(player, points);
            classicLog(`${player.playerName}: -${points} Punkte (${reason})`);
        }
    }

    /** Plünderung gilt, wenn die Welt dem Spieler zu Beginn und am Ende der Runde gehört. */
    applyPlunder(world: World) {
        const plunderer = world.plunderBy;
        world.plunderBy = null;
        if (plunderer === null || world.player !== plunderer || this.ownerAtStart.get(world) !== plunderer) {
            return;
        }
        world.plunderCount += 1;
        world.plunderRecovery = CLASSIC_PLUNDER_RECOVERY;
        world.addEvent(`${world.name} geplündert von ${plunderer.stringName()}`);
        this.penalize(plunderer, PENALTY_PER_PLUNDER, `${world.name} geplündert`);
    }

    /** Punkte der Runde je Spieler aus dem Stand am Rundenende. */
    awardPoints() {
        for (const player of this.allPlayerDict.values()) {
            const points = turnPoints(player, this.worlds);
            player.points = (player.points ?? 0) + points;
            classicLog(`${player.playerName}: +${points} Punkte, jetzt ${player.points}`);
        }
    }

    override doFinal() {
        for (const world of this.worlds) {
            this.ownerAtStart.set(world, world.player);
        }
        super.doFinal();
        this.buildPbbs();
        this.completeGifts();
        for (const world of this.worlds) {
            this.endEconomy(world);
            this.applyPlunder(world);
            resetCombatTurn(world);
        }
        this.awardPoints();
        for (const player of this.allPlayerDict.values()) {
            player.giftsThisTurn = 0;
        }
    }

    /** Geschenke gelten erst am Rundenende und nur, wenn der Geber die Welt bzw. Flotte noch hat. */
    completeGifts() {
        for (const world of this.worlds) {
            if (world.giftTo !== null) {
                if (world.player !== null && world.player === this.ownerAtStart.get(world)) {
                    world.addReportPlayer(world.player);
                    world.addEvent(`Welt geschenkt an ${world.giftTo.stringName()}, vorher ${world.player.stringName()}`);
                    world.player = world.giftTo;
                }
                world.giftTo = null;
            }
            for (const fleet of world.fleets) {
                if (fleet.giftTo !== null) {
                    if (fleet.player === fleet.giftFrom) {
                        this.changeFleetOwner(world, fleet, fleet.giftTo);
                    }
                    fleet.giftTo = null;
                    fleet.giftFrom = null;
                }
            }
        }
    }

    private isAllyOf(player: Player, other: Player): boolean {
        return Array.from(player.allies).some(ally => ally.playerName === other.playerName);
    }

    /**
     * Spieler mit Schiffen auf der Welt, die nicht At Peace sind. Die I- und P-Schiffe zählen
     * als Schiffe des Welteigners.
     */
    activePlayers(world: World): Array<Player> {
        const result = new Array<Player>();
        const add = (player: Player) => {
            if (player !== null && result.some(p => p.playerName === player.playerName) === false) {
                result.push(player);
            }
        };
        for (const fleet of world.fleets) {
            if (fleet.ships > 0 && fleet.atPeace === false) {
                add(fleet.player);
            }
        }
        if (world.iShips + world.pShips > 0) {
            add(world.player);
        }
        return result;
    }

    /**
     * Besitzregeln des Handbuchs: Wer als Einziger Schiffe (nicht At Peace) auf der Welt hat, erobert sie
     * und die leeren Flottenschlüssel, außer von Verbündeten. Bei mehreren Spielern bleibt die Welt wie sie ist
     * und leere Schlüssel werden herrenlos. Welten ohne Bevölkerung kann niemand besitzen.
     */
    override checkOwnership(world: World) {
        const active = this.activePlayers(world);

        if (active.length === 1 && world.population > 0 && world.blackHole === false) {
            const newOwner = active[0];
            const oldOwner = world.player;
            if (oldOwner === null) {
                world.player = newOwner;
                world.addEvent(`Welt erobert von ${newOwner.stringName()}`);
            } else if (oldOwner.playerName !== newOwner.playerName && this.isAllyOf(newOwner, oldOwner) === false) {
                world.player = newOwner;
                world.addReportPlayer(oldOwner);
                world.addEvent(`Welt erobert von ${newOwner.stringName()}, vorher ${oldOwner.stringName()}`);
            }
        }
        if (world.player !== null && world.population === 0 && world.blackHole === false) {
            world.addReportPlayer(world.player);
            world.addEvent(`Welt ohne Bevölkerung ist herrenlos, vorher ${world.player.stringName()}`);
            world.player = null;
        }

        for (const fleet of world.fleets) {
            if (fleet.ships > 0 || active.length === 0) {
                continue;
            }
            if (active.length > 1) {
                this.changeFleetOwner(world, fleet, null);
            } else if (fleet.player === null || fleet.player.playerName !== active[0].playerName) {
                const ally = fleet.player !== null && this.isAllyOf(active[0], fleet.player);
                this.changeFleetOwner(world, fleet, ally ? null : active[0]);
            }
        }
    }

    endEconomy(world: World) {
        if (world.plunderRecovery > 0) {
            // Geplünderte Welt: keine Förderung, kein Wachstum, Besitzdauer steht (außer bei Besitzwechsel).
            if (this.ownerAtStart.get(world) !== world.player) {
                this.updateTurnsOwned(world);
            }
            world.plunderRecovery -= 1;
            if (world.population > world.populationLimit) {
                world.population = world.populationLimit;
            }
            resetEconomyTurn(world);
            return;
        }
        this.updateTurnsOwned(world);
        if (world.player !== null && world.blackHole === false) {
            const metalBefore = world.metal;
            this.produceMetal(world);
            this.growPopulation(world);
            classicLog(`${world.name} [${world.player.playerName}] Rundenende: Metall ${metalBefore} -> ${world.metal}, `
                + `Bevölkerung ${world.population}/${world.populationLimit}, Industrie ${world.industry}, `
                + `I-Schiffe ${world.iShips}, P-Schiffe ${world.pShips}`);
        }
        resetEconomyTurn(world);
    }

    /** 1 bei Eigentümerwechsel, sonst 2..7 und danach wieder 1 mit einer Mine mehr (wenn schon eine da ist). */
    updateTurnsOwned(world: World) {
        const owner = world.player;
        if (owner === null) {
            world.turnsOwned = 0;
        } else if (this.ownerAtStart.get(world) !== owner) {
            world.turnsOwned = 1;
        } else if (world.turnsOwned >= CLASSIC_TURNS_OWNED_CYCLE) {
            world.turnsOwned = 1;
            if (world.mines >= 1) {
                world.mines += 1;
            }
        } else {
            world.turnsOwned += 1;
        }
    }

    /** Jede Mine fördert eine Einheit Metall; die Bevölkerung arbeitet zuerst in der Industrie. */
    produceMetal(world: World) {
        const minersAvailable = Math.max(0, world.population - world.industryWorkers);
        world.metal += Math.min(world.mines, minersAvailable);
    }

    /** Bevölkerung über dem Limit stirbt, darunter wächst sie um etwa 10 %. */
    growPopulation(world: World) {
        if (world.population > world.populationLimit) {
            world.population = world.populationLimit;
        } else if (world.population > 0) {
            const growth = Math.ceil(world.population * CLASSIC_POPULATION_GROWTH);
            world.population = Math.min(world.populationLimit, world.population + growth);
        }
    }
}
