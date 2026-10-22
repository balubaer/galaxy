import { Edge, Node } from '@galaxy/api-interfaces';
import {
  CLASSIC_BUILD_COST,
  CLASSIC_EMPEROR_INDUSTRY_COST,
  CLASSIC_EMPEROR_SCRAP_I_SHIPS,
} from '@galaxy/game-objects';

export interface CommandOption {
  command: string;
  label: string;
  /** Transfer, für den nach den gewählten Transfers nicht genug Schiffe übrig sind. */
  insufficient?: boolean;
}

export interface CommandRow {
  label: string;
  options: CommandOption[];
  /** Bei Bewegungszeilen: Nummer der Flotte (für die Routenplanung). */
  fleet?: number;
}

export interface CommandGroup {
  title: string;
  rows: CommandRow[];
}

interface WorldFleet {
  number: number;
  ships: number;
  own: boolean;
  /** Classic Game: geladenes Metall. */
  metal: number;
  atPeace: boolean;
}

/** Classic-Werte einer Welt, wie sie das Backend in node.data.classic liefert. */
interface ClassicInfo {
  blackHole: boolean;
  population: number;
  industry: number;
  metal: number;
  iShips: number;
  pShips: number;
}

/** d3 ersetzt source/target der Kanten durch die Knoten-Objekte. */
export function idOf(end: unknown): string {
  return typeof end === 'string' ? end : (end as Node).id;
}

function readFleets(node: Node, ownColor: string): WorldFleet[] {
  const fleets: Array<{ label?: string; backgroundColor?: string; metal?: number; atPeace?: boolean }> =
    node.data?.fleets ?? [];
  const result: WorldFleet[] = [];
  for (const fleet of fleets) {
    const match = /^F(\d+)=(\d+)$/.exec(fleet.label ?? '');
    if (match) {
      result.push({
        number: +match[1],
        ships: +match[2],
        own: fleet.backgroundColor === ownColor,
        metal: fleet.metal ?? 0,
        atPeace: fleet.atPeace ?? false,
      });
    }
  }
  return result;
}

/**
 * Wendet die gewählten Transfers in Textreihenfolge auf Schiffe und D-Schiffe an,
 * wie es die Auswertung tut (Transfer läuft vor Bewegen und Feuern).
 * Transfers ohne genug Schiffe oder mit unbekannter Flotte bleiben wirkungslos.
 */
function applyTransfers(
  fleets: WorldFleet[],
  dships: number,
  world: string,
  selected: string[],
  home = { i: 0, p: 0 },
): { fleets: WorldFleet[]; dships: number; failed: string[]; i: number; p: number } {
  const failed: string[] = [];
  let iShips = home.i;
  let pShips = home.p;
  const result = fleets.map((f) => ({ ...f }));
  const find = (n: number) => result.find((f) => f.own && f.number === n);
  for (const command of selected) {
    const toFleet = /^F(\d+)T(\d+)F(\d+)$/.exec(command);
    const toD = /^F(\d+)T(\d+)D$/.exec(command);
    const fromD = /^D(\d+)T(\d+)F(\d+)$/.exec(command);
    // Classic: I- und P-Schiffe der Welt (FaaTxxI/P, IaaTxxFbb, PaaTxxFbb, IaaTxxP, PaaTxxI).
    const toHome = /^F(\d+)T(\d+)([IP])$/.exec(command);
    const fromHome = /^([IP])(\d+)T(\d+)F(\d+)$/.exec(command);
    const betweenHome = /^([IP])(\d+)T(\d+)([IP])$/.exec(command);
    if (toHome) {
      const from = find(+toHome[1]);
      if (from) {
        if (from.ships >= +toHome[2]) {
          from.ships -= +toHome[2];
          if (toHome[3] === 'I') {
            iShips += +toHome[2];
          } else {
            pShips += +toHome[2];
          }
        } else {
          failed.push(command);
        }
      }
    } else if (fromHome && fromHome[2] === world) {
      const to = find(+fromHome[4]);
      const available = fromHome[1] === 'I' ? iShips : pShips;
      if (to) {
        if (available >= +fromHome[3]) {
          if (fromHome[1] === 'I') {
            iShips -= +fromHome[3];
          } else {
            pShips -= +fromHome[3];
          }
          to.ships += +fromHome[3];
        } else {
          failed.push(command);
        }
      }
    } else if (betweenHome && betweenHome[2] === world && betweenHome[1] !== betweenHome[4]) {
      const count = +betweenHome[3];
      const available = betweenHome[1] === 'I' ? iShips : pShips;
      if (available >= count) {
        iShips += betweenHome[1] === 'I' ? -count : count;
        pShips += betweenHome[1] === 'P' ? -count : count;
      } else {
        failed.push(command);
      }
    } else if (toFleet) {
      const from = find(+toFleet[1]);
      const to = find(+toFleet[3]);
      if (from && to) {
        if (from.ships >= +toFleet[2]) {
          from.ships -= +toFleet[2];
          to.ships += +toFleet[2];
        } else {
          failed.push(command);
        }
      }
    } else if (toD) {
      const from = find(+toD[1]);
      if (from) {
        if (from.ships >= +toD[2]) {
          from.ships -= +toD[2];
          dships += +toD[2];
        } else {
          failed.push(command);
        }
      }
    } else if (fromD && fromD[1] === world) {
      const to = find(+fromD[3]);
      if (to) {
        if (dships >= +fromD[2]) {
          dships -= +fromD[2];
          to.ships += +fromD[2];
        } else {
          failed.push(command);
        }
      }
    }
  }
  return { fleets: result, dships, failed, i: iShips, p: pShips };
}

/**
 * Industrie dieser Welt, die für Bauen, Migration usw. noch übrig ist, nachdem die gewählten Befehle
 * ihren Teil verbraucht haben. Nutzbar ist das Kleinste aus Industrie, Metall und Bevölkerung.
 * Die Kosten für Industrie gelten für den Emperor (den einzigen Charakter im Classic Game).
 */
export function remainingIndustry(
  info: ClassicInfo,
  world: string,
  selected: string[],
): number {
  let spent = 0;
  for (const command of selected) {
    const ships = new RegExp(`^W${world}B(\\d+)(?:I|P|F\\d+)$`).exec(command);
    const industry = new RegExp(`^W${world}I(\\d+)I$`).exec(command);
    const limit = new RegExp(`^W${world}I(\\d+)L$`).exec(command);
    const migrate = new RegExp(`^P${world}M(\\d+)W\\d+$`).exec(command);
    if (ships) {
      spent += +ships[1];
    } else if (industry) {
      spent += +industry[1] * CLASSIC_EMPEROR_INDUSTRY_COST;
    } else if (limit) {
      spent += +limit[1] * CLASSIC_BUILD_COST;
    } else if (migrate) {
      spent += +migrate[1];
    }
  }
  const usable = Math.min(info.industry, info.metal, info.population);
  return Math.max(0, usable - spent);
}

/** I-Schiffe, die nach den gewählten Verschrott-Befehlen (WaaSxx) noch übrig sind. */
function remainingIShips(info: ClassicInfo, world: string, selected: string[]): number {
  const scrapped = selected
    .map((c) => new RegExp(`^W${world}S(\\d+)$`).exec(c))
    .reduce(
      (sum, m) => sum + (m ? +m[1] * CLASSIC_EMPEROR_SCRAP_I_SHIPS : 0),
      0,
    );
  return Math.max(0, info.iShips - scrapped);
}

/**
 * Alle Befehle, die auf der gewählten Welt möglich sind, gruppiert nach Art.
 * Syntax siehe command.ts (FnnnWmmm, FnnnAFmmm, FnnnS, FnnnTqqqFmmm, ...).
 * Schiffe bauen gibt es im Core Game nicht, sie entstehen nur als D-Schiffe.
 * Bereits gewählte Transfers (selected) zählen mit: Eine Flotte, die dadurch Schiffe erhält, kann fliegen.
 */
export function buildCommandGroups(
  node: Node,
  links: Edge[],
  ownColor: string,
  count: number,
  selected: string[] = [],
  players: string[] = [],
): CommandGroup[] {
  const world = node.id.replace(/^W/, '');
  const isOwnWorld = node.data?.backgroundColor === ownColor;
  const classic: ClassicInfo | null = node.data?.classic ?? null;
  const projected = applyTransfers(
    readFleets(node, ownColor),
    node.data?.dships ?? 0,
    world,
    selected,
    { i: classic?.iShips ?? 0, p: classic?.pShips ?? 0 },
  );
  const dships = projected.dships;
  const fleets = projected.fleets;
  const ownFleets = fleets.filter((f) => f.own);
  // Flotten mit gewähltem Befehl bleiben sichtbar, damit der Befehl wieder abgewählt werden kann.
  const hasSelected = (n: number) =>
    selected.some((c) => new RegExp(`^F${n}(?!\\d)`).test(c));
  const movable = ownFleets.filter((f) => f.ships > 0 || hasSelected(f.number));
  const enemyFleets = fleets.filter((f) => !f.own);
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
  const transferOpt = (
    command: string,
    label: string,
    available: number,
  ): CommandOption => ({
    ...opt(command, label),
    insufficient: !selected.includes(command) && available < count,
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
      fleet: f.number,
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
        opt(`F${f.number}S`, 'Bereithalten (Hinterhalt)'),
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
          transferOpt(
            `F${from.number}T${count}F${to.number}`,
            `${count} → F${to.number}`,
            from.ships,
          ),
        ),
      ...(isOwnWorld && !classic
        ? [
            transferOpt(
              `F${from.number}T${count}D`,
              `${count} → D-Schiffe`,
              from.ships,
            ),
          ]
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
        transferOpt(
        `D${world}T${count}F${to.number}`,
        `${count} → F${to.number}`,
        dships,
      ),
      ),
    });
  }
  if (classic && !classic.blackHole && isOwnWorld) {
    for (const from of movable) {
      transferRows.push({
        label: `Flotte ${from.number} → Welt`,
        options: [
          transferOpt(`F${from.number}T${count}I`, `${count} → I-Schiffe`, from.ships),
          transferOpt(`F${from.number}T${count}P`, `${count} → P-Schiffe`, from.ships),
        ],
      });
    }
    for (const [kind, label, available] of [
      ['I', 'I-Schiffe', projected.i],
      ['P', 'P-Schiffe', projected.p],
    ] as Array<[string, string, number]>) {
      const other = kind === 'I' ? 'P' : 'I';
      transferRows.push({
        label,
        options: [
          ...ownFleets.map((to) =>
            transferOpt(`${kind}${world}T${count}F${to.number}`, `${count} → F${to.number}`, available),
          ),
          transferOpt(`${kind}${world}T${count}${other}`, `${count} → ${other}-Schiffe`, available),
        ],
      });
    }
  }
  add('Transfer', transferRows);

  if (classic && !classic.blackHole) {
    const remaining = remainingIndustry(classic, world, selected);
    const buildOpt = (
      command: string,
      label: string,
      cost: number,
    ): CommandOption => ({
      ...opt(command, label),
      insufficient: !selected.includes(command) && cost > remaining,
    });
    if (isOwnWorld) {
      add('Bauen', [
        {
          label: `Schiffe (Industrie übrig: ${remaining})`,
          options: [
            buildOpt(`W${world}B${count}I`, `${count} → I-Schiffe`, count),
            buildOpt(`W${world}B${count}P`, `${count} → P-Schiffe`, count),
            ...ownFleets.map((f) =>
              buildOpt(`W${world}B${count}F${f.number}`, `${count} → F${f.number}`, count),
            ),
          ],
        },
        {
          label: 'Industrie / Limit',
          options: [
            buildOpt(
              `W${world}I${count}I`,
              `${count} Industrie bauen`,
              count * CLASSIC_EMPEROR_INDUSTRY_COST,
            ),
            buildOpt(
              `W${world}I${count}L`,
              `Bev.-Limit +${count}`,
              count * CLASSIC_BUILD_COST,
            ),
            {
              ...opt(
                `W${world}S${count}`,
                `${count} Industrie durch Verschrotten`,
              ),
              insufficient:
                !selected.includes(`W${world}S${count}`) &&
                count * CLASSIC_EMPEROR_SCRAP_I_SHIPS >
                  remainingIShips(classic, world, selected),
            },
          ],
        },
        {
          label: 'Migration',
          options: targets.map((t) =>
            buildOpt(`P${world}M${count}W${t.replace(/^W/, '')}`, `${count} → ${t}`, count),
          ),
        },
      ]);
    }
    add(
      'Metall',
      ownFleets
        .filter((f) => f.ships > 0 || f.metal > 0 || hasSelected(f.number))
        .map((f) => ({
          label: `Flotte ${f.number} (Metall ${f.metal})`,
          options: [
            ...(f.metal > 0
              ? [
                  opt(`F${f.number}U`, 'alles entladen'),
                  opt(`F${f.number}U${count}`, `${count} entladen`),
                  opt(`F${f.number}N`, 'alles als Konsumgüter'),
                  opt(`F${f.number}J`, 'alles wegwerfen'),
                ]
              : []),
            ...(isOwnWorld && f.ships > 0
              ? [
                  opt(`F${f.number}L`, 'laden (max.)'),
                  opt(`F${f.number}L${count}`, `${count} laden`),
                ]
              : []),
          ],
        }))
        .filter((row) => row.options.length > 0),
    );
  }

  if (classic && !classic.blackHole) {
    add(
      'At Peace',
      ownFleets.map((f) => ({
        label: `Flotte ${f.number}${f.atPeace ? ' (At Peace)' : ''}`,
        options: [
          opt(`F${f.number}Q`, 'At Peace'),
          opt(`F${f.number}X`, 'nicht At Peace'),
        ],
      })),
    );
    add(
      'Geschenke',
      [
        ...ownFleets.map((f) => ({
          label: `Flotte ${f.number}`,
          options: players.map((p) => opt(`F${f.number}G=${p}`, `an ${p}`)),
        })),
        ...(isOwnWorld
          ? [
              {
                label: `Welt ${world}`,
                options: players.map((p) => opt(`W${world}G=${p}`, `an ${p}`)),
              },
            ]
          : []),
      ].filter((row) => row.options.length > 0),
    );
    add(
      'Beziehungen',
      players.map((p) => ({
        label: p,
        options: [
          opt(`A=${p}`, 'Verbündeter'),
          opt(`N=${p}`, 'kein Verbündeter'),
          opt(`L=${p}`, 'darf Metall laden'),
          opt(`X=${p}`, 'darf nicht laden'),
        ],
      })),
    );
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

/**
 * Gewählte Befehle dieser Welt, die an fehlenden Schiffen scheitern würden:
 * Transfers ohne genug Schiffe sowie Flug- und Feuerbefehle einer Flotte ohne Schiffe.
 */
export function brokenCommands(
  node: Node,
  ownColor: string,
  selected: string[],
): string[] {
  const world = node.id.replace(/^W/, '');
  const classic: ClassicInfo | undefined = node.data?.classic;
  const projected = applyTransfers(
    readFleets(node, ownColor),
    node.data?.dships ?? 0,
    world,
    selected,
    { i: classic?.iShips ?? 0, p: classic?.pShips ?? 0 },
  );
  const empty = new Set(
    projected.fleets.filter((f) => f.own && f.ships === 0).map((f) => f.number),
  );
  const emptyActing = selected.filter((c) => {
    const match = /^F(\d+)(?:W|AF|AD)/.exec(c);
    return match !== null && empty.has(+match[1]);
  });
  return [...projected.failed, ...emptyActing];
}

/** Befehle, die im Text stehen (getrennt durch Leerzeichen/Zeilenumbrüche). */
export function splitCommands(text: string): string[] {
  return (text ?? '').split(/\s+/).filter((c) => c.length > 0);
}

/** Flotte, die der Befehl verwendet, wenn er ihre einmalige Aktion braucht (bewegen/feuern/bereithalten). */
function actingFleet(command: string): string | null {
  const match = /^(F\d+)(?:W|AF|AD|S|G=)/.exec(command);
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
  // Pro Welt wird nur zu einem Ziel migriert.
  const migration = /^P(\d+)M\d+W\d+$/.exec(a);
  const otherMigration = /^P(\d+)M\d+W\d+$/.exec(b);
  if (migration && otherMigration && migration[1] === otherMigration[1]) {
    return true;
  }
  // Je Flotte und Art (entladen, Konsumgüter, wegwerfen, laden) nur eine Mengenangabe.
  const metal = /^F(\d+)([UNJL])\d*$/.exec(a);
  const otherMetal = /^F(\d+)([UNJL])\d*$/.exec(b);
  if (metal && otherMetal && metal[1] === otherMetal[1] && metal[2] === otherMetal[2]) {
    return true;
  }
  // Pro Flotte entweder At Peace oder nicht.
  const peace = /^F(\d+)[QX]$/.exec(a);
  const otherPeace = /^F(\d+)[QX]$/.exec(b);
  if (peace && otherPeace && peace[1] === otherPeace[1]) {
    return true;
  }
  // Pro Spieler nur eine Aussage zum Bündnis (A=/N=) und eine zum Laden (L=/X=).
  const relation = /^([ANLX])=(.+)$/.exec(a);
  const otherRelation = /^([ANLX])=(.+)$/.exec(b);
  if (
    relation &&
    otherRelation &&
    relation[2] === otherRelation[2] &&
    'AN'.includes(relation[1]) === 'AN'.includes(otherRelation[1])
  ) {
    return true;
  }
  const isAmbush = (c: string) => /^Z\d*$/.test(c);
  // "Z" gilt für alle Welten und schließt "Znn" damit ein.
  return isAmbush(a) && isAmbush(b) && (a === 'Z' || b === 'Z');
}

/** Pro Runde sind höchstens zwei Geschenke (FaaG=name, WaaG=name) möglich. */
export const MAX_GIFTS = 2;

function isGift(command: string): boolean {
  return /^[FW]\d+G=/.test(command);
}

export function isDisabled(command: string, selected: string[]): boolean {
  return (
    !selected.includes(command) &&
    (selected.some((s) => commandsConflict(command, s)) ||
      (isGift(command) && selected.filter(isGift).length >= MAX_GIFTS))
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

/** Mehrschritt-Flug: Eine Flotte kann bis zu drei Welten nacheinander anfliegen (FnnnWmmmWooo...). */
export const MAX_ROUTE_STEPS = 3;

export interface RoutePlan {
  fleet: number;
  start: string;
  path: string[];
}

export function routeWorlds(plan: RoutePlan): string[] {
  return [plan.start, ...plan.path];
}

export function canExtendRoute(
  plan: RoutePlan,
  links: Edge[],
  worldId: string,
): boolean {
  if (plan.path.length >= MAX_ROUTE_STEPS) {
    return false;
  }
  const last = routeWorlds(plan)[plan.path.length];
  return links.some(
    (l) => idOf(l.source) === last && idOf(l.target) === worldId,
  );
}

export function extendRoute(
  plan: RoutePlan,
  links: Edge[],
  worldId: string,
): RoutePlan {
  return canExtendRoute(plan, links, worldId)
    ? { ...plan, path: [...plan.path, worldId] }
    : plan;
}

export function routeCommand(plan: RoutePlan): string {
  return `F${plan.fleet}${plan.path.join('')}`;
}

/** Mehrschritt-Flugbefehle (FnnnWmmmWooo...) einer Flotte, die im Text stehen. */
export function multiStepMoves(
  commands: string[],
  fleet: number | undefined,
): string[] {
  const pattern = new RegExp(`^F${fleet}(?:W\\d+){2,}$`);
  return fleet === undefined ? [] : commands.filter((c) => pattern.test(c));
}
