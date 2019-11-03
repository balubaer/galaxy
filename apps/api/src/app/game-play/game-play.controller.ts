import { Controller, Get, Body } from '@nestjs/common';
import { readFileSync } from 'fs';
import { RequestTurnData } from '@galaxy/game-objects';

@Controller('game-play')
export class GamePlayController {
    @Get('GetTurnData')
    getTurnData(@Body() request: RequestTurnData): Array<string> {
        //const stringData = readFileSync('gamePref.json', 'utf8');
       // const gamepref: GamePref = JSON.parse(stringData);
        return ['Hallo1', 'Hallo2'];
    }
}
