import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from '../app.service';
import { GamePref, World, WorldGenerator, startGamePref, publicGamePref, keepHiddenGamePref, WorldsPersist, OutPutLists, OutPutStringWithNodesAndLinksInterface } from '@galaxy/game-objects';
import { Message } from '@galaxy/api-interfaces';
import { existsSync, readFileSync, writeFileSync } from 'fs';

@Controller('create-world')
export class CreateWorldController {
  constructor(private readonly appService: AppService) { }

  @Get('CreateWorld')
  getData(): Message {
    const stringData = readFileSync('gamePref.json', 'utf8');
    const gamepref: GamePref = startGamePref(JSON.parse(stringData));
    const worldGen = new WorldGenerator(gamepref);
    let outString = '';
    const outPath = `${gamepref.playName}/Turn${gamepref.round}/`

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
