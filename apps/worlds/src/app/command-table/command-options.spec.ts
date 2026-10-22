import { Node } from '@galaxy/api-interfaces';
import {
  addCommand,
  brokenCommands,
  buildCommandGroups,
  canExtendRoute,
  commandsConflict,
  extendRoute,
  isDisabled,
  multiStepMoves,
  removeCommand,
  routeCommand,
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

  it('offers fire, stand-by, transfer and ambush on an own world', () => {
    const all = commands(3);
    expect(all).toEqual(
      expect.arrayContaining([
        'F9AF20',
        'D1AF20',
        'F9T3F1',
        'F9S',
        'F9T3D',
        'D1T3F9',
        'Z1',
        'Z',
      ]),
    );
  });

  it('offers no build command in the core game', () => {
    expect(commands(3).some((c) => /^W\d+B/.test(c))).toBe(false);
  });

  it('offers no build, D-ship transfer or ambush on a foreign world', () => {
    const foreign: Node = {
      id: 'W2',
      data: { ...node.data, backgroundColor: 'blue' },
    };
    const all = buildCommandGroups(foreign, [], OWN, 1).flatMap((g) =>
      g.rows.flatMap((r) => r.options.map((o) => o.command)),
    );
    expect(all).toEqual(['F9AF20', 'F9AD', 'F9S', 'F9T1F1']);
  });
});

describe('buildCommandGroups with selected transfers', () => {
  it('offers moves for an empty own fleet once a transfer fills it', () => {
    const run = (selected: string[]) =>
      buildCommandGroups(node, links, OWN, 1, selected).flatMap((g) =>
        g.rows.flatMap((r) => r.options.map((o) => o.command)),
      );
    expect(run([])).not.toContain('F1W7');
    expect(run(['F9T1F1'])).toEqual(expect.arrayContaining(['F1W7', 'F9W7']));
  });
});

describe('dependent commands', () => {
  const find = (selected: string[], command: string) =>
    buildCommandGroups(node, links, OWN, 3, selected)
      .flatMap((g) => g.rows.flatMap((r) => r.options))
      .find((o) => o.command === command);

  it('marks transfers as insufficient when the fleet has too few ships left', () => {
    expect(find([], 'F9T3F1')?.insufficient).toBe(false);
    expect(find(['F9T3F1'], 'F9T3D')?.insufficient).toBe(true);
    expect(find(['F9T3F1'], 'F9T3F1')?.insufficient).toBe(false);
  });

  it('reports commands that fail for lack of ships', () => {
    expect(brokenCommands(node, OWN, ['F9T3F1', 'F9T3D'])).toEqual(['F9T3D']);
    expect(brokenCommands(node, OWN, ['F9T5F1', 'F9W7', 'F9AF20'])).toEqual([
      'F9W7',
      'F9AF20',
    ]);
    expect(brokenCommands(node, OWN, ['F9T2F1', 'F9W7'])).toEqual([]);
  });

  it('keeps a fleet with a selected command visible after it gave away all ships', () => {
    expect(find(['F9T5F1'], 'F9W7')).toBeDefined();
  });
});

describe('conflicts', () => {
  it('a fleet can only move or fire once', () => {
    expect(commandsConflict('F9W7', 'F9W6')).toBe(true);
    expect(commandsConflict('F9W7', 'F9AF20')).toBe(true);
    expect(commandsConflict('F9W7', 'F90W7')).toBe(false);
    expect(commandsConflict('F9W7', 'F9W7')).toBe(false);
  });

  it('stand-by (FnnnS) excludes moving and firing of the same fleet', () => {
    expect(commandsConflict('F9S', 'F9W7')).toBe(true);
    expect(commandsConflict('F9S', 'F9AF20')).toBe(true);
    expect(commandsConflict('F9S', 'F9AD')).toBe(true);
    expect(commandsConflict('F9S', 'F90W7')).toBe(false);
    expect(commandsConflict('F9S', 'F9T1F1')).toBe(false);
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

describe('route planning', () => {
  const edges = [
    { source: 'W1', target: 'W7' },
    {
      source: { id: 'W7' } as unknown as string,
      target: { id: 'W3' } as unknown as string,
    },
    { source: 'W3', target: 'W4' },
    { source: 'W4', target: 'W5' },
  ];
  const plan = { fleet: 9, start: 'W1', path: [] as string[] };

  it('only extends along directed links', () => {
    expect(canExtendRoute(plan, edges, 'W7')).toBe(true);
    expect(canExtendRoute(plan, edges, 'W3')).toBe(false);
    expect(canExtendRoute({ ...plan, path: ['W7'] }, edges, 'W1')).toBe(false);
  });

  it('builds a multi-hop command and stops after three steps', () => {
    let p = plan;
    for (const w of ['W7', 'W3', 'W4', 'W5']) {
      p = extendRoute(p, edges, w);
    }
    expect(p.path).toEqual(['W7', 'W3', 'W4']);
    expect(routeCommand(p)).toBe('F9W7W3W4');
  });
});

describe('multiStepMoves', () => {
  it('finds only routes with more than one step of the given fleet', () => {
    const text = ['F9W7', 'F9W7W3', 'F90W7W3W4', 'F9W7W3W4', 'F9AF2'];
    expect(multiStepMoves(text, 9)).toEqual(['F9W7W3', 'F9W7W3W4']);
    expect(multiStepMoves(text, undefined)).toEqual([]);
  });
});
