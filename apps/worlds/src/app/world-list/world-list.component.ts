import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, Subject } from 'rxjs';

declare let d3: any;

@Component({
  selector: 'galaxy-world-list',
  templateUrl: './world-list.component.html',
  styleUrls: ['./world-list.component.css']
})
export class WorldListComponent implements OnInit, OnDestroy {
  worlds$: Observable<string[]> | undefined;
  worldList$: Observable<string[]> | undefined;
  width = 0;
  height = 0;

nodes: any[];
links: any[];
 // public layout: Layout = new DagreNodesOnlyLayout();
  public links$: Observable<any[]> | undefined;
  //public links: Edge[];
  //public nodes: Node[];
  public nodes$: Observable<any[]> | undefined;
  
  public node: any | null;
  autoZoom = true;
  autoCenter = true; 

  draggingEnabled = false;
  panningEnabled = false;
  zoomEnabled = false;

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();
  
  private readonly subscriptions = new Subscription();

  constructor(private http: HttpClient) {
    /*this.node = null;*/
    this.nodes = [];
    this.links = [];
  }

  ngOnInit() {
    this.worlds$ = this.http.get<string[]>('/api/WorldStringList');
    this.worldList$ = this.http.get<string[]>('/api/WorldsString');
          this.links$ = this.http.get<any[]>('/api/GetEdge');
      this.subscriptions.add(this.links$.subscribe(aLinks => {
                                                   this.links = aLinks;
                                                   console.log(this.links);
                                                   this.initGraf();
                                                   }));
     this.nodes$ = this.http.get<any[]>('/api/GetNode');
      this.subscriptions.add(this.nodes$.subscribe(aNodes => {
                                                   this.nodes = aNodes;
                                                   console.log(this.nodes);
                                                   this.initGraf();
                                                   }));

    //this.links$ = this.http.get<Edge[]>('/api/GetWorldsEdge');
    //this.subscriptions.add(this.links$.subscribe(aLinks => this.links = aLinks));
    //this.nodes$ = this.http.get<Node[]>('/api/GetWorldsNode');
    //this.subscriptions.add(this.nodes$.subscribe(aNodes => this.nodes = aNodes));
    //setTimeout(()=> this.autoCenter = false, 500);
  }

    initGraf() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const th = this;
        
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
            
            // eslint-disable-next-line no-inner-declarations
            function clicked(this: any, event, d) {
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
            
            // eslint-disable-next-line no-inner-declarations
            function drag_start(d: { active: any; subject: { fx: any; x: any; y: any; }; subjectfy: unknown; }) {
                if (!d.active) force.alphaTarget(0.3).restart();
                d.subject.fx = d.subject.x;
                d.subjectfy = d.subject.y;
            }
            
            // eslint-disable-next-line no-inner-declarations
            function drag_drag(d) {
                d.subject.fx = d.x;
                d.subject.fy = d.y;
            }
            
            
            // eslint-disable-next-line no-inner-declarations
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

  /*onNodeSelected(aNode: Node | null) {
   // this.node = aNode;
  }

  onBubbleSelected(_d: any) {
    for (const node of this.nodes) {
    }
   // d.r = d.r * 2

  }*/

  getBubbles(): any {

    return {
      "children": [{ "Name": "Olives", "Count": 4319 },
      { "Name": "Tea", "Count": 4159 },
      { "Name": "Mashed Potatoes", "Count": 2583 },
      { "Name": "Boiled Potatoes", "Count": 2074 },
      { "Name": "Milk", "Count": 1894 },
      { "Name": "Chicken Salad", "Count": 1809 },
      { "Name": "Vanilla Ice Cream", "Count": 1713 },
      { "Name": "Cocoa", "Count": 1636 },
      { "Name": "Lettuce Salad", "Count": 1566 },
      { "Name": "Lobster Salad", "Count": 1511 },
      { "Name": "Chocolate", "Count": 1489 },
      { "Name": "Apple Pie", "Count": 1487 },
      { "Name": "Orange Juice", "Count": 1423 },
      { "Name": "American Cheese", "Count": 1372 },
      { "Name": "Green Peas", "Count": 1341 },
      { "Name": "Assorted Cakes", "Count": 1331 },
      { "Name": "French Fried Potatoes", "Count": 1328 },
      { "Name": "Potato Salad", "Count": 1306 },
      { "Name": "Baked Potatoes", "Count": 1293 },
      { "Name": "Roquefort", "Count": 1273 },
      { "Name": "Stewed Prunes", "Count": 1268 }]
    };
  }

  clickdragging() {
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
