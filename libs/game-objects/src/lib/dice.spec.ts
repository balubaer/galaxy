import { Dice } from './dice';

const dice = new Dice();
const site = 6;

describe('Dice', () => {
  it('should create an instance', () => {
    expect(dice).toBeTruthy();
  });
  it('test roll', () => {
    dice.setSites(site);

    for (let index = 0; index < 1000; index++) {
      const rollResult = dice.roll();
      const rollCorrect = (rollResult > 0 && rollResult <= site);
      expect(rollCorrect).toBe(true);
    }
  });
});
