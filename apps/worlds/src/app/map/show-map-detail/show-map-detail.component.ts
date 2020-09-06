import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoginInterface } from '@galaxy/api-interfaces';
import { RespondTurnData } from '@galaxy/game-objects';

declare var d3: any;

@Component({
  selector: 'galaxy-show-map-detail',
  templateUrl: './show-map-detail.component.html',
  styleUrls: ['./show-map-detail.component.scss']
})
export class ShowMapDetailComponent implements OnInit {
  key: string;
  currentUser: LoginInterface;
  public node: Node;
  nodes: any;
  links: any;

  force: any;

  turnData: RespondTurnData;


  constructor(
    private route: ActivatedRoute) {
    this.key = route.snapshot.params["key"];
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
   }

  ngOnInit() {
    this.turnData = JSON.parse(localStorage.getItem(this.key));
    this.initGraf();
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
        d.subject.fx = null;
        d.subject.fy = null;
    }

    th.force.nodes(this.turnData.nodes);
    th.force.force("link").links(this.turnData.links);
    th.force.alpha(1).restart();
  }

}
