import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {HttpClient} from '@angular/common/http';
import { GamePref } from '@galaxy/game-objects';

@Injectable({
  providedIn: 'root'
})
export class GameServiceService {

  constructor(private http: HttpClient) { }

  setGamePref(gamepref): Observable<GamePref> {
    console.log(`gamepref: ${gamepref}`)
    return this.http.post<GamePref>('/api/create-world/SetGamePref', {
      worldCount: gamepref.worldCount
    })
  }
  
  createMessage(message): Observable<Object> {

    return this.http.post('http://localhost:3000/messages', {
      content: message.content,
      submittedBy: message.submittedBy
    });

  }
}