import { Component, OnInit } from '@angular/core';
import { GameServiceService } from '../game-service.service';
import { Message } from '@galaxy/api-interfaces';


@Component({
  selector: 'galaxy-create-worlds',
  templateUrl: './create-worlds.component.html',
  styleUrls: ['./create-worlds.component.css']
})
export class CreateWorldsComponent implements OnInit {

  message: Message;
  ishidden:boolean;
  ishidden2:boolean;
  

  constructor(private gameService: GameServiceService) { 
    this.ishidden = true;
    this.ishidden2 = true;
  }

  ngOnInit() {
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
  onSubmitExecuteRound() {
    this.gameService.executeRound().subscribe( aMessage => {
      this.message = aMessage;
      if (aMessage !== undefined && aMessage !== null) {
        if (this.message.message === 'OK') {
        this.ishidden2 = false;
        } else {
          console.log(`onSubmitExecuteRound ${this.message.message}`);
        }
      }
    });
  }
}
