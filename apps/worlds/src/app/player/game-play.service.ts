import { Injectable } from '@angular/core';
import { RespondTurnData } from '@galaxy/game-objects';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Message } from '@galaxy/api-interfaces';

@Injectable({
  providedIn: 'root'
})
export class GamePlayService {

  constructor(private http: HttpClient) { }

  getTurnData(request): Observable<RespondTurnData> {
    return this.http.post<RespondTurnData>('/api/game-play/GetTurnData', request);
  }

  getTurnDataOnlyPlayer(request): Observable<RespondTurnData> {
    return this.http.post<RespondTurnData>('/api/game-play/GetTurnDataOnlyPlayer', request);
  }

  setCommands(request): Observable<Message> {
    return this.http.post<Message>('/api/game-play/SetCommands', request);
  }
 
}
