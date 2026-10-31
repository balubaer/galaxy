import { Component, Input } from '@angular/core';
import {
  ARTIFACT_ADJECTIVES,
  ARTIFACT_NOUNS,
  ARTIFACT_POINTS,
  ARTIFACT_SET_BONUS,
  ARTIFACT_TYPE_COUNT,
  artifactEffect,
  artifactKind,
  CHARACTER_TREASURES,
  CHARACTER_TYPE_NAMES,
  CHARACTER_TYPES,
  CharacterType,
  CURSED,
  KEY_TO_TIME_SEGMENTS,
  MUSEUM_ARTIFACTS,
  SPECIAL_ARTIFACTS,
} from '@galaxy/game-objects';
import { signedPoints } from '../../_helpers/artifact-effect';

/** Höchstzahl der Treffer beim Nachschlagen eines Artefakts. */
const MAX_MATCHES = 20;

/** Glossar der Artefakte des Classic Games; hebt hervor, was für den eigenen Charakter gilt. */
@Component({
  selector: 'galaxy-artifact-glossary',
  templateUrl: 'artifact-glossary.component.html',
  styleUrls: ['artifact-glossary.component.css'],
  standalone: true,
})
export class ArtifactGlossaryComponent {
  @Input() characterType: CharacterType | null = null;
  query = '';

  readonly signedPoints = signedPoints;
  readonly adjectives = ARTIFACT_ADJECTIVES;
  readonly nouns = ARTIFACT_NOUNS;
  readonly specials = SPECIAL_ARTIFACTS;
  readonly cursed = CURSED;
  readonly keyToTimeSegments = KEY_TO_TIME_SEGMENTS;
  readonly museumArtifacts = MUSEUM_ARTIFACTS;
  readonly treasures = CHARACTER_TYPES.map((type) => ({
    type,
    name: CHARACTER_TYPE_NAMES[type],
    treasure: `${CHARACTER_TREASURES[type].adjective} ${CHARACTER_TREASURES[type].noun}`,
  }));
  readonly pointRows: Array<{ label: string; other: number; collector: number }> = [
    { label: 'Größter Schatz des eigenen Charakters', other: ARTIFACT_POINTS.other.treasure, collector: ARTIFACT_POINTS.collector.treasure },
    { label: 'Gleiches Adjektiv oder Nomen wie der Schatz', other: ARTIFACT_POINTS.other.half, collector: ARTIFACT_POINTS.collector.half },
    { label: `${CURSED} … (alle verfluchten)`, other: ARTIFACT_POINTS.other.cursed, collector: ARTIFACT_POINTS.collector.cursed },
    { label: `The Key to Time (Segment 1–${KEY_TO_TIME_SEGMENTS})`, other: ARTIFACT_POINTS.other.keyToTime, collector: ARTIFACT_POINTS.collector.keyToTime },
    ...SPECIAL_ARTIFACTS.map((special) => ({
      label: special,
      other: ARTIFACT_POINTS.other.special[special],
      collector: ARTIFACT_POINTS.collector.special[special],
    })),
    { label: 'Alle anderen Artefakte', other: ARTIFACT_POINTS.other.default, collector: ARTIFACT_POINTS.collector.default },
  ];
  readonly bonusRows: Array<{ label: string; other: number; collector: number }> = [
    { label: `The Key to Time vollständig (alle ${KEY_TO_TIME_SEGMENTS} Segmente)`, other: ARTIFACT_SET_BONUS.other.keyToTime, collector: ARTIFACT_SET_BONUS.collector.keyToTime },
    { label: `Alle ${ARTIFACT_NOUNS.length} Artefakte mit dem Adjektiv des Schatzes`, other: ARTIFACT_SET_BONUS.other.adjective, collector: ARTIFACT_SET_BONUS.collector.adjective },
    { label: `Alle ${ARTIFACT_ADJECTIVES.length - 1} Artefakte mit dem Nomen des Schatzes (ohne ${CURSED})`, other: ARTIFACT_SET_BONUS.other.noun, collector: ARTIFACT_SET_BONUS.collector.noun },
    { label: `Museum: ${MUSEUM_ARTIFACTS} Artefakte auf einer eigenen Welt (je Welt)`, other: ARTIFACT_SET_BONUS.other.museum, collector: ARTIFACT_SET_BONUS.collector.museum },
  ];

  get isCollector(): boolean {
    return this.characterType === 'collector';
  }

  get characterName(): string {
    return this.characterType ? CHARACTER_TYPE_NAMES[this.characterType] : '';
  }

  onQuery(value: string) {
    this.query = value;
  }

  /** Artefakt-Arten, deren Name den Suchtext enthält, mit dem Wert für den eigenen Charakter. */
  get matches(): Array<{ name: string; points: number | null; notes: string[] }> {
    const query = this.query.trim().toLowerCase();
    if (query === '') {
      return [];
    }
    const result: Array<{ name: string; points: number | null; notes: string[] }> = [];
    for (let type = 1; type <= ARTIFACT_TYPE_COUNT && result.length < MAX_MATCHES; type++) {
      const name = artifactKind(type).name;
      if (name.toLowerCase().includes(query)) {
        const effect = artifactEffect(this.characterType, type);
        result.push({ name, points: this.characterType === null ? null : effect.points, notes: effect.notes });
      }
    }
    return result;
  }
}
