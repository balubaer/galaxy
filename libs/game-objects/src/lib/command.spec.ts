import { Command, TurnPhase, MoveCommand, compareCommand, TransferShipsFleetToFleet, TransferShipsFleetToDShips, TransferDShipsToFleet, FireFleetToFleet, FireDShipsToFleet, FireFleetToDShips, AmbushOffForWorld, AmbushOffForPlayer, AddTeammate, RemoveTeammate, UnloadAllMetal, UnloadMetal, JettisonMetal, LoadMetal, LoadAllMetal, JettisonAllMetal } from './command';
import { Player } from './player';
import { World, TestWorldsArrayFactory, GamePref, ExecuteCommand, WorldsPersist } from '..';
import { Fleet } from './fleet';
import { readFileSync } from 'fs';
import { TESTRESOUCESPATH } from './utils';

const command = new Command('F1W2', new Player('ZAPHOD'), TurnPhase.Movement);
const worlds: Array<World> = new TestWorldsArrayFactory().worlds;
const world4 = worlds[3];
const world2 = worlds[1];
const fleet4: Fleet = world4.fleets[0];
const player = world4.player;
const moveWorldArray = new Array();
moveWorldArray.push(world2);
const moveCommand: MoveCommand = new MoveCommand(fleet4, world4, moveWorldArray, 'F4W2', player);
const command_a = new Command('', player, TurnPhase.Movement);
const command_b = new Command('', player, TurnPhase.Movement);
const command_c = new Command('', player, TurnPhase.Initial);
const command_d = new Command('', player, TurnPhase.Final);
const command_e = new Command('', player, TurnPhase.Combat);
const command_f = new Command('', player, TurnPhase.Transfer);

describe('Command', () => {
  it('should create an instance', () => {
    expect(command).toBeTruthy();
  });

  it('test function compareCommand', () => {
    expect(compareCommand(command_a, command_b)).toBe(0);
    expect(compareCommand(command_a, command_c)).toBe(1);
    expect(compareCommand(command_c, command_b)).toBe(-1);
  });

  it('test CommandArray Sort', () => {
    const commandArray: Array<Command> = new Array<Command>();

    commandArray.push(command_a, command_b, command_c, command_d, command_e, command_f);
    commandArray.sort(compareCommand);
    expect(commandArray[0]).toBe(command_c);
    expect(commandArray[1]).toBe(command_f);
    expect(commandArray[2]).toBe(command_e);
    expect(commandArray[3].turnPhase).toBe(TurnPhase.Movement);
    expect(commandArray[4].turnPhase).toBe(TurnPhase.Movement);
    expect(commandArray[5]).toBe(command_d);
  });
});

describe('MoveCommand', () => {
  it('should create an instance', () => {
    expect(moveCommand).toBeTruthy();
  });
  it('test executeCommand', () => {
    moveCommand.executeCommand();
    const fleetMovement = fleet4.fleetMovements[0];
    expect(fleetMovement.fromWorld).toBe(world4);
    expect(fleetMovement.toWorld).toBe(world2);
  });
});

function createATransferShipsFleetToFleet(): TransferShipsFleetToFleet {
  const fleet42 = new Fleet();
  const fleet43 = new Fleet();
  const world42 = new World();

  fleet42.number = 42;
  fleet42.ships = 5;
  fleet42.player = player;

  fleet43.number = 43;
  fleet43.ships = 0;
  fleet43.player = player;

  world42.fleets.push(fleet42, fleet43);

  const transferShipsFleetToFleet: TransferShipsFleetToFleet = new TransferShipsFleetToFleet(fleet42, fleet43, world42, world42, 3, 'F42T3F43', player);
  return transferShipsFleetToFleet;
}

describe('TransferShipsFleetToFleet', () => {
  it('should create an instance', () => {

    const transferShipsFleetToFleet: TransferShipsFleetToFleet = createATransferShipsFleetToFleet();
    expect(transferShipsFleetToFleet).toBeTruthy();
  });
  it('test executeCommand', () => {
    const transferShipsFleetToFleet: TransferShipsFleetToFleet = createATransferShipsFleetToFleet();

    transferShipsFleetToFleet.executeCommand();
    expect(transferShipsFleetToFleet.fromFleet.ships).toBe(2);
    expect(transferShipsFleetToFleet.toFleet.ships).toBe(3);
  });
});

function createAUnloadAllMetal(): UnloadAllMetal {
  const fleet14 = new Fleet();
  const world87 = new World();

  fleet14.number = 14;
  fleet14.metal = 5;
  fleet14.player = new Player('Joe');

  world87.number = 87;
  world87.metal = 3;
  world87.player = fleet14.player;
  world87.fleets.push(fleet14);

  const unloadAllMetal: UnloadAllMetal = new UnloadAllMetal (fleet14, world87, 'F14U',fleet14.player);
  return unloadAllMetal;
} 

describe('UnloadAllMetal', () => {
  it('should create an instance', () => {

    const unloadAllMetal: UnloadAllMetal = createAUnloadAllMetal();
    expect(unloadAllMetal).toBeTruthy();
  });
  it('test executeCommand', () => {
    const unloadAllMetal: UnloadAllMetal = createAUnloadAllMetal();
    for (const world of worlds) {console.log ('world:' + world.name)
      
    }
    for (let index = 0; index < worlds.length; index++) {
      const element = worlds[index];
      console.log ('worldMitIndex:' + element.name)
      
    }

    unloadAllMetal.executeCommand();
    expect(unloadAllMetal.fromFleet.metal).toBe(0);
    expect(unloadAllMetal.toHomeWorld.metal).toBe(8);
  });
});

function createALoadAllMetal(): LoadAllMetal {
  const fleet14:Fleet = new Fleet();
  const world87 = new World();

  fleet14.number = 14;
  fleet14.ships = 6
  fleet14.metal = 5;
  fleet14.player = new Player('Joe');

  world87.number = 87;
  world87.metal = 3;
  world87.player = fleet14.player;
  world87.fleets.push(fleet14);

  const loadAllMetal: LoadAllMetal = new LoadAllMetal(fleet14, world87, 'F14L', world87.player);
  return loadAllMetal;
} 

describe('LoadAllMetal', () => {
  it('should create an instance', () => {

    const loadAllMetal: LoadAllMetal = createALoadAllMetal();
    expect(loadAllMetal).toBeTruthy();
  });
  it('test executeCommand', () => {
    const loadAllMetal: LoadAllMetal = createALoadAllMetal();

    loadAllMetal.executeCommand();
    expect(loadAllMetal.toFleet.metal).toBe(6);
    expect(loadAllMetal.fromHomeWorld.metal).toBe(2);
  });
});

function createAJettisonAllMetal(): JettisonAllMetal {
  const fleet14 = new Fleet();

  fleet14.number = 14;
  fleet14.metal = 5;
  fleet14.player = new Player('Joe');

  const jettisonAllMetal: JettisonAllMetal = new JettisonAllMetal(fleet14, 'F14J', fleet14.player);
  return jettisonAllMetal;
} 

describe('JettisonAllMetal', () => {
  it('should create an instance', () => {

    const jettisonAllMetal: JettisonAllMetal = createAJettisonAllMetal();
    expect(jettisonAllMetal).toBeTruthy();
  });
  it('test executeCommand', () => {
    const jettisonAllMetal: JettisonAllMetal = createAJettisonAllMetal();

    jettisonAllMetal.executeCommand();
    expect(jettisonAllMetal.fromFleet.metal).toBe(0);
  });
});

function createAUnloadMetal(): UnloadMetal {
  const fleet13 = new Fleet();
  const world85 = new World();

  fleet13.number = 14;
  fleet13.metal = 5;
  fleet13.player = new Player('Joe');
  
  world85.number = 87;
  world85.metal = 3;
  world85.player = fleet13.player;
  world85.fleets.push(fleet13);
  
  const unloadMetal: UnloadMetal = new UnloadMetal(fleet13, world85, 2, 'F13U2', fleet13.player);
  return unloadMetal;
} 

describe('UnloadMetal', () => {
  it('should create an instance', () => {

    const unloadMetal: UnloadMetal = createAUnloadMetal();
    expect(unloadMetal).toBeTruthy();
  });
  it('test executeCommand', () => {
    const unloadMetal: UnloadMetal = createAUnloadMetal();

    unloadMetal.executeCommand();
    expect(unloadMetal.fromFleet.metal).toBe(3);
    expect(unloadMetal.toHomeWorld.metal).toBe(5);
  });
});

function createAJettisonMetal(): JettisonMetal {
  const fleet13 = new Fleet();

  fleet13.number = 14;
  fleet13.metal = 5;
  fleet13.player = new Player('Joe');
  
  const jettisonMetal: JettisonMetal = new JettisonMetal(fleet13, 3, 'F13J3', fleet13.player);
  return jettisonMetal;
} 

describe('JettisonMetal', () => {
  it('should create an instance', () => {

    const jettisonMetal: JettisonMetal = createAJettisonMetal();
    expect(jettisonMetal).toBeTruthy();
  });
  it('test executeCommand', () => {
    const jettisonMetal: JettisonMetal = createAJettisonMetal();

    jettisonMetal.executeCommand();
    expect(jettisonMetal.fromFleet.metal).toBe(2);
  });
});

function createALoadMetal(): LoadMetal {
  const fleet13 = new Fleet();
  const world85 = new World();

  fleet13.number = 14;
  fleet13.ships = 7
  fleet13.metal = 5;
  fleet13.player = new Player('Joe');
  
  world85.number = 87;
  world85.metal = 3;
  world85.player = fleet13.player;
  world85.fleets.push(fleet13);
  
  const loadMetal: LoadMetal = new LoadMetal(fleet13, world85, 3, 'F13J3', fleet13.player);
  return loadMetal;
} 

describe('LoadMetal', () => {
  it('should create an instance', () => {

    const loadMetal: LoadMetal = createALoadMetal();
    expect(loadMetal).toBeTruthy();
  });
  it('test executeCommand', () => {
    const loadMetal: LoadMetal = createALoadMetal();

    loadMetal.executeCommand();
    expect(loadMetal.toFleet.metal).toBe(7);
    expect(loadMetal.fromHomeWorld.metal).toBe(1);
  });
});

function createATransferShipsFleetToDShips(): TransferShipsFleetToDShips {
  const fleet42 = new Fleet();
  const world42 = new World();

  fleet42.number = 42;
  fleet42.ships = 5;
  fleet42.player = player;

  world42.fleets.push(fleet42);

  const transferShipsFleetToDShips: TransferShipsFleetToDShips = new TransferShipsFleetToDShips(fleet42, world42, 3, 'F42T3D', player);
  return transferShipsFleetToDShips;
}


describe('TransferShipsFleetToDShips', () => {
  it('should create an instance', () => {
    const transferShipsFleetToDShips: TransferShipsFleetToDShips = createATransferShipsFleetToDShips();
    expect(transferShipsFleetToDShips).toBeTruthy();
  });
  it('test executeCommand', () => {
    const transferShipsFleetToDShips: TransferShipsFleetToDShips = createATransferShipsFleetToDShips();

    transferShipsFleetToDShips.executeCommand();
    expect(transferShipsFleetToDShips.fromFleet.ships).toBe(2);
    expect(transferShipsFleetToDShips.fromHomeWorld.dShips).toBe(3);
  });
});

function createATransferDShipsToFleet(): TransferDShipsToFleet {
  const fleet42 = new Fleet();
  const world42 = new World();

  fleet42.number = 42;
  fleet42.ships = 1;
  fleet42.player = player;

  world42.fleets.push(fleet42);
  world42.dShips = 4;
  world42.player = player;

  const transferDShipsToFleet: TransferDShipsToFleet = new TransferDShipsToFleet(fleet42, world42, world42, 2, 'D42T2F42', player);
  return transferDShipsToFleet;
}

describe('TransferDShipsToFleet', () => {
  it('should create an instance', () => {
    const transferDShipsToFleet: TransferDShipsToFleet = createATransferDShipsToFleet();
    expect(transferDShipsToFleet).toBeTruthy();
  });
  it('test executeCommand', () => {
    const transferDShipsToFleet: TransferDShipsToFleet = createATransferDShipsToFleet();

    transferDShipsToFleet.executeCommand();
    expect(transferDShipsToFleet.toFleet.ships).toBe(3);
    expect(transferDShipsToFleet.fromHomeWorld.dShips).toBe(2);
  });
});

function createAFireFleetToFleet(): FireFleetToFleet {
  const playerZaphod = new Player('ZAPHOD');
  const playerMarvin = new Player('MARVIN');

  const fleet42 = new Fleet();
  const fleet43 = new Fleet();
  const world42 = new World();

  fleet42.number = 42;
  fleet42.ships = 4;
  fleet42.player = playerZaphod;

  fleet43.number = 43;
  fleet43.ships = 1;
  fleet43.player = playerMarvin;

  world42.fleets.push(fleet42);
  world42.fleets.push(fleet43);
  world42.dShips = 4;
  world42.player = playerZaphod;

  const fireFleetToFleet: FireFleetToFleet = new FireFleetToFleet(fleet42, fleet43, world42, world42, 'F42AF43', playerZaphod);
  return fireFleetToFleet;
}

describe('FireFleetToFleet', () => {
  it('should create an instance', () => {
    const fireFleetToFleet: FireFleetToFleet = createAFireFleetToFleet();
    expect(fireFleetToFleet).toBeTruthy();
  });
  it('test executeCommand', () => {
    const fireFleetToFleet: FireFleetToFleet = createAFireFleetToFleet();

    fireFleetToFleet.executeCommand();
    expect(fireFleetToFleet.toFleet.hitedShots).toBe(4);
    expect(fireFleetToFleet.fromFleet.fired).toBeTruthy();
    expect(fireFleetToFleet.fromFleet.firesTo).toBe('F43[MARVIN]');
    expect(fireFleetToFleet.fromFleet.firesToCommand).toBe('AF43');
  });
});

function createAfireDShipsToFleet(): FireDShipsToFleet {
  const playerZaphod = new Player('ZAPHOD');
  const playerMarvin = new Player('MARVIN');

  const fleet42 = new Fleet();
  const fleet43 = new Fleet();
  const world42 = new World();

  fleet42.number = 42;
  fleet42.ships = 4;
  fleet42.player = playerZaphod;

  fleet43.number = 43;
  fleet43.ships = 1;
  fleet43.player = playerMarvin;

  world42.fleets.push(fleet42);
  world42.fleets.push(fleet43);
  world42.dShips = 4;
  world42.player = playerZaphod;

  const fireDShipsToFleet: FireDShipsToFleet = new FireDShipsToFleet(fleet43, world42, world42, 'D42AF43', playerZaphod);
  return fireDShipsToFleet;
}

describe('FireDShipsToFleet', () => {
  it('should create an instance', () => {
    const fireDShipsToFleet: FireDShipsToFleet = createAfireDShipsToFleet();
    expect(fireDShipsToFleet).toBeTruthy();
  });
  it('test executeCommand', () => {
    const fireDShipsToFleet: FireDShipsToFleet = createAfireDShipsToFleet();

    fireDShipsToFleet.executeCommand();
    expect(fireDShipsToFleet.toFleet.hitedShots).toBe(4);
    expect(fireDShipsToFleet.fromHomeWorld.dShipsFired).toBeTruthy();
    expect(fireDShipsToFleet.fromHomeWorld.dShipsFiredFleet.number).toBe(fireDShipsToFleet.toFleet.number);
  });
});

function createAFireFleetToDShips(): FireFleetToDShips {
  const playerZaphod = new Player('ZAPHOD');
  const playerMarvin = new Player('MARVIN');

  const fleet43 = new Fleet();
  const world42 = new World();

  fleet43.number = 43;
  fleet43.ships = 5;
  fleet43.player = playerMarvin;

  world42.fleets.push(fleet43);
  world42.dShips = 4;
  world42.player = playerZaphod;

  const fireFleetToDShips: FireFleetToDShips = new FireFleetToDShips(fleet43, world42, 'F43AD', playerMarvin);
  return fireFleetToDShips;
}

describe('FireFleetToDShips', () => {
  it('should create an instance', () => {
    const fireFleetToDShips: FireFleetToDShips = createAFireFleetToDShips();
    expect(fireFleetToDShips).toBeTruthy();
  });
  it('test executeCommand', () => {
    const fireFleetToDShips: FireFleetToDShips = createAFireFleetToDShips();

    fireFleetToDShips.executeCommand();
    expect(fireFleetToDShips.fromHomeWorld.hitedShotsDShips).toBe(5);
    expect(fireFleetToDShips.fromFleet.fired).toBeTruthy();
    expect(fireFleetToDShips.fromFleet.firesTo).toBe('D-Schiffe');
    expect(fireFleetToDShips.fromFleet.firesToCommand).toBe('AD');
  });
});

function createAnAmbushOffForWorld(): AmbushOffForWorld {
  const playerZaphod = new Player('ZAPHOD');

  const world42 = new World();

  world42.dShips = 4;
  world42.player = playerZaphod;

  const ambushOffForWorld: AmbushOffForWorld = new AmbushOffForWorld(world42, 'F43AD', playerZaphod);
  return ambushOffForWorld;
}

describe('AmbushOffForWorld', () => {
  it('should create an instance', () => {
    const ambushOffForWorld: AmbushOffForWorld = createAnAmbushOffForWorld();
    expect(ambushOffForWorld).toBeTruthy();
  });
  it('test executeCommand', () => {
    const ambushOffForWorld: AmbushOffForWorld = createAnAmbushOffForWorld();

    ambushOffForWorld.executeCommand();
    expect(ambushOffForWorld.world.ambushOff).toBeTruthy();
  });
});

function createAnAmbushOffForPlayer(): AmbushOffForPlayer {
  const ambushOffForWorld: AmbushOffForPlayer = new AmbushOffForPlayer(worlds, 'Z', worlds[3].player);
  return ambushOffForWorld;
}

describe('AmbushOffForPlayer', () => {
  it('should create an instance', () => {
    const ambushOffForPlayer: AmbushOffForPlayer = createAnAmbushOffForPlayer();
    expect(ambushOffForPlayer).toBeTruthy();
  });
  it('test executeCommand', () => {
    const ambushOffForPlayer: AmbushOffForPlayer = createAnAmbushOffForPlayer();

    ambushOffForPlayer.executeCommand();
    expect(ambushOffForPlayer.worlds[3].ambushOff).toBeTruthy();
  });
});

function createAnAddTeammateAndRemoveTeammate() {
  const stringData = readFileSync(`${TESTRESOUCESPATH}/gamePref.json`, 'utf8');
  const gamepref: GamePref = JSON.parse(stringData);
  const executeCommand = new ExecuteCommand(gamepref);
  const rawdata = readFileSync(`${TESTRESOUCESPATH}/worlds.json`, 'utf8');
  const worldsPersist: WorldsPersist = JSON.parse(rawdata);
  executeCommand.createEnvironment(worldsPersist);
  const addTeammate: AddTeammate = new AddTeammate(executeCommand.allPlayerDict, 'A=MARVIN', executeCommand.allPlayerDict.get('ZAPHOD'));
  const removeTeammate: RemoveTeammate = new RemoveTeammate(executeCommand.allPlayerDict, 'N=MARVIN', executeCommand.allPlayerDict.get('ZAPHOD'));
  return {
    addTeammate: addTeammate,
    removeTeammate: removeTeammate
  };
}

describe('AddTeammate and RemoveTeammate', () => {
  it('should create an instance AddTeammate', () => {
    const addTeammateAndRemoveTeammate = createAnAddTeammateAndRemoveTeammate();
    const addTeammate: AddTeammate = addTeammateAndRemoveTeammate.addTeammate;
    expect(addTeammate).toBeTruthy();
  });
  it('should create an instance RemoveTeammate', () => {
    const addTeammateAndRemoveTeammate = createAnAddTeammateAndRemoveTeammate();
    const removeTeammate: RemoveTeammate = addTeammateAndRemoveTeammate.removeTeammate;
    expect(removeTeammate).toBeTruthy();
  });
  it('test executeCommand', () => {
    const addTeammateAndRemoveTeammate = createAnAddTeammateAndRemoveTeammate();
    const addTeammate: AddTeammate = addTeammateAndRemoveTeammate.addTeammate;
    const removeTeammate: RemoveTeammate = addTeammateAndRemoveTeammate.removeTeammate;

    addTeammate.executeCommand();
    const aPlayer = addTeammate.allPlayerDict.get('ZAPHOD');

    for (const teammate of aPlayer.teammates) {
      expect(teammate.playerName).toBe('MARVIN');
    }
    removeTeammate.executeCommand();
    expect(aPlayer.teammates.size).toBe(0);

  });
});

