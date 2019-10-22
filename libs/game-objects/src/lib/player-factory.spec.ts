import { PlayerFactory } from './player-factory';

describe('PlayerFactory', () => {
  it('should create an instance', () => {
    expect(new PlayerFactory()).toBeTruthy();
  });
});
