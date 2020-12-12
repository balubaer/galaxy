import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from '../_services/authentication.service';
import { User, LoginInterface } from '@galaxy/api-interfaces';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { RespondTurnData, RequestTurnDataOnlyPlayer, PlayerCommands, GamePref, RequestTurnDataOnlyPlayerAndRound, PlayerColor, extractNumberString } from '@galaxy/game-objects';
import { GamePlayService } from '../player/game-play.service';
import { Node } from '@swimlane/ngx-graph';
import { GameServiceService } from '../game-service.service';

declare var d3: any;

@Component({
  selector: 'galaxy-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: LoginInterface;
  form: FormGroup;
  turnData$: Observable<RespondTurnData>;
  turnData: RespondTurnData;
  private readonly subscriptions = new Subscription();
  subscriptionsTurnData: Subscription = null;
  gamePref$: Observable<GamePref>;
  gamePrefSubsription: Subscription = null;
  homeWorldName: string;
  distanceLevelHomes: number;
  selectWorld: number;

  public node: Node;
  nodes: any;
  links: any;
  force: any;

  fixEnabled = false;

  round: number;
  changeround: number;
  playercolor$: Observable<Array<PlayerColor>>;

  turnCommandTxt = '';

  ishidden = false;
  ishiddenNextButton = true;
  ishiddenPrevButton = false;

  constructor(
    private authenticationService: AuthenticationService,
    private gamePlayService: GamePlayService,
    private gamePrefService: GameServiceService,
    private fb: FormBuilder
  ) {
    this.currentUser = this.authenticationService.currentUserValue;
    this.form = this.fb.group({
      Commands: ['']
    });
  }

  ngOnInit() {
    this.distanceLevelHomes = 3;


    const request: RequestTurnDataOnlyPlayer = {
      playerName: this.currentUser.username,
      distanceLevelHomes: this.distanceLevelHomes
    }
    const playerCommands$: Observable<PlayerCommands> = this.gamePlayService.getCommand(request);
    playerCommands$.subscribe(aPlayerCommands => {
      this.turnCommandTxt = aPlayerCommands.commands;
      this.form.get('Commands').setValue(aPlayerCommands.commands);
    })

    this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayer(request);
    this.subscriptionsTurnData = this.turnData$.subscribe(aTurnData => {
      this.homeWorldName = aTurnData.homeWorldName;
      this.selectWorld = +extractNumberString(aTurnData.homeWorldName);
      this.turnData = aTurnData;
      this.initGraf();
    });

    this.gamePref$ = this.gamePrefService.getGamePref();
    this.playercolor$ = this.gamePlayService.getPlayerColor();

    this.subscriptions.add(this.form.valueChanges.subscribe(console.log));
    this.subscriptions.add(this.form.statusChanges.subscribe(console.log));
    this.gamePrefSubsription = this.gamePref$.subscribe(aGamePref => {
      this.round = aGamePref.round;
      this.changeround = aGamePref.round
    });
  }

  deleteGraf() {
    const svgv7 = d3.select("svg#v7");
    const dellines = svgv7.selectAll("line");
    dellines.remove();
    const delnodes = svgv7.selectAll(".nodes");
    delnodes.remove();
  }

  initGraf() {
    const th = this;

    const width = 500;
    const height = 500;
    const svgv7 = d3.select("svg#v7")
      .attr("viewBox", "0 0 " + width + " " + height)
      .attr("width", "750px")
      .style("max-width", "100%")
      .style("background-color", "white");

    th.force = d3.forceSimulation();

    th.force.force("link", d3.forceLink().id(d => d.id).distance(15));

    th.force
      .force("charge_force", d3.forceManyBody())
      .force("center_force", d3.forceCenter(width / 2, height / 2));

    th.links = svgv7.selectAll("line")
      .data(this.turnData.links)
      .enter()
      .append("line")
      .style('stroke', '#999');

    th.nodes = svgv7.selectAll(".nodes")
      .data(this.turnData.nodes)
      .enter()
      .append("g")
      .attr("class", "nodes");


    th.nodes.append("circle")
      .attr("r", 10)
      .style("fill", function (d) { return d.data.backgroundColor; })

    const drag_handler = d3.drag()
      .on("start", drag_start)
      .on("drag", drag_drag)
      .on("end", drag_end);

    drag_handler(th.nodes)

    th.nodes.append("text")
      .attr("dy", 3)
      .attr("dx", 0)
      .attr("font-family", "sans-serif")
      .attr("font-size", 7)
      .attr("text-anchor", "middle")
      .text(d => d.id);

    th.nodes.on("click", clicked);

    function clicked(event, d) {
      th.node = d;

      if (event.defaultPrevented) return; // dragged

      d3.select(this).transition()
        .attr("fill", "black")
        .attr("r", 10 * 2)
        .transition()
        .attr("r", 10)
        .attr("fill", d3.schemeCategory10[d.index % 10]);
    }

    th.force.on("tick", function () {
      th.links
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

      th.nodes.attr("transform", d => `translate(${d.x},${d.y})`);

    });

    function drag_start(d) {
      console.log(d.subject);
      if (!d.active) th.force.alphaTarget(0.3).restart();
      d.subject.fx = d.subject.x;
      d.subject.fy = d.subject.y;
    }

    function drag_drag(d) {
      d.subject.fx = d.x;
      d.subject.fy = d.y;
    }

    function drag_end(d) {
      if (!d.active) th.force.alphaTarget(0);
      if (th.fixEnabled === false) {
        d.subject.fx = null;
        d.subject.fy = null;
      }
    }

    th.force.nodes(this.turnData.nodes);
    th.force.force("link").links(this.turnData.links);
    th.force.alpha(1).restart();
  }

  onSubmit() {
    if (this.round === this.changeround) {
      const commands: PlayerCommands = {
        player: this.currentUser.username,
        commands: this.form.value.Commands
      }
      this.subscriptions.add(this.gamePlayService.setCommands(commands).subscribe());
      this.turnCommandTxt = this.form.value.Commands;
    }
  }

  onNodeSelected(aNode) {
    this.node = aNode;
    this.readNewTurnDataWithRoundAndWorldName(this.changeround, this.node.id);
    this.selectWorld = +extractNumberString(this.node.id);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  readNewTurnDataWithRound(aRound: number) {
    if (this.gamePrefSubsription !== null) {
      this.gamePrefSubsription.unsubscribe();
      this.gamePrefSubsription = null;
    }
    const request: RequestTurnDataOnlyPlayerAndRound = {
      playerName: this.currentUser.username,
      round: this.changeround,
      worldName: `W${this.selectWorld}`,
      distanceLevelHomes: this.distanceLevelHomes
    }

    if (this.subscriptionsTurnData !== null) {
      this.subscriptionsTurnData.unsubscribe();
      this.subscriptionsTurnData = null;
    }
    this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayerAndRound(request);
    this.subscriptionsTurnData = this.turnData$.subscribe(aTurnData => {
      this.turnCommandTxt = aTurnData.turnCommanTxt;
      this.turnData = aTurnData;
      this.deleteGraf();
      this.initGraf();
      if (this.changeround === this.round) {
        this.form.get('Commands').setValue(aTurnData.turnCommanTxt);
      }
    });
  }

  readNewTurnDataWithRoundAndWorldName(aRound: number, aWorldName: string) {
    if (this.gamePrefSubsription !== null) {
      this.gamePrefSubsription.unsubscribe();
      this.gamePrefSubsription = null;
    }
    const request: RequestTurnDataOnlyPlayerAndRound = {
      playerName: this.currentUser.username,
      round: this.changeround,
      worldName: aWorldName,
      distanceLevelHomes: this.distanceLevelHomes
    }

    if (this.subscriptionsTurnData !== null) {
      this.subscriptionsTurnData.unsubscribe();
      this.subscriptionsTurnData = null;
    }

    this.turnData$ = this.gamePlayService.getTurnDataOnlyPlayerAndRound(request);
    this.subscriptionsTurnData = this.turnData$.subscribe(aTurnData => {
      this.turnCommandTxt = aTurnData.turnCommanTxt;
      this.turnData = aTurnData;
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
    this.readNewTurnDataWithRoundAndWorldName(this.changeround, `W${this.selectWorld}`);
  }

  pressSavewWorld() {
    for (const n of this.turnData.nodes) {
      n.fx = n.x;
      n.fy = n.y;
    }
    const key = `R${this.round}W${this.selectWorld}D${this.distanceLevelHomes}.${this.currentUser.username}`;
    localStorage.setItem(key, JSON.stringify(this.turnData));
  }
}