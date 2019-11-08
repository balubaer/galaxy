import { GamePref } from './game-pref';
import { World } from './world';
import { PortFactory } from './portfactory';

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



        /*


//Create Ports with PortFactory

var portFactory = PortFactory()

portFactory.moreConnectionPlanet = planetCount/10
portFactory.lessConectionPlanet = planetCount/10
portFactory.createWithPlanetArray(planets)


var fleetFactory = FleetFactory(aFleetCount: fleetCount)

fleetFactory.createWithPlanetArray(planets)

var playerFactory = PlayerFactory(aPlayerNameArray: playerNames)

playerFactory.createWithPlanetArray(planets, fleetCount: fleetCount, aFleetsOnHomePlanet: fleetsOnHomePlanet, startShipsCount: startShipsCount, distanceLevelHomes: distanceLevelHomes)

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
}
