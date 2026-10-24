import { Command, ExecuteCommand, TurnPhase } from './command';
import { Fleet } from './fleet';
import { World } from './world';
import { Player } from './player';
import {
    FleetNotFound_Error, FleetNotOwned_Error, WorldNotFound_Error, WorldNotOwned_Error, FleetNotOnWorld_Error,
    NotEnoughIndustry_Error, NotEnoughMetal_Error, NotEnoughPopulation_Error, NotEnoughShips_Error, FleetNoCapacity_Error,
    LoadNotAllowed_Error, AlreadyMigrating_Error, InvalidAmount_Error, NoConnection_Error, PlayerNotFound_Error,
    GiftLimit_Error, GiftNotPossible_Error, GiftToSelf_Error, WorldGiftNotPossible_Error, WorldRecovering_Error
} from './error';
import { classicLog } from './classic-log';
import { buildBudget, spendIndustry, industryBuildCost, scrapIShipsPerIndustry, CLASSIC_BUILD_COST } from './classic-economy';

abstract class FleetMetalCommand extends Command {
    constructor(protected fleet: Fleet, protected homeWorld: World, protected amount: number | null,
        aString: string, aPlayer: Player, aTurnPhase: number) {
        super(aString, aPlayer, aTurnPhase);
    }

    protected isValidFleetAndAmount(): boolean {
        if (this.fleet === null || this.homeWorld === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fleet.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        if (this.amount === 0) {
            return this.fail(InvalidAmount_Error);
        }
        return true;
    }

    /** Anzahl Metall, die der Befehl bewegt: die angegebene oder (ohne Angabe) alles auf der Flotte. */
    protected metalOnFleet(): number {
        return this.amount ?? this.fleet.metal;
    }
}

//FaaU[xx] (Konsumgüter: FaaN[xx])
export class UnloadMetal extends FleetMetalCommand implements ExecuteCommand {
    constructor(aFleet: Fleet, aHomeWorld: World, aAmount: number | null, private consumerGoods: boolean,
        aString: string, aPlayer: Player) {
        super(aFleet, aHomeWorld, aAmount, aString, aPlayer, TurnPhase.Unloading);
    }

    isValid(): boolean {
        if (this.isValidFleetAndAmount() === false) {
            return false;
        }
        if (this.fleet.metal === 0 || this.metalOnFleet() > this.fleet.metal) {
            return this.fail(NotEnoughMetal_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            const metal = this.metalOnFleet();
            this.fleet.metal -= metal;
            if (this.consumerGoods === false) {
                this.homeWorld.metal += metal;
                // Entladenes Metall steht erst in der nächsten Runde zum Bauen bereit.
                this.homeWorld.unloadedMetal += metal;
            }
        }
    }
}

//FaaJ[xx]
export class JettisonMetal extends FleetMetalCommand implements ExecuteCommand {
    constructor(aFleet: Fleet, aHomeWorld: World, aAmount: number | null, aString: string, aPlayer: Player) {
        super(aFleet, aHomeWorld, aAmount, aString, aPlayer, TurnPhase.Unloading);
    }

    isValid(): boolean {
        if (this.isValidFleetAndAmount() === false) {
            return false;
        }
        if (this.fleet.metal === 0 || this.metalOnFleet() > this.fleet.metal) {
            return this.fail(NotEnoughMetal_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.fleet.metal -= this.metalOnFleet();
        }
    }
}

//FaaL[xx]
export class LoadMetal extends FleetMetalCommand implements ExecuteCommand {
    constructor(aFleet: Fleet, aHomeWorld: World, aAmount: number | null, aString: string, aPlayer: Player) {
        super(aFleet, aHomeWorld, aAmount, aString, aPlayer, TurnPhase.Loading);
    }

    private mayLoadFromWorld(): boolean {
        const owner = this.homeWorld.player;
        if (owner === null) {
            return false;
        }
        return this.isOwnedByCommandPlayer(owner)
            || Array.from(owner.loaders).some(loader => loader.playerName === this.player.playerName);
    }

    /** Jedes Schiff trägt eine Einheit Metall. */
    private capacity(): number {
        return Math.max(0, this.fleet.ships - this.fleet.metal);
    }

    private metalToLoad(): number {
        return this.amount ?? Math.min(this.homeWorld.metal, this.capacity());
    }

    isValid(): boolean {
        if (this.isValidFleetAndAmount() === false) {
            return false;
        }
        if (this.mayLoadFromWorld() === false) {
            return this.fail(LoadNotAllowed_Error);
        }
        const metal = this.metalToLoad();
        if (metal > this.homeWorld.metal) {
            return this.fail(NotEnoughMetal_Error);
        }
        if (metal > this.capacity()) {
            return this.fail(FleetNoCapacity_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            const metal = this.metalToLoad();
            this.homeWorld.metal -= metal;
            this.fleet.metal += metal;
        }
    }
}

abstract class WorldBuildCommand extends Command {
    constructor(protected world: World, protected count: number, aString: string, aPlayer: Player, aTurnPhase: number) {
        super(aString, aPlayer, aTurnPhase);
    }

    protected isValidWorldAndCount(): boolean {
        if (this.world === null) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.world.player) === false) {
            return this.fail(WorldNotOwned_Error);
        }
        if (this.count < 1) {
            return this.fail(InvalidAmount_Error);
        }
        return true;
    }

    /** Verbraucht units Industrie samt Metall; meldet sonst zu wenig nutzbare Industrie. */
    protected spend(units: number): boolean {
        if (spendIndustry(this.world, units) === false) {
            return this.fail(NotEnoughIndustry_Error);
        }
        return true;
    }
}

export type BuildShipsTarget = 'I' | 'P' | Fleet;

//WaaBxxI WaaBxxP WaaBxxFbb
export class BuildShips extends WorldBuildCommand implements ExecuteCommand {
    constructor(aWorld: World, aCount: number, private target: BuildShipsTarget | null,
        aString: string, aPlayer: Player) {
        super(aWorld, aCount, aString, aPlayer, TurnPhase.Building);
    }

    isValid(): boolean {
        if (this.isValidWorldAndCount() === false) {
            return false;
        }
        if (this.target === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.target instanceof Fleet && this.world.fleets.indexOf(this.target) === -1) {
            return this.fail(FleetNotOnWorld_Error);
        }
        if (buildBudget(this.world) < this.count) {
            return this.fail(NotEnoughIndustry_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid() && this.spend(this.count)) {
            if (this.target === 'I') {
                this.world.iShips += this.count;
            } else if (this.target === 'P') {
                this.world.pShips += this.count;
            } else if (this.target !== null) {
                this.target.ships += this.count;
            }
        }
    }
}

//WaaIxxI
export class BuildIndustry extends WorldBuildCommand implements ExecuteCommand {
    constructor(aWorld: World, aCount: number, aString: string, aPlayer: Player) {
        super(aWorld, aCount, aString, aPlayer, TurnPhase.Building);
    }

    isValid(): boolean {
        if (this.isValidWorldAndCount() === false) {
            return false;
        }
        if (buildBudget(this.world) < this.count * industryBuildCost(this.player)) {
            return this.fail(NotEnoughIndustry_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid() && this.spend(this.count * industryBuildCost(this.player))) {
            this.world.industry += this.count;
        }
    }
}

//WaaIxxL
export class RaisePopulationLimit extends WorldBuildCommand implements ExecuteCommand {
    constructor(aWorld: World, aCount: number, aString: string, aPlayer: Player) {
        super(aWorld, aCount, aString, aPlayer, TurnPhase.Building);
    }

    isValid(): boolean {
        if (this.isValidWorldAndCount() === false) {
            return false;
        }
        if (buildBudget(this.world) < this.count * CLASSIC_BUILD_COST) {
            return this.fail(NotEnoughIndustry_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid() && this.spend(this.count * CLASSIC_BUILD_COST)) {
            this.world.populationLimit += this.count;
        }
    }
}

//WaaSxx: Industrie durch Verschrotten von I-Schiffen, die zu Rundenbeginn schon auf der Welt waren.
export class ScrapIShips extends WorldBuildCommand implements ExecuteCommand {
    constructor(aWorld: World, aCount: number, aString: string, aPlayer: Player) {
        super(aWorld, aCount, aString, aPlayer, TurnPhase.Unloading);
    }

    isValid(): boolean {
        if (this.isValidWorldAndCount() === false) {
            return false;
        }
        if (this.world.iShips < this.count * scrapIShipsPerIndustry(this.player)) {
            return this.fail(NotEnoughShips_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.world.iShips -= this.count * scrapIShipsPerIndustry(this.player);
            this.world.industry += this.count;
        }
    }
}

//PaaMxxWbb: je Person eine Einheit Industrie und Metall, nur zu einer Nachbarwelt pro Welt und Runde.
export class MigratePopulation extends WorldBuildCommand implements ExecuteCommand {
    constructor(aWorld: World, aCount: number, private destination: World, aString: string, aPlayer: Player) {
        super(aWorld, aCount, aString, aPlayer, TurnPhase.Building);
    }

    isValid(): boolean {
        if (this.isValidWorldAndCount() === false) {
            return false;
        }
        if (this.destination === null) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.world.hasConnectionToWorld(this.destination) === false) {
            return this.fail(NoConnection_Error);
        }
        if (this.world.migratesTo !== null) {
            return this.fail(AlreadyMigrating_Error);
        }
        if (this.world.population < this.count) {
            return this.fail(NotEnoughPopulation_Error);
        }
        if (buildBudget(this.world) < this.count) {
            return this.fail(NotEnoughIndustry_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid() && this.spend(this.count)) {
            this.world.population -= this.count;
            this.destination.population += this.count;
            this.world.migratesTo = this.destination;
        }
    }
}

/** Industrie, die keinen Befehl bekommen hat, baut I-Schiffe (läuft nach allen Bau-Befehlen). */
export class BuildDefaultIShips extends Command implements ExecuteCommand {
    constructor(private worlds: Array<World>, aPlayer: Player) {
        super('', aPlayer, TurnPhase.Building);
    }

    executeCommand() {
        for (const world of this.worlds) {
            if (world.player === this.player && world.blackHole === false) {
                const units = buildBudget(world);
                if (units > 0 && spendIndustry(world, units)) {
                    world.iShips += units;
                    classicLog(`${world.name} baut ${units} I-Schiffe (Industrie ohne Befehl)`);
                }
            }
        }
    }
}

export type ShipPlace = Fleet | 'I' | 'P';

//FaaTxxI FaaTxxP IaaTxxFbb PaaTxxFbb IaaTxxP PaaTxxI
export class TransferShipsClassic extends Command implements ExecuteCommand {
    constructor(private world: World | null, private from: ShipPlace | null, private to: ShipPlace | null,
        private count: number, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Transfer);
    }

    private shipsAt(place: ShipPlace): number {
        if (place === 'I') {
            return this.world.iShips;
        }
        return place === 'P' ? this.world.pShips : place.ships;
    }

    private add(place: ShipPlace, count: number) {
        if (place === 'I') {
            this.world.iShips += count;
        } else if (place === 'P') {
            this.world.pShips += count;
        } else {
            place.ships += count;
            place.metal = Math.min(place.metal, place.ships);
        }
    }

    isValid(): boolean {
        if (this.from === null || this.to === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.world === null) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.count < 1) {
            return this.fail(InvalidAmount_Error);
        }
        for (const place of [this.from, this.to]) {
            if (place instanceof Fleet && this.world.fleets.indexOf(place) === -1) {
                return this.fail(FleetNotOnWorld_Error);
            }
        }
        if (this.from instanceof Fleet && this.isOwnedByCommandPlayer(this.from.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        // I- und P-Schiffe gehören dem Eigner der Welt; Schiffe an fremde Flotten zu geben ist ein Geschenk.
        if ((this.from === 'I' || this.from === 'P' || this.to === 'I' || this.to === 'P')
            && this.isOwnedByCommandPlayer(this.world.player) === false) {
            return this.fail(WorldNotOwned_Error);
        }
        if (this.shipsAt(this.from) < this.count) {
            return this.fail(NotEnoughShips_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.add(this.from, -this.count);
            this.add(this.to, this.count);
        }
    }
}

//FaaQ FaaX
export class SetAtPeace extends Command implements ExecuteCommand {
    constructor(private fleet: Fleet | null, private atPeace: boolean, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Initial);
    }

    executeCommand() {
        if (this.fleet === null) {
            this.fail(FleetNotFound_Error);
        } else if (this.isOwnedByCommandPlayer(this.fleet.player) === false) {
            this.fail(FleetNotOwned_Error);
        } else {
            this.fleet.atPeace = this.atPeace;
        }
    }
}

export type RelationKind = 'ally' | 'noAlly' | 'loader' | 'noLoader';

//A=handle N=handle L=handle X=handle
export class SetRelation extends Command implements ExecuteCommand {
    constructor(private other: Player | null, private kind: RelationKind, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Initial);
    }

    executeCommand() {
        if (this.other === null) {
            this.fail(PlayerNotFound_Error);
            return;
        }
        if (this.other === this.player) {
            return;
        }
        switch (this.kind) {
            case 'ally':
                // Verbündete sind auch Teammates, damit Hinterhalt und Bericht sie wie bisher behandeln.
                this.player.allies.add(this.other);
                this.player.teammates.add(this.other);
                break;
            case 'noAlly':
                this.player.allies.delete(this.other);
                this.player.teammates.delete(this.other);
                break;
            case 'loader':
                this.player.loaders.add(this.other);
                break;
            default:
                this.player.loaders.delete(this.other);
                break;
        }
    }
}

export const MAX_GIFTS_PER_TURN = 2;

abstract class GiftCommand extends Command {
    constructor(protected recipient: Player | null, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Final);
    }

    protected isValidRecipientAndLimit(): boolean {
        if (this.recipient === null) {
            return this.fail(PlayerNotFound_Error);
        }
        if (this.recipient === this.player) {
            return this.fail(GiftToSelf_Error);
        }
        if (this.player.giftsThisTurn >= MAX_GIFTS_PER_TURN) {
            return this.fail(GiftLimit_Error);
        }
        return true;
    }
}

//FaaG=handle
export class GiveFleet extends GiftCommand implements ExecuteCommand {
    constructor(private fleet: Fleet | null, recipient: Player | null, aString: string, aPlayer: Player) {
        super(recipient, aString, aPlayer);
    }

    isValid(): boolean {
        if (this.fleet === null) {
            return this.fail(FleetNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.fleet.player) === false) {
            return this.fail(FleetNotOwned_Error);
        }
        // Eine verschenkte Flotte darf in derselben Runde weder fliegen noch feuern.
        if (this.fleet.fleetMovements.length > 0 || this.fleet.fired || this.fleet.conditionalFire) {
            return this.fail(GiftNotPossible_Error);
        }
        return this.isValidRecipientAndLimit();
    }

    executeCommand() {
        if (this.isValid()) {
            this.fleet.giftTo = this.recipient;
            this.fleet.giftFrom = this.player;
            this.player.giftsThisTurn++;
        }
    }
}

//WaaG=handle
export class GiveWorld extends GiftCommand implements ExecuteCommand {
    constructor(private world: World | null, recipient: Player | null, aString: string, aPlayer: Player) {
        super(recipient, aString, aPlayer);
    }

    isValid(): boolean {
        if (this.world === null) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.world.player) === false) {
            return this.fail(WorldNotOwned_Error);
        }
        // Mit den I- oder P-Schiffen einer verschenkten Welt darf in derselben Runde nicht gefeuert werden.
        if (this.world.iShipsFired || this.world.pShipsFired) {
            return this.fail(WorldGiftNotPossible_Error);
        }
        return this.isValidRecipientAndLimit();
    }

    executeCommand() {
        if (this.isValid()) {
            this.world.giftTo = this.recipient;
            this.player.giftsThisTurn++;
        }
    }
}

//WaaX: Plündern, wirksam am Rundenende, wenn die Welt dann noch dem Spieler gehört.
export class PlunderWorld extends Command implements ExecuteCommand {
    constructor(private world: World | null, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Final);
    }

    isValid(): boolean {
        if (this.world === null) {
            return this.fail(WorldNotFound_Error);
        }
        if (this.isOwnedByCommandPlayer(this.world.player) === false) {
            return this.fail(WorldNotOwned_Error);
        }
        if (this.world.plunderRecovery > 0) {
            return this.fail(WorldRecovering_Error);
        }
        return true;
    }

    executeCommand() {
        if (this.isValid()) {
            this.world.plunderBy = this.player;
        }
    }
}
