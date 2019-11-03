import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'galaxy-player-detail',
  templateUrl: './player-detail.component.html',
  styleUrls: ['./player-detail.component.css']
})
export class PlayerDetailComponent implements OnInit {
  playerName: string;

  constructor(private route: ActivatedRoute) {
    this.playerName = route.snapshot.params["player"];
  }

  ngOnInit() {
    const test = this.route.snapshot.paramMap.get["test"];

    console.log('test: ' + test);

    for (const key of this.route.snapshot.paramMap.keys) {
      console.log('key: ' + key);
    }
  }

}
