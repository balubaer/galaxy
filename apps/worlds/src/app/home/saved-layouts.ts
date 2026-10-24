/** Eine gespeicherte Darstellungsfläche ("save") im localStorage. */
export interface SavedLayout {
  key: string;
  round: number;
  world: number;
  distanceLevel: number;
}

const SAVE_KEY = /^R(\d+)W(\d+)D(\d+)\.(.+)$/;

/** Zerlegt einen Save-Schlüssel `R<runde>W<welt>D<distanzlevel>.<benutzer>`. */
export function parseSaveKey(key: string): (SavedLayout & { user: string }) | null {
  const match = SAVE_KEY.exec(key);
  return match
    ? { key, round: +match[1], world: +match[2], distanceLevel: +match[3], user: match[4] }
    : null;
}

/** Saves des Benutzers, neueste Runde zuerst, dann nach Welt und Distanzlevel. */
export function listSavedLayouts(keys: string[], user: string): SavedLayout[] {
  return keys
    .map(parseSaveKey)
    .filter((save) => save !== null && save.user === user)
    .map(({ key, round, world, distanceLevel }) => ({ key, round, world, distanceLevel }))
    .sort((a, b) => b.round - a.round || a.world - b.world || a.distanceLevel - b.distanceLevel);
}
