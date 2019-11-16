import { Component, OnInit, OnDestroy } from '@angular/core';
import { GameServiceService } from '../game-service.service';
import { Message } from '@galaxy/api-interfaces';
import { GamePref } from '@galaxy/game-objects';
import { Subscription } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';


@Component({
  selector: 'galaxy-create-worlds',
  templateUrl: './create-worlds.component.html',
  styleUrls: ['./create-worlds.component.css']
})

export class CreateWorldsComponent implements OnInit, OnDestroy {

  form: FormGroup;
  message: Message;
  ishidden:boolean;
  ishidden2:boolean;
  gamepref: GamePref;
  private readonly subscriptions = new Subscription();


  constructor(private fb: FormBuilder, private gameService: GameServiceService) { 
    this.ishidden = true;
    this.ishidden2 = true;
  }

  ngOnInit() {
    this.form = this.fb.group({
      Round: ['']
    });

    this.subscriptions.add(this.gameService.getGamePref().subscribe(out_gamepref => this.gamepref = out_gamepref));
  }

  onSubmitCreateWorld() {
    //subscribe(books => this.books = books);
    this.gameService.createWorlds().subscribe( aMessage => {
      this.message = aMessage;
      if (aMessage !== undefined && aMessage !== null) {
        if (this.message.message === 'OK') {
        this.ishidden = false;
        }
      }
    });
  }

  onSubmitExecuteRound() {
    this.gameService.executeRound().subscribe( aMessage => {
      this.message = aMessage;
      if (aMessage !== undefined && aMessage !== null) {
        if (this.message.message === 'OK') {
        this.ishidden2 = false;
        }
      }
    });
  }

  onSubmitSetRound() {
    this.gamepref.round = this.form.value.Round;

    this.gameService.setGamePref(this.gamepref)
      .subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
