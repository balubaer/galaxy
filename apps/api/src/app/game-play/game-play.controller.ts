import { Controller, Get, Body, Query, Post } from '@nestjs/common';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { RequestTurnData, RespondTurnData, GamePref, RequestTurnDataOnlyPlayer, PlayerCommands, ExecuteCommand, WorldsPersist } from '@galaxy/game-objects';
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
        return respondTurnDate;
    }

    @Post('SetCommands')
    setCommands(@Body() request: PlayerCommands): Message {
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


        return respondTurnDate;
    }

    @Get('ExecuteRound')
    executeRound(): Message {
        const stringData = readFileSync('gamePref.json', 'utf8');
        const gamepref: GamePref = JSON.parse(stringData);
        const executeCommand = new ExecuteCommand(gamepref);
        const rawdata = readFileSync(`${gamepref.playName}/Turn${gamepref.round}/worlds.json`, 'utf8');

        gamepref.round++;

        const worldsPersistForExecuteRound: WorldsPersist = JSON.parse(rawdata);
        executeCommand.createEnvironment(worldsPersistForExecuteRound);
        const commandsDict = new Map();
        for (const playerName of gamepref.player) {
            const commandFile = `${gamepref.playName}/Turn${gamepref.round}/${playerName}.txt`;
            const commandString = readFileSync(commandFile, 'utf8');

            commandsDict.set(playerName, commandString);

        }
        executeCommand.start(commandsDict);

        const outputDict = executeCommand.generateOutput();

        for (const playerName of outputDict.keys()) {
            const outputFile = `${gamepref.playName}/Turn${gamepref.round}/${playerName}.out`;
            writeFileSync(outputFile, outputDict.get(playerName));
        }
        const resultWorldsPersist = executeCommand.generateResultWorlds();

        const outPath = `${gamepref.playName}/Turn${gamepref.round}/`

        const data = JSON.stringify(resultWorldsPersist);
        writeFileSync(outPath + 'worlds.json', data);

        const gameprefdata = JSON.stringify(gamepref);

        writeFileSync('gamePref.json', gameprefdata);

        return { message: 'OK' };
    }
}
