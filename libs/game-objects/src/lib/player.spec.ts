import { Player } from './player';

    const playerName = 'ZAPHOD';
    const player = new Player(playerName);
    const toStringTestString = `[${playerName}]`;

describe('Player', () => {
  it('should create an instance', () => {
    expect(player).toBeTruthy();
    expect(player.playerName).toBe(playerName);
  });
  it('test stringName', () => {
    expect(player.stringName()).toBe(toStringTestString);
  });
});
