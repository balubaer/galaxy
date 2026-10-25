import { Component, OnInit, OnDestroy } from '@angular/core';
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
} from '@galaxy/game-objects';
import { GamePlayService } from '../player/game-play.service';
import { Node } from "@galaxy/api-interfaces";
import * as d3 from 'd3';
import { GameServiceService } from '../game-service.service';
import {
  addCommand,
  canExtendRoute,
  extendRoute,
  idOf,
  removeCommand,
  RoutePlan,
  routeCommand,
  routeWorlds,
} from '../command-table/command-options';
import { centerOnWorld, clampToArea, keepNodesInArea } from '../_helpers/graph-bounds';
import { outwardAngle, stubAngles } from '../_helpers/hidden-links';
import { applyRingLayout } from '../_helpers/ring-layout';
import { Box, forceBoxCollide } from '../_helpers/box-collide';
import { parseSaveKey, SavedLayout } from './saved-layouts';
import { LayoutStoreService } from './layout-store.service';

/** Flottenlabel mit den Classic-Angaben (Metall, PBB, At Peace) für Tooltips. */
export function fleetInfo(fleet: { label?: string; metal?: number; pbb?: boolean; atPeace?: boolean }): string {
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
  zoom = 1;

  round = 0;
  gameFinished = false;
  winner = '';
  changeround = 0;
  playercolor$: Observable<Array<PlayerColor>> | undefined;

  turnCommandTxt = '';
  ownColor = '';
  /** Namen der anderen Spieler, für Geschenke und Beziehungen im Classic Game. */
  otherPlayerNames: string[] = [];
  /** Classic Game: Legende und Flotten-Infos zeigen Wirtschaft statt D-Schiffen. */
  isClassic = false;
  readonly fleetInfo = fleetInfo;
  routePlan: RoutePlan | null = null;

  ishidden = false;
  /** Kurze Rückmeldung nach „Anordnung speichern“. */
  savedFeedback = false;
  private savedFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private authenticationService: AuthenticationService,
    private gamePlayService: GamePlayService,
    private gamePrefService: GameServiceService,
    private layoutStore: LayoutStoreService,
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
      })
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

  deleteGraf(selector = 'svg#v7') {
    const svgv7 = d3.select(selector);
    const dellines = svgv7.selectAll('line');
    dellines.remove();
    const delnodes = svgv7.selectAll('.nodes');
    delnodes.remove();
    svgv7.selectAll('.hidden-link').remove();
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
      const lineHeight = 5.5;
      const boxWidth = 40;
      const boxHeight = lines.length * lineHeight + 3;
      // Die Flotten liegen bis ca. 25 unterhalb des Mittelpunkts, die Box beginnt darunter.
      const boxTop = 28;
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
      lines.forEach((line, index) => {
        box
          .append('text')
          .attr('x', -boxWidth / 2 + 2)
          .attr('y', boxTop + 1.5 + (index + 1) * lineHeight - 1.5)
          .attr('font-family', 'sans-serif')
          .attr('font-size', 4)
          .attr('fill', '#222')
          .text(line);
      });
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
      );
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
        this.gamePlayService.setCommands(commands).subscribe()
      );
      this.turnCommandTxt = this.form.value.Commands;
    }
  }

    onNodeSelected(aNode: Node | undefined) {
        this.node = aNode;
        this.readNewTurnDataWithRoundAndWorldName(this.changeround, this.node.id);
        this.selectWorld = +extractNumberString(this.node.id);
  }

  ngOnDestroy(): void {
    if (this.subscriptionsTurnData !== null) {
      this.subscriptionsTurnData.unsubscribe();
      this.subscriptionsTurnData = null;
    }
    this.prevTurnDataSubscription?.unsubscribe();
    clearTimeout(this.savedFeedbackTimer);
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
