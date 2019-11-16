import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from '../app.service';
import { GamePref, World, WorldGenerator, WorldsPersist, OutPutLists } from '@galaxy/game-objects';
import { Message } from '@galaxy/api-interfaces';
import { readFileSync, writeFileSync } from 'fs';

@Controller('create-world')
export class CreateWorldController {
  constructor(private readonly appService: AppService) { }

  @Get('CreateWorld')
  getData(): Message {
    const stringData = readFileSync('gamePref.json', 'utf8');
    const gamepref: GamePref = JSON.parse(stringData);
    const worldGen = new WorldGenerator(gamepref);
    let outString = '';
    const outPath = `${gamepref.playName}/Turn${gamepref.round}/`

    const worldsPersist: WorldsPersist = worldGen.generate();
    for (const world of worldGen.worlds) {
      outString += `${world.description()}\n\n`;
    }
    const outPutLists = new OutPutLists(gamepref);
    const output = outPutLists.generate(worldsPersist);

    for (const playerName of output.keys()) {
      const outPutString = output.get(playerName);
      writeFileSync(`${outPath}${playerName}.out`, outPutString);
    }

    const data = JSON.stringify(worldsPersist);
    writeFileSync(outPath + 'worlds.json', data);
    writeFileSync(outPath + 'worlds.txt', outString);
    return { message: 'OK' };
  }

  @Get('GetGamePref')
  getGamePref(): GamePref {
    const stringData = readFileSync('gamePref.json', 'utf8');
    const gamepref: GamePref = JSON.parse(stringData);
    return gamepref;
  }

  @Get('GetPlayerList')
  getPlayerList(): Array<string> {
    const stringData = readFileSync('gamePref.json', 'utf8');
    const gamepref: GamePref = JSON.parse(stringData);
    return gamepref.player;
  }

  @Post('SetGamePref')
  setGamePref(@Body() gamepref: GamePref) {
    const data = JSON.stringify(gamepref);

    writeFileSync('gamePref.json', data);
  }

}
