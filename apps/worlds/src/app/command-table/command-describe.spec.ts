import { Node } from '@galaxy/api-interfaces';
import {
  commandPath,
  commandWorld,
  describeCommand,
  fleetWorld,
  reachableWorlds,
  shortestRoute,
} from './command-describe';
import { checkCommand, replaceCommands } from './command-options';

const OWN = 'rgba(255,103, 43,1)';
const nodes: Node[] = [
  {
    id: 'W1',
    data: {
      backgroundColor: OWN,
      dships: 0,
      fleets: [
        { label: 'F1=4', backgroundColor: OWN },
        { label: 'F2=0', backgroundColor: OWN },
        { label: 'F20=3', backgroundColor: 'blue' },
      ],
    },
  },
  { id: 'W2', data: { fleets: [{ label: 'F3=1', backgroundColor: OWN }] } },
  { id: 'W3', data: {} },
  { id: 'W4', data: {} },
  { id: 'W5', data: {} },
];
const links = [
  { source: 'W1', target: 'W2' },
  { source: 'W2', target: 'W1' },
  { source: 'W2', target: 'W3' },
  { source: 'W3', target: 'W4' },
  { source: 'W4', target: 'W5' },
];

describe('describeCommand', () => {
  it('beschreibt Flüge, Feuern und Transfers', () => {
    expect(describeCommand('F1W2W3')).toEqual({ category: 'move', icon: '➜', text: 'F1 fliegt → W2 → W3' });
    expect(describeCommand('F1AF20').text).toBe('F1 feuert auf F20');
    expect(describeCommand('F1T2F3').category).toBe('transfer');
    expect(describeCommand('W1B3I').text).toBe('W1 baut 3 I-Schiffe');
    expect(describeCommand('A=MARVIN').category).toBe('diplomacy');
  });

  it('lässt Unbekanntes stehen', () => {
    expect(describeCommand('QQQ')).toEqual({ category: 'other', icon: '•', text: 'QQQ' });
  });
});

describe('Welten der Befehle', () => {
  it('findet den Standort einer Flotte', () => {
    expect(fleetWorld(nodes, 3)).toBe('W2');
    expect(fleetWorld(nodes, 99)).toBeUndefined();
  });

  it('ordnet Befehle ihrer Welt zu', () => {
    expect(commandWorld('F3W1', nodes)).toBe('W2');
    expect(commandWorld('W4B1I', nodes)).toBe('W4');
    expect(commandWorld('P5M2W4', nodes)).toBe('W5');
    expect(commandWorld('A=MARVIN', nodes)).toBeUndefined();
  });

  it('liefert den Weg von Flügen, Sonden und Migrationen', () => {
    expect(commandPath('F1W2W3', nodes)).toEqual(['W1', 'W2', 'W3']);
    expect(commandPath('F3P4', nodes)).toEqual(['W2', 'W4']);
    expect(commandPath('P1M2W2', nodes)).toEqual(['W1', 'W2']);
    expect(commandPath('F1AF20', nodes)).toEqual([]);
  });
});

describe('Routen', () => {
  it('findet den kürzesten Weg mit höchstens drei Sprüngen', () => {
    expect(shortestRoute(links, 'W1', 'W2')).toEqual(['W2']);
    expect(shortestRoute(links, 'W1', 'W4')).toEqual(['W2', 'W3', 'W4']);
    expect(shortestRoute(links, 'W1', 'W5')).toBeNull();
    expect(shortestRoute(links, 'W1', 'W1')).toBeNull();
  });

  it('kennt die erreichbaren Welten mit ihrer Sprungzahl', () => {
    expect([...reachableWorlds(links, 'W1')]).toEqual([
      ['W2', 1],
      ['W3', 2],
      ['W4', 3],
    ]);
  });
});

describe('checkCommand', () => {
  const world = nodes[0];

  it('erlaubt Flüge und ersetzt einen anderen Flug derselben Flotte', () => {
    expect(checkCommand(world, links, OWN, 1, ['F1W2'], [], 'F1W2W3')).toEqual({ ok: true, replaces: ['F1W2'] });
  });

  it('lehnt Befehle ab, die es hier nicht gibt', () => {
    expect(checkCommand(world, links, OWN, 1, [], [], 'F9W2').ok).toBe(false);
  });

  it('lehnt Transfers ohne genug Schiffe ab', () => {
    expect(checkCommand(world, links, OWN, 5, [], [], 'F1T5F2').ok).toBe(false);
    expect(checkCommand(world, links, OWN, 4, [], [], 'F1T4F2').ok).toBe(true);
  });

  it('ersetzt widersprechende Befehle im Text', () => {
    expect(replaceCommands('F1W2\nF3W1', 'F1AF20', ['F1W2'])).toBe('F3W1\nF1AF20');
  });
});
