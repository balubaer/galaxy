import { Port } from './port';

const worldNumbers = [2, 3];
    const worldNumber = 1;
    const port = new Port(worldNumbers, worldNumber);
    const testString = 'W1(2,3)';

describe('Port', () => {
  it('should create an instance', () => {
    expect(port).toBeTruthy();
    expect(port.description).toBe(testString);
  });
  it('test makeDiscription', () => {
    expect(port.makeDiscription(worldNumbers, worldNumber)).toBe(testString);
  })
  it('test has Connection to World', () => {
    expect(port.hasConnectionToWorld(2)).toBe(true);
    expect(port.hasConnectionToWorld(4)).toBe(false);
  })
});

/*
const sum = (a, b) => a + b
const mul = (a, b) => a * b
const sub = (a, b) => a - b
const div = (a, b) => a / b

test('Adding 1 + 1 equals 2', () => {
  expect(sum(1, 1)).toBe(2)
})
test('Multiplying 1 * 1 equals 1', () => {
  expect(mul(1, 1)).toBe(1)
})
test('Subtracting 1 - 1 equals 0', () => {
  expect(sub(1, 1)).toBe(0)
})
test('Dividing 1 / 1 equals 1', () => {
  expect(div(1, 1)).toBe(1)
})*/