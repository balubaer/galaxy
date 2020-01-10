# Galaxy

Ist ein Spiel nach den
<a href="http://rswgame.com/de/help/core_game_type.htm" 
   title="mehr Informationen">
    Regeln
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

## TODOs

- FinalPhaseCoreGame Tests
- Timer für Layout Grafik laden
- Login für Admin-Bereich
- Back-Links für Seiten im Admin-Bereich
- Im Home Auswahl der Runde um alte Runden-Stände abrufen zu können
- Farbe Wählen für Spieler
	- Legende Farben Spieler
- Legende für Symbole (Flotten, D-Schiffe usw.)
- Farben für Hintergrund ändern damit man die Fläche der Grafik sieht 


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

## Projekt

This project was generated using [Nx](https://nx.dev).

<p align="center"><img src="https://raw.githubusercontent.com/nrwl/nx/master/nx-logo.png" width="450"></p>

🔎 **Nx is a set of Extensible Dev Tools for Monorepos.**

## Quick Start & Documentation

[Nx Documentation](https://nx.dev/angular)

[10-minute video showing all Nx features](https://nx.dev/angular/getting-started/what-is-nx)

[Interactive Tutorial](https://nx.dev/angular/tutorial/01-create-application)

## Adding capabilities to your workspace

Nx supports many plugins which add capabilities for developing different types of applications and different tools.

These capabilities include generating applications, libraries, etc as well as the devtools to test, and build projects as well.

Below are some plugins which you can add to your workspace:

- [Angular](https://angular.io)
  - `ng add @nrwl/angular`
- [React](https://reactjs.org)
  - `ng add @nrwl/react`
- Web (no framework frontends)
  - `ng add @nrwl/web`
- [Nest](https://nestjs.com)
  - `ng add @nrwl/nest`
- [Express](https://expressjs.com)
  - `ng add @nrwl/express`
- [Node](https://nodejs.org)
  - `ng add @nrwl/node`

## Generate an application

Run `ng g @nrwl/angular:app my-app` to generate an application.

> You can use any of the plugins above to generate applications as well.

When using Nx, you can create multiple applications and libraries in the same workspace.

## Generate a library

Run `ng g @nrwl/angular:lib my-lib` to generate a library.

> You can also use any of the plugins above to generate libraries as well.

Libraries are sharable across libraries and applications. They can be imported from `@galaxy/mylib`.

## Development server

Run `ng serve my-app` for a dev server. Navigate to http://localhost:4200/. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng g component my-component --project=my-app` to generate a new component.

## Build

Run `ng build my-app` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test my-app` to execute the unit tests via [Jest](https://jestjs.io).

Run `nx affected:test` to execute the unit tests affected by a change.

## Running end-to-end tests

Run `ng e2e my-app` to execute the end-to-end tests via [Cypress](https://www.cypress.io).

Run `nx affected:e2e` to execute the end-to-end tests affected by a change.

## Understand your workspace

Run `nx dep-graph` to see a diagram of the dependencies of your projects.

## Further help

Visit the [Nx Documentation](https://nx.dev/angular) to learn more.
