import { Controller, Get, Body, Query } from '@nestjs/common';
import { readFileSync } from 'fs';
import { RequestTurnData } from '@galaxy/game-objects';

@Controller('game-play')
export class GamePlayController {
    @Get('GetTurnData')
    getTurnData(@Body() request: RequestTurnData, @Query() query): Array<string> {
        console.log('Query: ' + query);
        console.log('Query.test: ' + query['Test']);
        console.log('request:' + request);
        console.log('request.turn:' + request.turn);
        console.log('request.playerName:' + request.playerName);
        
        return ['Hallo1', 'Hallo2'];
    }

    @Get('GetTurnData2')
    getTurnData2(@Body() request: RequestTurnData): Array<string> {
      
        console.log('request.turn:' + request.turn);
        console.log('request.playerName:' + request.playerName);
        
        return ['Hallo1', 'Hallo2'];
    }
}
