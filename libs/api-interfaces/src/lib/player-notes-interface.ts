/** Eigene Notizen eines Spielers zu den Mitspielern im laufenden Spiel (nicht geprüft, nur für die Oberfläche). */
export interface PlayerNotes {
  playerName: string;
  /** Spieler, die man für Collector hält: Das Kommandopult bietet an, Artefakte an ihre Flotten zu hängen. */
  collectors: string[];
}

export interface RequestPlayerNotes {
  playerName: string;
}
