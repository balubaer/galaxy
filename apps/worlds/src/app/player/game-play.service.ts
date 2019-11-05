import { Injectable } from '@angular/core';
import { RespondTurnData } from '@galaxy/game-objects';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GamePlayService {

  constructor(private http: HttpClient) { }

  getTurnData(request): Observable<RespondTurnData> {
    console.log(`request: ${request}`)
    return this.http.post<RespondTurnData>('/api/game-play/GetTurnData', request)
  }

  /* getGamePref(): Observable<GamePref> {
     return this.http.get<GamePref>('/api/create-world/GetGamePref');
   }*/
}
