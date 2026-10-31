import { Command, ExecuteCommand, TurnPhase } from './command';
import { Fleet } from './fleet';
import { World } from './world';
import { Player } from './player';
import {
    ArtifactNotFound_Error, ArtifactNotOwned_Error, ArtifactNotOnWorld_Error, ArtifactHookNotAllowed_Error,
    ArtifactNotOnFleet_Error, FleetNotFound_Error
} from './error';
import { artifactName, findArtifact, removeArtifact } from './classic-artifacts';

function isCollector(player: Player | null): boolean {
    return player !== null && player.characterType === 'collector';
}

/**
 * VaaFbb: Artefakt an eine Flotte hängen. Von der eigenen Welt an eine eigene Flotte oder an die Flotte eines
 * Collectors; von Flotte zu Flotte nur an eine Flotte eines Collectors (Phase Laden, vor dem Flug).
 */
export class HookArtifact extends Command implements ExecuteCommand {
    constructor(private worlds: Array<World>, private artifactNumber: number, private target: Fleet | null,
        aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Loading);
    }

    executeCommand() {
        const found = findArtifact(this.worlds, this.artifactNumber);
        if (found === null) {
            this.fail(ArtifactNotFound_Error);
            return;
        }
        if (this.target === null) {
            this.fail(FleetNotFound_Error);
            return;
        }
        if (found.world.fleets.indexOf(this.target) === -1 || found.fleet === this.target) {
            this.fail(ArtifactNotOnWorld_Error);
            return;
        }
        const source = found.fleet ?? found.world;
        if (this.isOwnedByCommandPlayer(source.player) === false) {
            this.fail(ArtifactNotOwned_Error);
            return;
        }
        const toCollector = isCollector(this.target.player);
        const toOwnFleet = this.isOwnedByCommandPlayer(this.target.player);
        if ((found.fleet !== null && toCollector === false) || (toOwnFleet === false && toCollector === false)) {
            this.fail(ArtifactHookNotAllowed_Error);
            return;
        }
        removeArtifact(source, found.artifact);
        this.target.artifacts.push(found.artifact);
        found.world.addEvent(`${artifactName(found.artifact)} an ${this.target.name()} gehängt`);
    }
}

/** VaaW: Artefakt von der eigenen Flotte auf die Welt darunter abwerfen (Phase Laden, vor dem Flug). */
export class DropArtifact extends Command implements ExecuteCommand {
    constructor(private worlds: Array<World>, private artifactNumber: number, aString: string, aPlayer: Player) {
        super(aString, aPlayer, TurnPhase.Loading);
    }

    executeCommand() {
        const found = findArtifact(this.worlds, this.artifactNumber);
        if (found === null) {
            this.fail(ArtifactNotFound_Error);
            return;
        }
        if (found.fleet === null) {
            this.fail(ArtifactNotOnFleet_Error);
            return;
        }
        if (this.isOwnedByCommandPlayer(found.fleet.player) === false) {
            this.fail(ArtifactNotOwned_Error);
            return;
        }
        removeArtifact(found.fleet, found.artifact);
        found.world.artifacts.push(found.artifact);
        found.world.artifacts.sort((a, b) => a.number - b.number);
        found.world.addEvent(`${artifactName(found.artifact)} von ${found.fleet.name()} abgeworfen`);
    }
}
