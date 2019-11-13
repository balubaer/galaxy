import { ExecuteCommand } from './execute-command';
import { readFileSync } from 'fs';
import { GamePref } from './game-pref.interface';

const stringData = readFileSync('gamePref.json', 'utf8');
const gamepref: GamePref = JSON.parse(stringData);

describe('ExecuteCommand', () => {
  it('should create an instance', () => {
    expect(new ExecuteCommand(gamepref)).toBeTruthy();
  });
});
