import { FinalPhaseCoreGame } from './final-phase-core-game';
import { World } from './world';
import { Player } from './player';
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
        for (const world of this.worlds) {
            this.endEconomy(world);
        }
    }

    endEconomy(world: World) {
        this.updateTurnsOwned(world);
        if (world.player !== null && world.blackHole === false) {
            this.produceMetal(world);
            this.growPopulation(world);
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
