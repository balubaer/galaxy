import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from '../app.service';
import { GamePref, World, WorldGenerator, startGamePref, publicGamePref, keepHiddenGamePref, WorldsPersist, OutPutLists, OutPutStringWithNodesAndLinksInterface, gameTypeOf, CharacterType, PlayerCharacter, PersistenceManager } from '@galaxy/game-objects';
import { Message, User } from '@galaxy/api-interfaces';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

@Controller('create-world')
export class CreateWorldController {
  constructor(private readonly appService: AppService) { }

  @Get('CreateWorld')
  getData(): Message {
    const stringData = readFileSync('gamePref.json', 'utf8');
    const gamepref: GamePref = this.withUserCharacterTypes(startGamePref(JSON.parse(stringData)));
    const worldGen = new WorldGenerator(gamepref);
    let outString = '';
    const outPath = `${gamepref.playName}/Turn${gamepref.round}/`
    mkdirSync(outPath, { recursive: true });

    const worldsPersist: WorldsPersist = worldGen.generate();
    for (const world of worldGen.worlds) {
      outString += `${world.description()}\n\n`;
    }
    const outPutLists = new OutPutLists(gamepref, this.appService.getColorPlayerMap(), this.appService.getFontColorPlayerMap());
    const output = outPutLists.generate(worldsPersist);

    for (const playerName of output.keys()) {
      const outPutStringWithNodesAndLinks: OutPutStringWithNodesAndLinksInterface = output.get(playerName);
      writeFileSync(`${outPath}${playerName}.out`, outPutStringWithNodesAndLinks.outPutString);
      const grafData = JSON.stringify(outPutStringWithNodesAndLinks.nodesAndLinks);
      writeFileSync(`${outPath}${playerName}_graf.json`, grafData);
    }

    const data = JSON.stringify(worldsPersist);
    writeFileSync(outPath + 'worlds.json', data);
    writeFileSync(outPath + 'worlds.txt', outString);
    writeFileSync('gamePref.json', JSON.stringify(gamepref));
    return { message: 'OK' };
  }

  /** Classic Game: Spieler ohne Charakter in der Gamepref bekommen den beim User gespeicherten. */
  withUserCharacterTypes(gamepref: GamePref): GamePref {
    if (gameTypeOf(gamepref) !== 'classic' || existsSync('user.json') === false) {
      return gamepref;
    }
    const users: Array<User> = JSON.parse(readFileSync('user.json', 'utf8'));
    const characterTypes = { ...gamepref.characterTypes };
    for (const player of gamepref.player) {
      const userType = users.find(user => user.username === player)?.characterType;
      if (characterTypes[player] === undefined && userType !== undefined) {
        characterTypes[player] = userType as CharacterType | 'random';
      }
    }
    return { ...gamepref, characterTypes };
  }

  @Get('GetGamePref')
  getGamePref(): GamePref {
    const stringData = readFileSync('gamePref.json', 'utf8');
    const gamepref: GamePref = JSON.parse(stringData);

    return publicGamePref(gamepref);
  }

  @Get('GetGamePref2')
  getGamePref2(): Message {
    return { message: 'OK' };
  }

  @Get('GetPlayerList')
  getPlayerList(): Array<string> {
    const stringData = readFileSync('gamePref.json', 'utf8');
    const gamepref: GamePref = JSON.parse(stringData);
    return gamepref.player;
  }

  /** Charakter und Punkte je Spieler, aus der Gamepref und den Welten der aktuellen Runde. */
  @Get('GetPlayerCharacters')
  getPlayerCharacters(): Array<PlayerCharacter> {
    const gamepref: GamePref = JSON.parse(readFileSync('gamePref.json', 'utf8'));
    const worldsFile = `${gamepref.playName}/Turn${gamepref.round}/worlds.json`;
    const pm = new PersistenceManager(new Array<World>());
    if (existsSync(worldsFile)) {
      pm.createWorldsWithWorldsPersist(JSON.parse(readFileSync(worldsFile, 'utf8')));
    }
    return gamepref.player.map(playerName => {
      const player = pm.allPlayerDict.get(playerName);
      return {
        playerName,
        chosen: gamepref.characterTypes?.[playerName],
        characterType: player?.characterType ?? null,
        points: player?.points ?? 0,
      };
    });
  }

  @Post('SetGamePref')
  setGamePref(@Body() gamepref: GamePref) {
    let newPref = publicGamePref(gamepref);
    if (existsSync('gamePref.json')) {
      const stored: GamePref = JSON.parse(readFileSync('gamePref.json', 'utf8'));
      newPref = keepHiddenGamePref(newPref, stored);
    }
    const data = JSON.stringify(newPref);

    writeFileSync('gamePref.json', data);
  }

}
