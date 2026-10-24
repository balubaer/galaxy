import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from '../_services/authentication.service';
import { User } from '@galaxy/api-interfaces';
import { Observable, Subscription, Subject } from 'rxjs';
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
import { listSavedLayouts, parseSaveKey, SavedLayout } from './saved-layouts';

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
  ishiddenNextButton = true;
  ishiddenPrevButton = false;

  constructor(
    private authenticationService: AuthenticationService,
    private gamePlayService: GamePlayService,
    private gamePrefService: GameServiceService,
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
    this.subscriptionsTurnData = this.turnData$.subscribe((aTurnData) => {
      this.homeWorldName = aTurnData.homeWorldName;
      this.selectWorld = +extractNumberString(aTurnData.homeWorldName);
      this.turnData = aTurnData;
      this.applySavedLayout(aTurnData.homeWorldName);
      this.initGraf();
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

  deleteGraf() {
    const svgv7 = d3.select('svg#v7');
    const dellines = svgv7.selectAll('line');
    dellines.remove();
    const delnodes = svgv7.selectAll('.nodes');
    delnodes.remove();
    svgv7.selectAll('.hidden-link').remove();
  }

  initGraf() {
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
    // Die gewählte Welt (Select W) liegt in der Mitte der Darstellungsfläche und hält das
    // Netz dort; nur wenn sie fehlt, zentriert die Simulation das Netz als Ganzes.
    if (!centerOnWorld(this.turnData.nodes, `W${this.selectWorld}`, width / 2, height / 2)) {
      th.force.force('center_force', d3.forceCenter(width / 2, height / 2));
    }

    th.links = svgv7
      .selectAll('line')
      .data(this.turnData.links)
      .enter()
      .append('line')
      .style('stroke', '#999');

    // Gestrichelte Arme zu Welten außerhalb des Distanzlevels (als path, damit die
    // Routenmarkierung über 'line' sie nicht erfasst).
    const stubLength = 22;
    const nodeById = new Map(this.turnData.nodes.map((n) => [n.id, n]));
    const neighborIds = new Map<string, string[]>();
    for (const link of this.turnData.links) {
      const source = idOf(link.source);
      const target = idOf(link.target);
      neighborIds.set(source, [...(neighborIds.get(source) ?? []), target]);
      neighborIds.set(target, [...(neighborIds.get(target) ?? []), source]);
    }
    const hiddenByWorld = new Map<string, string[]>();
    for (const link of this.turnData.hiddenLinks ?? []) {
      if (nodeById.has(link.source)) {
        hiddenByWorld.set(link.source, [...(hiddenByWorld.get(link.source) ?? []), link.target]);
      }
    }
    const stubData = [...hiddenByWorld].flatMap(([world, targets]) =>
      targets.map((target, index) => ({ world, target, index, count: targets.length }))
    );
    th.hiddenLinks = svgv7
      .selectAll('.hidden-link')
      .data(stubData)
      .enter()
      .append('g')
      .attr('class', 'hidden-link');
    th.hiddenLinks.append('title').text((d) => `${d.world} – ${d.target} (außerhalb des Distanzlevels)`);
    th.hiddenLinks
      .append('path')
      .style('stroke', '#999')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '3,2')
      .style('fill', 'none');
    th.hiddenLinks
      .append('text')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 5)
      .attr('text-anchor', 'middle')
      .attr('dy', 1.5)
      .attr('fill', '#777')
      .text((d) => d.target);

    th.nodes = svgv7
      .selectAll('.nodes')
      .data(this.turnData.nodes)
      .enter()
      .append('g')
      .attr('class', 'nodes');

    th.nodes
      .append('circle')
      .attr('r', 10)
      .style('fill', function (d) {
        return d.data.backgroundColor;
      });

    // Flotten als kleine Ellipsen rund um die Welt (Position wie in der Detailansicht, verkleinert).
    th.nodes.each(function (this: SVGGElement, d: any) {
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

    const drag_handler = d3
      .drag()
      .on('start', drag_start)
      .on('drag', drag_drag)
      .on('end', drag_end);

    drag_handler(th.nodes);

    th.nodes
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
    th.nodes.each(function (this: SVGGElement, d: any) {
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

    th.force.on('tick', function () {
      keepNodesInArea(th.turnData.nodes, width, height, margin);
      th.links
        .attr('x1', function (d) {
          return d.source.x;
        })
        .attr('y1', function (d) {
          return d.source.y;
        })
        .attr('x2', function (d) {
          return d.target.x;
        })
        .attr('y2', function (d) {
          return d.target.y;
        });

      th.nodes.attr('transform', (d) => `translate(${d.x},${d.y})`);

      th.hiddenLinks.each(function (this: SVGGElement, d: any) {
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
    });

    function drag_start(d) {
      if (!d.active) th.force.alphaTarget(0.3).restart();
      d.subject.fx = d.subject.x;
      d.subject.fy = d.subject.y;
    }

    function drag_drag(d) {
      d.subject.fx = clampToArea(d.x, width, margin);
      d.subject.fy = clampToArea(d.y, height, margin);
    }

    function drag_end(d) {
      if (!d.active) th.force.alphaTarget(0);
      if (th.fixEnabled === false) {
        d.subject.fx = null;
        d.subject.fy = null;
      }
    }
    th.force.nodes(this.turnData.nodes);
    th.force.force('link').links(this.turnData.links);
    th.force.alpha(1).restart();
    this.highlightRoute();
  }

  /** Zoom über die Größe der SVG-Fläche; der Rahmen (graph-scroll) scrollt. */
  applyZoom() {
    const size = 750 * this.zoom;
    d3.select('svg#v7')
      .attr('viewBox', '0 0 500 500')
      .attr('width', size)
      .attr('height', size)
      .style('max-width', 'none');
  }

  /** Scrollt den Rahmen so, dass die Mitte der Darstellungsfläche sichtbar ist. */
  scrollToCenter() {
    const box = document.querySelector<HTMLElement>('.graph-scroll');
    if (box) {
      box.scrollLeft = (box.scrollWidth - box.clientWidth) / 2;
      box.scrollTop = (box.scrollHeight - box.clientHeight) / 2;
    }
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
  }

  readNewTurnDataWithRound(aRound: number) {
    this.routePlan = null;
    if (this.gamePrefSubsription !== null) {
      this.gamePrefSubsription.unsubscribe();
      this.gamePrefSubsription = null;
    }
    const request: RequestTurnDataOnlyPlayerAndRound = {
      playerName: this.currentUser.username,
      round: this.changeround,
      worldName: `W${this.selectWorld}`,
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
      if (this.changeround === this.round) {
        const element = this.form.get('Commands');
        if (element) {
          element.setValue(aTurnData.turnCommanTxt);
        }
      }
    });
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
      this.applySavedLayout(aWorldName, aSaveKey);
      this.deleteGraf();
      this.initGraf();
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
      this.ishiddenNextButton = false;
      if (this.changeround === 0) {
        this.ishiddenPrevButton = true;
      }
    }
  }

  pressNextRound() {
    if (this.changeround < this.round) {
      this.changeround += 1;
      this.readNewTurnDataWithRound(this.changeround);
      if (this.changeround === this.round) {
        this.ishidden = false;
        this.ishiddenNextButton = true;
      }
      if (this.changeround > 0) {
        this.ishiddenPrevButton = false;
      }
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

  private layoutKey(worldName: string): string {
    return `R${this.round}W${extractNumberString(worldName)}D${this.distanceLevelHomes}.${this.currentUser.username}`;
  }

  private readSave(key: string): Node[] {
    try {
      const saved: RespondTurnData | null = JSON.parse(localStorage.getItem(key) ?? 'null');
      return saved?.nodes ?? [];
    } catch {
      return [];
    }
  }

  private storageKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i) ?? '');
    }
    return keys;
  }

  /** Andere Saves des Benutzers: gleiche Runde zuerst, dann das nächstliegende Distanzlevel. */
  private otherSaveKeys(ownKey: string): string[] {
    return listSavedLayouts(this.storageKeys(), this.currentUser.username)
      .filter((save) => save.key !== ownKey)
      .map((save) => ({
        key: save.key,
        rank: (save.round === this.round ? 0 : 1000) + Math.abs(save.distanceLevel - this.distanceLevelHomes),
      }))
      .sort((a, b) => a.rank - b.rank)
      .map((k) => k.key);
  }

  /**
   * Übernimmt gesicherte Positionen ("save"). Zuerst gilt ein im Popup gewählter Save,
   * dann der eigene Save dieser Ansicht; Welten, die dort fehlen, bekommen ihre Position
   * aus Saves anderer Distanzlevel.
   */
  private applySavedLayout(worldName: string, preferredKey?: string) {
    const ownKey = this.layoutKey(worldName);
    const pending = new Map(this.turnData.nodes.map((n) => [n.id, n]));
    const keys = [...new Set([preferredKey ?? ownKey, ownKey, ...this.otherSaveKeys(ownKey)])];
    for (const key of keys) {
      if (pending.size === 0) {
        break;
      }
      for (const old of this.readSave(key)) {
        const node = pending.get(old.id);
        if (node && old.fx !== undefined && old.fy !== undefined) {
          node.x = old.fx;
          node.y = old.fy;
          node.fx = old.fx;
          node.fy = old.fy;
          pending.delete(old.id);
        }
      }
    }
  }

  openSavedLayouts() {
    this.savedLayouts = listSavedLayouts(this.storageKeys(), this.currentUser.username);
  }

  closeSavedLayouts() {
    this.savedLayouts = null;
  }

  /** Zeigt die Welt und das Distanzlevel eines Saves mit dessen Positionen an. */
  loadSavedLayout(save: SavedLayout) {
    this.selectWorld = save.world;
    this.distanceLevelHomes = save.distanceLevel;
    this.closeSavedLayouts();
    this.readNewTurnDataWithRoundAndWorldName(this.changeround, `W${save.world}`, save.key);
  }

  deleteSavedLayout(save: SavedLayout) {
    if (confirm(`Speicherung ${save.key} löschen?`)) {
      localStorage.removeItem(save.key);
      this.openSavedLayouts();
    }
  }

  pressSavewWorld() {
    for (const n of this.turnData.nodes) {
      n.fx = n.x;
      n.fy = n.y;
    }
    const key = this.layoutKey(`W${this.selectWorld}`);
    localStorage.setItem(key, JSON.stringify(this.turnData));
  }

}
