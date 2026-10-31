import { Edge, Node } from '@galaxy/api-interfaces';
import {
  PBB_MIN_SHIPS,
  PBB_SHIP_COST,
  CLASSIC_BUILD_COST,
  CLASSIC_EMPEROR_INDUSTRY_COST,
  CLASSIC_EMPEROR_SCRAP_I_SHIPS,
  CLASSIC_PLUNDER_RECOVERY,
  PENALTY_PER_PLUNDER,
  raiderPlunderPoints,
  consumerGoodsPoints,
  artifactTypePoints,
  artifactTypeByName,
  isCharacterType,
} from '@galaxy/game-objects';

export interface CommandOption {
  command: string;
  label: string;
  /** Transfer, für den nach den gewählten Transfers nicht genug Schiffe übrig sind. */
  insufficient?: boolean;
}

/** Art einer Befehlszeile, damit die moderne Steuerung sie Flotten und Welten zuordnen kann. */
export type CommandKind =
  | 'move'
  | 'fire'
  | 'conditional'
  | 'homeFire'
  | 'dFire'
  | 'transfer'
  | 'dTransfer'
  | 'toWorld'
  | 'homeTransfer'
  | 'build'
  | 'industry'
  | 'migration'
  | 'metal'
  | 'probe'
  | 'homeProbe'
  | 'pbb'
  | 'plunder'
  | 'artifact'
  | 'peace'
  | 'gift'
  | 'worldGift'
  | 'relation'
  | 'ambush';

export interface CommandRow {
  label: string;
  options: CommandOption[];
  /** Nummer der Flotte, um die es in der Zeile geht (Routenplanung, moderne Steuerung). */
  fleet?: number;
  kind?: CommandKind;
}

export interface CommandGroup {
  title: string;
  rows: CommandRow[];
}

export interface WorldFleet {
  number: number;
  ships: number;
  own: boolean;
  /** Classic Game: geladenes Metall. */
  metal: number;
  atPeace: boolean;
  /** Classic Game: Flotte trägt eine PBB. */
  pbb: boolean;
  /** Classic Game: angehängte Artefakte. */
  artifacts: ArtifactInfo[];
  /** Farbe des Besitzers (wie auf der Karte). */
  color: string;
}

/** Artefakt, wie es das Backend in den Kartendaten liefert. */
export interface ArtifactInfo {
  number: number;
  name: string;
  /** Art des Artefakts, bestimmt die Punkte je Charakter (fehlt bei älteren Kartendaten). */
  type?: number;
}

/** Classic-Werte einer Welt, wie sie das Backend in node.data.classic liefert. */
export interface ClassicInfo {
  blackHole: boolean;
  population: number;
  industry: number;
  metal: number;
  iShips: number;
  pShips: number;
  /** Runden, die sich die Welt noch von einer Plünderung erholt. */
  plunderRecovery?: number;
  /** Wie oft die Welt schon geplündert wurde. */
  plunderCount?: number;
  /** Wie oft man selbst hier schon Konsumgüter entladen hat (nur Trader). */
  ownConsumerGoods?: number;
  /** Artefakte auf der Welt. */
  artifacts?: ArtifactInfo[];
}

/** Artefakt mit den Punkten je Runde für den eigenen Charakter, z. B. "V12 Holy Grail (+15/Rd.)". */
export function artifactLabel(artifact: ArtifactInfo, characterType: string | null): string {
  const label = `V${artifact.number} ${artifact.name}`;
  const type = artifact.type ?? artifactTypeByName(artifact.name);
  if (type === undefined || !isCharacterType(characterType)) {
    return label;
  }
  const points = artifactTypePoints(characterType, type);
  return `${label} (${points > 0 ? '+' : ''}${points}/Rd.)`;
}

/** Beschriftung für Konsumgüter: Der Trader sieht die Punkte der nächsten Entladung auf dieser Welt. */
export function consumerGoodsLabel(classic: ClassicInfo, characterType: string | null): string {
  return characterType === 'trader'
    ? `alles als Konsumgüter (+${consumerGoodsPoints((classic.ownConsumerGoods ?? 0) + 1)} Punkte)`
    : 'alles als Konsumgüter';
}

/** Beschriftung des Plünderbefehls: Der Raider bekommt Punkte (weniger je Wiederholung), alle anderen zahlen Strafe. */
export function plunderLabel(classic: ClassicInfo, characterType: string | null): string {
  const points = characterType === 'raider'
    ? `+${raiderPlunderPoints((classic.plunderCount ?? 0) + 1)}`
    : `−${PENALTY_PER_PLUNDER}`;
  return `Plündern (${points} Punkte, ${CLASSIC_PLUNDER_RECOVERY} Runden unproduktiv)`;
}

/** d3 ersetzt source/target der Kanten durch die Knoten-Objekte. */
export function idOf(end: unknown): string {
  return typeof end === 'string' ? end : (end as Node).id;
}

function readFleets(node: Node, ownColor: string): WorldFleet[] {
  const fleets: Array<{ label?: string; backgroundColor?: string; metal?: number; atPeace?: boolean; pbb?: boolean; artifacts?: ArtifactInfo[] }> =
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
        pbb: fleet.pbb ?? false,
        artifacts: fleet.artifacts ?? [],
        color: fleet.backgroundColor ?? '',
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
  // Gebaut wird erst nach den Transfers; die neuen Schiffe kann die Flotte im selben Zug fliegen lassen.
  for (const command of selected) {
    const build = new RegExp(`^W${world}B(\\d+)F(\\d+)$`).exec(command);
    const to = build ? find(+build[2]) : undefined;
    if (build && to) {
      to.ships += +build[1];
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
  const spent = selected.reduce((sum, command) => sum + industryCost(command, world), 0);
  return Math.max(0, usableIndustry(info) - spent);
}

/** Nutzbar ist das Kleinste aus Industrie, Metall und Bevölkerung. */
export function usableIndustry(info: ClassicInfo): number {
  return Math.min(info.industry, info.metal, info.population);
}

/** Industrie, die ein Befehl auf dieser Welt verbraucht (0, wenn er keine braucht). */
export function industryCost(command: string, world: string): number {
  const ships = new RegExp(`^W${world}B(\\d+)(?:I|P|F\\d+)$`).exec(command);
  const industry = new RegExp(`^W${world}I(\\d+)I$`).exec(command);
  const limit = new RegExp(`^W${world}I(\\d+)L$`).exec(command);
  const migrate = new RegExp(`^P${world}M(\\d+)W\\d+$`).exec(command);
  if (ships) {
    return +ships[1];
  } else if (industry) {
    return +industry[1] * CLASSIC_EMPEROR_INDUSTRY_COST;
  } else if (limit) {
    return +limit[1] * CLASSIC_BUILD_COST;
  } else if (migrate) {
    return +migrate[1];
  }
  return 0;
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
  characterType: string | null = null,
  collectorColors: string[] = [],
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
  // Auch leere Flotten: Ob Bau- oder Transferbefehle sie füllen, zeigt erst die Markierung fehlerhafter Befehle.
  const movable = ownFleets;
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
  // Ein Button je Anzahl: die aus dem Feld Anzahl und jede, mit der der Befehl schon gewählt ist.
  const counted = (make: (n: number) => CommandOption): CommandOption[] => {
    const pattern = new RegExp(`^${make(-1).command.replace('-1', '(\\d+)')}$`);
    const counts = new Set([count]);
    for (const command of selected) {
      const match = pattern.exec(command);
      if (match) {
        counts.add(+match[1]);
      }
    }
    return [...counts].sort((a, b) => a - b).map(make);
  };
  const transferOpt = (
    command: string,
    label: string,
    available: number,
    amount: number,
  ): CommandOption => ({
    ...opt(command, label),
    insufficient: !selected.includes(command) && available < amount,
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
      kind: 'move' as const,
      options: targets.map((t) => opt(`F${f.number}${t}`, `→ ${t}`)),
    })),
  );

  const fireRows: CommandRow[] = movable
    .map((f) => ({
      label: `Flotte ${f.number} feuert`,
      fleet: f.number,
      kind: 'fire' as CommandKind,
      options: [
        ...enemyFleets.map((e) =>
          opt(`F${f.number}AF${e.number}`, `auf F${e.number}`),
        ),
        ...(!isOwnWorld && dships > 0
          ? [opt(`F${f.number}AD`, 'auf D-Schiffe')]
          : []),
        ...(classic && !classic.blackHole && !isOwnWorld
          ? [
              opt(`F${f.number}AI`, 'auf I-Schiffe/Industrie'),
              opt(`F${f.number}AP`, 'auf P-Schiffe/Bevölkerung'),
              opt(`F${f.number}AH`, 'auf I- und P-Schiffe'),
            ]
          : []),
        ...(classic && f.pbb ? [opt(`F${f.number}D`, 'PBB abwerfen')] : []),
        opt(`F${f.number}S`, 'Bereithalten (Hinterhalt)'),
      ],
    }))
    .filter((row) => row.options.length > 0);
  if (classic && !classic.blackHole) {
    // Bedingt: feuert nur, wenn der Gegner hier in dieser Runde selbst angreift.
    for (const f of movable) {
      const options = [
        ...enemyFleets.map((e) => opt(`F${f.number}CF${e.number}`, `auf F${e.number}`)),
        ...(!isOwnWorld
          ? [
              opt(`F${f.number}CI`, 'auf I-Schiffe/Industrie'),
              opt(`F${f.number}CP`, 'auf P-Schiffe/Bevölkerung'),
              opt(`F${f.number}CH`, 'auf I- und P-Schiffe'),
            ]
          : []),
      ];
      if (options.length > 0) {
        fireRows.push({ label: `Flotte ${f.number} bedingt`, fleet: f.number, kind: 'conditional', options });
      }
    }
    if (isOwnWorld) {
      for (const [kind, label, ships] of [
        ['I', 'I-Schiffe feuern', projected.i],
        ['P', 'P-Schiffe feuern', projected.p],
      ] as Array<[string, string, number]>) {
        if (ships > 0) {
          fireRows.push({
            label,
            kind: 'homeFire',
            options: enemyFleets.flatMap((e) => [
              opt(`${kind}${world}AF${e.number}`, `auf F${e.number}`),
              opt(`${kind}${world}CF${e.number}`, `bedingt auf F${e.number}`),
            ]),
          });
        }
      }
    }
  }
  if (isOwnWorld && dships > 0) {
    fireRows.push({
      label: 'D-Schiffe feuern',
      kind: 'dFire',
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
        .flatMap((to) =>
          counted((n) =>
            transferOpt(`F${from.number}T${n}F${to.number}`, `${n} → F${to.number}`, from.ships, n),
          ),
        ),
      ...(isOwnWorld && !classic
        ? counted((n) =>
            transferOpt(`F${from.number}T${n}D`, `${n} → D-Schiffe`, from.ships, n),
          )
        : []),
    ];
    if (options.length > 0) {
      transferRows.push({ label: `Flotte ${from.number}`, fleet: from.number, kind: 'transfer', options });
    }
  }
  if (isOwnWorld && dships > 0 && ownFleets.length > 0) {
    transferRows.push({
      label: 'D-Schiffe',
      kind: 'dTransfer',
      options: ownFleets.flatMap((to) =>
        counted((n) =>
          transferOpt(`D${world}T${n}F${to.number}`, `${n} → F${to.number}`, dships, n),
        ),
      ),
    });
  }
  if (classic && !classic.blackHole && isOwnWorld) {
    for (const from of movable) {
      transferRows.push({
        label: `Flotte ${from.number} → Welt`,
        fleet: from.number,
        kind: 'toWorld',
        options: [
          ...counted((n) => transferOpt(`F${from.number}T${n}I`, `${n} → I-Schiffe`, from.ships, n)),
          ...counted((n) => transferOpt(`F${from.number}T${n}P`, `${n} → P-Schiffe`, from.ships, n)),
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
        kind: 'homeTransfer',
        options: [
          ...ownFleets.flatMap((to) =>
            counted((n) =>
              transferOpt(`${kind}${world}T${n}F${to.number}`, `${n} → F${to.number}`, available, n),
            ),
          ),
          ...counted((n) =>
            transferOpt(`${kind}${world}T${n}${other}`, `${n} → ${other}-Schiffe`, available, n),
          ),
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
          kind: 'build',
          options: [
            ...counted((n) => buildOpt(`W${world}B${n}I`, `${n} → I-Schiffe`, n)),
            ...counted((n) => buildOpt(`W${world}B${n}P`, `${n} → P-Schiffe`, n)),
            ...ownFleets.flatMap((f) =>
              counted((n) => buildOpt(`W${world}B${n}F${f.number}`, `${n} → F${f.number}`, n)),
            ),
          ],
        },
        {
          label: 'Industrie / Limit',
          kind: 'industry',
          options: [
            ...counted((n) =>
              buildOpt(`W${world}I${n}I`, `${n} Industrie bauen`, n * CLASSIC_EMPEROR_INDUSTRY_COST),
            ),
            ...counted((n) =>
              buildOpt(`W${world}I${n}L`, `Bev.-Limit +${n}`, n * CLASSIC_BUILD_COST),
            ),
            ...counted((n) => ({
              ...opt(`W${world}S${n}`, `${n} Industrie durch Verschrotten`),
              insufficient:
                !selected.includes(`W${world}S${n}`) &&
                n * CLASSIC_EMPEROR_SCRAP_I_SHIPS >
                  remainingIShips(classic, world, selected),
            })),
          ],
        },
        {
          label: 'Migration',
          kind: 'migration',
          options: targets.flatMap((t) =>
            counted((n) => buildOpt(`P${world}M${n}W${t.replace(/^W/, '')}`, `${n} → ${t}`, n)),
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
          fleet: f.number,
          kind: 'metal' as CommandKind,
          options: [
            ...(f.metal > 0
              ? [
                  opt(`F${f.number}U`, 'alles entladen'),
                  ...counted((n) => opt(`F${f.number}U${n}`, `${n} entladen`)),
                  opt(`F${f.number}N`, consumerGoodsLabel(classic, characterType)),
                  opt(`F${f.number}J`, 'alles wegwerfen'),
                ]
              : []),
            ...(isOwnWorld && f.ships > 0
              ? [
                  opt(`F${f.number}L`, 'laden (max.)'),
                  ...counted((n) => opt(`F${f.number}L${n}`, `${n} laden`)),
                ]
              : []),
          ],
        }))
        .filter((row) => row.options.length > 0),
    );
  }

  if (classic && !classic.blackHole) {
    const probeTargets = targets.map((t) => ({ id: t, number: t.replace(/^W/, '') }));
    add('Sonden', [
      ...movable
        .filter((f) => f.ships > 0)
        .map((f) => ({
          label: `Flotte ${f.number}`,
          fleet: f.number,
          kind: 'probe' as CommandKind,
          options: probeTargets.map((t) => opt(`F${f.number}P${t.number}`, `→ ${t.id}`)),
        })),
      ...(isOwnWorld
        ? ([
            ['I', 'I-Schiff', projected.i],
            ['P', 'P-Schiff', projected.p],
          ] as Array<[string, string, number]>)
            .filter(([, , ships]) => ships > 0)
            .map(([kind, label]) => ({
              label,
              kind: 'homeProbe' as CommandKind,
              options: probeTargets.map((t) => opt(`${kind}${world}P${t.number}`, `→ ${t.id}`)),
            }))
        : []),
    ].filter((row) => row.options.length > 0));
    add(
      'PBB',
      ownFleets
        .filter((f) => !f.pbb && (f.ships >= PBB_MIN_SHIPS || selected.includes(`F${f.number}B`)))
        .map((f) => ({
          label: `Flotte ${f.number} (${f.ships})`,
          fleet: f.number,
          kind: 'pbb' as CommandKind,
          options: [opt(`F${f.number}B`, `PBB bauen (kostet ${PBB_SHIP_COST} Schiffe)`)],
        })),
    );
  }

  if (classic && !classic.blackHole && isOwnWorld && (classic.plunderRecovery ?? 0) === 0) {
    add('Plündern', [
      {
        label: `Welt ${world}`,
        kind: 'plunder',
        options: [opt(`W${world}X`, plunderLabel(classic, characterType))],
      },
    ]);
  }

  if (classic && !classic.blackHole) {
    // Artefakte: von der eigenen Welt an eigene Flotten hängen, von eigenen Flotten abwerfen.
    // Flotten von Spielern, die man als Collector markiert hat, nehmen Artefakte von Welt und Flotte;
    // von Flotte zu eigener Flotte geht es nur, wenn man selbst Collector ist.
    const collectorFleets = enemyFleets.filter((f) => collectorColors.includes(f.color));
    const hook = (artifact: ArtifactInfo, fleet: WorldFleet, collector: boolean) =>
      opt(`V${artifact.number}F${fleet.number}`, collector ? `an Flotte ${fleet.number} (Collector)` : `an Flotte ${fleet.number}`);
    add('Artefakte', [
      ...(isOwnWorld ? classic.artifacts ?? [] : []).map((artifact) => ({
        label: artifactLabel(artifact, characterType),
        kind: 'artifact' as CommandKind,
        options: [
          ...ownFleets.map((f) => hook(artifact, f, false)),
          ...collectorFleets.map((f) => hook(artifact, f, true)),
        ],
      })),
      ...ownFleets.flatMap((f) =>
        f.artifacts.map((artifact) => ({
          label: `${artifactLabel(artifact, characterType)} (Flotte ${f.number})`,
          kind: 'artifact' as CommandKind,
          options: [
            opt(`V${artifact.number}W`, `auf Welt ${world} abwerfen`),
            ...(characterType === 'collector'
              ? ownFleets.filter((t) => t.number !== f.number).map((t) => hook(artifact, t, false))
              : []),
            ...collectorFleets.map((t) => hook(artifact, t, true)),
          ],
        })),
      ),
    ].filter((row) => row.options.length > 0));
  }

  if (classic && !classic.blackHole) {
    add(
      'At Peace',
      ownFleets.map((f) => ({
        label: `Flotte ${f.number}${f.atPeace ? ' (At Peace)' : ''}`,
        fleet: f.number,
        kind: 'peace' as CommandKind,
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
          fleet: f.number,
          kind: 'gift' as CommandKind,
          options: players.map((p) => opt(`F${f.number}G=${p}`, `an ${p}`)),
        })),
        ...(isOwnWorld
          ? [
              {
                label: `Welt ${world}`,
                kind: 'worldGift' as CommandKind,
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
        kind: 'relation' as CommandKind,
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
        kind: 'ambush',
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
    const match = /^F(\d+)(?:W|A[FDIPH]|C[FIPH]|D$|P\d)/.exec(c);
    return match !== null && empty.has(+match[1]);
  });
  return [...projected.failed, ...emptyActing];
}

/** Stand einer Welt nach den gewählten Transfers und Bauaufträgen (für die moderne Steuerung). */
export interface WorldProjection {
  world: string;
  isOwnWorld: boolean;
  classic: ClassicInfo | null;
  /** Flotten vor den gewählten Befehlen. */
  before: WorldFleet[];
  fleets: WorldFleet[];
  dships: number;
  iShips: number;
  pShips: number;
}

export function projectWorld(node: Node, ownColor: string, selected: string[]): WorldProjection {
  const world = node.id.replace(/^W/, '');
  const classic: ClassicInfo | null = node.data?.classic ?? null;
  const before = readFleets(node, ownColor);
  const projected = applyTransfers(before, node.data?.dships ?? 0, world, selected, {
    i: classic?.iShips ?? 0,
    p: classic?.pShips ?? 0,
  });
  return {
    world,
    isOwnWorld: node.data?.backgroundColor === ownColor,
    classic,
    before,
    fleets: projected.fleets,
    dships: projected.dships,
    iShips: projected.i,
    pShips: projected.p,
  };
}

/** Befehle, die im Text stehen (getrennt durch Leerzeichen/Zeilenumbrüche). */
export function splitCommands(text: string): string[] {
  return (text ?? '').split(/\s+/).filter((c) => c.length > 0);
}

/** Flotte, die der Befehl verwendet, wenn er ihre einmalige Aktion braucht (bewegen/feuern/bereithalten). */
function actingFleet(command: string): string | null {
  const match = /^(F\d+)(?:W|A[FDIPH]|C[FIPH]|S|G=|D$)/.exec(command);
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
  // I- bzw. P-Schiffe einer Welt haben pro Runde einen Feuerbefehl.
  const home = /^([IP]\d+)[AC]F\d+$/.exec(a);
  const otherHome = /^([IP]\d+)[AC]F\d+$/.exec(b);
  if (home && otherHome && home[1] === otherHome[1]) {
    return true;
  }
  // Jedes Artefakt bekommt pro Zug nur einen Befehl (anhängen oder abwerfen).
  const artifact = /^V(\d+)(?:F\d+|W)$/.exec(a);
  const otherArtifact = /^V(\d+)(?:F\d+|W)$/.exec(b);
  if (artifact && otherArtifact && artifact[1] === otherArtifact[1]) {
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

export interface CommandCheck {
  ok: boolean;
  /** Gewählte Befehle, die dem neuen widersprechen und durch ihn ersetzt werden. */
  replaces: string[];
  reason?: string;
}

/**
 * Prüft einen Befehl, der per Drag & Drop entsteht, nach denselben Regeln wie die Buttons.
 * Widersprechende Befehle (z. B. ein anderer Flug derselben Flotte) zählen nicht, sie werden ersetzt.
 */
export function checkCommand(
  node: Node,
  links: Edge[],
  ownColor: string,
  count: number,
  selected: string[],
  players: string[],
  command: string,
): CommandCheck {
  if (selected.includes(command)) {
    return { ok: true, replaces: [] };
  }
  const replaces = selected.filter((s) => commandsConflict(command, s));
  const rest = selected.filter((s) => !replaces.includes(s));
  const rows = buildCommandGroups(node, links, ownColor, count, rest, players).flatMap((g) => g.rows);
  // Mehrschritt-Flüge stehen nicht als Button da: Es reicht, dass die Flotte hier fliegen kann.
  const multiStep = /^F(\d+)(?:W\d+){2,}$/.exec(command);
  const option = multiStep
    ? rows.some((r) => r.kind === 'move' && r.fleet === +multiStep[1])
      ? { command, label: command }
      : undefined
    : rows.flatMap((r) => r.options).find((o) => o.command === command);
  if (!option) {
    return { ok: false, replaces, reason: `${command} ist hier nicht möglich.` };
  }
  if (option.insufficient) {
    return { ok: false, replaces, reason: `Für ${command} reicht der Vorrat nicht.` };
  }
  if (isDisabled(command, rest)) {
    return { ok: false, replaces, reason: `Höchstens ${MAX_GIFTS} Geschenke pro Runde.` };
  }
  return { ok: true, replaces };
}

/** Ersetzt widersprechende Befehle durch den neuen. */
export function replaceCommands(text: string, command: string, replaces: string[]): string {
  return addCommand(
    replaces.reduce((current, old) => removeCommand(current, old), text),
    command,
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
