import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'galaxy-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('MapsComponent');
  }

}
