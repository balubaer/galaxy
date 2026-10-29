import { GamePref, gameTypeOf } from './game-pref.interface';
import { World } from './world';
import { PortFactory } from './portfactory';
import { FleetFactory } from './fleet-factory';
import { PlayerFactory } from './player-factory';
import { PersistenceManager } from './persistence-manager';
import { ClassicWorldFactory } from './classic-world-factory';
import { WorldsPersist } from './worlds-persist.interface';

export class WorldGenerator {
    gamePref: GamePref;
    worlds: Array<World>;

    constructor(gamePref: GamePref) {
        this.gamePref = gamePref;
    }

    generate(): WorldsPersist {
        //Create Worlds
        this.worlds = new Array <World> ();
        for (let index = 1; index <= this.gamePref.worldCount; index++) {
            const world = new World();
            world.setNumber(index);

            this.worlds.push(world);
        }

        //Create Ports with PortFactory
        const portFactory = new PortFactory();

        portFactory.moreConnectionWorld = this.gamePref.worldCount/10;
        portFactory.lessConectionWorld = this.gamePref.worldCount/10;
        portFactory.createWithWorldArray(this.worlds);

        //Create Fleets with FleetFactory
        //Für die Startflotten aller Spieler müssen genug Flotten existieren
        const neededFleets = this.gamePref.player.length * this.gamePref.fleetsOnHomeWorld;
        const fleetCount = Math.max(this.gamePref.fleetCount, neededFleets);
        const fleetFactory = new FleetFactory(fleetCount);

        fleetFactory.createWithWorldArray(this.worlds);

        //Create Player with PlayerFactory
        const playerFactory = new PlayerFactory(this.gamePref.player);
        playerFactory.createWithWorldArray(this.worlds, fleetCount, this.gamePref.fleetsOnHomeWorld, this.gamePref.startShipCount, this.gamePref.distanceLevelHomes);

        if (gameTypeOf(this.gamePref) === 'classic') {
            new ClassicWorldFactory(Math.random, this.gamePref.characterTypes ?? {}).initWorlds(this.worlds);
        }

        //Write to file
        const pm = new PersistenceManager(this.worlds);
        return pm.createWorldsPersist();
    }
}
