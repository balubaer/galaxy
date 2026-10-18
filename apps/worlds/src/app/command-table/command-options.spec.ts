import { Node } from '@galaxy/api-interfaces';
import {
  addCommand,
  buildCommandGroups,
  commandsConflict,
  isDisabled,
  removeCommand,
} from './command-options';

const OWN = 'rgba(255,103, 43,1)';
const node: Node = {
  id: 'W1',
  data: {
    dships: 2,
    backgroundColor: OWN,
    fleets: [
      { label: 'F1=0', backgroundColor: OWN },
      { label: 'F9=5', backgroundColor: OWN },
      { label: 'F20=3', backgroundColor: 'blue' },
    ],
  },
};
const links = [
  { source: 'W1', target: 'W7' },
  {
    source: { id: 'W1' } as unknown as string,
    target: { id: 'W6' } as unknown as string,
  },
  { source: 'W7', target: 'W1' },
];

function commands(count = 1): string[] {
  return buildCommandGroups(node, links, OWN, count).flatMap((g) =>
    g.rows.flatMap((r) => r.options.map((o) => o.command)),
  );
}

describe('buildCommandGroups', () => {
  it('offers moves only for own fleets with ships, along outgoing links', () => {
    const all = commands();
    expect(all).toEqual(expect.arrayContaining(['F9W7', 'F9W6']));
    expect(all).not.toContain('F1W7');
    expect(all).not.toContain('F20W7');
  });

  it('offers fire, transfer, build and ambush on an own world', () => {
    const all = commands(3);
    expect(all).toEqual(
      expect.arrayContaining([
        'F9AF20',
        'D1AF20',
        'F9T3F1',
        'F9T3D',
        'D1T3F9',
        'W1B3F9',
        'Z1',
        'Z',
      ]),
    );
  });

  it('offers no build, D-ship transfer or ambush on a foreign world', () => {
    const foreign: Node = {
      id: 'W2',
      data: { ...node.data, backgroundColor: 'blue' },
    };
    const all = buildCommandGroups(foreign, [], OWN, 1).flatMap((g) =>
      g.rows.flatMap((r) => r.options.map((o) => o.command)),
    );
    expect(all).toEqual(['F9AF20', 'F9AD', 'F9T1F1']);
  });
});

describe('conflicts', () => {
  it('a fleet can only move or fire once', () => {
    expect(commandsConflict('F9W7', 'F9W6')).toBe(true);
    expect(commandsConflict('F9W7', 'F9AF20')).toBe(true);
    expect(commandsConflict('F9W7', 'F90W7')).toBe(false);
    expect(commandsConflict('F9W7', 'F9W7')).toBe(false);
  });

  it('Z excludes Znn but Znn do not exclude each other', () => {
    expect(commandsConflict('Z', 'Z1')).toBe(true);
    expect(commandsConflict('Z1', 'Z2')).toBe(false);
  });

  it('keeps a selected command enabled and disables its rivals', () => {
    expect(isDisabled('F9W7', ['F9W7'])).toBe(false);
    expect(isDisabled('F9W6', ['F9W7'])).toBe(true);
    expect(isDisabled('F9T1F1', ['F9W7'])).toBe(false);
  });
});

describe('text helpers', () => {
  it('adds without duplicates and removes', () => {
    expect(addCommand('', 'F9W7')).toBe('F9W7');
    expect(addCommand('F9W7', 'Z')).toBe('F9W7\nZ');
    expect(addCommand('F9W7', 'F9W7')).toBe('F9W7');
    expect(removeCommand('F9W7\nZ', 'F9W7')).toBe('Z');
  });
});
