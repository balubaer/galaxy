import { Player } from './player';

    const palyerName = 'ZAPHOD';
    const player = new Player(palyerName);
    const toStringTestString = `[${palyerName}]`;

describe('Player', () => {
  it('should create an instance', () => {
    expect(player).toBeTruthy();
    expect(player.playerName).toBe(palyerName);
  });
  it('test stringName', () => {
    expect(player.stringName()).toBe(toStringTestString);
  });
});
