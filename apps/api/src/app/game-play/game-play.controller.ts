import { Controller, Get, Body, Query, Post } from '@nestjs/common';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { RequestTurnData, RespondTurnData, GamePref, RequestTurnDataOnlyPlayer, PlayerCommands, ExecuteCommand, WorldsPersist, NodesAndLinks, PersistenceManager, World, RequestTurnDataOnlyPlayerAndRound, StripGraphFactory } from '@galaxy/game-objects';
import { Message } from '@galaxy/api-interfaces';
import { AppService } from '../app.service';

@Controller('game-play')
export class GamePlayController {
    constructor(private readonly appService: AppService) { }

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
        const turnDataGrafFile = `${playName}/Turn${request.turn}/${request.playerName}_graf.json`;
        const turnDataGraf: NodesAndLinks = JSON.parse(turnDataGrafFile);
        const respondTurnDate: RespondTurnData = {
            points: 0,
            turnCommanTxt: commandString,
            turnDataTxt: turnDataTxTstring,
            links: turnDataGraf.links,
            nodes: turnDataGraf.nodes,
            homeWorldName: ''
        }
        return respondTurnDate;
    }

    @Post('SetCommands')
    setCommands(@Body() request: PlayerCommands): Message {
        const stringData = readFileSync('gamePref.json', 'utf8');
        const gamepref: GamePref = JSON.parse(stringData);
        const playName = gamepref.playName;
        const turnPath = `${playName}/Turn${gamepref.round + 1}`;
        if (existsSync(turnPath) === false) {
            mkdirSync(turnPath);
        }

        const commandFile = `${turnPath}/${request.player}.txt`;
        writeFileSync(commandFile, request.commands);
        return { message: 'OK' };
    }

    @Post('GetCommands')
    getCommands(@Body() request: RequestTurnDataOnlyPlayer): PlayerCommands {
        let commands = '';
        const stringData = readFileSync('gamePref.json', 'utf8');
        const gamepref: GamePref = JSON.parse(stringData);
        const playName = gamepref.playName;
        const turnPath = `${playName}/Turn${gamepref.round + 1}`;
        if (existsSync(turnPath) === true) {
            const commandFile = `${turnPath}/${request.playerName}.txt`;

            if (existsSync(commandFile) === true) {
                commands = readFileSync(commandFile, 'utf8');
            }
        }
        return {
            player: request.playerName,
            commands: commands
        }
    }

    getHomeWorldName(playerName: string, playName: string): string {
        const turnDataGrafFile = `${playName}/Turn0/${playerName}_graf.json`;
        const turnDataGrafData = readFileSync(turnDataGrafFile, 'utf8');
        const turnDataGraf: NodesAndLinks = JSON.parse(turnDataGrafData);
        return turnDataGraf.nodes[0].id;
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
        const turnDataGrafFile = `${playName}/Turn${gamepref.round}/${request.playerName}_graf.json`;
        const turnDataGrafData = readFileSync(turnDataGrafFile, 'utf8');
        const turnDataGraf: NodesAndLinks = JSON.parse(turnDataGrafData);
        const rawdata = readFileSync(`${playName}/Turn${gamepref.round}/worlds.json`, 'utf8');
        const worldsPersist: WorldsPersist = JSON.parse(rawdata);
        const pm = new PersistenceManager(new Array<World>());
        const worlds = pm.createWorldsWithWorldsPersist(worldsPersist);

        const homeWorldName = this.getHomeWorldName(request.playerName, playName);
        const stripGraphFactory: StripGraphFactory = new StripGraphFactory(homeWorldName, worlds, turnDataGraf, 3);
        const dataGraf: NodesAndLinks = stripGraphFactory.getResult();

        const player = pm.allPlayerDict.get(request.playerName);

        const respondTurnData: RespondTurnData = {
            points: player.points,
            turnCommanTxt: commandString,
            turnDataTxt: turnDataTxTstring,
            links: dataGraf.links,
            nodes: dataGraf.nodes,
            homeWorldName: homeWorldName
        }
        return respondTurnData;
    }

    @Post('GetTurnDataOnlyPlayerAndRound')
    getTurnDataOnlyPlayerAndRound(@Body() request: RequestTurnDataOnlyPlayerAndRound): RespondTurnData {
        const stringData = readFileSync('gamePref.json', 'utf8');
        const gamepref: GamePref = JSON.parse(stringData);
        const playName = gamepref.playName;
        const commandFile = `${playName}/Turn${request.round + 1}/${request.playerName}.txt`;
        let commandString = '';
        if (existsSync(commandFile)) {
            commandString = readFileSync(commandFile, 'utf8');
        }
        const turnDataTxTFile = `${playName}/Turn${request.round}/${request.playerName}.out`;
        let turnDataTxTstring = '';
        if (existsSync(turnDataTxTFile)) {
            turnDataTxTstring = readFileSync(turnDataTxTFile, 'utf8');
        }
        const turnDataGrafFile = `${playName}/Turn${request.round}/${request.playerName}_graf.json`;
        const turnDataGrafData = readFileSync(turnDataGrafFile, 'utf8');

        const turnDataGraf: NodesAndLinks = JSON.parse(turnDataGrafData);

        const rawdata = readFileSync(`${playName}/Turn${request.round}/worlds.json`, 'utf8');
        const worldsPersist: WorldsPersist = JSON.parse(rawdata);
        const pm = new PersistenceManager(new Array<World>());
        const worlds = pm.createWorldsWithWorldsPersist(worldsPersist);
        const homeWorldName = request.worldName;
        const stripGraphFactory: StripGraphFactory = new StripGraphFactory(homeWorldName, worlds, turnDataGraf, 3);
        const dataGraf: NodesAndLinks = stripGraphFactory.getResult();

        const player = pm.allPlayerDict.get(request.playerName);

        const respondTurnData: RespondTurnData = {
            points: player.points,
            turnCommanTxt: commandString,
            turnDataTxt: turnDataTxTstring,
            links: dataGraf.links,
            nodes: dataGraf.nodes,
            homeWorldName: homeWorldName
        }
        return respondTurnData;
    }

    @Get('ExecuteRound')
    executeRound(): Message {
        const stringData = readFileSync('gamePref.json', 'utf8');
        const gamepref: GamePref = JSON.parse(stringData);
        const executeCommand = new ExecuteCommand(gamepref, this.appService.getColorPlayerMap(), this.appService.getFontColorPlayerMap());
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
        const grafDict = executeCommand.generateNodeAndLinks();

        for (const playerName of outputDict.keys()) {
            let outputFile = `${gamepref.playName}/Turn${gamepref.round}/${playerName}.out`;
            writeFileSync(outputFile, outputDict.get(playerName));
            outputFile = `${gamepref.playName}/Turn${gamepref.round}/${playerName}_graf.json`;
            const grafData = JSON.stringify(grafDict.get(playerName));
            writeFileSync(outputFile, grafData);
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
