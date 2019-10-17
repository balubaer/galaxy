import { Component, OnInit } from '@angular/core';
import {Validators, FormBuilder, FormGroup} from '@angular/forms';
import { GamePref } from '@galaxy/game-objects';
import { GameServiceService } from '../game-service.service';


@Component({
  selector: 'galaxy-create-worlds',
  templateUrl: './create-worlds.component.html',
  styleUrls: ['./create-worlds.component.css']
})
export class CreateWorldsComponent implements OnInit {

  form: FormGroup;

  constructor(private fb: FormBuilder, private gameService: GameServiceService) { }

  ngOnInit() {
    this.form = this.fb.group({
      WorldsCount: ['', Validators.required]
    });
  }

  onSubmit() {

    const gamepref: GamePref = {
      worldCount: this.form.value.WorldsCount
    }

    console.log('Added new book', gamepref)

    this.gameService.setGamePref(gamepref)
      .subscribe((gamepref01: GamePref) => console.log('Added new book', gamepref01));
  }

}
