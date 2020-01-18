import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, Subject } from 'rxjs';
import * as d3 from 'd3';
import { Edge, Node } from '@swimlane/ngx-graph';

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

 // public layout: Layout = new DagreNodesOnlyLayout();
  public links$: Observable<Edge[]>;
  public links: Edge[];
  public nodes: Node[];
  public nodes$: Observable<Node[]>;
  
  public node: Node;
  autoZoom = true;
  autoCenter = true; 

  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();
  
  private readonly subscriptions = new Subscription();

  constructor(private http: HttpClient) {
    this.node = null;
    this.nodes = new Array();
    this.links = new Array();
  }

  ngOnInit() {
    this.worlds$ = this.http.get<string[]>('/api/WorldStringList');
    this.worldList$ = this.http.get<string[]>('/api/WorldsString');
    this.links$ = this.http.get<Edge[]>('/api/GetWorldsEdge');
    this.subscriptions.add(this.links$.subscribe(aLinks => this.links = aLinks));
    this.nodes$ = this.http.get<Node[]>('/api/GetWorldsNode');
    this.subscriptions.add(this.nodes$.subscribe(aNodes => this.nodes = aNodes));
    setTimeout(()=> this.autoCenter = false, 500);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onNodeSelected(aNode) {
    this.node = aNode;
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
}
