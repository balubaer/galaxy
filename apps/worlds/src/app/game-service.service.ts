import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {HttpClient} from '@angular/common/http';
import { GamePref } from '@galaxy/game-objects';
import { Message } from '@galaxy/api-interfaces';


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

  createWorlds():Observable<Message> {
    console.log('createWorlds')
    return this.http.get<Message>('/api/create-world/CreateWorld');
  }
}