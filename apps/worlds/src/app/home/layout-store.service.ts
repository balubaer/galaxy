import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { LayoutData, LayoutInfo, LayoutNode } from '@galaxy/api-interfaces';
import { listSavedLayouts, SavedLayout } from './saved-layouts';

/**
 * Save im localStorage. `updated` ist der Serverzeitpunkt der letzten Speicherung;
 * `dirty` markiert Saves, die noch nicht auf dem Server liegen. Alte Saves aus der Zeit
 * vor der Serverspeicherung haben beides nicht und werden beim Abgleich hochgeladen.
 */
interface CachedLayout {
  updated?: number;
  dirty?: boolean;
  nodes: { id: string; fx?: number; fy?: number }[];
}

/**
 * Anordnungen der Karte ("saves"). Sie liegen auf dem Server, damit sie in jedem Browser
 * verfügbar sind; der localStorage dient als Cache, sodass Lesen ohne Serveranfrage geht.
 */
@Injectable({ providedIn: 'root' })
export class LayoutStoreService {
  /** Gelöschte Saves, deren Löschen der Server noch nicht bestätigt hat. */
  private readonly deleting = new Set<string>();
  /** Wann (performance.now()) ein Save zuletzt hochgeladen wurde. */
  private readonly uploadedAt = new Map<string, number>();

  constructor(private http: HttpClient) {}

  /**
   * Gleicht den Cache mit dem Server ab: neuere Saves vom Server holen, auf dem Server
   * gelöschte entfernen, nur lokal vorhandene hochladen. Liefert, ob sich der Cache geändert
   * hat. Fehler des Servers lassen den Cache unverändert.
   */
  sync(user: string): Observable<boolean> {
    const started = performance.now();
    return this.http.post<LayoutInfo[]>('/api/layouts/List', { playerName: user }).pipe(
      switchMap((remote) => {
        const remoteByKey = new Map(remote.map((info) => [info.key, info.updated]));
        const requests: Observable<boolean>[] = [];
        for (const { key } of this.list(user)) {
          const cached = this.read(key);
          if (!cached) {
            continue;
          }
          if (cached.dirty || cached.updated === undefined) {
            requests.push(this.upload(user, key).pipe(map(() => false)));
          } else if (!remoteByKey.has(key) && (this.uploadedAt.get(key) ?? -1) < started) {
            localStorage.removeItem(key);
            requests.push(of(true));
          }
        }
        for (const [key, updated] of remoteByKey) {
          const cached = this.read(key);
          if (this.deleting.has(key)) {
            continue;
          }
          if (!cached || (!cached.dirty && (cached.updated ?? 0) < updated)) {
            requests.push(this.download(user, key));
          }
        }
        return requests.length ? forkJoin(requests).pipe(map((changes) => changes.some(Boolean))) : of(false);
      }),
      catchError(() => of(false))
    );
  }

  /** Saves des Benutzers aus dem Cache. */
  list(user: string): SavedLayout[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i) ?? '');
    }
    return listSavedLayouts(keys, user);
  }

  /** Gesicherte Positionen eines Saves aus dem Cache. */
  nodes(key: string): LayoutNode[] {
    return (this.read(key)?.nodes ?? []).filter(
      (n): n is LayoutNode => n.fx !== undefined && n.fy !== undefined
    );
  }

  /** Speichert sofort im Cache und lädt dann auf den Server hoch. */
  save(user: string, key: string, nodes: LayoutNode[]) {
    const cached: CachedLayout = { dirty: true, nodes: nodes.map(({ id, fx, fy }) => ({ id, fx, fy })) };
    this.write(key, cached);
    this.upload(user, key).subscribe();
  }

  delete(user: string, key: string) {
    localStorage.removeItem(key);
    this.deleting.add(key);
    this.http
      .post('/api/layouts/Delete', { playerName: user, key })
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.deleting.delete(key));
  }

  /** Lädt einen Save hoch; klappt das nicht, bleibt er `dirty` für den nächsten Abgleich. */
  private upload(user: string, key: string): Observable<void> {
    const nodes = this.nodes(key);
    const sent = JSON.stringify(nodes);
    return this.http.post<LayoutInfo>('/api/layouts/Save', { playerName: user, key, nodes }).pipe(
      tap((info) => {
        // Nur als abgeglichen markieren, wenn inzwischen nicht neu gespeichert oder gelöscht wurde.
        this.uploadedAt.set(key, performance.now());
        if (this.read(key) && JSON.stringify(this.nodes(key)) === sent) {
          this.write(key, { updated: info.updated, nodes });
        }
      }),
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  private download(user: string, key: string): Observable<boolean> {
    return this.http.post<LayoutData>('/api/layouts/Get', { playerName: user, key }).pipe(
      tap((layout) => this.write(key, { updated: layout.updated, nodes: layout.nodes })),
      map(() => true),
      catchError(() => of(false))
    );
  }

  private read(key: string): CachedLayout | null {
    try {
      const cached: CachedLayout | null = JSON.parse(localStorage.getItem(key) ?? 'null');
      return Array.isArray(cached?.nodes) ? cached : null;
    } catch {
      return null;
    }
  }

  private write(key: string, cached: CachedLayout) {
    try {
      localStorage.setItem(key, JSON.stringify(cached));
    } catch {
      // Cache voll: der Save liegt trotzdem auf dem Server.
    }
  }
}
