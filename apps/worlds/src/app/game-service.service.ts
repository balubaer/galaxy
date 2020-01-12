import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GamePref } from '@galaxy/game-objects';
import { Message } from '@galaxy/api-interfaces';


@Injectable({
  providedIn: 'root'
})
export class GameServiceService {

  constructor(private http: HttpClient) { }

  setGamePref(gamepref): Observable<GamePref> {
    return this.http.post<GamePref>('/api/create-world/SetGamePref', gamepref)
  }

  getGamePref(): Observable<GamePref> {
    return this.http.get<GamePref>('/api/create-world/GetGamePref');
  }

  getPlayerList(): Observable<Array<string>> {
    return this.http.get<Array<string>>('/api/create-world/GetPlayerList')
  }

  getColors(): Observable<Array<string>> {
    return this.http.get<Array<string>>('/api/GetColors')
  }

  createWorlds(): Observable<Message> {
    return this.http.get<Message>('/api/create-world/CreateWorld');
  }

  executeRound(): Observable<Message> {
    return this.http.get<Message>('/api/game-play/ExecuteRound');
  }
}