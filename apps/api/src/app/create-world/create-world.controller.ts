import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from '../app.service';
import { GamePref, World, WorldGenerator } from '@galaxy/game-objects';
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

    worldGen.generate();
    for (const world of worldGen.worlds) {
      outString += `${world.description()}\n\n`;
    }
    /*const data = JSON.stringify(worlds);
    writeFileSync('worlds.json', data);*/
    writeFileSync('worlds.txt', outString);
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

    console.log(gamepref);
  }

}
