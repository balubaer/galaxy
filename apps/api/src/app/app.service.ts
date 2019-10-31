import { Injectable } from '@nestjs/common';
import { Message } from '@galaxy/api-interfaces';
import { Player, World, TestWorldsArrayFactory } from '@galaxy/game-objects';
import { readFileSync, writeFileSync } from 'fs';

@Injectable()
export class AppService {
  getData(): Message {
    return { message: 'Welcome to api!' };
  }

  getPlayer(): Player {
    const player: Player = new Player('Bernd');
    return player;
  }

  getWorld(): World {
    return new World;
  }

  getWorlds(): World[] {

    const rawdata = readFileSync('worlds.json', 'utf8');
    const worlds: World[] = JSON.parse(rawdata);
    return worlds;
  }

  getWorldsString(): string[] {
    const stringArray = new Array();
    const string = readFileSync(`worlds.txt`, 'utf8');
    stringArray.push(string);
    return stringArray;
  }

  getWorldStringList(): string[] {
    const worlds = new TestWorldsArrayFactory().worlds;
    const worldStringList = new Array();

    for (const world of worlds) {
      worldStringList.push(world.description());
    }
    return worldStringList;
  }
}
