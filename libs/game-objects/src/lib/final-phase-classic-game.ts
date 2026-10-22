import { FinalPhaseCoreGame } from './final-phase-core-game';
import { World } from './world';
import { Player } from './player';
import { classicLog } from './classic-log';
import { CLASSIC_POPULATION_GROWTH, CLASSIC_TURNS_OWNED_CYCLE, resetEconomyTurn } from './classic-economy';

/**
 * Rundenende des Classic Games: Kampf, Flüge und Besitzwechsel wie im Core Game, danach die Wirtschaft
 * (Besitzdauer, Minen, Bevölkerung). Punkte (Emperor) folgen später, daher vergibt diese Phase keine.
 */
export class FinalPhaseClassicGame extends FinalPhaseCoreGame {
    private ownerAtStart: Map<World, Player> = new Map();

    // Punkte gibt es im Classic Game je nach Charakter, nicht pauschal je Welt.
    override calculatePoints(world: World) {
        return;
    }

    override doFinal() {
        for (const world of this.worlds) {
            this.ownerAtStart.set(world, world.player);
        }
        super.doFinal();
        this.completeGifts();
        for (const world of this.worlds) {
            this.endEconomy(world);
        }
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
