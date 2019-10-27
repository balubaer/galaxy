import { Component, OnInit } from '@angular/core';
import {Validators, FormBuilder, FormGroup} from '@angular/forms';
import { GamePref } from '@galaxy/game-objects';
import { GameServiceService } from '../game-service.service';
import { Message } from '@galaxy/api-interfaces';


@Component({
  selector: 'galaxy-create-worlds',
  templateUrl: './create-worlds.component.html',
  styleUrls: ['./create-worlds.component.css']
})
export class CreateWorldsComponent implements OnInit {

  form: FormGroup;
  message: Message;
  ishidden:boolean;

  constructor(private fb: FormBuilder, private gameService: GameServiceService) { 
    this.ishidden = true;
  }

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

  onSubmitCreateWorld() {
    //subscribe(books => this.books = books);
    this.gameService.createWorlds().subscribe( aMessage => {
      this.message = aMessage;
      console.log(`onSubmitCreateWorld ${this.message.message}`);
      if (aMessage !== undefined && aMessage !== null) {
        if (this.message.message === 'OK') {
        this.ishidden = false;
        } else {
          console.log(`onSubmitCreateWorld ${this.message.message}`);
        }
      }
    });
  }
}
