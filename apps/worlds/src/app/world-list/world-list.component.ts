import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, Subject } from 'rxjs';
//import * as d3 from 'd3';
import { Edge, Node } from '@swimlane/ngx-graph';

declare var d3 : any;

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

 // public layout: Layout = new DagreNodesOnlyLayout();
  public links$: Observable<Edge[]>;
  //public links: Edge[];
 // public nodes: Node[];
  public nodes$: Observable<Node[]>;
  
 // public node: Node;
  autoZoom = true;
  autoCenter = true; 

  draggingEnabled = false;
  panningEnabled = false;
  zoomEnabled = false;

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();
  
  private readonly subscriptions = new Subscription();

  constructor(private http: HttpClient) {
    //this.node = null;
   this.nodes = new Array();
   this.links = new Array();
  }

  ngOnInit() {
    this.links$ = this.http.get<any[]>('/api/GetEdge');
    //this.links$ = this.http.get<any[]>('/api/GetWorldsEdge');
    this.subscriptions.add(this.links$.subscribe(aLinks => {
      this.links = aLinks;
      console.log(this.links);
      this.initGraf();
     }));
     this.nodes$ = this.http.get<any[]>('/api/GetNode');
    // this.nodes$ = this.http.get<any[]>('/api/GetWorldsNode');
     this.subscriptions.add(this.nodes$.subscribe(aNodes => {
      this.nodes = aNodes;
      console.log(this.nodes);
      this.initGraf();
    }));
  
   /* this.nodes = [
      {"name":"King","dept":10},{"name":"Blake","dept":30},
      {"name":"Clark","dept":10},{"name":"Jones","dept":20},
      {"name":"Scott","dept":20},{"name":"Ford","dept":20},
      {"name":"Smith","dept":20},{"name":"Allen","dept":30},
      {"name":"Ward","dept":30},{"name":"Martin","dept":30},
      {"name":"Turner","dept":30},{"name":"Adams","dept":20},
      {"name":"James","dept":30},{"name":"Miller","dept":10}
    ];

    this.links = [
      {"source":1,"target":0},{"source":2,"target":0},
      {"source":3,"target":0},{"source":7,"target":1},
      {"source":8,"target":1},{"source":9,"target":1},
      {"source":10,"target":1},{"source":12,"target":1},
      {"source":13,"target":2},{"source":4,"target":3},
      {"source":5,"target":3},{"source":6,"target":5},
      {"source":11,"target":4}
    ]; */

   

    this.worlds$ = this.http.get<string[]>('/api/WorldStringList');
    this.worldList$ = this.http.get<string[]>('/api/WorldsString');
      // setTimeout(()=> this.autoCenter = false, 500);
  }

  initGraf() {
    if (this.nodes.length > 0 && this.links.length > 0) {
      const width = 300;
      const height = 225;
  
      const svg = d3.select("svg#v6")
      .attr("viewBox","0 0 " + width + " " + height)
      .attr("width","500px")
      .style("max-width","100%")
      .style("background-color","white");
  
      const color = d3.scale.category10();
      const force = d3.layout.force().size([width,height]);
  
      const links = svg.selectAll("line").data(this.links)
      .enter().append("line").style('stroke','#999');
    
    const nodes = svg.selectAll("circle").data(this.nodes)
      .enter().append("circle")
        .attr("r", 5)
        .style("fill", function(d){ return color(d.dept); })
        .call(force.drag);
    
    force.on("tick", function(){
      links
        .attr("x1", function(d){ return d.source.x; })
        .attr("y1", function(d){ return d.source.y; })
        .attr("x2", function(d){ return d.target.x; })
        .attr("y2", function(d){ return d.target.y; });
    
      nodes
        .attr("cx", function(d){ return d.x; })
        .attr("cy", function(d){ return d.y; });
    });
    
    force
      .nodes(this.nodes)
      .links(this.links)
      .start();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onNodeSelected(aNode) {
  //  this.node = aNode;
    console.log(aNode);
  }

  onBubbleSelected(d) {
    for (const node of this.nodes) {
      console.log(node);
    }
   // d.r = d.r * 2

  }

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
