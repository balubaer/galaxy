import { Controller, Body, Post, BadRequestException, NotFoundException } from '@nestjs/common';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { GamePref } from '@galaxy/game-objects';
import {
  LayoutData,
  LayoutInfo,
  LayoutNode,
  Message,
  RequestLayout,
  RequestLayouts,
  SaveLayout,
} from '@galaxy/api-interfaces';

/** Save-Schlüssel `R<runde>W<welt>D<distanzlevel>.<benutzer>` wie im Frontend. */
const SAVE_KEY = /^R\d+W\d+D\d+\.(.+)$/;

type LayoutFile = Record<string, { updated: number; nodes: LayoutNode[] }>;

/**
 * Speichert die Anordnungen der Karte ("saves") pro Spiel und Spieler in
 * `<playName>/Layouts/<spieler>.json`, damit sie in jedem Browser verfügbar sind.
 */
@Controller('layouts')
export class LayoutsController {
  @Post('List')
  list(@Body() request: RequestLayouts): LayoutInfo[] {
    const layouts = this.readLayouts(this.layoutFile(request.playerName));
    return Object.entries(layouts).map(([key, layout]) => ({ key, updated: layout.updated }));
  }

  @Post('Get')
  get(@Body() request: RequestLayout): LayoutData {
    const file = this.layoutFile(request.playerName);
    const layout = this.readLayouts(file)[this.checkKey(request)];
    if (!layout) {
      throw new NotFoundException(`Speicherung ${request.key} gibt es nicht.`);
    }
    return { key: request.key, ...layout };
  }

  @Post('Save')
  save(@Body() request: SaveLayout): LayoutInfo {
    const file = this.layoutFile(request.playerName);
    const key = this.checkKey(request);
    if (!Array.isArray(request.nodes)) {
      throw new BadRequestException('Keine Positionen übergeben.');
    }
    const nodes: LayoutNode[] = request.nodes
      .filter((n) => typeof n?.id === 'string' && Number.isFinite(n.fx) && Number.isFinite(n.fy))
      .map((n) => ({ id: n.id, fx: n.fx, fy: n.fy }));
    const layouts = this.readLayouts(file);
    const updated = Date.now();
    layouts[key] = { updated, nodes };
    this.writeLayouts(file, layouts);
    return { key, updated };
  }

  @Post('Delete')
  delete(@Body() request: RequestLayout): Message {
    const file = this.layoutFile(request.playerName);
    const key = this.checkKey(request);
    const layouts = this.readLayouts(file);
    if (key in layouts) {
      delete layouts[key];
      this.writeLayouts(file, layouts);
    }
    return { message: 'OK' };
  }

  /** Datei der Anordnungen des Spielers im laufenden Spiel; nur bekannte Spieler sind erlaubt. */
  private layoutFile(playerName: string): string {
    const gamepref: GamePref = JSON.parse(readFileSync('gamePref.json', 'utf8'));
    if (typeof playerName !== 'string' || !gamepref.player.includes(playerName) || /[/\\]|\.\./.test(playerName)) {
      throw new BadRequestException(`Unbekannter Spieler ${playerName}.`);
    }
    return `${gamepref.playName}/Layouts/${playerName}.json`;
  }

  /** Der Schlüssel muss zum Save-Format passen und dem anfragenden Spieler gehören. */
  private checkKey(request: RequestLayout): string {
    const match = typeof request.key === 'string' ? SAVE_KEY.exec(request.key) : null;
    if (!match || match[1] !== request.playerName) {
      throw new BadRequestException(`Ungültiger Speicherschlüssel ${request.key}.`);
    }
    return request.key;
  }

  private readLayouts(file: string): LayoutFile {
    return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  }

  private writeLayouts(file: string, layouts: LayoutFile) {
    mkdirSync(file.substring(0, file.lastIndexOf('/')), { recursive: true });
    writeFileSync(file, JSON.stringify(layouts));
  }
}
