import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from '../app.service';
import { Dice, GamePref, World } from '@galaxy/game-objects';
import { Message } from '@galaxy/api-interfaces';
import { readFileSync, writeFileSync } from 'fs';

@Controller('create-world')
export class CreateWorldController {
    constructor(private readonly appService: AppService) {}

    @Get('CreateWorld')
    getData(): Message {
        const stringData = readFileSync('gamePref.json', 'utf8');
        const gamepref:GamePref = JSON.parse(stringData);
        const worldCount = gamepref.worldCount;
        const dice:Dice = new Dice();
        dice.setSites(worldCount);

        const worlds:World[] = new Array;

        let outString = '';

        for (let i = 0; i < worldCount; i++) {
          const world: World = new World;
          world.setNumber(dice.roll());
          worlds.push(world);

          outString += `${world.name}(${dice.roll()}, ${dice.roll()}, ${dice.roll()}) [Bernd] (D-Schiffe=${dice.roll()})\n`;
        }
        const data = JSON.stringify(worlds);
        writeFileSync('worlds.json', data);
        writeFileSync('worlds.txt', outString);
        return { message: 'OK' };
      }

    @Post('SetGamePref')
    setGamePref(@Body() gamepref: GamePref) {
      const data = JSON.stringify(gamepref);

      writeFileSync('gamePref.json', data);

        console.log(gamepref);
    }

}
