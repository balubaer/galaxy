import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, forkJoin } from 'rxjs';
import { clampToArea, keepNodesInArea } from '../_helpers/graph-bounds';
import * as d3 from 'd3';

@Component({
    selector: 'galaxy-world-list',
    templateUrl: './world-list.component.html',
    styleUrls: ['./world-list.component.css'],
    standalone: false
})
export class WorldListComponent implements OnInit, OnDestroy {
  worldList$: Observable<string[]> | undefined;

  nodes: any[];
  links: any[];

  public node: any | null;

  private readonly subscriptions = new Subscription();

  constructor(private http: HttpClient) {
    this.nodes = [];
    this.links = [];
  }

  ngOnInit() {
    this.worldList$ = this.http.get<string[]>('/api/WorldsString');
    this.subscriptions.add(
      forkJoin({
        nodes: this.http.get<any[]>('/api/GetWorldsNode'),
        links: this.http.get<any[]>('/api/GetWorldsEdge')
      }).subscribe(({ nodes, links }) => {
        this.nodes = nodes;
        this.links = links;
        this.initGraf();
      })
    );
  }

  initGraf() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const th = this;

    if (this.nodes.length > 0 && this.links.length > 0) {
      const width = 300;
      const height = 225;
      // Welten bleiben mit ihrem Kreis (r = 5) vollständig in der Darstellungsfläche.
      const margin = 5;

      const svg = d3
        .select('svg#v6')
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('width', '500px')
        .style('max-width', '100%')
        .style('background-color', 'white');

      const color = d3.scaleOrdinal(d3.schemeTableau10);

      const force = d3.forceSimulation();

      force.force(
        'link',
        d3
          .forceLink()
          .id((d) => d.id)
          .distance(15)
      );

      force
        .force('charge_force', d3.forceManyBody())
        .force('center_force', d3.forceCenter(width / 2, height / 2));

      const links = svg
        .selectAll('line')
        .data(this.links)
        .enter()
        .append('line')
        .style('stroke', '#999');

      const nodes = svg
        .selectAll('circle')
        .data(this.nodes)
        .enter()
        .append('circle')
        .attr('r', 5)
        .style('fill', function (d) {
          return color(d.dept);
        });

      nodes.on('click', clicked);

      // eslint-disable-next-line no-inner-declarations
      function clicked(this: any, event, d) {
        th.node = d;

        if (event.defaultPrevented) return; // dragged

        d3.select(this)
          .transition()
          .attr('fill', 'black')
          .attr('r', 10 * 2)
          .transition()
          .attr('r', 10)
          .attr('fill', d3.schemeCategory10[d.index % 10]);
      }

      force.on('tick', function () {
        keepNodesInArea(th.nodes, width, height, margin);
        links
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

        nodes
          .attr('cx', function (d) {
            return d.x;
          })
          .attr('cy', function (d) {
            return d.y;
          });
      });

      const drag_handler = d3
        .drag()
        .on('start', drag_start)
        .on('drag', drag_drag)
        .on('end', drag_end);

      drag_handler(nodes);

      // eslint-disable-next-line no-inner-declarations
      function drag_start(d: {
        active: any;
        subject: { fx: any; fy: any; x: any; y: any };
      }) {
        if (!d.active) force.alphaTarget(0.3).restart();
        d.subject.fx = d.subject.x;
        d.subject.fy = d.subject.y;
      }

      // eslint-disable-next-line no-inner-declarations
      function drag_drag(d) {
        d.subject.fx = clampToArea(d.x, width, margin);
        d.subject.fy = clampToArea(d.y, height, margin);
      }

      // eslint-disable-next-line no-inner-declarations
      function drag_end(d) {
        if (!d.active) force.alphaTarget(0);
        d.subject.fx = null;
        d.subject.fy = null;
      }

      force.nodes(this.nodes);
      force.force('link').links(this.links);
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
