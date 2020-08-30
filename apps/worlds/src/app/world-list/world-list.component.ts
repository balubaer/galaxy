import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, Subject } from 'rxjs';
import { Edge, Node } from '@swimlane/ngx-graph';

declare var d3: any;

@Component({
  selector: 'galaxy-world-list',
  templateUrl: './world-list.component.html',
  styleUrls: ['./world-list.component.css']
})
export class WorldListComponent implements OnInit, OnDestroy {
  worlds$: Observable<string[]>;
  worldList$: Observable<string[]>;
  width: number;
  height: number;

  nodes: any[];
  links: any[];

  public links$: Observable<Edge[]>;
  public nodes$: Observable<Node[]>;

  public node: Node;
  //node$: Observable<Node>;

  autoZoom = true;
  autoCenter = true;

  draggingEnabled = false;
  panningEnabled = false;
  zoomEnabled = false;

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();

  private readonly subscriptions = new Subscription();

  constructor(private http: HttpClient) {
    this.node = null;
    this.nodes = new Array();
    this.links = new Array();
  }

  ngOnInit() {
    // this.links$ = this.http.get<any[]>('/api/GetEdge');
    this.links$ = this.http.get<any[]>('/api/GetWorldsEdge');
    this.subscriptions.add(this.links$.subscribe(aLinks => {
      this.links = aLinks;
      console.log(this.links);
      this.initGraf();
    }));
    // this.nodes$ = this.http.get<any[]>('/api/GetNode');
    this.nodes$ = this.http.get<any[]>('/api/GetWorldsNode');
    this.subscriptions.add(this.nodes$.subscribe(aNodes => {
      this.nodes = aNodes;
      console.log(this.nodes);
      this.initGraf();
    }));

    this.worlds$ = this.http.get<string[]>('/api/WorldStringList');
    this.worldList$ = this.http.get<string[]>('/api/WorldsString');
    // setTimeout(()=> this.autoCenter = false, 500);
  }

  initGraf() {
    let th = this;

    if (this.nodes.length > 0 && this.links.length > 0) {
      const width = 300;
      const height = 225;

      const svg = d3.select("svg#v6")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("width", "500px")
        .style("max-width", "100%")
        .style("background-color", "white");

      const color = d3.scaleOrdinal(d3.schemeTableau10);

      const force = d3.forceSimulation();

      force.force("link", d3.forceLink().id(d => d.id).distance(10));

      force
        .force("charge_force", d3.forceManyBody())
        .force("center_force", d3.forceCenter(width / 2, height / 2));

      const links = svg.selectAll("line").data(this.links)
        .enter().append("line").style('stroke', '#999');

      const nodes = svg.selectAll("circle").data(this.nodes)
        .enter().append("circle")
        .attr("r", 5)
        .style("fill", function (d) { return color(d.dept); });

      nodes.on("click", clicked);

      function clicked(event, d) {
        th.node = d;

        //console.log(d);
        if (event.defaultPrevented) return; // dragged

        d3.select(this).transition()
          .attr("fill", "black")
          .attr("r", 10 * 2)
          .transition()
          .attr("r", 10)
          .attr("fill", d3.schemeCategory10[d.index % 10]);
      }

      force.on("tick", function () {
        links
          .attr("x1", function (d) { return d.source.x; })
          .attr("y1", function (d) { return d.source.y; })
          .attr("x2", function (d) { return d.target.x; })
          .attr("y2", function (d) { return d.target.y; });

        nodes
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });
      });

      const drag_handler = d3.drag()
        .on("start", drag_start)
        .on("drag", drag_drag)
        .on("end", drag_end);

      drag_handler(nodes)

      function drag_start(d) {
        if (!d.active) force.alphaTarget(0.3).restart();
        d.subject.fx = d.subject.x;
        d.subjectfy = d.subject.y;
      }

      function drag_drag(d) {
        d.subject.fx = d.x;
        d.subject.fy = d.y;
      }


      function drag_end(d) {
        if (!d.active) force.alphaTarget(0);
        d.subject.fx = null;
        d.subject.fy = null;
      }

      force
        .nodes(this.nodes);
      force.force("link").links(this.links);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onNodeSelected(e, aNode) {
   // this.node$ = aNode.asObservable();
   // this.node$.subscribe(aNodeIn => {
   //   this.node = aNodeIn;
   // });
   this.node = aNode;
    console.log(aNode);
  }

  clickdragging() {
    console.log(this.node);

    if (this.draggingEnabled === true) {
      this.draggingEnabled = false;
    } else {
      this.draggingEnabled = true;
    }
  }

  clickpanning() {
    if (this.panningEnabled === true) {
      this.panningEnabled = false;
    } else {
      this.panningEnabled = true;
    }
  }

  clickzoom() {
    if (this.zoomEnabled === true) {
      this.zoomEnabled = false;
    } else {
      this.zoomEnabled = true;
    }
  }
}
