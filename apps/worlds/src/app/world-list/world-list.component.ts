import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import * as d3 from 'd3';
import { Layout, Edge, Node } from '@swimlane/ngx-graph';
import { DagreNodesOnlyLayout } from './customDagreNodesOnly';


function Step(context, t) {
  this._context = context;
  this._t = t;
}

const stepRound = function (context) {
  return new Step(context, 0.5);
};

Step.prototype = {
  areaStart: function () {
    this._line = 0;
  },
  areaEnd: function () {
    this._line = NaN;
  },
  lineStart: function () {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function () {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function (x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
        break;
      case 1:
        this._point = 2; // proceed
      default:
        {
          var xN, yN, mYb, mYa;
          if (this._t <= 0) {
            xN = Math.abs(x - this._x) * 0.25;
            yN = Math.abs(y - this._y) * 0.25;
            mYb = (this._y < y) ? this._y + yN : this._y - yN;
            mYa = (this._y > y) ? y + yN : y - yN;

            this._context.quadraticCurveTo(this._x, this._y, this._x, mYb);
            this._context.lineTo(this._x, mYa);
            this._context.quadraticCurveTo(this._x, y, this._x + xN, y);
            this._context.lineTo(x - xN, y);

          } else {
            var x1 = this._x * (1 - this._t) + x * this._t;

            xN = Math.abs(x - x1) * 0.25;
            yN = Math.abs(y - this._y) * 0.25;
            mYb = (this._y < y) ? this._y + yN : this._y - yN;
            mYa = (this._y > y) ? y + yN : y - yN;

            this._context.quadraticCurveTo(x1, this._y, x1, mYb);
            this._context.lineTo(x1, mYa);
            this._context.quadraticCurveTo(x1, y, x1 + xN, y);
            this._context.lineTo(x - xN, y);
          }
          break;
        }
    }
    this._x = x, this._y = y;
  }
};

const stepRoundBefore = function (context) {
  return new Step(context, 0);
};

const stepRoundAfter = function (context) {
  return new Step(context, 1);
};

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
  data = [
    {
      x: 2,
      y: 2,
      r: 4
    },
    {
      x: 10,
      y: 10,
      r: 6
    }
  ]

 // public layout: Layout = new DagreNodesOnlyLayout();
  public links$: Observable<Edge[]>;
  public links: Edge[];
  public nodes: Node[];
  public nodes$: Observable<Node[]>;

  public node: Node;

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


    /*const pack = d3.pack()
      .size([this.width, this.height])
      .padding(1.5);
    const root = d3.hierarchy({ children: this.getBubbles() })
      .sum(function (d) {
        return d.value;
      });
    this.data = pack(root).leaves();*/
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
