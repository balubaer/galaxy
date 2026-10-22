import { World } from './world';
import { Player } from './player';
import { Fleet } from './fleet';
import { CommandFactory } from './command-factory';
import { FinalPhaseClassicGame } from './final-phase-classic-game';
import { setClassicLogSink } from './classic-log';

function homeWorld(): { world: World; player: Player; players: Map<string, Player> } {
  const player = new Player('A'); player.points = 0; player.characterType = 'emperor';
  const world = new World(); world.setNumber(1);
  Object.assign(world, { player, industry: 30, metal: 30, mines: 2, population: 50, populationLimit: 100, turnsOwned: 1 });
  const fleet = new Fleet(); fleet.number = 1; fleet.player = player; world.fleets.push(fleet);
  return { world, player, players: new Map([['A', player]]) };
}

describe('Classic Logs', () => {
  const lines: Array<string> = [];

  beforeEach(() => {
    lines.length = 0;
    setClassicLogSink(message => lines.push(message));
  });
  afterEach(() => setClassicLogSink());

  function run(commands: string, ...extra: Array<[string, string]>) {
    const { world, players } = homeWorld();
    const factory = new CommandFactory([world], players);
    factory.gameType = 'classic';
    factory.setCommandStringsWithLongString('A', commands);
    for (const [name, text] of extra) {
      factory.setCommandStringsWithLongString(name, text);
    }
    factory.executeCommands();
    return { world, players };
  }

  it('nennt die Werte hinter der nutzbaren Industrie und was sie begrenzt', () => {
    const { world } = homeWorld();
    world.metal = 2;
    const { world: w, players } = run('W1B2I');
    w.metal = 2;
    const text = lines.join('\n');
    expect(text).toContain('A: 1 Befehle: W1B2I');
    expect(text).toContain('W1 [A] nutzbare Industrie 30');
    expect(text).toContain('begrenzt durch Industrie und Metall');
    expect(players.size).toBe(1);
  });

  it('meldet, warum nichts gebaut wird: Metall fehlt', () => {
    const { world, players } = homeWorld();
    world.metal = 0;
    const factory = new CommandFactory([world], players);
    factory.gameType = 'classic';
    factory.setCommandStringsWithLongString('A', 'W1B6F1');
    factory.executeCommands();
    const text = lines.join('\n');
    expect(text).toContain('nutzbare Industrie 0');
    expect(text).toContain('begrenzt durch Metall');
    expect(text).toContain('W1 baut nichts: keine nutzbare Industrie');
    expect(text).toContain('A: Befehl W1B6F1 abgelehnt: Nicht genug nutzbare Industrie (Fehler 19)');
  });

  it('meldet ignorierte Spieler und abgebaute Standard-Schiffe und das Rundenende', () => {
    const { world, players } = run('', ['UNBEKANNT', 'W1B1I']);
    const text = lines.join('\n');
    expect(text).toContain('Befehle von UNBEKANNT ignoriert');
    expect(text).toContain('W1 baut 30 I-Schiffe (Industrie ohne Befehl)');
    new FinalPhaseClassicGame([world], players).doFinal();
    expect(lines.join('\n')).toContain('W1 [A] Rundenende: Metall 0 -> 2');
  });
});
