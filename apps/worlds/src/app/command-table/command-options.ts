import { Edge, Node } from '@galaxy/api-interfaces';

export interface CommandOption {
  command: string;
  label: string;
}

export interface CommandRow {
  label: string;
  options: CommandOption[];
}

export interface CommandGroup {
  title: string;
  rows: CommandRow[];
}

interface WorldFleet {
  number: number;
  ships: number;
  own: boolean;
}

function readFleets(node: Node, ownColor: string): WorldFleet[] {
  const fleets: Array<{ label?: string; backgroundColor?: string }> =
    node.data?.fleets ?? [];
  const result: WorldFleet[] = [];
  for (const fleet of fleets) {
    const match = /^F(\d+)=(\d+)$/.exec(fleet.label ?? '');
    if (match) {
      result.push({
        number: +match[1],
        ships: +match[2],
        own: fleet.backgroundColor === ownColor,
      });
    }
  }
  return result;
}

/**
 * Alle Befehle, die auf der gewählten Welt möglich sind, gruppiert nach Art.
 * Syntax siehe command.ts (FnnnWmmm, WnnnBqqqFmmm, FnnnTqqqFmmm, ...).
 */
export function buildCommandGroups(
  node: Node,
  links: Edge[],
  ownColor: string,
  count: number,
): CommandGroup[] {
  const world = node.id.replace(/^W/, '');
  const isOwnWorld = node.data?.backgroundColor === ownColor;
  const dships: number = node.data?.dships ?? 0;
  const fleets = readFleets(node, ownColor);
  const ownFleets = fleets.filter((f) => f.own);
  const movable = ownFleets.filter((f) => f.ships > 0);
  const enemyFleets = fleets.filter((f) => !f.own);
  // d3 ersetzt source/target der Kanten durch die Knoten-Objekte.
  const idOf = (end: unknown): string =>
    typeof end === 'string' ? end : (end as Node).id;
  const targets = Array.from(
    new Set(
      links
        .filter((l) => idOf(l.source) === node.id)
        .map((l) => idOf(l.target)),
    ),
  );

  const opt = (command: string, label = command): CommandOption => ({
    command,
    label,
  });
  const groups: CommandGroup[] = [];
  const add = (title: string, rows: CommandRow[]) => {
    if (rows.length > 0) {
      groups.push({ title, rows });
    }
  };

  add(
    'Bewegen',
    movable.map((f) => ({
      label: `Flotte ${f.number} (${f.ships})`,
      options: targets.map((t) => opt(`F${f.number}${t}`, `→ ${t}`)),
    })),
  );

  const fireRows: CommandRow[] = movable
    .map((f) => ({
      label: `Flotte ${f.number} feuert`,
      options: [
        ...enemyFleets.map((e) =>
          opt(`F${f.number}AF${e.number}`, `auf F${e.number}`),
        ),
        ...(!isOwnWorld && dships > 0
          ? [opt(`F${f.number}AD`, 'auf D-Schiffe')]
          : []),
      ],
    }))
    .filter((row) => row.options.length > 0);
  if (isOwnWorld && dships > 0) {
    fireRows.push({
      label: 'D-Schiffe feuern',
      options: enemyFleets.map((e) =>
        opt(`D${world}AF${e.number}`, `auf F${e.number}`),
      ),
    });
  }
  add(
    'Feuern',
    fireRows.filter((row) => row.options.length > 0),
  );

  const transferRows: CommandRow[] = [];
  for (const from of movable) {
    const options = [
      ...ownFleets
        .filter((to) => to.number !== from.number)
        .map((to) =>
          opt(
            `F${from.number}T${count}F${to.number}`,
            `${count} → F${to.number}`,
          ),
        ),
      ...(isOwnWorld
        ? [opt(`F${from.number}T${count}D`, `${count} → D-Schiffe`)]
        : []),
    ];
    if (options.length > 0) {
      transferRows.push({ label: `Flotte ${from.number}`, options });
    }
  }
  if (isOwnWorld && dships > 0 && ownFleets.length > 0) {
    transferRows.push({
      label: 'D-Schiffe',
      options: ownFleets.map((to) =>
        opt(`D${world}T${count}F${to.number}`, `${count} → F${to.number}`),
      ),
    });
  }
  add('Transfer', transferRows);

  if (isOwnWorld && ownFleets.length > 0) {
    add('Bauen', [
      {
        label: `Welt ${world}`,
        options: ownFleets.map((f) =>
          opt(
            `W${world}B${count}F${f.number}`,
            `${count} Schiffe → F${f.number}`,
          ),
        ),
      },
    ]);
  }

  if (isOwnWorld) {
    add('Hinterhalt aus', [
      {
        label: 'Zurückhalten',
        options: [opt(`Z${world}`, `Welt ${world}`), opt('Z', 'alle Welten')],
      },
    ]);
  }

  return groups;
}

/** Befehle, die im Text stehen (getrennt durch Leerzeichen/Zeilenumbrüche). */
export function splitCommands(text: string): string[] {
  return (text ?? '').split(/\s+/).filter((c) => c.length > 0);
}

/** Flotte, die der Befehl verwendet, wenn er ihre einmalige Aktion braucht (bewegen/feuern). */
function actingFleet(command: string): string | null {
  const match = /^(F\d+)(?:W|AF|AD)/.exec(command);
  return match ? match[1] : null;
}

/** Zwei verschiedene Befehle, die nicht beide im selben Zug stehen dürfen. */
export function commandsConflict(a: string, b: string): boolean {
  if (a === b) {
    return false;
  }
  const fleetA = actingFleet(a);
  if (fleetA !== null && fleetA === actingFleet(b)) {
    // Eine Flotte kann pro Zug nur einmal fliegen oder feuern.
    return true;
  }
  const isAmbush = (c: string) => /^Z\d*$/.test(c);
  // "Z" gilt für alle Welten und schließt "Znn" damit ein.
  return isAmbush(a) && isAmbush(b) && (a === 'Z' || b === 'Z');
}

export function isDisabled(command: string, selected: string[]): boolean {
  return (
    !selected.includes(command) &&
    selected.some((s) => commandsConflict(command, s))
  );
}

export function addCommand(text: string, command: string): string {
  const commands = splitCommands(text);
  return commands.includes(command)
    ? commands.join('\n')
    : [...commands, command].join('\n');
}

export function removeCommand(text: string, command: string): string {
  return splitCommands(text)
    .filter((c) => c !== command)
    .join('\n');
}
