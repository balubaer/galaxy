import { CommandFactory } from './command-factory';

describe('CommandFactory', () => {
  it('should create an instance', () => {
    expect(new CommandFactory()).toBeTruthy();
  });
});
