import { Component, HostListener, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AuthenticationService } from '../_services/authentication.service';
import { User } from '@galaxy/api-interfaces';
import { Observable, Subscription, Subject, forkJoin } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import {
  RespondTurnData,
  RequestTurnDataOnlyPlayer,
  PlayerCommands,
  GamePref,
  RequestTurnDataOnlyPlayerAndRound,
  PlayerColor,
  extractNumberString,
  CHARACTER_TYPE_NAMES,
  CharacterType,
} from '@galaxy/game-objects';
import { GamePlayService } from '../player/game-play.service';
import { Node } from "@galaxy/api-interfaces";
import * as d3 from 'd3';
import { GameServiceService } from '../game-service.service';
import {
  addCommand,
  checkCommand,
  extendRoute,
  idOf,
  MAX_ROUTE_STEPS,
  removeCommand,
  replaceCommands,
  RoutePlan,
  routeCommand,
  routeWorlds,
  splitCommands,
} from '../command-table/command-options';
import {
  commandPath,
  commandWorld,
  describeCommand,
  fleetWorld,
  reachableWorlds,
  shortestRoute,
} from '../command-table/command-describe';
import { CommandPanelComponent } from '../command-panel/command-panel.component';
import { centerOnWorld, clampToArea, keepNodesInArea } from '../_helpers/graph-bounds';
import { outwardAngle, stubAngles } from '../_helpers/hidden-links';
import { applyRingLayout } from '../_helpers/ring-layout';
import { Box, forceBoxCollide } from '../_helpers/box-collide';
import { parseSaveKey, SavedLayout } from './saved-layouts';
import { PlayerNotesService } from './player-notes.service';
import { LayoutStoreService } from './layout-store.service';

/** Steuerungsart der Befehle: klassische Tabelle oder Kommandopult mit Maussteuerung. */
export type ControlMode = 'classic' | 'modern';

const CONTROL_MODE_KEY = 'galaxy.controlMode';

function loadControlMode(): ControlMode {
  try {
    return localStorage.getItem(CONTROL_MODE_KEY) === 'modern' ? 'modern' : 'classic';
  } catch {
    return 'classic';
  }
}

/** Geplanter Befehl, den die moderne Steuerung als Pfeil auf der Karte zeigt. */
interface OrderArrow {
  command: string;
  kind: 'move' | 'probe' | 'migration' | 'fire';
  /** Welten des Wegs, beginnend beim Start. */
  worlds: string[];
  fromFleet?: number;
  toFleet?: number;
  /** Feuer auf den Boden: I-Schiffe/Industrie, P-Schiffe/Bevölkerung oder beides. */
  ground?: GroundTarget;
  label: string;
}

const ORDER_COLORS: Record<OrderArrow['kind'], string> = {
  move: '#1976d2',
  probe: '#8e24aa',
  migration: '#2e7d32',
  fire: '#c62828',
};

type GroundTarget = 'I' | 'P' | 'H';

// Lage der InfoBox einer Classic-Welt (relativ zur Welt): Die Zeile mit I- und P-Schiffen
// ist zugleich Ziel für Feuer auf den Boden.
const INFO_BOX_TOP = 28;
const INFO_LINE_HEIGHT = 5.5;
const INFO_BOX_WIDTH = 40;
const GROUND_LINE = 3;
const GROUND_LINE_MIDDLE = INFO_BOX_TOP + 1.5 + GROUND_LINE * INFO_LINE_HEIGHT + INFO_LINE_HEIGHT / 2;

/** Punkt, auf den ein Pfeil für Feuer auf den Boden zeigt: I- bzw. P-Feld der InfoBox, sonst die Welt. */
function groundTargetPosition(world: Node, target: GroundTarget | null): Point {
  const x = world.x ?? 0;
  const y = world.y ?? 0;
  if (!target || !world.data?.classic || world.data.classic.blackHole) {
    return { x, y };
  }
  const dx = target === 'I' ? -INFO_BOX_WIDTH / 4 : target === 'P' ? INFO_BOX_WIDTH / 4 : 0;
  return { x: x + dx, y: y + GROUND_LINE_MIDDLE };
}

/** Bodenziel aus dem Bericht ("I-Schiffe und Industrie W6", "P-Schiffe und Bevölkerung W6", "I- und P-Schiffe W6"). */
function groundTargetOf(firesTo: string): GroundTarget | null {
  return firesTo.startsWith('I-Schiffe') ? 'I' : firesTo.startsWith('P-Schiffe') ? 'P' : firesTo.startsWith('I- und P') ? 'H' : null;
}

/** Farbe der Schüsse der letzten Runde (geplante Feuerbefehle sind rot). */
const FIRE_COLOR = '#ff6f00';

/** Flottenlabel mit den Classic-Angaben (Metall, PBB, At Peace, Feuer) für Tooltips. */
export function fleetInfo(fleet: { label?: string; metal?: number; pbb?: boolean; atPeace?: boolean; firesTo?: string }): string {
  const parts = [fleet.label ?? ''];
  if (fleet.metal) {
    parts.push(`Metall ${fleet.metal}`);
  }
  if (fleet.pbb) {
    parts.push('PBB');
  }
  if (fleet.atPeace) {
    parts.push('At Peace');
  }
  if (fleet.firesTo) {
    parts.push(`feuerte auf ${fleet.firesTo}`);
  }
  return parts.join(', ');
}

@Component({
    selector: 'galaxy-home',
    templateUrl: 'home.component.html',
    styleUrls: ['home.component.css'],
    standalone: false
})
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: User;
  form: FormGroup;
  turnData$: Observable<RespondTurnData> | undefined;
  turnData: RespondTurnData;

  private readonly subscriptions = new Subscription();
  subscriptionsTurnData: Subscription | null = null;
  gamePref$: Observable<GamePref> | undefined;
  gamePrefSubsription: Subscription | null = null;
  homeWorldName: string;
  distanceLevelHomes = 0;
  selectWorld = 0;

  public node: Node | undefined;
  nodes: any;
  links: any;
  hiddenLinks: any;
  /** Vergleich: die Runde nach der angewählten älteren Runde, rechts neben der Karte. */
  prevTurnData: RespondTurnData | null = null;
  private prevTurnDataSubscription: Subscription | null = null;
  /** Überträgt die Positionen der Karte links auf die Vergleichskarte und zeichnet sie. */
  private renderPrevMap: (() => void) | null = null;
  /** Popup mit den gespeicherten Darstellungsflächen; null = geschlossen. */
  savedLayouts: SavedLayout[] | null = null;
  force: any;
    
  fixEnabled = false;
  /** Schüsse der letzten Runde als Pfeile auf der Karte zeigen. */
  showFire = true;
  /** Feuerbefehle aus dem Befehlsfeld als Pfeile zeigen, auch mit klassischer Steuerung. */
  showPlannedFire = true;
  zoom = 1;

  round = 0;
  gameFinished = false;
  winner = '';
  changeround = 0;
  playercolor$: Observable<Array<PlayerColor>> | undefined;

  turnCommandTxt = '';
  /** Zuletzt geladener bzw. gespeicherter Befehlstext (null: noch nicht geladen). */
  savedCommands: string | null = null;
  ownColor = '';
  /** Namen der anderen Spieler, für Geschenke und Beziehungen im Classic Game. */
  otherPlayerNames: string[] = [];
  /** Farbe je Spieler, um Flotten auf der Karte ihrem Besitzer zuzuordnen. */
  playerColors: PlayerColor[] = [];
  /** Mitspieler, die man selbst als Collector markiert hat (Classic Game). */
  collectors: string[] = [];
  /** Farben der markierten Collector für das Kommandopult. */
  collectorColors: string[] = [];
  /** Classic Game: Legende und Flotten-Infos zeigen Wirtschaft statt D-Schiffen. */
  isClassic = false;
  readonly fleetInfo = fleetInfo;
  routePlan: RoutePlan | null = null;

  ishidden = false;
  controlMode: ControlMode = loadControlMode();
  @ViewChild(CommandPanelComponent) panel?: CommandPanelComponent;
  /** Befehl, über dem im Kommandopult die Maus steht. */
  hoveredCommand: string | null = null;
  /** Rückmeldung der Maussteuerung auf der Karte. */
  mapHint = '';
  private mapHintTimer: ReturnType<typeof setTimeout> | undefined;
  private orderArrows: OrderArrow[] = [];
  readonly maxRouteSteps = MAX_ROUTE_STEPS;
  /** Kurze Rückmeldung nach „Anordnung speichern“. */
  savedFeedback = false;
  private savedFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private authenticationService: AuthenticationService,
    private gamePlayService: GamePlayService,
    private gamePrefService: GameServiceService,
    private layoutStore: LayoutStoreService,
    private playerNotes: PlayerNotesService,
    private fb: FormBuilder
  ) {
    this.homeWorldName = '';
    this.currentUser = this.authenticationService.currentUserValue;
    this.form = this.fb.group({
      Commands: [''],
    });
  }

  ngOnInit() {
    this.distanceLevelHomes = 3;

    const request: RequestTurnDataOnlyPlayer = {
      playerName: this.currentUser.username,
      distanceLevelHomes: this.distanceLevelHomes,
    };
    const playerCommands$: Observable<PlayerCommands> =
      this.gamePlayService.getCommand(request);
    playerCommands$.subscribe((aPlayerCommands) => {
      this.turnCommandTxt = aPlayerCommands.commands;
      if (this.form) {
        const element = this.form.get('Commands');
        if (element) {
          element.setValue(aPlayerCommands.commands);
        }
        this.savedCommands = aPlayerCommands.commands ?? '';
      }
    });

    this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayer(request);
    // Saves vorher mit dem Server abgleichen, damit auch die aus anderen Browsern gelten.
    this.subscriptionsTurnData = forkJoin([
      this.turnData$,
      this.layoutStore.sync(this.currentUser.username),
    ]).subscribe(([aTurnData]) => {
      this.homeWorldName = aTurnData.homeWorldName;
      this.selectWorld = +extractNumberString(aTurnData.homeWorldName);
      this.turnData = aTurnData;
      this.initGraf(this.applySavedLayout(aTurnData.homeWorldName));
    });

    this.gamePref$ = this.gamePrefService.getGamePref();
    this.playercolor$ = this.gamePlayService.getPlayerColor();
    this.subscriptions.add(
      this.playercolor$.subscribe((colors) => {
        this.ownColor =
          colors.find((c) => c.playername === this.currentUser.username)?.color ?? '';
        this.otherPlayerNames = colors
          .map((c) => c.playername)
          .filter((name) => name !== this.currentUser.username);
        this.playerColors = colors;
        this.updateCollectorColors();
        this.updateModernMap();
      })
    );
    this.subscriptions.add(
      this.playerNotes.collectors(this.currentUser.username).subscribe((collectors) => {
        this.collectors = collectors;
        this.updateCollectorColors();
      })
    );
    this.subscriptions.add(
      this.form.get('Commands')!.valueChanges.subscribe((text: string) => this.updateOrders(text))
    );

    this.subscriptions.add(this.form.valueChanges.subscribe(console.log));
    this.subscriptions.add(this.form.statusChanges.subscribe(console.log));
    this.gamePrefSubsription = this.gamePref$.subscribe((aGamePref) => {
      this.round = aGamePref.round;
      this.changeround = aGamePref.round;
      this.gameFinished = aGamePref.finished === true;
      this.winner = aGamePref.winner ?? '';
      this.isClassic = aGamePref.gameType === 'classic';
    });
  }

  /** Markiert einen Mitspieler als Collector oder nimmt die Markierung zurück und speichert sie. */
  toggleCollector(playerName: string) {
    const next = this.collectors.includes(playerName)
      ? this.collectors.filter((name) => name !== playerName)
      : [...this.collectors, playerName];
    this.collectors = next;
    this.updateCollectorColors();
    this.subscriptions.add(
      this.playerNotes.saveCollectors(this.currentUser.username, next).subscribe((saved) => {
        this.collectors = saved;
        this.updateCollectorColors();
      })
    );
  }

  private updateCollectorColors() {
    this.collectorColors = this.playerColors
      .filter((c) => this.collectors.includes(c.playername))
      .map((c) => c.color);
  }

  /** Flotten der Welt, an denen Artefakte hängen (für die Weltinfo). */
  fleetsWithArtifacts(node: Node | undefined): Array<{ label: string; artifacts: Array<{ number: number; name: string }> }> {
    const fleets: Array<{ label?: string; artifacts?: Array<{ number: number; name: string }> }> = node?.data?.fleets ?? [];
    return fleets
      .filter((fleet) => (fleet.artifacts?.length ?? 0) > 0)
      .map((fleet) => ({ label: (fleet.label ?? '').replace(/=.*/, ''), artifacts: fleet.artifacts ?? [] }));
  }

  deleteGraf(selector = 'svg#v7') {
    const svgv7 = d3.select(selector);
    const dellines = svgv7.selectAll('line');
    dellines.remove();
    const delnodes = svgv7.selectAll('.nodes');
    delnodes.remove();
    svgv7.selectAll('.hidden-link').remove();
    svgv7.selectAll('g.orders, g.fire-shots').remove();
  }

  /** Zeichnet die Karte; ohne Sicherung werden die Welten auf Ringen um die gewählte Welt verteilt. */
  initGraf(hasSavedLayout: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const th = this;

    const width = 500;
    const height = 500;
    // Welten bleiben mit ihrem Kreis (r = 10) vollständig in der Darstellungsfläche.
    const margin = 10;
    const svgv7 = d3
      .select('svg#v7')
      .style('background-color', 'white');

    th.applyZoom();
    th.scrollToCenter();

    th.force = d3.forceSimulation();

    th.force.force(
      'link',
      d3
        .forceLink()
        .id((d) => d.id)
        .distance(15)
    );

    th.force.force('charge_force', d3.forceManyBody());
    const centerId = `W${this.selectWorld}`;
    if (!hasSavedLayout) {
      // Ohne Sicherung: Ringe nach Sprüngen zur gewählten Welt über die ganze Fläche,
      // die Simulation glättet nur noch die Abstände und hält die Welten auf ihrem Ring.
      // Platz am Rand für Flotten und InfoBox der äußeren Welten.
      const maxRadius = width / 2 - 30;
      const depths = applyRingLayout(this.turnData.nodes, this.turnData.links, centerId, width / 2, height / 2, maxRadius);
      const maxRing = Math.max(1, ...depths.values());
      const spacing = maxRadius / maxRing;
      th.force.force('link').distance(spacing).strength(0.1);
      th.force.force('charge_force').strength(-spacing).distanceMax(spacing * 2);
      th.force.force(
        'ring',
        d3.forceRadial((d) => ((depths.get(d.id) ?? maxRing) / maxRing) * maxRadius, width / 2, height / 2).strength(0.6)
      );
    }
    // Die gewählte Welt (Select W) liegt in der Mitte der Darstellungsfläche und hält das
    // Netz dort; nur wenn sie fehlt, zentriert die Simulation das Netz als Ganzes.
    if (!centerOnWorld(this.turnData.nodes, centerId, width / 2, height / 2)) {
      th.force.force('center_force', d3.forceCenter(width / 2, height / 2));
    }

    const map = this.drawMap(svgv7, this.turnData, width, height);
    th.links = map.links;
    th.hiddenLinks = map.hiddenLinks;
    th.nodes = map.nodes;

    // Mindestabstand: Welten samt Flotten und InfoBox dürfen sich nicht überdecken.
    const boxes = new Map<string, Box>();
    th.nodes.each(function (this: SVGGElement, d: any) {
      const b = this.getBBox?.();
      if (b) {
        boxes.set(d.id, { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height });
      }
    });
    th.force.force('box_collide', forceBoxCollide((d) => boxes.get(d.id)));

    const drag_handler = d3
      .drag()
      .on('start', drag_start)
      .on('drag', drag_drag)
      .on('end', drag_end);

    drag_handler(th.nodes);

    th.nodes.on('click', clicked);

    function clicked(this: any, event, d) {
      if (th.routePlan) {
        // Routenplanung: Klick wählt die nächste Welt der Route, die Auswahl bleibt.
        if (!event.defaultPrevented) {
          th.routePlan = extendRoute(th.routePlan, th.turnData.links, d.id);
          th.highlightRoute();
        }
        return;
      }
      if (event.defaultPrevented) return; // dragged

      // Erneuter Klick hebt die Auswahl auf, eine andere Welt ersetzt sie.
      th.node = th.node?.id === d.id ? undefined : d;
      th.highlightRoute();
    }

    function render() {
      keepNodesInArea(th.turnData.nodes, width, height, margin);
      map.render();
      th.renderPrevMap?.();
      th.renderFire();
      th.renderOrders();
    }
    th.force.on('tick', render);

    // Mit Fix läuft keine Simulation: nur die gezogene Welt bewegt sich, alle anderen
    // (auch ohne Sicherung) bleiben, wo sie sind.
    function drag_start(d) {
      if (th.fixEnabled) {
        th.force.stop();
      } else if (!d.active) {
        th.force.alphaTarget(0.3).restart();
      }
      d.subject.fx = d.subject.x;
      d.subject.fy = d.subject.y;
    }

    function drag_drag(d) {
      d.subject.fx = clampToArea(d.x, width, margin);
      d.subject.fy = clampToArea(d.y, height, margin);
      if (th.fixEnabled) {
        d.subject.x = d.subject.fx;
        d.subject.y = d.subject.fy;
        render();
      }
    }

    function drag_end(d) {
      if (!d.active && !th.fixEnabled) th.force.alphaTarget(0);
      if (th.fixEnabled === false) {
        d.subject.fx = null;
        d.subject.fy = null;
      }
    }
    th.force.nodes(this.turnData.nodes);
    th.force.force('link').links(this.turnData.links);
    // Das Ringlayout ist schon fertig verteilt, die Simulation braucht nur wenig Energie.
    th.force.alpha(hasSavedLayout ? 1 : 0.3);
    if (th.fixEnabled) {
      // Mit Fix bewegt sich nichts sichtbar: Endzustand sofort berechnen und anhalten.
      th.force.stop();
      th.force.tick(300);
      render();
    } else {
      th.force.restart();
    }
    this.highlightRoute();
    this.updateModernMap();
  }

  /**
   * Zeichnet Verbindungen, Arme, Welten, Flotten und InfoBoxen einer Runde in eine
   * Darstellungsfläche; render() setzt alles auf die aktuellen Positionen der Welten.
   */
  private drawMap(svg: any, data: RespondTurnData, width: number, height: number) {
    const links = svg
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .style('stroke', '#999');

    // Gestrichelte Arme zu Welten außerhalb des Distanzlevels (als path, damit die
    // Routenmarkierung über 'line' sie nicht erfasst).
    const stubLength = 22;
    const nodeById = new Map(data.nodes.map((n) => [n.id, n]));
    const neighborIds = new Map<string, string[]>();
    for (const link of data.links) {
      const source = idOf(link.source);
      const target = idOf(link.target);
      neighborIds.set(source, [...(neighborIds.get(source) ?? []), target]);
      neighborIds.set(target, [...(neighborIds.get(target) ?? []), source]);
    }
    const hiddenByWorld = new Map<string, string[]>();
    for (const link of data.hiddenLinks ?? []) {
      if (nodeById.has(link.source)) {
        hiddenByWorld.set(link.source, [...(hiddenByWorld.get(link.source) ?? []), link.target]);
      }
    }
    const stubData = [...hiddenByWorld].flatMap(([world, targets]) =>
      targets.map((target, index) => ({ world, target, index, count: targets.length }))
    );
    const hiddenLinks = svg
      .selectAll('.hidden-link')
      .data(stubData)
      .enter()
      .append('g')
      .attr('class', 'hidden-link');
    hiddenLinks.append('title').text((d) => `${d.world} – ${d.target} (außerhalb der Sprungweite)`);
    hiddenLinks
      .append('path')
      .style('stroke', '#999')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '3,2')
      .style('fill', 'none');
    hiddenLinks
      .append('text')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 5)
      .attr('text-anchor', 'middle')
      .attr('dy', 1.5)
      .attr('fill', '#777')
      .text((d) => d.target);

    const nodes = svg
      .selectAll('.nodes')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'nodes');

    nodes
      .append('circle')
      .attr('r', 10)
      .style('fill', function (d) {
        return d.data.backgroundColor;
      });

    // Flotten als kleine Ellipsen rund um die Welt (Position wie in der Detailansicht, verkleinert).
    nodes.each(function (this: SVGGElement, d: any) {
      const group = d3.select(this);
      for (const fleet of d.data?.fleets ?? []) {
        const fleetGroup = group
          .append('g')
          .attr('class', 'fleet')
          // Für die Maussteuerung: Nummer und Farbe des Besitzers.
          .attr('data-fleet', /^F(\d+)=/.exec(fleet.label ?? '')?.[1] ?? null)
          .attr('data-color', fleet.backgroundColor ?? null)
          .attr('transform', `translate(${fleet.x * 0.3},${fleet.y * 0.3})`);
        fleetGroup.append('title').text(`${d.id}: ${fleetInfo(fleet)}`);
        fleetGroup
          .append('ellipse')
          .attr('rx', 8)
          .attr('ry', 3.5)
          .style('fill', fleet.backgroundColor)
          // Flotten mit PBB sind für alle erkennbar: roter Rand.
          .style('stroke', fleet.pbb ? 'red' : 'none')
          .style('stroke-width', fleet.pbb ? 0.8 : 0);
        fleetGroup
          .append('text')
          .attr('dy', 1.5)
          .attr('font-family', 'sans-serif')
          .attr('font-size', 4)
          .attr('text-anchor', 'middle')
          .attr('fill', fleet.fontColor ?? 'black')
          .text(fleet.label);
      }
    });

    nodes
      .append('text')
      .attr('dy', 3)
      .attr('dx', 0)
      .attr('font-family', 'sans-serif')
      .attr('font-size', 7)
      .attr('text-anchor', 'middle')
      // Schwarze Löcher liefern weiße Schrift.
      .attr('fill', (d) => d.data?.fontColor ?? 'black')
      .text((d) => d.id);

    // Classic Game: InfoBox mit den Weltenwerten unterhalb der Flotten.
    nodes.each(function (this: SVGGElement, d: any) {
      const info = d.data?.classic;
      if (!info || info.blackHole) {
        return;
      }
      const lines = [
        `Bev ${info.population}/${info.populationLimit}`,
        `Ind ${info.industry} · Metall ${info.metal}`,
        `Minen ${info.mines}`,
        `I ${info.iShips} · P ${info.pShips}`,
        ...(info.plunderRecovery > 0 ? [`geplündert, noch ${info.plunderRecovery} Rd.`] : []),
      ];
      const lineHeight = INFO_LINE_HEIGHT;
      const boxWidth = INFO_BOX_WIDTH;
      const boxHeight = lines.length * lineHeight + 3;
      // Die Flotten liegen bis ca. 25 unterhalb des Mittelpunkts, die Box beginnt darunter.
      const boxTop = INFO_BOX_TOP;
      const box = d3.select(this).append('g').attr('class', 'info-box');
      box.append('title').text(`${d.id}: ${lines.join(', ')}, Besitz seit ${info.turnsOwned}`);
      box
        .append('rect')
        .attr('x', -boxWidth / 2)
        .attr('y', boxTop)
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('rx', 2)
        .style('fill', 'white')
        .style('fill-opacity', 0.9)
        .style('stroke', '#999')
        .style('stroke-width', 0.4);
      const lineY = (index: number) => boxTop + 1.5 + (index + 1) * lineHeight - 1.5;
      lines.forEach((line, index) => {
        if (index === GROUND_LINE) {
          return;
        }
        box
          .append('text')
          .attr('x', -boxWidth / 2 + 2)
          .attr('y', lineY(index))
          .attr('font-family', 'sans-serif')
          .attr('font-size', 4)
          .attr('fill', '#222')
          .text(line);
      });
      // I- und P-Schiffe als eigene Felder: Ziel, wenn man eine Flotte zum Feuern darauf zieht.
      for (const [target, text, left] of [
        ['I', `I ${info.iShips}`, -boxWidth / 2],
        ['P', `P ${info.pShips}`, 0],
      ] as const) {
        const field = box.append('g').attr('class', 'ground-target').attr('data-target', target);
        field
          .append('rect')
          .attr('x', left + 0.5)
          .attr('y', boxTop + 1.5 + GROUND_LINE * lineHeight)
          .attr('width', boxWidth / 2 - 1)
          .attr('height', lineHeight)
          .attr('rx', 1)
          .style('fill', 'transparent');
        field
          .append('text')
          .attr('x', left + 2)
          .attr('y', lineY(GROUND_LINE))
          .attr('font-family', 'sans-serif')
          .attr('font-size', 4)
          .attr('fill', '#222')
          .text(text);
      }
    });

    // Vor der Simulation sind die Enden der Verbindungen noch Welten-Ids.
    const at = (end: any) => (typeof end === 'string' ? nodeById.get(end) : end);
    const render = () => {
      links
        .attr('x1', function (d) {
          return at(d.source)?.x;
        })
        .attr('y1', function (d) {
          return at(d.source)?.y;
        })
        .attr('x2', function (d) {
          return at(d.target)?.x;
        })
        .attr('y2', function (d) {
          return at(d.target)?.y;
        });

      nodes.attr('transform', (d) => `translate(${d.x},${d.y})`);

      hiddenLinks.each(function (this: SVGGElement, d: any) {
        const world = nodeById.get(d.world);
        const neighbors = (neighborIds.get(d.world) ?? [])
          .map((id) => nodeById.get(id))
          .filter((n) => n !== undefined);
        const base = outwardAngle(world, neighbors, { x: width / 2, y: height / 2 });
        const angle = stubAngles(d.count, base)[d.index];
        const endX = world.x + Math.cos(angle) * stubLength;
        const endY = world.y + Math.sin(angle) * stubLength;
        const group = d3.select(this);
        group.select('path').attr('d', `M${world.x},${world.y}L${endX},${endY}`);
        group
          .select('text')
          .attr('x', world.x + Math.cos(angle) * (stubLength + 5))
          .attr('y', world.y + Math.sin(angle) * (stubLength + 5));
      });
    };
    return { links, hiddenLinks, nodes, render };
  }

  /** Runde nach der angewählten älteren Runde; null, wenn nicht verglichen wird. */
  get nextRound(): number | null {
    return this.changeround < this.round ? this.changeround + 1 : null;
  }

  /** Lädt die Runde danach für die Vergleichskarte rechts (gleiche Welt, gleiches Distanzlevel). */
  private loadPrevMap(worldName: string) {
    this.prevTurnDataSubscription?.unsubscribe();
    this.prevTurnDataSubscription = null;
    this.prevTurnData = null;
    this.renderPrevMap = null;
    this.deleteGraf('svg#v7prev');
    const nextRound = this.nextRound;
    if (nextRound === null) {
      return;
    }
    const request: RequestTurnDataOnlyPlayerAndRound = {
      playerName: this.currentUser.username,
      round: nextRound,
      worldName,
      distanceLevelHomes: this.distanceLevelHomes,
    };
    this.prevTurnDataSubscription = this.gamePlayService
      .getTurnDataOnlyPlayerAndRound(request)
      .subscribe((aTurnData) => {
        this.prevTurnData = aTurnData;
        this.drawPrevGraf(worldName);
      });
  }

  /**
   * Zeichnet die Vergleichskarte nur zum Ansehen. Welten, die auch links zu sehen sind,
   * stehen an derselben Stelle und folgen dort jedem Verschieben; die übrigen bekommen
   * ihre Position aus der Speicherung, wenn vorhanden, sonst liegen sie auf Ringen.
   */
  private drawPrevGraf(worldName: string) {
    const width = 500;
    const height = 500;
    const data = this.prevTurnData;
    const svg = d3.select('svg#v7prev').style('background-color', 'white');
    this.applyZoom();
    applyRingLayout(data.nodes, data.links, worldName, width / 2, height / 2, width / 2 - 30);
    // Eigene Anordnung der Runde danach zuerst, dann die Saves der nächstliegenden Runden.
    this.applySavedLayout(worldName, undefined, data.nodes, this.changeround + 1);
    const map = this.drawMap(svg, data, width, height);
    this.renderPrevMap = () => {
      const current = new Map(this.turnData.nodes.map((n) => [n.id, n]));
      for (const node of data.nodes) {
        const same = current.get(node.id);
        if (same?.x !== undefined && same?.y !== undefined) {
          node.x = same.x;
          node.y = same.y;
        }
      }
      map.render();
    };
    this.renderPrevMap();
    // Die Vergleichskarte wird erst nach diesem Durchlauf eingeblendet.
    setTimeout(() => this.syncPrevScroll());
  }

  /** Die Vergleichskarte zeigt denselben Ausschnitt wie die Karte links. */
  syncPrevScroll() {
    const box = document.querySelector<HTMLElement>('.graph-scroll');
    const prev = document.querySelector<HTMLElement>('.prev-scroll');
    if (box && prev) {
      prev.scrollLeft = box.scrollLeft;
      prev.scrollTop = box.scrollTop;
    }
  }

  /** Fix an: Simulation anhalten, damit keine Welt mehr von Kräften verschoben wird. */
  toggleFix() {
    this.fixEnabled = !this.fixEnabled;
    if (this.fixEnabled) {
      this.force?.stop();
    }
  }

  /** Zoom über die Größe der SVG-Fläche; der Rahmen (graph-scroll) scrollt. */
  applyZoom() {
    const size = 750 * this.zoom;
    d3.selectAll('svg#v7, svg#v7prev')
      .attr('viewBox', '0 0 500 500')
      .attr('width', size)
      .attr('height', size)
      .style('max-width', 'none');
  }

  /** Scrollt den Rahmen so, dass die Mitte der Darstellungsfläche sichtbar ist. */
  scrollToCenter() {
    document.querySelectorAll<HTMLElement>('.graph-scroll').forEach((box) => {
      box.scrollLeft = (box.scrollWidth - box.clientWidth) / 2;
      box.scrollTop = (box.scrollHeight - box.clientHeight) / 2;
    });
  }

  onZoomChange(value: string) {
    const zoom = +value;
    const newZoom = zoom >= 0.5 && zoom <= 4 ? zoom : 1;
    const box = document.querySelector<HTMLElement>('.graph-scroll');
    // Mittelpunkt des sichtbaren Ausschnitts beim Zoomen beibehalten.
    const center = box
      ? {
          x: (box.scrollLeft + box.clientWidth / 2) / this.zoom,
          y: (box.scrollTop + box.clientHeight / 2) / this.zoom,
        }
      : null;
    this.zoom = newZoom;
    this.applyZoom();
    if (box && center) {
      box.scrollLeft = center.x * newZoom - box.clientWidth / 2;
      box.scrollTop = center.y * newZoom - box.clientHeight / 2;
    }
    this.syncPrevScroll();
  }

  highlightRoute() {
    const worlds = this.routePlan ? routeWorlds(this.routePlan) : [];
    const svg = d3.select('svg#v7');
    svg
      .selectAll('.nodes circle')
      .style('stroke', (d: any) =>
        d.id === this.node?.id ? 'red' : worlds.includes(d.id) ? '#1976d2' : null
      )
      .style('stroke-width', (d: any) =>
        d.id === this.node?.id || worlds.includes(d.id) ? 3 : null
      )
      .style('stroke-dasharray', null);
    const inRoute = (d: any) => {
      const from = worlds.indexOf(idOf(d.source));
      return from >= 0 && worlds[from + 1] === idOf(d.target);
    };
    svg
      .selectAll('line')
      .style('stroke', (d: any) => (inRoute(d) ? '#1976d2' : '#999'))
      .style('stroke-width', (d: any) => (inRoute(d) ? 3 : null));
  }

  onRouteStarted(fleet: number) {
    if (this.node) {
      this.routePlan = { fleet, start: this.node.id, path: [] };
      this.highlightRoute();
    }
  }

  onRouteStepBack() {
    if (this.routePlan) {
      this.routePlan = { ...this.routePlan, path: this.routePlan.path.slice(0, -1) };
      this.highlightRoute();
    }
  }

  onRouteConfirmed() {
    if (this.routePlan && this.routePlan.path.length > 0) {
      this.onCommandToggled({ command: routeCommand(this.routePlan), selected: true });
    }
    this.onRouteCancelled();
  }

  onRouteCancelled() {
    this.routePlan = null;
    this.highlightRoute();
  }

  routeText(): string {
    return this.routePlan ? routeCommand(this.routePlan) : '';
  }

  get modern(): boolean {
    return this.controlMode === 'modern';
  }

  /** Die Maussteuerung auf der Karte gibt es nur in der aktuellen Runde, in der Befehle möglich sind. */
  private get mapControlActive(): boolean {
    return this.modern && !!this.turnData && this.changeround === this.round;
  }

  /** Befehlspfeile gibt es nur in der aktuellen Runde: alle mit Maussteuerung, sonst die Feuerbefehle. */
  private get ordersActive(): boolean {
    return this.mapControlActive || (this.showPlannedFire && !!this.turnData && this.changeround === this.round);
  }

  togglePlannedFire() {
    this.showPlannedFire = !this.showPlannedFire;
    this.updateOrders();
  }

  setControlMode(mode: ControlMode) {
    this.controlMode = mode;
    try {
      localStorage.setItem(CONTROL_MODE_KEY, mode);
    } catch {
      // Ohne Speicher gilt die Wahl nur bis zum Neuladen.
    }
    this.onRouteCancelled();
    this.hoveredCommand = null;
    this.updateModernMap();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.routePlan) {
      this.onRouteCancelled();
    }
  }

  private showMapHint(text: string) {
    this.mapHint = text;
    clearTimeout(this.mapHintTimer);
    this.mapHintTimer = setTimeout(() => (this.mapHint = ''), 4000);
  }

  /** Eigene Flotten auf der Karte ziehbar machen (moderne Steuerung) und Befehlspfeile zeichnen. */
  updateModernMap() {
    const fleets = d3.select('svg#v7').selectAll<SVGGElement, Node>('g.fleet');
    fleets.on('.drag', null).on('click.fleet', null).style('cursor', null);
    if (this.mapControlActive && this.ownColor) {
      const ownColor = this.ownColor;
      fleets
        .filter(function (this: SVGGElement) {
          return this.getAttribute('data-color') === ownColor;
        })
        .style('cursor', 'grab')
        // Der Klick auf eine eigene Flotte wählt sie aus, nicht die Welt ab.
        .on('click.fleet', (event: MouseEvent) => event.stopPropagation())
        .call(this.fleetDrag());
    }
    this.updateOrders();
  }

  /** Welt unter dem Mauszeiger (Koordinaten der Darstellungsfläche). */
  private worldAt(x: number, y: number): Node | undefined {
    let best: Node | undefined;
    let bestDistance = 16;
    for (const node of this.turnData?.nodes ?? []) {
      const distance = Math.hypot((node.x ?? 0) - x, (node.y ?? 0) - y);
      if (distance < bestDistance) {
        best = node;
        bestDistance = distance;
      }
    }
    return best;
  }

  /** Während des Ziehens: erreichbare Welten grün, die Welt unter dem Zeiger orange. */
  private markReachable(reach: Map<string, number>, hover: string | null) {
    d3.select('svg#v7')
      .selectAll('.nodes circle')
      .style('stroke', (d: any) =>
        d.id === hover ? (reach.has(d.id) ? '#ff9800' : '#9e9e9e') : reach.has(d.id) ? '#2e7d32' : null
      )
      .style('stroke-width', (d: any) => (d.id === hover ? 4 : reach.has(d.id) ? (reach.get(d.id) === 1 ? 3 : 2) : null))
      .style('stroke-dasharray', (d: any) => ((reach.get(d.id) ?? 1) > 1 && d.id !== hover ? '3,2' : null));
  }

  /**
   * Eigene Flotte auf der Karte ziehen: auf eine Welt = Flug (kürzester Weg, bis 3 Sprünge),
   * auf eine fremde Flotte derselben Welt = Feuern, auf I- bzw. P-Schiffe der fremden Welt (InfoBox) =
   * Feuern auf den Boden, auf eine eigene Flotte = Transfer. Klick = Flotte im Pult.
   */
  private fleetDrag() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const th = this;
    let line: any = null;
    let start = { x: 0, y: 0 };
    let reach = new Map<string, number>();
    return d3
      .drag<SVGGElement, any>()
      .container(() => d3.select('svg#v7').node() as SVGSVGElement)
      .subject((event: any) => ({ x: event.x, y: event.y }))
      .on('start', function (this: SVGGElement, event: any, d: any) {
        start = { x: event.x, y: event.y };
        reach = reachableWorlds(th.turnData.links, d.id);
        // Auf einer fremden Welt sind I- und P-Schiffe mögliche Ziele.
        if (d.data?.backgroundColor !== th.ownColor) {
          d3.select(this.parentNode as SVGGElement)
            .selectAll('.ground-target rect')
            .style('stroke', ORDER_COLORS.fire)
            .style('stroke-width', 0.6)
            .style('stroke-dasharray', '1,0.6');
        }
        line = th
          .ordersLayer()
          .append('line')
          .attr('class', 'drag-line')
          .attr('x1', start.x)
          .attr('y1', start.y)
          .attr('x2', start.x)
          .attr('y2', start.y)
          .style('stroke', ORDER_COLORS.move)
          .style('stroke-width', 2)
          .style('stroke-dasharray', '4,3')
          .attr('marker-end', 'url(#order-arrow-move)');
      })
      .on('drag', function (event: any) {
        line?.attr('x2', event.x).attr('y2', event.y);
        if (Math.hypot(event.x - start.x, event.y - start.y) > 4) {
          th.markReachable(reach, th.worldAt(event.x, event.y)?.id ?? null);
        }
      })
      .on('end', function (this: SVGGElement, event: any, d: any) {
        line?.remove();
        line = null;
        d3.select(this.parentNode as SVGGElement).selectAll('.ground-target rect').style('stroke', null);
        const fleet = +(this.getAttribute('data-fleet') ?? 0);
        th.node = d;
        th.highlightRoute();
        if (Math.hypot(event.x - start.x, event.y - start.y) <= 4) {
          th.withPanel((panel) => panel.focusFleet(fleet));
        } else {
          th.dropFleetOnMap(fleet, d, event);
        }
      });
  }

  /** Das Pult zeigt erst nach dem nächsten Durchlauf die neu gewählte Welt. */
  private withPanel(action: (panel: CommandPanelComponent) => void) {
    setTimeout(() => this.panel && action(this.panel));
  }

  private dropFleetOnMap(fleet: number, world: Node, event: any) {
    const source = event.sourceEvent;
    const point = source?.changedTouches?.[0] ?? source;
    const element = point ? document.elementFromPoint(point.clientX, point.clientY) : null;
    const groundElement = element?.closest('g.ground-target') as SVGGElement | null;
    const groundWorld = groundElement?.closest('g.nodes') as SVGGElement | null;
    if (groundElement && groundWorld && (d3.select(groundWorld).datum() as Node)?.id === world.id) {
      this.applyMapCommand(world, `F${fleet}A${groundElement.getAttribute('data-target')}`);
      return;
    }
    const fleetElement = element?.closest('g.fleet') as SVGGElement | null;
    if (fleetElement && (d3.select(fleetElement).datum() as Node)?.id === world.id) {
      const other = +(fleetElement.getAttribute('data-fleet') ?? 0);
      if (other !== fleet) {
        if (fleetElement.getAttribute('data-color') === this.ownColor) {
          this.withPanel((panel) => panel.openTransfer(fleet, other));
        } else {
          this.applyMapCommand(world, `F${fleet}AF${other}`);
        }
        return;
      }
    }
    const target = this.worldAt(event.x, event.y);
    if (!target || target.id === world.id) {
      this.showMapHint(
        'Flotte auf eine Welt (Flug), eine fremde Flotte oder die I-/P-Schiffe einer fremden Welt (Feuern) oder eine eigene Flotte (Transfer) ziehen.'
      );
      return;
    }
    const path = shortestRoute(this.turnData.links, world.id, target.id);
    if (!path) {
      this.showMapHint(`${target.id} ist von ${world.id} aus nicht in ${MAX_ROUTE_STEPS} Sprüngen erreichbar.`);
      return;
    }
    this.applyMapCommand(world, `F${fleet}${path.join('')}`);
  }

  /** Prüft einen Befehl von der Karte wie die Buttons und trägt ihn ein. */
  private applyMapCommand(world: Node, command: string) {
    const selected = splitCommands(this.form.value.Commands);
    const check = checkCommand(world, this.turnData.links, this.ownColor, 1, selected, this.otherPlayerNames, command);
    if (!check.ok) {
      this.showMapHint(check.reason ?? `${command} ist nicht möglich.`);
      return;
    }
    this.onCommandReplaced({ command, replaces: check.replaces });
    const replaced = check.replaces.length > 0 ? ` (ersetzt ${check.replaces.join(', ')})` : '';
    this.showMapHint(`✓ ${describeCommand(command).text}${replaced}`);
  }

  onCommandReplaced(event: { command: string; replaces: string[] }) {
    const element = this.form.get('Commands');
    if (element) {
      element.setValue(replaceCommands(element.value ?? '', event.command, event.replaces));
      this.onSubmit();
    }
  }

  onCommandHovered(command: string | null) {
    this.hoveredCommand = command;
    this.renderOrders();
  }

  /** Welt aus dem Pult anzeigen; liegt sie nicht auf der Karte, wird die Karte um sie geladen. */
  onWorldRequested(worldId: string) {
    const node = this.turnData?.nodes.find((n) => n.id === worldId);
    if (node) {
      this.node = node;
      this.highlightRoute();
    } else {
      this.selectWorld = +extractNumberString(worldId);
      this.pressViewWorld();
    }
  }

  /** Ebene für Befehlspfeile über der Karte (fängt keine Mausereignisse ab). */
  private ordersLayer() {
    const svg = d3.select('svg#v7');
    if (svg.select('defs.order-defs').empty()) {
      const defs = svg.append('defs').attr('class', 'order-defs');
      for (const [kind, color] of Object.entries(ORDER_COLORS)) {
        defs
          .append('marker')
          .attr('id', `order-arrow-${kind}`)
          .attr('viewBox', '0 0 10 10')
          .attr('refX', 8)
          .attr('refY', 5)
          .attr('markerWidth', 4)
          .attr('markerHeight', 4)
          .attr('orient', 'auto-start-reverse')
          .append('path')
          .attr('d', 'M0,0L10,5L0,10z')
          .style('fill', color);
      }
    }
    let layer = svg.select<SVGGElement>('g.orders');
    if (layer.empty()) {
      layer = svg.append('g').attr('class', 'orders').style('pointer-events', 'none');
    }
    return layer.raise();
  }

  /** Liest die geplanten Flüge, Sonden, Migrationen und Feuerbefehle aus dem Befehlstext. */
  updateOrders(text: string = this.form.value.Commands) {
    const nodes = this.turnData?.nodes ?? [];
    const commands = this.ordersActive ? splitCommands(text ?? '') : [];
    this.orderArrows = [];
    for (const command of commands) {
      const fire = /^(?:F(\d+)|[DIP](\d+))[AC]F(\d+)$/.exec(command);
      if (fire) {
        if (!this.showPlannedFire) {
          continue;
        }
        const world = fire[1] ? fleetWorld(nodes, +fire[1]) : `W${fire[2]}`;
        if (world) {
          this.orderArrows.push({
            command,
            kind: 'fire',
            worlds: [world],
            fromFleet: fire[1] ? +fire[1] : undefined,
            toFleet: +fire[3],
            label: '',
          });
        }
        continue;
      }
      const ground = /^F(\d+)[AC]([IPH])$/.exec(command);
      if (ground) {
        const world = fleetWorld(nodes, +ground[1]);
        if (world && this.showPlannedFire) {
          this.orderArrows.push({
            command,
            kind: 'fire',
            worlds: [world],
            fromFleet: +ground[1],
            ground: ground[2] as GroundTarget,
            label: '',
          });
        }
        continue;
      }
      const worlds = this.mapControlActive ? commandPath(command, nodes) : [];
      if (worlds.length >= 2) {
        const category = describeCommand(command).category;
        const kind = category === 'move' ? 'move' : category === 'probe' ? 'probe' : 'migration';
        const fleet = /^F(\d+)/.exec(command);
        const migrants = /^P\d+M(\d+)/.exec(command);
        this.orderArrows.push({
          command,
          kind,
          worlds,
          fromFleet: fleet ? +fleet[1] : undefined,
          label: fleet ? `F${fleet[1]}` : migrants ? `${migrants[1]} Bev.` : 'Sonde',
        });
      }
    }
    this.renderOrders();
  }

  /** Zeichnet die Befehlspfeile an den aktuellen Positionen der Welten. */
  renderOrders() {
    const svg = d3.select('svg#v7');
    if (!this.ordersActive) {
      svg.selectAll('g.orders, defs.order-defs').remove();
      return;
    }
    const layer = this.ordersLayer();
    const byId = new Map((this.turnData?.nodes ?? []).map((n) => [n.id, n]));
    const fleetPosition = (fleet: number | undefined) => fleetPositionOnMap(byId.values(), fleet);
    const hovered = this.hoveredCommand;
    const arrows = layer
      .selectAll<SVGGElement, OrderArrow>('g.order')
      .data(this.orderArrows, (d: OrderArrow) => d.command);
    arrows.exit().remove();
    const entered = arrows.enter().append('g').attr('class', 'order');
    entered.append('path').style('fill', 'none');
    entered
      .append('text')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 5)
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .style('paint-order', 'stroke')
      .style('stroke', 'white')
      .style('stroke-width', 1.5);
    entered
      .merge(arrows)
      .style('opacity', (d) => (hovered && d.command !== hovered ? 0.25 : 1))
      .each(function (this: SVGGElement, d) {
        const group = d3.select(this);
        const points: Array<{ x: number; y: number }> = [];
        if (d.kind === 'fire') {
          const world = byId.get(d.worlds[0]);
          const from = d.fromFleet !== undefined ? fleetPosition(d.fromFleet) : world && { x: world.x ?? 0, y: world.y ?? 0 };
          const to = d.ground ? world && groundTargetPosition(world, d.ground) : fleetPosition(d.toFleet);
          if (from && to) {
            points.push(from, to);
          }
        } else {
          const start = d.fromFleet !== undefined ? fleetPosition(d.fromFleet) : undefined;
          for (const id of d.worlds) {
            const world = byId.get(id);
            if (!world) {
              break; // Ziel außerhalb der Karte: Pfeil endet an der letzten sichtbaren Welt.
            }
            points.push({ x: world.x ?? 0, y: world.y ?? 0 });
          }
          if (start && points.length > 0) {
            points[0] = start;
          }
        }
        const width = (d.kind === 'move' ? 1.6 : 1.2) * (d.command === hovered ? 2 : 1);
        group
          .select('path')
          .attr('d', points.length >= 2 ? curvedPath(points, d.kind === 'fire' ? (d.ground ? 1 : 0) : 11) : null)
          .style('stroke', ORDER_COLORS[d.kind])
          .style('stroke-width', width)
          .style('stroke-dasharray', d.kind === 'probe' ? '2,2' : d.kind === 'migration' ? '4,2' : null)
          .attr('marker-end', `url(#order-arrow-${d.kind})`);
        const labelAt = points.length >= 2 ? curveMiddle(points[0], points[1]) : null;
        group
          .select('text')
          .attr('x', labelAt?.x ?? 0)
          .attr('y', labelAt?.y ?? 0)
          .style('fill', ORDER_COLORS[d.kind])
          .text(labelAt ? d.label : '');
      });
    // Befehl ohne Pfeil (z. B. Transfer, Bauen): Ring um seine Welt.
    const hoverWorld = hovered ? byId.get(commandWorld(hovered, this.turnData?.nodes ?? []) ?? '') : undefined;
    const ring = layer.selectAll<SVGCircleElement, Node>('circle.hover-ring').data(hoverWorld ? [hoverWorld] : []);
    ring.exit().remove();
    ring
      .enter()
      .append('circle')
      .attr('class', 'hover-ring')
      .attr('r', 15)
      .style('fill', 'none')
      .style('stroke', '#ff9800')
      .style('stroke-width', 2.5)
      .merge(ring)
      .attr('cx', (d) => d.x ?? 0)
      .attr('cy', (d) => d.y ?? 0);
  }

  toggleFire() {
    this.showFire = !this.showFire;
    this.renderFire();
  }

  /**
   * Zeichnet die Schüsse der letzten Runde: Flotte auf Flotte, Flotte auf den Boden bzw. die
   * D-Schiffe (Pfeil in die Welt) und D-/I-/P-Schiffe einer Welt auf eine Flotte.
   */
  renderFire() {
    const svg = d3.select('svg#v7');
    const nodes = this.turnData?.nodes ?? [];
    const shots: Array<{ from: Point; to: Point; intoWorld: boolean }> = [];
    if (this.showFire) {
      for (const node of nodes) {
        const world = { x: node.x ?? 0, y: node.y ?? 0 };
        for (const fleet of node.data?.fleets ?? []) {
          if (!fleet.firesTo) {
            continue;
          }
          const from = { x: world.x + fleet.x * 0.3, y: world.y + fleet.y * 0.3 };
          const target = /^F(\d+)/.exec(fleet.firesTo);
          const ground = groundTargetOf(fleet.firesTo);
          // PBB und D-Schiffe: Pfeil in die Welt, I-/P-Schiffe: auf ihr Feld in der InfoBox.
          const to = target ? fleetPositionOnMap(nodes, +target[1]) : groundTargetPosition(node, ground);
          if (to) {
            shots.push({ from, to, intoWorld: !target && !ground });
          }
        }
        for (const shot of node.data?.homeFire ?? []) {
          const to = fleetPositionOnMap(nodes, shot.fleet);
          if (to) {
            shots.push({ from: world, to, intoWorld: false });
          }
        }
      }
    }
    if (shots.length === 0) {
      svg.selectAll('g.fire-shots').remove();
      return;
    }
    if (svg.select('#fire-shot-arrow').empty()) {
      svg
        .append('defs')
        .append('marker')
        .attr('id', 'fire-shot-arrow')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 8)
        .attr('refY', 5)
        .attr('markerWidth', 4)
        .attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,0L10,5L0,10z')
        .style('fill', FIRE_COLOR);
    }
    let layer = svg.select<SVGGElement>('g.fire-shots');
    if (layer.empty()) {
      layer = svg.append('g').attr('class', 'fire-shots').style('pointer-events', 'none');
    }
    layer.raise();
    const paths = layer.selectAll<SVGPathElement, unknown>('path').data(shots);
    paths.exit().remove();
    paths
      .enter()
      .append('path')
      .style('fill', 'none')
      .style('stroke', FIRE_COLOR)
      .style('stroke-width', 1)
      .style('stroke-dasharray', '1.5,1')
      .attr('marker-end', 'url(#fire-shot-arrow)')
      .merge(paths)
      .attr('d', (d) => curvedPath([d.from, d.to], d.intoWorld ? 10 : 1));
  }

  /** Im Befehlsfeld steht Text, der noch nicht gespeichert ist. */
  get hasUnsavedCommands(): boolean {
    return this.savedCommands !== null && (this.form.value.Commands ?? '') !== this.savedCommands;
  }

  /** Das Befehlsfeld wächst mit der Zahl der Zeilen (mindestens 5). */
  get commandRows(): number {
    const lines = ((this.form.value.Commands as string) ?? '').split('\n').length;
    return Math.max(5, lines + 1);
  }

  onCommandToggled(event: { command: string; selected: boolean }) {
    const element = this.form.get('Commands');
    if (element) {
      const text: string = element.value ?? '';
      element.setValue(
        event.selected
          ? addCommand(text, event.command)
          : removeCommand(text, event.command)
      );
      // Jeder Befehlsbutton speichert die Befehle sofort.
      this.onSubmit();
    }
  }

  onSubmit() {
    if (this.round === this.changeround) {
      const commands: PlayerCommands = {
        player: this.currentUser.username,
        commands: this.form.value.Commands,
      };
      this.subscriptions.add(
        this.gamePlayService.setCommands(commands).subscribe(() => {
          this.savedCommands = commands.commands ?? '';
        })
      );
      this.turnCommandTxt = this.form.value.Commands;
    }
  }

    onNodeSelected(aNode: Node | undefined) {
        this.node = aNode;
        this.readNewTurnDataWithRoundAndWorldName(this.changeround, this.node.id);
        this.selectWorld = +extractNumberString(this.node.id);
  }

  characterName(type: CharacterType): string {
    return CHARACTER_TYPE_NAMES[type];
  }

  ngOnDestroy(): void {
    if (this.subscriptionsTurnData !== null) {
      this.subscriptionsTurnData.unsubscribe();
      this.subscriptionsTurnData = null;
    }
    this.prevTurnDataSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
    clearTimeout(this.savedFeedbackTimer);
    clearTimeout(this.mapHintTimer);
  }

  /** Zeigt die Karte der Runde aRound für die gewählte Welt (Select W). */
  readNewTurnDataWithRound(aRound: number) {
    this.readNewTurnDataWithRoundAndWorldName(aRound, `W${this.selectWorld}`);
  }

  readNewTurnDataWithRoundAndWorldName(aRound: number, aWorldName: string, aSaveKey?: string) {
    this.routePlan = null;
    if (this.gamePrefSubsription !== null) {
      this.gamePrefSubsription.unsubscribe();
      this.gamePrefSubsription = null;
    }
    const request: RequestTurnDataOnlyPlayerAndRound = {
      playerName: this.currentUser.username,
      round: this.changeround,
      worldName: aWorldName,
      distanceLevelHomes: this.distanceLevelHomes,
    };

    if (this.subscriptionsTurnData !== null) {
      this.subscriptionsTurnData.unsubscribe();
      this.subscriptionsTurnData = null;
    }

    this.turnData$ =
      this.gamePlayService.getTurnDataOnlyPlayerAndRound(request);
    this.subscriptionsTurnData = this.turnData$.subscribe((aTurnData) => {
      this.turnCommandTxt = aTurnData.turnCommanTxt;
      this.turnData = aTurnData;
      const hasSavedLayout = this.applySavedLayout(aWorldName, aSaveKey);
      this.deleteGraf();
      this.initGraf(hasSavedLayout);
      this.loadPrevMap(aWorldName);
      if (this.changeround === this.round) {
        this.form.get('Commands').setValue(aTurnData.turnCommanTxt);
        this.savedCommands = aTurnData.turnCommanTxt ?? '';
      }
    });
  }

  pressPrevRound() {
    if (this.changeround > 0) {
      this.changeround -= 1;
      this.readNewTurnDataWithRound(this.changeround);
      this.ishidden = true;
    }
  }

  pressNextRound() {
    if (this.changeround < this.round) {
      this.changeround += 1;
      this.readNewTurnDataWithRound(this.changeround);
      this.ishidden = this.changeround < this.round;
    }
  }

  /** Springt zurück zur aktuellen Runde, in der Befehle möglich sind. */
  pressCurrentRound() {
    if (this.changeround < this.round) {
      this.changeround = this.round;
      this.readNewTurnDataWithRound(this.changeround);
      this.ishidden = false;
    }
  }

  pressViewHomeWorld() {
    this.selectWorld = +extractNumberString(this.homeWorldName);
    this.readNewTurnDataWithRound(this.changeround);
  }

  pressViewWorld() {
    this.readNewTurnDataWithRoundAndWorldName(
      this.changeround,
      `W${this.selectWorld}`
    );
  }

  /** Save-Schlüssel der angezeigten Runde (auch ältere Runden haben eigene Anordnungen). */
  private layoutKey(worldName: string, round = this.changeround): string {
    return `R${round}W${extractNumberString(worldName)}D${this.distanceLevelHomes}.${this.currentUser.username}`;
  }

  /** Andere Saves des Benutzers: nächstliegende Runde zuerst, dann das nächstliegende Distanzlevel. */
  private otherSaveKeys(ownKey: string, round: number): string[] {
    return this.layoutStore
      .list(this.currentUser.username)
      .filter((save) => save.key !== ownKey)
      .map((save) => ({
        key: save.key,
        rank: Math.abs(save.round - round) * 1000 + Math.abs(save.distanceLevel - this.distanceLevelHomes),
      }))
      .sort((a, b) => a.rank - b.rank)
      .map((k) => k.key);
  }

  /**
   * Übernimmt gesicherte Positionen ("save"). Zuerst gilt ein im Popup gewählter Save,
   * dann der eigene Save dieser Ansicht; Welten, die dort fehlen, bekommen ihre Position
   * aus Saves anderer Runden und Distanzlevel. Liefert, ob mindestens eine Welt eine Position bekam.
   */
  private applySavedLayout(
    worldName: string,
    preferredKey?: string,
    nodes: Node[] = this.turnData.nodes,
    round = this.changeround
  ): boolean {
    const ownKey = this.layoutKey(worldName, round);
    const pending = new Map(nodes.map((n) => [n.id, n]));
    const keys = [...new Set([preferredKey ?? ownKey, ownKey, ...this.otherSaveKeys(ownKey, round)])];
    for (const key of keys) {
      if (pending.size === 0) {
        break;
      }
      for (const old of this.layoutStore.nodes(key)) {
        const node = pending.get(old.id);
        if (node) {
          node.x = old.fx;
          node.y = old.fy;
          node.fx = old.fx;
          node.fy = old.fy;
          pending.delete(old.id);
        }
      }
    }
    return pending.size < nodes.length;
  }

  /** Zeigt sofort die Saves aus dem Cache und danach den Stand des Servers. */
  openSavedLayouts() {
    const user = this.currentUser.username;
    this.savedLayouts = this.layoutStore.list(user);
    this.subscriptions.add(
      this.layoutStore.sync(user).subscribe(() => {
        if (this.savedLayouts) {
          this.savedLayouts = this.layoutStore.list(user);
        }
      })
    );
  }

  closeSavedLayouts() {
    this.savedLayouts = null;
  }

  /** Zeigt Runde, Welt und Distanzlevel eines Saves mit dessen Positionen an. */
  loadSavedLayout(save: SavedLayout) {
    this.selectWorld = save.world;
    this.distanceLevelHomes = save.distanceLevel;
    this.changeround = Math.min(save.round, this.round);
    this.ishidden = this.changeround < this.round;
    this.closeSavedLayouts();
    this.readNewTurnDataWithRoundAndWorldName(this.changeround, `W${save.world}`, save.key);
  }

  deleteSavedLayout(save: SavedLayout) {
    if (confirm(`Speicherung ${save.key} löschen?`)) {
      this.layoutStore.delete(this.currentUser.username, save.key);
      this.openSavedLayouts();
    }
  }

  pressSavewWorld() {
    for (const n of this.turnData.nodes) {
      n.fx = n.x;
      n.fy = n.y;
    }
    const key = this.layoutKey(`W${this.selectWorld}`);
    this.layoutStore.save(
      this.currentUser.username,
      key,
      this.turnData.nodes.map((n) => ({ id: n.id, fx: n.x ?? 0, fy: n.y ?? 0 }))
    );
    this.savedFeedback = true;
    clearTimeout(this.savedFeedbackTimer);
    this.savedFeedbackTimer = setTimeout(() => (this.savedFeedback = false), 2500);
  }

}

type Point = { x: number; y: number };

/** Position der Flotte auf der Karte (Ellipse neben ihrer Welt), undefined wenn sie nicht zu sehen ist. */
function fleetPositionOnMap(nodes: Iterable<Node>, fleet: number | undefined): Point | undefined {
  for (const node of nodes) {
    const found = (node.data?.fleets ?? []).find((f: any) => new RegExp(`^F${fleet}=`).test(f.label ?? ''));
    if (found) {
      return { x: (node.x ?? 0) + found.x * 0.3, y: (node.y ?? 0) + found.y * 0.3 };
    }
  }
  return undefined;
}

/** Weg durch die Punkte, jeder Abschnitt leicht gebogen, damit er neben der Verbindungslinie liegt. */
function curvedPath(points: Array<{ x: number; y: number }>, endGap: number): string {
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    let to = points[i];
    if (i === points.length - 1 && endGap > 0) {
      // Pfeilspitze am Rand der Zielwelt statt in ihrer Mitte.
      const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
      const gap = Math.min(endGap, length / 2);
      to = { x: to.x - ((to.x - from.x) / length) * gap, y: to.y - ((to.y - from.y) / length) * gap };
    }
    const control = curveControl(from, to);
    d += `Q${control.x},${control.y} ${to.x},${to.y}`;
  }
  return d;
}

function curveControl(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return { x: (from.x + to.x) / 2 - dy * 0.15, y: (from.y + to.y) / 2 + dx * 0.15 };
}

/** Punkt in der Mitte der Kurve (Bezier bei t = 0,5). */
function curveMiddle(from: { x: number; y: number }, to: { x: number; y: number }) {
  const control = curveControl(from, to);
  return {
    x: 0.25 * from.x + 0.5 * control.x + 0.25 * to.x,
    y: 0.25 * from.y + 0.5 * control.y + 0.25 * to.y - 2,
  };
}
