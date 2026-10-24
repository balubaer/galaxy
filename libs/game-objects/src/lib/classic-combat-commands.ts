import { Command, ExecuteCommand, TurnPhase } from './command';
import { Fleet } from './fleet';
import { World } from './world';
import { Player } from './player';
import {
    FleetNotFound_Error, FleetNotOwned_Error, WorldNotFound_Error, WorldNotOwned_Error, FleetNotOnWorld_Error,
    FleetAlreadyActed_Error, FleetHasNoShips_Error, FireOnOwnFleet_Error, NotEnoughShips_Error, NoConnection_Error,
    HomeShipsAlreadyFired_Error, FireOnOwnWorld_Error, NoPbb_Error, PbbNeedsShips_Error, AlreadyPbb_Error
} from './error';
import { addAttack, fleetShots, homeShipShots, isAttackOf } from './classic-combat';

/** Schiffe, die mindestens auf einer Flotte stehen müssen, damit sie eine PBB bauen kann. */
export const PBB_MIN_SHIPS = 26;
/** Schiffe, die beim Bau einer PBB verbraucht werden. */
export const PBB_SHIP_COST = 25;

export type Shooter = Fleet | 'I' | 'P';
export type FireTarget = Fleet | 'I' | 'P' | 'H';

const groundTargetNames = { I: 'I-Schiffe und Industrie', P: 'P-Schiffe und Bevölkerung', H: 'I- und P-Schiffe' };

/**
 * Feuerbefehle des Classic Games: Flotte bzw. I-/P-Schiffe auf eine Flotte (FaaAFbb, IaaAFbb, PaaAFbb)
 * und Flotte auf den Boden (FaaAI, FaaAP, FaaAH); mit C statt A bedingt (feuert nur, wenn der Gegner
 * auf dieser Welt in dieser Runde selbst angreift).
 */
export class ClassicFire extends Command implements ExecuteCommand {
    constructor(private world: World | null, private shooter: Shooter | null, private target: FireTarget | null,
        private conditional: boolean, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Combat);
    }

    /** Spieler, der angegriffen wird (für bedingtes Feuern). */
    victim(): Player | null {
        return this.target instanceof Fleet ? this.target.player : this.world.player;
    }

    isValid(): boolean {
        if (this.shooter === null || this.target === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.world === null) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.shooter instanceof Fleet) {
            if (this.world.fleets.indexOf(this.shooter) === -1) {
                return this.fail(FleetNotOnWorld_Error);
            }
            if (this.isOwnedByCommandPlayer(this.shooter.player) === false) {
                return this.fail(FleetNotOwned_Error);
            }
            if (this.shooter.fired || this.shooter.conditionalFire) {
                return this.fail(FleetAlreadyActed_Error);
            }
            if (this.shooter.ships === 0) {
                return this.fail(FleetHasNoShips_Error);
            }
        } else {
            if (this.isOwnedByCommandPlayer(this.world.player) === false) {
                return this.fail(WorldNotOwned_Error);
            }
            if ((this.shooter === 'I' && this.world.iShipsFired) || (this.shooter === 'P' && this.world.pShipsFired)) {
                return this.fail(HomeShipsAlreadyFired_Error);
            }
            if ((this.shooter === 'I' ? this.world.iShips : this.world.pShips) === 0) {
                return this.fail(NotEnoughShips_Error);
            }
            // I- und P-Schiffe feuern nur auf Flotten.
            if ((this.target instanceof Fleet) === false) {
                return this.fail(FleetNotFound_Error);
            }
        }
        if (this.target instanceof Fleet) {
            if (this.world.fleets.indexOf(this.target) === -1) {
                return this.fail(FleetNotOnWorld_Error);
            }
            if (this.isOwnedByCommandPlayer(this.target.player)) {
                return this.fail(FireOnOwnFleet_Error);
            }
        } else if (this.isOwnedByCommandPlayer(this.world.player)) {
            return this.fail(FireOnOwnWorld_Error);
        }
        return true;
    }

    private markActed() {
        if (this.shooter instanceof Fleet) {
            if (this.conditional) {
                this.shooter.conditionalFire = true;
            } else {
                this.shooter.fired = true;
            }
        } else if (this.shooter === 'I') {
            this.world.iShipsFired = true;
        } else {
            this.world.pShipsFired = true;
        }
    }

    executeCommand() {
        if (this.isValid()) {
            this.markActed();
            if (this.conditional === false) {
                this.fire();
            }
        }
    }

    /** Bedingter Befehl ist ausgelöst, wenn das Ziel den Spieler auf dieser Welt angegriffen hat. */
    isTriggered(): boolean {
        const victim = this.victim();
        return victim !== null && isAttackOf(this.world, victim, this.player);
    }

    fire() {
        const shooterName = this.shooter instanceof Fleet ? this.shooter.name() : `${this.shooter}-Schiffe ${this.world.name}`;
        if (this.shooter instanceof Fleet) {
            this.shooter.fired = true;
        }
        const shots = this.shooter instanceof Fleet
            ? fleetShots(this.shooter)
            : homeShipShots(this.shooter === 'I' ? this.world.iShips : this.world.pShips);
        if (this.target instanceof Fleet) {
            this.target.incomingShots.push(shots);
            this.world.addReportPlayer(this.target.player);
            if (this.shooter instanceof Fleet) {
                this.shooter.firesTo = this.target.name();
            } else {
                this.world.addEvent(`${shooterName} feuern auf ${this.target.name()}`);
            }
        } else {
            this.world.groundShots.push({ player: this.player, shots, target: this.target });
            this.world.addReportPlayer(this.world.player);
            (this.shooter as Fleet).firesTo = `${groundTargetNames[this.target]} ${this.world.name}`;
        }
        addAttack(this.world, this.player, this.victim());
    }
}

/** Löst bedingte Feuerbefehle aus, solange neue Angriffe weitere Befehle auslösen (läuft nach allem Feuer). */
export class ResolveConditionalFire extends Command implements ExecuteCommand {
    constructor(private orders: Array<ClassicFire>) {
        super('', null, TurnPhase.Combat);
    }

    executeCommand() {
        let pending = this.orders.filter(order => order.errors.length === 0);
        let changed = true;
        while (changed) {
            changed = false;
            for (const order of pending) {
                if (order.isTriggered()) {
                    order.fire();
                    changed = true;
                }
            }
            pending = pending.filter(order => order.isTriggered() === false);
        }
    }
}

/** FaaPbb IaaPbb PaaPbb: ein Schiff erkundet eine Nachbarwelt und verglüht dabei. */
export class ClassicProbe extends Command implements ExecuteCommand {
    constructor(private world: World | null, private source: Shooter | null, private target: World | null,
        aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Combat);
    }

    isValid(): boolean {
        if (this.source === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.world === null || this.target === null) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.source instanceof Fleet) {
            if (this.isOwnedByCommandPlayer(this.source.player) === false) {
                return this.fail(FleetNotOwned_Error);
            }
        } else if (this.isOwnedByCommandPlayer(this.world.player) === false) {
            return this.fail(WorldNotOwned_Error);
        }
        if (this.world.hasConnectionToWorld(this.target) === false) {
            return this.fail(NoConnection_Error);
        }
        const ships = this.source instanceof Fleet ? this.source.ships : this.source === 'I' ? this.world.iShips : this.world.pShips;
        if (ships < 1) {
            return this.fail(NotEnoughShips_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            if (this.source instanceof Fleet) {
                this.source.ships -= 1;
                this.source.metal = Math.min(this.source.metal, this.source.ships);
            } else if (this.source === 'I') {
                this.world.iShips -= 1;
            } else {
                this.world.pShips -= 1;
            }
            this.target.addReportPlayer(this.player);
        }
    }
}

/** FaaB: PBB bauen (am Rundenende, wenn die Flotte dann noch mindestens 26 Schiffe hat). */
export class BuildPbb extends Command implements ExecuteCommand {
    constructor(private fleet: Fleet | null, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Final);
    }

    isValid(): boolean {
        if (this.fleet === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fleet.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        if (this.fleet.pbb) {
            return this.fail(AlreadyPbb_Error);
        }
        if (this.fleet.ships < PBB_MIN_SHIPS) {
            return this.fail(PbbNeedsShips_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.fleet.buildPbbBy = this.player;
        }
    }
}

/** FaaD: PBB abwerfen; zählt als Feuerbefehl und als Angriff auf den Eigner der Welt. */
export class DropPbb extends Command implements ExecuteCommand {
    constructor(private fleet: Fleet | null, private world: World | null, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Combat);
    }

    isValid(): boolean {
        if (this.fleet === null || this.world === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fleet.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        if (this.fleet.pbb === false) {
            return this.fail(NoPbb_Error);
        }
        if (this.fleet.fired || this.fleet.conditionalFire) {
            return this.fail(FleetAlreadyActed_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.fleet.fired = true;
            this.fleet.firesTo = `PBB auf ${this.world.name}`;
            this.world.pbbDrops.push(this.fleet);
            this.world.addReportPlayer(this.world.player);
            addAttack(this.world, this.player, this.world.player);
        }
    }
}
