import { GamePref } from './game-pref';
import { World } from './world';
import { PortFactory } from './portfactory';
import { FleetFactory } from './fleet-factory';
import { PlayerFactory } from './player-factory';

export class WorldGenerator {
    gamePref: GamePref;
    worlds: Array<World>;

    constructor(gamePref: GamePref) {
        this.gamePref = gamePref;
    }

    generate(): void {
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
        const fleetFactory = new FleetFactory(this.gamePref.fleetCount);

        fleetFactory.createWithWorldArray(this.worlds);

        //Create Player with PlayerFactory
        const playerFactory = new PlayerFactory(this.gamePref.player);
        playerFactory.createWithWorldArray(this.worlds, this.gamePref.fleetCount, this.gamePref.fleetsOnHomeWorld, this.gamePref.startShipCount, this.gamePref.distanceLevelHomes);

    }

        /*

var planetPlistFilePath = playPath.stringByAppendingPathComponent(playName)

var fileManager = NSFileManager.defaultManager()

var isDir : ObjCBool = false

if fileManager.fileExistsAtPath(planetPlistFilePath, isDirectory: &isDir) == false {
    do {
        try fileManager.createDirectoryAtPath(planetPlistFilePath, withIntermediateDirectories: true, attributes: nil)
    } catch {
        NSLog("Fehler createDirectoryAtPath")
    }
}

var planetPlistFilePathTurn = planetPlistFilePath as NSString

planetPlistFilePath = planetPlistFilePathTurn.stringByAppendingPathComponent("Turn0")

if fileManager.fileExistsAtPath(planetPlistFilePath, isDirectory: &isDir) == false {
    try fileManager.createDirectoryAtPath(planetPlistFilePath, withIntermediateDirectories: true, attributes: nil)
}

planetPlistFilePathTurn = planetPlistFilePath as NSString

planetPlistFilePath = planetPlistFilePathTurn.stringByAppendingPathComponent("Turn0.plist")

var persManager = PersistenceManager(aPlanetArray:planets)
persManager.writePlanetPListWithPlanetArray(planetPlistFilePath)

*/

}
