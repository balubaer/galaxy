import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from '../app.service';
import { Dice, GamePref, World } from '@galaxy/game-objects';

const fs = require('fs');

@Controller('create-world')
export class CreateWorldController {
    constructor(private readonly appService: AppService) {}

    @Get('CreateWorld')
    getData(): String {
        const rawdata = fs.readFileSync('gamePref.json');
        const gamepref:GamePref = JSON.parse(rawdata);
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
        fs.writeFileSync('worlds.json', data);
        fs.writeFileSync('worlds.txt', outString);
        return outString;
      }

    @Post('SetGamePref')
    setGamePref(@Body() gamepref: GamePref) {
      const data = JSON.stringify(gamepref);

      fs.writeFileSync('gamePref.json', data);

        console.log(gamepref);
    }

}
