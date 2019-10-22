import { FleetFactory } from './fleet-factory';

describe('FleetFactory', () => {
  it('should create an instance', () => {
    expect(new FleetFactory(42)).toBeTruthy();
  });
});
