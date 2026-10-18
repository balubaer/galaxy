# Galaxy


Ist ein Spiel nach den
<a href="http://rswgame.com/de/help/core_game_type.htm" 
   title="mehr Informationen">
    Regeln
</a>

## Hilfe
Um das Adminlogin zu ändern "adminLogin.json" löschen und mit
<a href="http://localhost:4200/admin/set-admin" 
   title="http://localhost:4200/admin/set-admin">
   http://localhost:4200/admin/set-admin
   </a>

## Implementierungen in anderen Sprachen

### Java
<a href="http://bitbucket.solutio.intern/users/bernd.niklas/repos/planetgeneratorjava/browse" 
   title="PlanetGeneratorJava">
    PlanetGeneratorJava
</a>
### Swift
<a href="http://bitbucket.solutio.intern/users/bernd.niklas/repos/planetgeneratorswift/browse" 
   title="PlanetGeneratorSwift">
    PlanetGeneratorSwift
</a>

## Bugs
- Command kommt nicht mit Weltennummern zurecht die es nicht gibt
- Keine Ausgabe für den der angeschossen wurde:
W125(77,140,63,117) [ZAPHOD] (D-Schiffe=1)
   F69[ZAPHOD] = 0
   F34[ZAPHOD] = 7 (feuert auf F69[Drake])
   F102[ZAPHOD] = 5
   (F110[ZAPHOD]-->W140 )
- feuern D-Schiffe wird nicht angezeigt


## TODOs
- FinalPhaseCoreGame Tests
	- checkFireResults
	- isAmbushFromMovementCount
	- isAmbushFleet
	- checkOwnership
	- ambush teammates
* Game Verzeichnis erstellen bein Generieren der Welten
	* Eventuell auch Turn 0 Verzeichnis erstellen

* Validierung der Befehle beim senden an Server
* Nachladen der Welten die man in vorherigen Runden gesehen hat per Option
  * Quadrat mit Rundennummer als Marke

## Erledigte TODOs
- Dice ist vollfunktionsfähig
- Port ist vollfunktionsfähig
- FleetFactory ist vollfunktionsfähig
- FleetMovement ist vollfunktionsfähig
- World ist vollfunktionsfähig
- Fleet ist vollfunktionsfähig mit Tests
- DistanceLevel ist vollfunktionsfähig
- Command ist implementiert
- CommandFactory ist implementiert
- PortFactory ist implementiert
- FinalPhaseCoreGame ist implementiert
- Player ist implementiert
- PlayerFactory ist implementiert
- OutputPlyerStatisticCoreGame ist implementiert
- Service bauen Ausgaben der Ergebnisse eines Zuges (siehe main.swift OutPutLists)
- Service bauen für das Ausführen eines Zuges (siehe main.swift ExecuteCommands)
- distanceLevelHomes funktioniert auch nicht richtig bei World Generierung
- Anzhal HomeFleeds kontrollieren bei World Generierung
- PlayerFactory Tests
- Command Tests
- CommandFactory Tests
- PortFactory Tests
- Player Tests
- OutputPlyerStatisticCoreGame Tests
- FinalPhaseCoreGame Tests
- Timer für Layout Grafik laden
- Farben für Hintergrund ändern damit man die Fläche der Grafik sieht 
- Farbe Wählen für Spieler
- Back-Links für Seiten im Admin-Bereich
- Login für Admin-Bereich
- Im Home Auswahl der Runde um alte Runden-Stände abrufen zu können
	- Mit Pfeil-Bottons [<-] und [->]
- Legende Farben Spieler
- Legende für Symbole (Flotten, D-Schiffe usw.)
Sternen Karten nur noch 3 Level anzeigen
- Initial Heimatplanet aus Turn0
- Eingabe felder für Planet und Level
- Oder auf Klick
* Es kommt zu einem Fehler wenn keine Befehlsdatei vorhanden ist
* wenn man Welt über kilick setzt auch Welt Eingabefeld setzen
- Flotten dürfen nur einmal fliege
  - Doppelter Flugbefehl Copiert Flotte
	
## Claude-Skills

Projekt-Skills liegen unter `.claude/skills/` und werden von Claude Code beim Start einer Session geladen
(nach dem Anlegen eines Skills eine neue Session starten).

### `commit-aenderungen`

Committet die offenen Änderungen mit passender deutscher Commit-Nachricht (Titel + Stichpunkte), ohne zu pushen.

**Benutzung**

- Im Eingabefeld von Claude Code: `/commit-aenderungen`
- Optional mit Hinweis: `/commit-aenderungen nur die Bugfixes`
- Oder einfach sagen: "committe die letzten Änderungen mit entsprechendem Kommentar"

**Was der Skill macht**

1. Prüft `git status`/`git diff` und die bisherigen Commit-Titel.
2. Sortiert aus, was nicht dazugehört (von Tests überschriebenes `TestGame/`, neue `Galaxy/TurnN/`-Ordner).
3. Teilt in logische Commits auf, stagt gezielt per Pfad und lässt vorher Build/Tests der betroffenen Teile laufen.
4. Meldet Hash und Titel jedes Commits sowie nicht eingecheckte Dateien.

## Projekt

Nx-Monorepo (Nx 21.6, Angular 20.3, NestJS 10):

| Projekt | Beschreibung |
|---|---|
| `apps/worlds` | Angular-Frontend (http://localhost:4200) |
| `apps/api` | NestJS-Backend |
| `libs/game-objects` | Spiellogik |
| `libs/api-interfaces` | Gemeinsame Interfaces |

## Voraussetzungen

### Node-Version

Ideal ist **Node.js 24 (LTS „Krypton“)**, getestet mit `v24.17.0`. Angular 20 unterstützt `^20.19 || ^22.12 || ^24`.
In `package.json` ist `engines` auf `>=24 <25` gesetzt.

Die Version steht in der Datei `.nvmrc`.

### Node mit nvm einstellen

nvm installieren (falls noch nicht vorhanden):

```bash
brew install nvm
```

Danach die Hinweise von Homebrew beachten (nvm-Zeilen in `~/.zshrc` eintragen) und ein neues Terminal öffnen.

Im Projektverzeichnis die passende Version installieren und aktivieren:

```bash
cd galaxy
nvm install   # liest .nvmrc und installiert Node 24
nvm use       # aktiviert die Version aus .nvmrc
node -v       # sollte v24.x.x ausgeben
```

Optional als Standard für neue Terminals:

```bash
nvm alias default 24
```

## Projekt starten

```bash
npm install
```

Backend und Frontend in zwei getrennten Terminals starten (in beiden vorher `nvm use`):

```bash
npx nx serve api
```

```bash
npx nx serve worlds
```

Das Frontend ist danach unter http://localhost:4200/ erreichbar und lädt bei Änderungen automatisch neu.

## Weitere Befehle

| Zweck | Befehl |
|---|---|
| Build | `npx nx build worlds` bzw. `npx nx build api` (Ergebnis in `dist/`) |
| Unit-Tests (Jest) | `npx nx test game-objects` (oder `api`, `worlds`) |
| Alle betroffenen Tests | `npx nx affected -t test` |
| E2E-Tests (Cypress) | `npx nx e2e worlds-e2e` |
| Lint | `npx nx lint worlds` |
| Abhängigkeitsgraph | `npx nx graph` |

## Fehlersuche

- `nvm: command not found`: nvm-Zeilen in `~/.zshrc` fehlen, neues Terminal öffnen.
- Fehler beim `npm install` oder Build nach Node-Wechsel: `rm -rf node_modules && npm install` und `npx nx reset`.
- Falsche Node-Version im Terminal: `nvm use` im Projektverzeichnis erneut ausführen.

## Weitere Dokumentation

[Nx Dokumentation](https://nx.dev) · [Angular](https://angular.io) · [NestJS](https://nestjs.com)
