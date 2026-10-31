import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PlayerNotes } from '@galaxy/api-interfaces';

/** Eigene Notizen zu den Mitspielern (wen man für einen Collector hält), gespeichert auf dem Server. */
@Injectable({ providedIn: 'root' })
export class PlayerNotesService {
  constructor(private http: HttpClient) {}

  /** Markierte Collector; bei einem Fehler des Servers eine leere Liste. */
  collectors(playerName: string): Observable<string[]> {
    return this.http.post<PlayerNotes>('/api/player-notes/Get', { playerName }).pipe(
      map((notes) => notes.collectors ?? []),
      catchError(() => of([])),
    );
  }

  saveCollectors(playerName: string, collectors: string[]): Observable<string[]> {
    return this.http
      .post<PlayerNotes>('/api/player-notes/Save', { playerName, collectors })
      .pipe(map((notes) => notes.collectors));
  }
}
