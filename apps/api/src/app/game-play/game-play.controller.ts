import { Controller, Get, Body, Query, Post } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { RequestTurnData , RespondTurnData, GamePref} from '@galaxy/game-objects';

@Controller('game-play')
export class GamePlayController {
    @Post('GetTurnData')
    getTurnData(@Body() request: RequestTurnData): RespondTurnData {
        const stringData = readFileSync('gamePref.json', 'utf8');
    const gamepref: GamePref = JSON.parse(stringData);
    const playName = gamepref.playName;
    const commandFile = `${playName}/Turn${request.turn + 1}/${request.playerName}.txt`;
    let commandString = '';
    if (existsSync(commandFile)) {
        commandString = readFileSync(commandFile, 'utf8');
    }
    const turnDataTxTFile = `${playName}/Turn${request.turn}/${request.playerName}.out`;
    let turnDataTxTstring = '';
    if (existsSync(turnDataTxTFile)) {
        turnDataTxTstring = readFileSync(turnDataTxTFile, 'utf8');
    }
    const respondTurnDate: RespondTurnData = {
        'points': 0,
        'turnCommanTxt': commandString,
        'turnDataTxt': turnDataTxTstring
    }

        console.log('request.turn:' + request.turn);
        console.log('request.playerName:' + request.playerName);
        
        return respondTurnDate;
    }

    @Get('GetTurnData2')
    getTurnData2(@Body() request: RequestTurnData): Array<string> {
      
        console.log('request.turn:' + request.turn);
        console.log('request.playerName:' + request.playerName);
        
        return ['Hallo1', 'Hallo2'];
    }
}
