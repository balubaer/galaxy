import { Controller, Body, Post, BadRequestException } from '@nestjs/common';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { GamePref } from '@galaxy/game-objects';
import { PlayerNotes, RequestPlayerNotes } from '@galaxy/api-interfaces';

/**
 * Speichert die Notizen eines Spielers zu seinen Mitspielern (z. B. wen er für einen Collector hält)
 * pro Spiel in `<playName>/Notes/<spieler>.json`.
 */
@Controller('player-notes')
export class PlayerNotesController {
  @Post('Get')
  get(@Body() request: RequestPlayerNotes): PlayerNotes {
    const { file } = this.notesFile(request.playerName);
    const stored: Partial<PlayerNotes> = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
    return { playerName: request.playerName, collectors: stored.collectors ?? [] };
  }

  @Post('Save')
  save(@Body() request: PlayerNotes): PlayerNotes {
    const { file, players } = this.notesFile(request.playerName);
    if (!Array.isArray(request.collectors)) {
      throw new BadRequestException('Keine Collector-Liste übergeben.');
    }
    // Nur Mitspieler, nicht man selbst, jeder nur einmal.
    const collectors = Array.from(new Set(request.collectors))
      .filter((name) => typeof name === 'string' && name !== request.playerName && players.includes(name));
    const notes: PlayerNotes = { playerName: request.playerName, collectors };
    mkdirSync(file.substring(0, file.lastIndexOf('/')), { recursive: true });
    writeFileSync(file, JSON.stringify({ collectors }));
    return notes;
  }

  /** Datei der Notizen des Spielers im laufenden Spiel; nur bekannte Spieler sind erlaubt. */
  private notesFile(playerName: string): { file: string; players: string[] } {
    const gamepref: GamePref = JSON.parse(readFileSync('gamePref.json', 'utf8'));
    if (typeof playerName !== 'string' || !gamepref.player.includes(playerName) || /[/\\]|\.\./.test(playerName)) {
      throw new BadRequestException(`Unbekannter Spieler ${playerName}.`);
    }
    return { file: `${gamepref.playName}/Notes/${playerName}.json`, players: gamepref.player };
  }
}
