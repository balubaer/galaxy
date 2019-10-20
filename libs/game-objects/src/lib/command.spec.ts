import { Command, TurnPhase } from "./command";
import { Player } from './player';

const command = new Command('F1W2', new Player('ZAPHOD'), TurnPhase.Movement);

describe('Command', () => {
    it('should create an instance', () => {
      expect(command).toBeTruthy();
    });
  });