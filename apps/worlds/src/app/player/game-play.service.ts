import { Injectable } from '@angular/core';
import { RespondTurnData, PlayerColor, PlayerCommands, RequestTurnDataOnlyPlayer, RequestTurnDataOnlyPlayerAndRound } from '@galaxy/game-objects';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Message } from '@galaxy/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class GamePlayService {

  constructor(private http: HttpClient) { }

  getTurnData(request: any): Observable<RespondTurnData> {
    return this.http.post<RespondTurnData>('/api/game-play/GetTurnData', request);
  }

  getTurnDataOnlyPlayer(request: RequestTurnDataOnlyPlayer): Observable<RespondTurnData> {
    return this.http.post<RespondTurnData>('/api/game-play/GetTurnDataOnlyPlayer', request);
  }

  getTurnDataOnlyPlayerAndRound(request: RequestTurnDataOnlyPlayerAndRound): Observable<RespondTurnData> {
    return this.http.post<RespondTurnData>('/api/game-play/GetTurnDataOnlyPlayerAndRound', request);
  }

  getPlayerColor(): Observable<Array<PlayerColor>> {
    return this.http.get<Array<PlayerColor>>('/api/GetPlayerColor');
  }

  setCommands(request: PlayerCommands): Observable<Message> {
    return this.http.post<Message>('/api/game-play/SetCommands', request);
  }

  getCommand(request: RequestTurnDataOnlyPlayer): Observable<PlayerCommands> {
    return this.http.post<PlayerCommands>('/api/game-play/GetCommands', request);
  }
 
}
