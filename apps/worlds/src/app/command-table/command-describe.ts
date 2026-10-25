import { Edge, Node } from '@galaxy/api-interfaces';
import { idOf, MAX_ROUTE_STEPS } from './command-options';

/** Farbe und Symbol eines Befehls in der modernen Steuerung. */
export type CommandCategory =
  | 'move'
  | 'fire'
  | 'transfer'
  | 'build'
  | 'metal'
  | 'probe'
  | 'diplomacy'
  | 'other';

export interface CommandDescription {
  category: CommandCategory;
  icon: string;
  text: string;
}

const ICONS: Record<CommandCategory, string> = {
  move: '➜',
  fire: '✸',
  transfer: '⇄',
  build: '⚒',
  metal: '⛏',
  probe: '◎',
  diplomacy: '✉',
  other: '•',
};

const FIRE_TARGETS: Record<string, string> = {
  D: 'D-Schiffe',
  I: 'I-Schiffe/Industrie',
  P: 'P-Schiffe/Bevölkerung',
  H: 'I- und P-Schiffe',
};

const HOME: Record<string, string> = { I: 'I-Schiffe', P: 'P-Schiffe' };

/** Übersetzt einen Befehl (Syntax siehe command.ts) in einen kurzen deutschen Satz. */
export function describeCommand(command: string): CommandDescription {
  const rules: Array<[RegExp, CommandCategory, (m: RegExpExecArray) => string]> = [
    [/^F(\d+)((?:W\d+)+)$/, 'move', (m) => `F${m[1]} fliegt ${m[2].replace(/W/g, ' → W').trim()}`],
    [/^F(\d+)AF(\d+)$/, 'fire', (m) => `F${m[1]} feuert auf F${m[2]}`],
    [/^F(\d+)A([DIPH])$/, 'fire', (m) => `F${m[1]} feuert auf ${FIRE_TARGETS[m[2]]}`],
    [/^F(\d+)CF(\d+)$/, 'fire', (m) => `F${m[1]} feuert bedingt auf F${m[2]}`],
    [/^F(\d+)C([IPH])$/, 'fire', (m) => `F${m[1]} feuert bedingt auf ${FIRE_TARGETS[m[2]]}`],
    [/^F(\d+)S$/, 'fire', (m) => `F${m[1]} hält sich bereit (Hinterhalt)`],
    [/^F(\d+)D$/, 'fire', (m) => `F${m[1]} wirft die PBB ab`],
    [/^D(\d+)AF(\d+)$/, 'fire', (m) => `D-Schiffe W${m[1]} feuern auf F${m[2]}`],
    [/^([IP])(\d+)AF(\d+)$/, 'fire', (m) => `${HOME[m[1]]} W${m[2]} feuern auf F${m[3]}`],
    [/^([IP])(\d+)CF(\d+)$/, 'fire', (m) => `${HOME[m[1]]} W${m[2]} feuern bedingt auf F${m[3]}`],
    [/^F(\d+)T(\d+)F(\d+)$/, 'transfer', (m) => `F${m[1]} gibt ${m[2]} Schiffe an F${m[3]}`],
    [/^F(\d+)T(\d+)D$/, 'transfer', (m) => `F${m[1]} gibt ${m[2]} Schiffe an die D-Schiffe`],
    [/^F(\d+)T(\d+)([IP])$/, 'transfer', (m) => `F${m[1]} gibt ${m[2]} Schiffe an die ${HOME[m[3]]}`],
    [/^D(\d+)T(\d+)F(\d+)$/, 'transfer', (m) => `D-Schiffe W${m[1]} geben ${m[2]} an F${m[3]}`],
    [/^([IP])(\d+)T(\d+)F(\d+)$/, 'transfer', (m) => `${HOME[m[1]]} W${m[2]} geben ${m[3]} an F${m[4]}`],
    [/^([IP])(\d+)T(\d+)([IP])$/, 'transfer', (m) => `${HOME[m[1]]} W${m[2]} werden zu ${m[3]} ${HOME[m[4]]}`],
    [/^W(\d+)B(\d+)([IP])$/, 'build', (m) => `W${m[1]} baut ${m[2]} ${HOME[m[3]]}`],
    [/^W(\d+)B(\d+)F(\d+)$/, 'build', (m) => `W${m[1]} baut ${m[2]} Schiffe für F${m[3]}`],
    [/^W(\d+)I(\d+)I$/, 'build', (m) => `W${m[1]} baut ${m[2]} Industrie`],
    [/^W(\d+)I(\d+)L$/, 'build', (m) => `W${m[1]} erhöht das Bev.-Limit um ${m[2]}`],
    [/^W(\d+)S(\d+)$/, 'build', (m) => `W${m[1]} verschrottet I-Schiffe für ${m[2]} Industrie`],
    [/^W(\d+)X$/, 'build', (m) => `W${m[1]} wird geplündert`],
    [/^P(\d+)M(\d+)W(\d+)$/, 'build', (m) => `${m[2]} Bevölkerung wandert von W${m[1]} nach W${m[3]}`],
    [/^F(\d+)U$/, 'metal', (m) => `F${m[1]} entlädt alles Metall`],
    [/^F(\d+)U(\d+)$/, 'metal', (m) => `F${m[1]} entlädt ${m[2]} Metall`],
    [/^F(\d+)N$/, 'metal', (m) => `F${m[1]} gibt das Metall als Konsumgüter ab`],
    [/^F(\d+)J$/, 'metal', (m) => `F${m[1]} wirft das Metall weg`],
    [/^F(\d+)L$/, 'metal', (m) => `F${m[1]} lädt so viel Metall wie möglich`],
    [/^F(\d+)L(\d+)$/, 'metal', (m) => `F${m[1]} lädt ${m[2]} Metall`],
    [/^F(\d+)P(\d+)$/, 'probe', (m) => `F${m[1]} schickt eine Sonde nach W${m[2]}`],
    [/^([IP])(\d+)P(\d+)$/, 'probe', (m) => `${HOME[m[1]]} W${m[2]} schicken eine Sonde nach W${m[3]}`],
    [/^F(\d+)B$/, 'build', (m) => `F${m[1]} baut eine PBB`],
    [/^F(\d+)Q$/, 'diplomacy', (m) => `F${m[1]} ist At Peace`],
    [/^F(\d+)X$/, 'diplomacy', (m) => `F${m[1]} ist nicht mehr At Peace`],
    [/^F(\d+)G=(.+)$/, 'diplomacy', (m) => `F${m[1]} wird an ${m[2]} verschenkt`],
    [/^W(\d+)G=(.+)$/, 'diplomacy', (m) => `W${m[1]} wird an ${m[2]} verschenkt`],
    [/^A=(.+)$/, 'diplomacy', (m) => `${m[1]} ist Verbündeter`],
    [/^N=(.+)$/, 'diplomacy', (m) => `${m[1]} ist kein Verbündeter`],
    [/^L=(.+)$/, 'diplomacy', (m) => `${m[1]} darf Metall laden`],
    [/^X=(.+)$/, 'diplomacy', (m) => `${m[1]} darf kein Metall laden`],
    [/^Z(\d+)$/, 'fire', (m) => `W${m[1]} hält den Hinterhalt zurück`],
    [/^Z$/, 'fire', () => 'Alle Welten halten den Hinterhalt zurück'],
  ];
  for (const [pattern, category, text] of rules) {
    const match = pattern.exec(command);
    if (match) {
      return { category, icon: ICONS[category], text: text(match) };
    }
  }
  return { category: 'other', icon: ICONS.other, text: command };
}

/** Welt, auf der die Flotte steht (Flottennummern sind im ganzen Spiel eindeutig). */
export function fleetWorld(nodes: Node[], fleet: number): string | undefined {
  const label = new RegExp(`^F${fleet}=`);
  return nodes.find((n) =>
    (n.data?.fleets ?? []).some((f: { label?: string }) => label.test(f.label ?? '')),
  )?.id;
}

/** Welt, zu der ein Befehl gehört: die genannte Welt oder der Standort der Flotte. */
export function commandWorld(command: string, nodes: Node[]): string | undefined {
  const fleet = /^F(\d+)/.exec(command);
  if (fleet) {
    return fleetWorld(nodes, +fleet[1]);
  }
  const world = /^[DIPWZ](\d+)/.exec(command);
  return world ? `W${world[1]}` : undefined;
}

/** Welten, durch die ein Befehl führt (Flug, Sonde, Migration), beginnend beim Start. */
export function commandPath(command: string, nodes: Node[]): string[] {
  const move = /^F(\d+)((?:W\d+)+)$/.exec(command);
  if (move) {
    const start = fleetWorld(nodes, +move[1]);
    return start ? [start, ...(move[2].match(/W\d+/g) ?? [])] : [];
  }
  const probe = /^(?:F(\d+)|[IP](\d+))P(\d+)$/.exec(command);
  if (probe) {
    const start = probe[1] ? fleetWorld(nodes, +probe[1]) : `W${probe[2]}`;
    return start ? [start, `W${probe[3]}`] : [];
  }
  const migration = /^P(\d+)M\d+W(\d+)$/.exec(command);
  return migration ? [`W${migration[1]}`, `W${migration[2]}`] : [];
}

/**
 * Kürzester Weg entlang der Verbindungen (höchstens MAX_ROUTE_STEPS Sprünge),
 * ohne die Startwelt; null, wenn das Ziel so nicht erreichbar ist.
 */
export function shortestRoute(
  links: Edge[],
  from: string,
  to: string,
  maxSteps = MAX_ROUTE_STEPS,
): string[] | null {
  if (from === to) {
    return null;
  }
  const next = new Map<string, string[]>();
  for (const link of links) {
    const source = idOf(link.source);
    next.set(source, [...(next.get(source) ?? []), idOf(link.target)]);
  }
  let paths: string[][] = [[from]];
  const seen = new Set([from]);
  for (let step = 0; step < maxSteps; step++) {
    const extended: string[][] = [];
    for (const path of paths) {
      for (const world of next.get(path[path.length - 1]) ?? []) {
        if (world === to) {
          return [...path.slice(1), world];
        }
        if (!seen.has(world)) {
          seen.add(world);
          extended.push([...path, world]);
        }
      }
    }
    paths = extended;
  }
  return null;
}

/** Alle Welten, die in höchstens maxSteps Sprüngen erreichbar sind, mit ihrer Sprungzahl. */
export function reachableWorlds(
  links: Edge[],
  from: string,
  maxSteps = MAX_ROUTE_STEPS,
): Map<string, number> {
  const result = new Map<string, number>();
  let frontier = [from];
  for (let step = 1; step <= maxSteps; step++) {
    const nextFrontier: string[] = [];
    for (const link of links) {
      const source = idOf(link.source);
      const target = idOf(link.target);
      if (frontier.includes(source) && target !== from && !result.has(target)) {
        result.set(target, step);
        nextFrontier.push(target);
      }
    }
    frontier = nextFrontier;
  }
  return result;
}
