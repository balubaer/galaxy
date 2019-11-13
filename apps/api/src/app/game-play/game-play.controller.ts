import { Controller, Get, Body, Query, Post } from '@nestjs/common';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { RequestTurnData, RespondTurnData, GamePref, RequestTurnDataOnlyPlayer, PlayerCommands } from '@galaxy/game-objects';
import { Message } from '@galaxy/api-interfaces';

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

    @Post('SetCommands')
    setCommands(@Body() request: PlayerCommands): Message {
        console.log('request.commands:' + request.commands);
        console.log('request.playe:' + request.player);
        const stringData = readFileSync('gamePref.json', 'utf8');
        const gamepref: GamePref = JSON.parse(stringData);
        const playName = gamepref.playName;
        const commandFile = `${playName}/Turn${gamepref.round + 1}/${request.player}.txt`;
        writeFileSync(commandFile, request.commands);
        return { message: 'OK' };
    }

    @Post('GetTurnDataOnlyPlayer')
    getTurnDataOnlyPlayer(@Body() request: RequestTurnDataOnlyPlayer): RespondTurnData {
        const stringData = readFileSync('gamePref.json', 'utf8');
        const gamepref: GamePref = JSON.parse(stringData);
        const playName = gamepref.playName;
        const commandFile = `${playName}/Turn${gamepref.round + 1}/${request.playerName}.txt`;
        let commandString = '';
        if (existsSync(commandFile)) {
            commandString = readFileSync(commandFile, 'utf8');
        }
        const turnDataTxTFile = `${playName}/Turn${gamepref.round}/${request.playerName}.out`;
        let turnDataTxTstring = '';
        if (existsSync(turnDataTxTFile)) {
            turnDataTxTstring = readFileSync(turnDataTxTFile, 'utf8');
        }
        const respondTurnDate: RespondTurnData = {
            'points': 0,
            'turnCommanTxt': commandString,
            'turnDataTxt': turnDataTxTstring
        }

        console.log('gamepref.round:' + gamepref.round);
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
