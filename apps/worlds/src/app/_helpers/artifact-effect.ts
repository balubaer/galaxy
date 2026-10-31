import { artifactEffect, artifactTypeByName, CharacterType } from '@galaxy/game-objects';

/** Artefakt aus den Kartendaten (type fehlt bei älteren Runden). */
export interface ArtifactView {
  number: number;
  name: string;
  type?: number;
}

/** Was das Artefakt dem eigenen Charakter bringt; points ist null, wenn es sich nicht bestimmen lässt. */
export function artifactEffectFor(
  artifact: ArtifactView,
  characterType: CharacterType | null
): { points: number | null; notes: string[] } {
  const type = artifact.type ?? artifactTypeByName(artifact.name);
  if (type === undefined) {
    return { points: null, notes: [] };
  }
  const effect = artifactEffect(characterType, type);
  return { points: characterType === null ? null : effect.points, notes: effect.notes };
}

/** Punkte mit Vorzeichen: "+15", "-10", "0". */
export function signedPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`;
}

/** Eine Zeile je Artefakt für Tooltips: "V12 Holy Grail: +15 Punkte/Runde – dein größter Schatz". */
export function artifactLine(artifact: ArtifactView, characterType: CharacterType | null): string {
  const effect = artifactEffectFor(artifact, characterType);
  const parts = [`V${artifact.number} ${artifact.name}`];
  if (effect.points !== null) {
    parts[0] += `: ${signedPoints(effect.points)} Punkte/Runde`;
  }
  return [...parts, ...effect.notes].join(' – ');
}

/** Summe der Punkte je Runde, die diese Artefakte dem eigenen Charakter bringen würden. */
export function artifactPointsSum(artifacts: ArtifactView[], characterType: CharacterType | null): number | null {
  let sum = 0;
  for (const artifact of artifacts) {
    const points = artifactEffectFor(artifact, characterType).points;
    if (points === null) {
      return null;
    }
    sum += points;
  }
  return sum;
}
