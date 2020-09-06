import { Component, OnInit } from '@angular/core';
import { LoginInterface } from '@galaxy/api-interfaces';

@Component({
  selector: 'galaxy-show-maps',
  templateUrl: './show-maps.component.html',
  styleUrls: ['./show-maps.component.scss']
})
export class ShowMapsComponent implements OnInit {

  keys: Array<string>;
  currentUser: LoginInterface;

  constructor() {
    this.keys = new Array<string>();
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }

  ngOnInit() {
    console.log('ShowMapsComponent');

    for (let i=0; i<=localStorage.length-1; i++)  
    {  
        const key = localStorage.key(i);  
        console.log(key);

        const suffix = key.split('.')[1];

        //alert(localStorage.getItem(key));
        if (suffix === this.currentUser.username) {
        this.keys.push(key);
        }

    }  
    console.log(this.keys);
    // tslint:disable-next-line: forin
    /*for (const key in localStorage) {
      this.keys.push(key);
    }*/
  }

}
