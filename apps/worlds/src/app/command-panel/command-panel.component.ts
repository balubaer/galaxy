import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Edge, Node } from '@galaxy/api-interfaces';
import {
  brokenCommands,
  buildCommandGroups,
  checkCommand,
  CommandGroup,
  CommandKind,
  CommandOption,
  CommandRow,
  idOf,
  industryCost,
  isDisabled,
  MAX_ROUTE_STEPS,
  multiStepMoves,
  projectWorld,
  routeCommand,
  RoutePlan,
  splitCommands,
  usableIndustry,
  WorldFleet,
  WorldProjection,
} from '../command-table/command-options';
import {
  commandWorld,
  CommandDescription,
  describeCommand,
} from '../command-table/command-describe';

interface Action {
  key: string;
  label: string;
  icon: string;
  kinds: CommandKind[];
  /** Befehle mit Mengenangabe: der Schieberegler Menge wird eingeblendet. */
  amount?: boolean;
}

const FLEET_ACTIONS: Action[] = [
  { key: 'move', label: 'Fliegen', icon: '➜', kinds: ['move'] },
  { key: 'fire', label: 'Feuern', icon: '✸', kinds: ['fire', 'conditional'] },
  { key: 'transfer', label: 'Transfer', icon: '⇄', kinds: ['transfer', 'toWorld'], amount: true },
  { key: 'metal', label: 'Metall', icon: '⛏', kinds: ['metal'], amount: true },
  { key: 'probe', label: 'Sonde', icon: '◎', kinds: ['probe'] },
  { key: 'pbb', label: 'PBB', icon: '☢', kinds: ['pbb'] },
  { key: 'peace', label: 'Frieden', icon: '☮', kinds: ['peace'] },
  { key: 'gift', label: 'Verschenken', icon: '✉', kinds: ['gift'] },
];

const WORLD_ACTIONS: Action[] = [
  { key: 'build', label: 'Werft', icon: '⚒', kinds: ['build', 'industry', 'migration'], amount: true },
  { key: 'plunder', label: 'Plündern', icon: '⚑', kinds: ['plunder'] },
  { key: 'stock', label: 'Lager', icon: '⇄', kinds: ['dTransfer', 'homeTransfer', 'homeProbe'], amount: true },
  { key: 'defense', label: 'Verteidigung', icon: '⛨', kinds: ['dFire', 'homeFire', 'ambush'] },
  { key: 'diplomacy', label: 'Diplomatie', icon: '✉', kinds: ['relation', 'worldGift'] },
];

/** Zeilen, deren Optionen sich gegenseitig ausschließen: als Umschalter dargestellt. */
const SEGMENTED: CommandKind[] = ['peace', 'relation'];

interface FleetCard {
  fleet: WorldFleet;
  /** Schiffe vor den gewählten Transfers und Bauaufträgen. */
  shipsBefore: number;
  commands: string[];
  actions: Action[];
}

/** Was per Drag & Drop gezogen wird: eine eigene Flotte oder ein Schiffsvorrat der Welt. */
type DragItem = { type: 'fleet'; fleet: number } | { type: 'D' | 'I' | 'P' };

/** Ziel eines Drops. */
type DropTarget =
  | { type: 'fleet'; fleet: number }
  | { type: 'enemy'; fleet: number }
  | { type: 'D' | 'I' | 'P' }
  | { type: 'world'; world: string };

interface AmountDialog {
  title: string;
  max: number;
  value: number;
  make: (n: number) => string;
  error?: string;
}

interface StockTile {
  type: 'D' | 'I' | 'P';
  label: string;
  ships: number;
  before: number;
}

interface CommandEntry {
  command: string;
  description: CommandDescription;
  world: string | undefined;
  broken: boolean;
}

interface BudgetSegment {
  command: string;
  cost: number;
  text: string;
}

@Component({
  selector: 'galaxy-command-panel',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './command-panel.component.html',
  styleUrls: ['./command-panel.component.css'],
})
export class CommandPanelComponent implements OnChanges {
  @Input() node: Node | undefined;
  @Input() links: Edge[] = [];
  /** Alle Welten der Karte: Standort der Flotten für die Befehlsübersicht. */
  @Input() nodes: Node[] = [];
  @Input() ownColor = '';
  @Input() players: string[] = [];
  /** Classic Game: eigener Charakter (z. B. für die Plünderpunkte). */
  @Input() characterType: string | null = null;
  @Input() commandText = '';
  @Input() readonly = false;
  @Input() routePlan: RoutePlan | null = null;
  @Output() routeStarted = new EventEmitter<number>();
  @Output() routeStepBack = new EventEmitter<void>();
  @Output() routeConfirmed = new EventEmitter<void>();
  @Output() routeCancelled = new EventEmitter<void>();
  @Output() commandToggled = new EventEmitter<{ command: string; selected: boolean }>();
  /** Neuer Befehl, der widersprechende ersetzt (Drag & Drop). */
  @Output() commandReplaced = new EventEmitter<{ command: string; replaces: string[] }>();
  /** Befehl, über dem die Maus steht: die Karte hebt ihn hervor. */
  @Output() commandHovered = new EventEmitter<string | null>();
  @Output() worldRequested = new EventEmitter<string>();

  readonly maxRouteSteps = MAX_ROUTE_STEPS;

  /** Flotte, deren Aktionen aufgeklappt sind, und die gewählte Aktion. */
  activeFleet: number | null = null;
  activeAction: string | null = null;
  worldAction: string | null = null;
  amount = 1;
  dialog: AmountDialog | null = null;
  dragging: DragItem | null = null;
  dropHover: string | null = null;
  onlyThisWorld = false;

  selected: string[] = [];
  groups: CommandGroup[] = [];
  projection: WorldProjection | null = null;
  broken: string[] = [];
  cards: FleetCard[] = [];
  enemies: WorldFleet[] = [];
  stock: StockTile[] = [];
  neighbours: string[] = [];
  worldActions: Action[] = [];
  entries: CommandEntry[] = [];
  budget: { usable: number; segments: BudgetSegment[]; remaining: number } | null = null;

  private shownWorld: string | undefined;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnChanges() {
    if (this.node?.id !== this.shownWorld) {
      this.shownWorld = this.node?.id;
      this.activeFleet = null;
      this.activeAction = null;
      this.dialog = null;
    }
    this.refresh();
  }

  /** Berechnet alles, was die Vorlage zeigt, aus Welt, Befehlstext und Menge. */
  refresh() {
    this.selected = splitCommands(this.commandText);
    this.entries = this.buildEntries();
    if (!this.node) {
      this.groups = [];
      this.projection = null;
      this.cards = [];
      this.enemies = [];
      this.stock = [];
      this.neighbours = [];
      this.worldActions = [];
      this.budget = null;
      return;
    }
    const node = this.node;
    this.groups = buildCommandGroups(
      node, this.links, this.ownColor, this.amount, this.selected, this.players, this.characterType,
    );
    this.projection = projectWorld(node, this.ownColor, this.selected);
    this.broken = brokenCommands(node, this.ownColor, this.selected);
    const p = this.projection;
    const rows = this.rows();
    this.cards = p.fleets
      .filter((f) => f.own)
      .map((fleet) => ({
        fleet,
        shipsBefore: p.before.find((b) => b.number === fleet.number)?.ships ?? fleet.ships,
        commands: this.selected.filter((c) => new RegExp(`^F${fleet.number}(?!\\d)`).test(c)),
        actions: FLEET_ACTIONS.filter((a) =>
          rows.some((r) => r.fleet === fleet.number && a.kinds.includes(r.kind!) && r.options.length > 0),
        ),
      }));
    if (this.activeFleet !== null && !this.cards.some((c) => c.fleet.number === this.activeFleet)) {
      this.activeFleet = null;
      this.activeAction = null;
    }
    this.enemies = p.fleets.filter((f) => !f.own);
    this.stock = [];
    if (p.isOwnWorld && !p.classic) {
      this.stock.push({ type: 'D', label: 'D-Schiffe', ships: p.dships, before: node.data?.dships ?? 0 });
    }
    if (p.isOwnWorld && p.classic && !p.classic.blackHole) {
      this.stock.push(
        { type: 'I', label: 'I-Schiffe', ships: p.iShips, before: p.classic.iShips },
        { type: 'P', label: 'P-Schiffe', ships: p.pShips, before: p.classic.pShips },
      );
    }
    this.neighbours = Array.from(
      new Set(this.links.filter((l) => idOf(l.source) === node.id).map((l) => idOf(l.target))),
    );
    this.worldActions = WORLD_ACTIONS.filter((a) => rows.some((r) => r.fleet === undefined && a.kinds.includes(r.kind!)));
    if (this.worldAction && !this.worldActions.some((a) => a.key === this.worldAction)) {
      this.worldAction = null;
    }
    this.budget =
      p.classic && !p.classic.blackHole && p.isOwnWorld
        ? this.buildBudget(p)
        : null;
  }

  private rows(): CommandRow[] {
    return this.groups.flatMap((g) => g.rows);
  }

  private buildBudget(p: WorldProjection) {
    const usable = usableIndustry(p.classic!);
    const segments = this.selected
      .map((command) => ({
        command,
        cost: industryCost(command, p.world),
        text: describeCommand(command).text,
      }))
      .filter((s) => s.cost > 0);
    const spent = segments.reduce((sum, s) => sum + s.cost, 0);
    return { usable, segments, remaining: Math.max(0, usable - spent) };
  }

  private buildEntries(): CommandEntry[] {
    const brokenByWorld = new Map<string, string[]>();
    const entries = this.selected.map((command) => {
      const world = commandWorld(command, this.nodes);
      return { command, description: describeCommand(command), world, broken: false };
    });
    for (const entry of entries) {
      if (entry.world && !brokenByWorld.has(entry.world)) {
        const node = this.nodes.find((n) => n.id === entry.world);
        brokenByWorld.set(entry.world, node ? brokenCommands(node, this.ownColor, this.selected) : []);
      }
      entry.broken = (brokenByWorld.get(entry.world ?? '') ?? []).includes(entry.command);
    }
    return entries;
  }

  get visibleEntries(): CommandEntry[] {
    return this.onlyThisWorld && this.node
      ? this.entries.filter((e) => e.world === this.node!.id)
      : this.entries;
  }

  // ---------- Aktionen der Flotten und der Welt ----------

  rowsFor(action: Action, fleet?: number): CommandRow[] {
    return this.rows().filter((r) => r.fleet === fleet && action.kinds.includes(r.kind!));
  }

  fleetAction(key: string | null): Action | undefined {
    return FLEET_ACTIONS.find((a) => a.key === key);
  }

  worldActionDef(key: string | null): Action | undefined {
    return WORLD_ACTIONS.find((a) => a.key === key);
  }

  isSegmented(row: CommandRow): boolean {
    return SEGMENTED.includes(row.kind!);
  }

  /** Klick auf eine Flottenkarte klappt ihre Aktionen auf; erneuter Klick schließt sie. */
  selectFleet(fleet: number) {
    if (this.activeFleet === fleet) {
      this.activeFleet = null;
      this.activeAction = null;
    } else {
      this.activeFleet = fleet;
      this.activeAction = this.cards.find((c) => c.fleet.number === fleet)?.actions[0]?.key ?? null;
    }
    this.amount = this.defaultAmount();
    this.refresh();
  }

  /** Von der Karte aus: Flotte aufklappen und in den sichtbaren Bereich holen. */
  focusFleet(fleet: number) {
    this.activeFleet = fleet;
    this.activeAction = 'move';
    this.amount = this.defaultAmount();
    this.refresh();
    setTimeout(() =>
      this.host.nativeElement
        .querySelector(`[data-fleet-card="${fleet}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
    );
  }

  chooseAction(key: string) {
    this.activeAction = key;
    this.amount = this.defaultAmount();
    this.refresh();
  }

  chooseWorldAction(key: string) {
    this.worldAction = this.worldAction === key ? null : key;
    this.refresh();
  }

  /** Menge vorbelegen: für Transfers alle Schiffe der Flotte, sonst 1. */
  private defaultAmount(): number {
    const card = this.cards.find((c) => c.fleet.number === this.activeFleet);
    return this.activeAction === 'transfer' && card ? Math.max(1, card.fleet.ships) : 1;
  }

  amountMax(): number {
    const card = this.cards.find((c) => c.fleet.number === this.activeFleet);
    const classic = this.projection?.classic;
    const candidates = [
      card?.fleet.ships ?? 0,
      card?.fleet.metal ?? 0,
      classic?.metal ?? 0,
      this.budget?.usable ?? 0,
      this.projection?.dships ?? 0,
      this.projection?.iShips ?? 0,
      this.projection?.pShips ?? 0,
      this.amount,
    ];
    return Math.max(1, ...candidates);
  }

  setAmount(value: string | number) {
    const parsed = Math.floor(+value);
    this.amount = parsed > 0 ? parsed : 1;
    this.refresh();
  }

  // ---------- Auswahl wie bei den Buttons der Tabelle ----------

  isSelected(option: CommandOption): boolean {
    return this.selected.includes(option.command);
  }

  isBroken(command: string): boolean {
    return this.broken.includes(command);
  }

  isOptionDisabled(option: CommandOption): boolean {
    return this.readonly || !!option.insufficient || isDisabled(option.command, this.selected);
  }

  press(option: CommandOption) {
    if (!this.isOptionDisabled(option)) {
      this.commandToggled.emit({ command: option.command, selected: !this.isSelected(option) });
    }
  }

  remove(command: string) {
    if (!this.readonly) {
      this.commandToggled.emit({ command, selected: false });
      this.commandHovered.emit(null);
    }
  }

  multiStepRoutes(fleet: number): string[] {
    return multiStepMoves(this.selected, fleet);
  }

  routeText(): string {
    return this.routePlan ? routeCommand(this.routePlan) : '';
  }

  isRouteDisabled(fleet: number): boolean {
    return this.readonly || this.routePlan !== null || isDisabled(`F${fleet}W`, this.selected);
  }

  /** Trägt einen Befehl ein und ersetzt widersprechende; liefert den Grund, wenn es nicht geht. */
  apply(command: string, count = 1): string | undefined {
    if (!this.node || this.readonly) {
      return 'Befehle sind nur in der aktuellen Runde möglich.';
    }
    const check = checkCommand(this.node, this.links, this.ownColor, count, this.selected, this.players, command);
    if (!check.ok) {
      return check.reason;
    }
    if (!this.selected.includes(command)) {
      this.commandReplaced.emit({ command, replaces: check.replaces });
    }
    return undefined;
  }

  // ---------- Drag & Drop im Pult ----------

  dragKey(item: DragItem | DropTarget): string {
    switch (item.type) {
      case 'fleet':
      case 'enemy':
        return `${item.type}${item.fleet}`;
      case 'world':
        return `world${item.world}`;
      default:
        return item.type;
    }
  }

  onDragStart(event: DragEvent, item: DragItem) {
    if (this.readonly) {
      event.preventDefault();
      return;
    }
    this.dragging = item;
    event.dataTransfer?.setData('text/plain', this.dragKey(item));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onDragEnd() {
    this.dragging = null;
    this.dropHover = null;
  }

  onDragOver(event: DragEvent, target: DropTarget) {
    if (this.canDrop(target)) {
      event.preventDefault();
      this.dropHover = this.dragKey(target);
    }
  }

  onDragLeave(target: DropTarget) {
    if (this.dropHover === this.dragKey(target)) {
      this.dropHover = null;
    }
  }

  onDrop(event: DragEvent, target: DropTarget) {
    event.preventDefault();
    const source = this.dragging;
    this.onDragEnd();
    if (source) {
      this.dropOn(source, target);
    }
  }

  /** Ob die gezogene Sache auf diesem Ziel einen Befehl ergibt (Mengen erst im Dialog). */
  canDrop(target: DropTarget): boolean {
    const source = this.dragging;
    if (!source || !this.node) {
      return false;
    }
    const drop = this.dropCommand(source, target);
    return (
      drop !== null &&
      checkCommand(this.node, this.links, this.ownColor, 1, this.selected, this.players, drop.make(1)).ok
    );
  }

  private stockShips(type: 'D' | 'I' | 'P'): number {
    const p = this.projection;
    return !p ? 0 : type === 'D' ? p.dships : type === 'I' ? p.iShips : p.pShips;
  }

  private fleetShips(fleet: number): number {
    return this.cards.find((c) => c.fleet.number === fleet)?.fleet.ships ?? 0;
  }

  /**
   * Befehl für Quelle und Ziel. Mit Menge (max > 0) öffnet der Drop den Mengendialog,
   * sonst wird der Befehl direkt eingetragen.
   */
  private dropCommand(
    source: DragItem,
    target: DropTarget,
  ): { title: string; max: number; make: (n: number) => string } | null {
    const world = this.projection?.world ?? '';
    if (source.type === 'fleet') {
      const a = source.fleet;
      switch (target.type) {
        case 'fleet':
          return target.fleet === a
            ? null
            : { title: `F${a} → F${target.fleet}`, max: this.fleetShips(a), make: (n) => `F${a}T${n}F${target.fleet}` };
        case 'D':
        case 'I':
        case 'P':
          return { title: `F${a} → ${target.type}-Schiffe`, max: this.fleetShips(a), make: (n) => `F${a}T${n}${target.type}` };
        case 'enemy':
          return { title: `F${a} feuert auf F${target.fleet}`, max: 0, make: () => `F${a}AF${target.fleet}` };
        case 'world':
          return { title: `F${a} fliegt nach ${target.world}`, max: 0, make: () => `F${a}${target.world}` };
      }
    }
    const stock = source.type;
    switch (target.type) {
      case 'fleet':
        return {
          title: `${stock}-Schiffe → F${target.fleet}`,
          max: this.stockShips(stock),
          make: (n) => `${stock}${world}T${n}F${target.fleet}`,
        };
      case 'I':
      case 'P':
        return stock === target.type || stock === 'D'
          ? null
          : {
              title: `${stock}-Schiffe → ${target.type}-Schiffe`,
              max: this.stockShips(stock),
              make: (n) => `${stock}${world}T${n}${target.type}`,
            };
      case 'enemy':
        return { title: `${stock}-Schiffe feuern auf F${target.fleet}`, max: 0, make: () => `${stock}${world}AF${target.fleet}` };
      default:
        return null;
    }
  }

  dropOn(source: DragItem, target: DropTarget) {
    const drop = this.dropCommand(source, target);
    if (!drop) {
      return;
    }
    if (drop.max > 0) {
      this.dialog = { title: drop.title, max: drop.max, value: drop.max, make: drop.make };
    } else {
      const error = this.apply(drop.make(1));
      if (error) {
        this.dialog = { title: drop.title, max: 0, value: 0, make: drop.make, error };
      }
    }
  }

  /** Transfer zwischen zwei eigenen Flotten, z. B. nach einem Drop auf der Karte. */
  openTransfer(from: number, to: number) {
    this.dropOn({ type: 'fleet', fleet: from }, { type: 'fleet', fleet: to });
  }

  setDialogValue(value: string | number) {
    if (this.dialog) {
      const parsed = Math.floor(+value);
      this.dialog = {
        ...this.dialog,
        value: Math.min(Math.max(parsed > 0 ? parsed : 1, 1), Math.max(1, this.dialog.max)),
        error: undefined,
      };
    }
  }

  confirmDialog() {
    const dialog = this.dialog;
    if (dialog && dialog.max > 0) {
      const error = this.apply(dialog.make(dialog.value), dialog.value);
      this.dialog = error ? { ...dialog, error } : null;
    } else {
      this.dialog = null;
    }
  }

  closeDialog() {
    this.dialog = null;
  }

  /** Klick auf eine fremde Flotte, während eine eigene Flotte aufgeklappt ist: feuern. */
  fireAt(enemy: number) {
    if (this.activeFleet !== null) {
      this.dropOn({ type: 'fleet', fleet: this.activeFleet }, { type: 'enemy', fleet: enemy });
    }
  }

  /** Klick auf eine Nachbarwelt: mit aufgeklappter Flotte hinfliegen, sonst die Welt ansehen. */
  neighbourClicked(world: string) {
    if (this.activeFleet !== null && this.activeAction === 'move') {
      this.dropOn({ type: 'fleet', fleet: this.activeFleet }, { type: 'world', world });
    } else {
      this.worldRequested.emit(world);
    }
  }

  describe(command: string): CommandDescription {
    return describeCommand(command);
  }

  /** Text ohne die Flotte vorne, für die Befehle auf der Flottenkarte. */
  shortText(text: string): string {
    return text.replace(/^F\d+ /, '');
  }

  budgetPercent(cost: number): number {
    return this.budget && this.budget.usable > 0 ? (cost / this.budget.usable) * 100 : 0;
  }

  trackCard(card: FleetCard): number {
    return card.fleet.number;
  }
}
