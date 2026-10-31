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
  remainingIndustry,
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
  it('offers moves for all own fleets, also empty ones, along outgoing links', () => {
    const all = commands();
    expect(all).toEqual(expect.arrayContaining(['F9W7', 'F9W6', 'F1W7']));
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
    expect(all).toEqual([
      'F1AF20', 'F1AD', 'F1S',
      'F9AF20', 'F9AD', 'F9S',
      'F1T1F9', 'F9T1F1',
    ]);
  });
});

describe('buildCommandGroups with selected transfers', () => {
  it('marks a move of an empty own fleet as broken until a transfer fills it', () => {
    expect(brokenCommands(node, OWN, ['F1W7'])).toEqual(['F1W7']);
    expect(brokenCommands(node, OWN, ['F9T1F1', 'F1W7'])).toEqual([]);
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

describe('Classic Game', () => {
  const classicNode: Node = {
    id: 'W1',
    data: {
      dships: 0,
      backgroundColor: OWN,
      classic: {
        blackHole: false,
        population: 50,
        populationLimit: 100,
        industry: 30,
        metal: 20,
        mines: 2,
        turnsOwned: 1,
        iShips: 8,
        pShips: 1,
      },
      fleets: [
        { label: 'F1=0', backgroundColor: OWN, metal: 0 },
        { label: 'F9=5', backgroundColor: OWN, metal: 3 },
        { label: 'F20=3', backgroundColor: 'blue', metal: 0 },
      ],
    },
  };

  function classicOptions(count = 1, selected: string[] = [], n = classicNode) {
    return buildCommandGroups(n, links, OWN, count, selected).flatMap((g) =>
      g.rows.flatMap((r) => r.options),
    );
  }

  it('offers building, industry, migration and metal commands on an own world', () => {
    const all = classicOptions(2).map((o) => o.command);
    expect(all).toEqual(
      expect.arrayContaining([
        'W1B2I',
        'W1B2P',
        'W1B2F1',
        'W1B2F9',
        'W1I2I',
        'W1I2L',
        'W1S2',
        'P1M2W7',
        'P1M2W6',
        'F9U',
        'F9U2',
        'F9N',
        'F9J',
        'F9L',
        'F9L2',
      ]),
    );
  });

  it('offers no D-ship commands in a Classic Game', () => {
    const all = classicOptions(2).map((o) => o.command);
    expect(all).not.toContain('F9T2D');
    expect(all.filter((c) => /D/.test(c))).toEqual([]);
  });

  it('offers no unload for a fleet without metal, and no building on a foreign world', () => {
    const all = classicOptions(1).map((o) => o.command);
    expect(all).not.toContain('F1U');
    const foreign: Node = {
      ...classicNode,
      data: { ...classicNode.data, backgroundColor: 'blue' },
    };
    const foreignAll = classicOptions(1, [], foreign).map((o) => o.command);
    expect(foreignAll.filter((c) => /^[WP]/.test(c))).toEqual([]);
  });

  it('marks building as insufficient when the usable industry is spent', () => {
    // nutzbar: min(30, 20, 50) = 20
    expect(remainingIndustry(classicNode.data.classic, '1', [])).toBe(20);
    expect(remainingIndustry(classicNode.data.classic, '1', ['W1B5F9', 'W1I2I', 'P1M3W7'])).toBe(20 - 5 - 8 - 3);
    const opts = classicOptions(10, ['W1B15I']);
    expect(opts.find((o) => o.command === 'W1B10P').insufficient).toBe(true);
    expect(classicOptions(10).find((o) => o.command === 'W1B10P').insufficient).toBe(false);
  });

  it('marks scrapping as insufficient without enough I-ships', () => {
    const opts = classicOptions(3);
    expect(opts.find((o) => o.command === 'W1S3').insufficient).toBe(true); // 3*4 > 8
    expect(classicOptions(2).find((o) => o.command === 'W1S2').insufficient).toBe(false);
  });

  it('allows only one migration target per world and one amount per metal action', () => {
    expect(commandsConflict('P1M2W7', 'P1M1W6')).toBe(true);
    expect(commandsConflict('P1M2W7', 'P2M1W6')).toBe(false);
    expect(commandsConflict('F9U', 'F9U2')).toBe(true);
    expect(commandsConflict('F9U', 'F9L')).toBe(false);
    expect(commandsConflict('F9U', 'F9W7')).toBe(false);
  });

  it('keeps Core nodes free of Classic commands', () => {
    const all = commands(2);
    expect(all.filter((c) => /^[WP]\d/.test(c))).toEqual([]);
    expect(all).toContain('F9T2D');
  });
});

describe('Classic Game: M3', () => {
  const m3Node: Node = {
    id: 'W1',
    data: {
      dships: 0,
      backgroundColor: OWN,
      classic: {
        blackHole: false,
        population: 50,
        populationLimit: 100,
        industry: 30,
        metal: 30,
        mines: 2,
        turnsOwned: 1,
        iShips: 4,
        pShips: 2,
      },
      fleets: [
        { label: 'F1=0', backgroundColor: OWN, metal: 0 },
        { label: 'F9=5', backgroundColor: OWN, metal: 0, atPeace: true },
        { label: 'F20=3', backgroundColor: 'blue', metal: 0 },
      ],
    },
  };

  function options(count = 1, selected: string[] = [], players = ['MARVIN', 'ZAPHOD']) {
    return buildCommandGroups(m3Node, links, OWN, count, selected, players).flatMap((g) =>
      g.rows.flatMap((r) => r.options),
    );
  }
  const commandsOf = (opts: Array<{ command: string }>) => opts.map((o) => o.command);

  it('offers transfers between fleets, I-ships and P-ships', () => {
    const all = commandsOf(options(2));
    expect(all).toEqual(
      expect.arrayContaining(['F9T2I', 'F9T2P', 'I1T2F1', 'I1T2F9', 'P1T2F9', 'I1T2P', 'P1T2I']),
    );
  });

  it('marks home-ship transfers insufficient when too few I- or P-ships are left', () => {
    // I: 4, P: 2
    const opts = options(3);
    expect(opts.find((o) => o.command === 'I1T3F9').insufficient).toBe(false);
    expect(opts.find((o) => o.command === 'P1T3F9').insufficient).toBe(true);
    const afterTransfer = options(3, ['I1T3F9']);
    expect(afterTransfer.find((o) => o.command === 'I1T3F1').insufficient).toBe(true);
    // Schiffe, die in I-Schiffe wandern, stehen danach zur Verfügung
    const refilled = options(3, ['F9T3P']);
    expect(refilled.find((o) => o.command === 'P1T3F1').insufficient).toBe(false);
  });

  it('projects I/P transfers so that a fleet emptied by them can not move, and reports broken ones', () => {
    expect(brokenCommands(m3Node, OWN, ['F9T9I'])).toEqual(['F9T9I']);
    expect(brokenCommands(m3Node, OWN, ['I1T5F1'])).toEqual(['I1T5F1']);
    expect(brokenCommands(m3Node, OWN, ['I1T2F1', 'F1W7'])).toEqual([]);
  });

  it('keeps selected build and transfer commands visible whatever the count field says', () => {
    const selected = ['W1B7F1', 'F9T4F1', 'I1T3P', 'W1I2I', 'P1M6W7'];
    const all = commandsOf(options(1, selected));
    expect(all).toEqual(expect.arrayContaining([...selected, 'W1B1F1', 'F9T1F1', 'I1T1P']));
    expect(options(1, selected).filter((o) => selected.includes(o.command)).every((o) => !o.insufficient)).toBe(true);
    expect(all.filter((c) => /^W1B\d+F1$/.test(c))).toEqual(['W1B1F1', 'W1B7F1']);
  });

  it('counts ships built for a fleet so that it can move in the same turn', () => {
    expect(brokenCommands(m3Node, OWN, ['F1W7'])).toEqual(['F1W7']);
    expect(brokenCommands(m3Node, OWN, ['W1B5F1', 'F1W7'])).toEqual([]);
    // Gebaut wird erst nach den Transfers, die neuen Schiffe lassen sich nicht im selben Zug abgeben.
    expect(brokenCommands(m3Node, OWN, ['W1B5F1', 'F1T2F9'])).toEqual(['F1T2F9']);
  });

  it('offers At Peace, gifts and relations', () => {
    const all = commandsOf(options());
    expect(all).toEqual(
      expect.arrayContaining([
        'F9Q',
        'F9X',
        'F9G=MARVIN',
        'W1G=ZAPHOD',
        'A=MARVIN',
        'N=MARVIN',
        'L=ZAPHOD',
        'X=ZAPHOD',
      ]),
    );
    expect(all).not.toContain('F20Q');
  });

  it('offers no gifts or relations without other players', () => {
    const all = commandsOf(options(1, [], []));
    expect(all.filter((c) => /G=|^[ANLX]=/.test(c))).toEqual([]);
  });

  it('allows at most two gifts and no gift together with a move of the same fleet', () => {
    expect(isDisabled('F1G=MARVIN', ['F9G=MARVIN', 'W1G=MARVIN'])).toBe(true);
    expect(isDisabled('F1G=MARVIN', ['F9G=MARVIN'])).toBe(false);
    expect(isDisabled('F9G=MARVIN', ['F9W7'])).toBe(true);
    expect(isDisabled('F9G=MARVIN', ['F9G=MARVIN', 'W1G=MARVIN'])).toBe(false);
  });

  it('excludes At Peace vs not, ally vs not-ally, loader vs not-loader of the same player', () => {
    expect(commandsConflict('F9Q', 'F9X')).toBe(true);
    expect(commandsConflict('F9Q', 'F1X')).toBe(false);
    expect(commandsConflict('A=MARVIN', 'N=MARVIN')).toBe(true);
    expect(commandsConflict('L=MARVIN', 'X=MARVIN')).toBe(true);
    expect(commandsConflict('A=MARVIN', 'L=MARVIN')).toBe(false);
    expect(commandsConflict('A=MARVIN', 'N=ZAPHOD')).toBe(false);
  });

  it('keeps I/P transfers and gifts out of the Core Game', () => {
    const all = commands(2);
    expect(all.filter((c) => /^[IP]\d|G=|Q$|^[ANLX]=/.test(c))).toEqual([]);
  });
});

describe('Classic Game: M4 Kampf', () => {
  const classicData = (owner: string, iShips = 3, pShips = 2) => ({
    dships: 0,
    backgroundColor: owner,
    classic: {
      blackHole: false,
      population: 50,
      populationLimit: 100,
      industry: 30,
      metal: 30,
      mines: 2,
      turnsOwned: 1,
      iShips,
      pShips,
    },
    fleets: [
      { label: 'F9=30', backgroundColor: OWN, metal: 0 },
      { label: 'F5=4', backgroundColor: OWN, metal: 0, pbb: true },
      { label: 'F20=3', backgroundColor: 'blue', metal: 0 },
    ],
  });
  const ownWorld: Node = { id: 'W1', data: classicData(OWN) };
  const enemyWorld: Node = { id: 'W1', data: classicData('blue') };

  const commandsAt = (n: Node, selected: string[] = []) =>
    buildCommandGroups(n, links, OWN, 1, selected).flatMap((g) =>
      g.rows.flatMap((r) => r.options.map((o) => o.command)),
    );

  it('offers ground fire and its conditional variants only on a foreign world', () => {
    const enemy = commandsAt(enemyWorld);
    expect(enemy).toEqual(
      expect.arrayContaining(['F9AI', 'F9AP', 'F9AH', 'F9CI', 'F9CP', 'F9CH', 'F9AF20', 'F9CF20']),
    );
    const own = commandsAt(ownWorld);
    expect(own.filter((c) => /^F\d+[AC][IPH]$/.test(c))).toEqual([]);
    expect(own).toContain('F9CF20');
  });

  it('offers I- and P-ship fire on an own world', () => {
    const own = commandsAt(ownWorld);
    expect(own).toEqual(expect.arrayContaining(['I1AF20', 'I1CF20', 'P1AF20', 'P1CF20']));
    const noHome: Node = { id: 'W1', data: classicData(OWN, 0, 0) };
    expect(commandsAt(noHome).filter((c) => /^[IP]1[AC]F/.test(c))).toEqual([]);
  });

  it('offers probes from fleets and home ships to neighbour worlds', () => {
    const own = commandsAt(ownWorld);
    expect(own).toEqual(expect.arrayContaining(['F9P7', 'F9P6', 'I1P7', 'P1P6']));
    expect(commandsAt(enemyWorld).filter((c) => /^[IP]1P/.test(c))).toEqual([]);
  });

  it('offers building a PBB with at least 26 ships and dropping a carried PBB', () => {
    const own = commandsAt(ownWorld);
    expect(own).toContain('F9B');
    expect(own).not.toContain('F5B');
    expect(own).toContain('F5D');
    expect(own).not.toContain('F9D');
  });

  it('a fleet has only one action: fire, conditional fire, PBB drop, move or gift', () => {
    expect(commandsConflict('F9AI', 'F9CF20')).toBe(true);
    expect(commandsConflict('F5D', 'F5W7')).toBe(true);
    expect(commandsConflict('F9CH', 'F9G=MARVIN')).toBe(true);
    expect(commandsConflict('F9P7', 'F9W7')).toBe(false);
    expect(commandsConflict('F9B', 'F9W7')).toBe(false);
    expect(commandsConflict('I1AF20', 'I1CF20')).toBe(true);
    expect(commandsConflict('I1AF20', 'P1AF20')).toBe(false);
  });

  it('reports fire and probes of an emptied fleet as broken', () => {
    expect(brokenCommands(ownWorld, OWN, ['F5T4I', 'F5AF20'])).toEqual(['F5AF20']);
    expect(brokenCommands(ownWorld, OWN, ['F5T4I', 'F5P7'])).toEqual(['F5P7']);
  });
});

describe('Classic Game: M5 Plündern', () => {
  const plunderNode = (owner: string, plunderRecovery: number): Node => ({
    id: 'W1',
    data: {
      dships: 0,
      backgroundColor: owner,
      classic: {
        blackHole: false, population: 50, populationLimit: 100, industry: 30, metal: 30, mines: 2,
        turnsOwned: 1, iShips: 1, pShips: 1, plunderCount: plunderRecovery > 0 ? 1 : 0, plunderRecovery,
      },
      fleets: [],
    },
  });
  const all = (n: Node) =>
    buildCommandGroups(n, links, OWN, 1).flatMap((g) => g.rows.flatMap((r) => r.options.map((o) => o.command)));

  it('offers plundering an own world that is not recovering', () => {
    expect(all(plunderNode(OWN, 0))).toContain('W1X');
    expect(all(plunderNode(OWN, 2))).not.toContain('W1X');
    expect(all(plunderNode('blue', 0))).not.toContain('W1X');
  });

  const plunderText = (n: Node, characterType: string | null) =>
    buildCommandGroups(n, links, OWN, 1, [], [], characterType)
      .flatMap((g) => g.rows.flatMap((r) => r.options))
      .find((o) => o.command === 'W1X')?.label;

  it('shows the plunder penalty for non-raiders', () => {
    expect(plunderText(plunderNode(OWN, 0), 'emperor')).toBe('Plündern (−5 Punkte, 3 Runden unproduktiv)');
    expect(plunderText(plunderNode(OWN, 0), null)).toBe('Plündern (−5 Punkte, 3 Runden unproduktiv)');
  });

  it('shows the raider points for the next plunder of this world', () => {
    expect(plunderText(plunderNode(OWN, 0), 'raider')).toBe('Plündern (+50 Punkte, 3 Runden unproduktiv)');
    const twice: Node = plunderNode(OWN, 0);
    twice.data.classic.plunderCount = 2;
    expect(plunderText(twice, 'raider')).toBe('Plündern (+30 Punkte, 3 Runden unproduktiv)');
    twice.data.classic.plunderCount = 7;
    expect(plunderText(twice, 'raider')).toBe('Plündern (+10 Punkte, 3 Runden unproduktiv)');
  });
});

describe('Classic Game: Trader-Konsumgüter', () => {
  const traderNode = (ownConsumerGoods?: number): Node => ({
    id: 'W1',
    data: {
      dships: 0,
      backgroundColor: OWN,
      classic: {
        blackHole: false, population: 50, populationLimit: 100, industry: 30, metal: 30, mines: 2,
        turnsOwned: 1, iShips: 1, pShips: 1, plunderCount: 0, plunderRecovery: 0, ownConsumerGoods,
      },
      fleets: [{ label: 'F1=5', backgroundColor: OWN, metal: 5 }],
    },
  });
  const label = (n: Node, characterType: string | null) =>
    buildCommandGroups(n, links, OWN, 1, [], [], characterType)
      .flatMap((g) => g.rows.flatMap((r) => r.options))
      .find((o) => o.command === 'F1N')?.label;

  it('shows the points of the next consumer goods unload for a trader', () => {
    expect(label(traderNode(), 'trader')).toBe('alles als Konsumgüter (+10 Punkte)');
    expect(label(traderNode(2), 'trader')).toBe('alles als Konsumgüter (+5 Punkte)');
    expect(label(traderNode(9), 'trader')).toBe('alles als Konsumgüter (+1 Punkte)');
  });

  it('shows no points for other characters', () => {
    expect(label(traderNode(), 'emperor')).toBe('alles als Konsumgüter');
  });
});

describe('Classic Game: Artefakte', () => {
  const artifactNode = (owner: string): Node => ({
    id: 'W1',
    data: {
      dships: 0,
      backgroundColor: owner,
      classic: {
        blackHole: false, population: 50, populationLimit: 100, industry: 30, metal: 30, mines: 2,
        turnsOwned: 1, iShips: 1, pShips: 1, plunderCount: 0, plunderRecovery: 0,
        artifacts: [{ number: 3, name: 'Holy Grail' }],
      },
      fleets: [
        { label: 'F1=5', backgroundColor: OWN, metal: 0, artifacts: [{ number: 4, name: 'Cursed Grail' }] },
        { label: 'F2=5', backgroundColor: OWN, metal: 0 },
      ],
    },
  });
  const commands = (n: Node, characterType: string | null = null) =>
    buildCommandGroups(n, links, OWN, 1, [], [], characterType)
      .flatMap((g) => g.rows.filter((r) => r.kind === 'artifact').flatMap((r) => r.options.map((o) => o.command)));

  it('offers hooking world artifacts onto own fleets and dropping fleet artifacts', () => {
    expect(commands(artifactNode(OWN))).toEqual(['V3F1', 'V3F2', 'V4W']);
  });

  it('offers fleet-to-fleet only to a collector', () => {
    expect(commands(artifactNode(OWN), 'collector')).toEqual(['V3F1', 'V3F2', 'V4W', 'V4F2']);
  });

  it('offers hooking onto fleets of players marked as collector, from world and fleet', () => {
    const n = artifactNode(OWN);
    n.data.fleets.push({ label: 'F6=2', backgroundColor: 'blue', metal: 0 }, { label: 'F7=2', backgroundColor: 'red', metal: 0 });
    const marked = buildCommandGroups(n, links, OWN, 1, [], [], null, ['blue'])
      .flatMap((g) => g.rows.filter((r) => r.kind === 'artifact').flatMap((r) => r.options));
    expect(marked.map((o) => o.command)).toEqual(['V3F1', 'V3F2', 'V3F6', 'V4W', 'V4F6']);
    expect(marked.find((o) => o.command === 'V3F6')?.label).toBe('an Flotte 6 (Collector)');
    expect(commands(n)).not.toContain('V3F6');
  });

  it('offers no hooking from a foreign world', () => {
    expect(commands(artifactNode('blue'))).toEqual(['V4W']);
  });

  it('allows only one order per artifact', () => {
    expect(commandsConflict('V3F1', 'V3W')).toBe(true);
    expect(commandsConflict('V3F1', 'V4F1')).toBe(false);
  });
});
