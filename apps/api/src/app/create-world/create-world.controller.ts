import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from '../app.service';
import { Dice, GamePref } from '@galaxy/game-objects';

@Controller('create-world')
export class CreateWorldController {
    constructor(private readonly appService: AppService) {}

    @Get('CreateWorld')
    getData(): String {
        const dice:Dice = new Dice;
        dice.sides = 6
        return `Hallo CreateWorld ${dice.roll ()}`;
      }

    @Post('SetGamePref')
    setGamePref(@Body() gamepref: GamePref) {
      const data = JSON.stringify(gamepref);
      const fs = require('fs');

      fs.writeFileSync('gamePref.json', data);

        console.log(gamepref);
    }

}
