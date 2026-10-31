import type { World } from './world';
import type { Fleet } from './fleet';
import type { Player, CharacterType } from './player';

// Artefakte des Classic Games (Handbuch "Artifacts", "Artifact Points" und "The Collector").
export const ARTIFACT_ADJECTIVES = ['Imperial', 'Antique', 'Savage', 'Legal', 'Metallic', 'Holy', 'Venusian', 'Mythical', 'Bamboo', 'Cursed'];
export const ARTIFACT_NOUNS = ['Sceptor', 'Sculpture', 'Cutlass', 'Compact', 'Conduit', 'Grail', 'Asteroid', 'Sapphire', 'Carapace'];
export const CURSED = 'Cursed';
/** Die zehn Sonderstücke: Key to Time 1–5 und fünf Einzelstücke. */
export const KEY_TO_TIME_SEGMENTS = 5;
export const SPECIAL_ARTIFACTS = ['The Rock of Diamante', 'The Rhinovirus', "The Philosopher's Stone", 'The Deadly Nightshade', "The Pandora's Box"];
export const PANDORAS_BOX = "The Pandora's Box";
/** Zahl der verschiedenen Artefakte (90 Kombinationen + 10 Sonderstücke). */
export const ARTIFACT_TYPE_COUNT = ARTIFACT_ADJECTIVES.length * ARTIFACT_NOUNS.length + KEY_TO_TIME_SEGMENTS + SPECIAL_ARTIFACTS.length;
/** Standard: 100 Artefakte je 15 Spieler, mit einem Zufallsfaktor je Spiel. */
export const ARTIFACTS_PER_PLAYER = 100 / 15;
export const ARTIFACT_RANDOM_FACTOR_MIN = 0.8;
export const ARTIFACT_RANDOM_FACTOR_MAX = 1.2;

/** Das besondere Artefakt jedes Charakters ("größter Schatz"). */
export const CHARACTER_TREASURES: { [key in CharacterType]: { adjective: string; noun: string } } = {
    emperor: { adjective: 'Imperial', noun: 'Sceptor' },
    collector: { adjective: 'Antique', noun: 'Sculpture' },
    raider: { adjective: 'Savage', noun: 'Cutlass' },
    trader: { adjective: 'Legal', noun: 'Compact' },
    positronix: { adjective: 'Metallic', noun: 'Conduit' },
    missionary: { adjective: 'Holy', noun: 'Grail' },
};

/** Punkte je Runde für Nicht-Collector und für den Collector. */
export const ARTIFACT_POINTS = {
    other: { treasure: 15, half: 5, cursed: -10, keyToTime: 0, special: { 'The Rock of Diamante': 10, 'The Rhinovirus': -15, "The Philosopher's Stone": 20, 'The Deadly Nightshade': -30, "The Pandora's Box": 0 }, default: 0 },
    collector: { treasure: 90, half: 30, cursed: 0, keyToTime: 0, special: { 'The Rock of Diamante': 30, 'The Rhinovirus': 30, "The Philosopher's Stone": 30, 'The Deadly Nightshade': 30, "The Pandora's Box": 30 }, default: 15 },
};

/** Boni am Spielende für vollständige Sätze (und Museen beim Collector). */
export const ARTIFACT_SET_BONUS = {
    other: { keyToTime: 1000, adjective: 500, noun: 500, museum: 0 },
    collector: { keyToTime: 1500, adjective: 1000, noun: 1000, museum: 500 },
};
/** Eine eigene Welt mit so vielen Artefakten ist ein Museum. */
export const MUSEUM_ARTIFACTS = 10;

/** Verhalten der Pandora's Box, je Spiel zufällig gewählt. */
export type PandoraBehavior = 'industry' | 'mines' | 'selfDestruct';
export const PANDORA_BEHAVIORS: ReadonlyArray<PandoraBehavior> = ['industry', 'mines', 'selfDestruct'];

export interface Artifact {
    /** Nummer des Artefakts im Spiel (für VaaFbb und VaaW). */
    number: number;
    /** Art des Artefakts 1..100; bei mehr als 100 Artefakten gibt es Duplikate. */
    type: number;
    /** Nur die Pandora's Box: ihr Verhalten in diesem Spiel. */
    pandora?: PandoraBehavior;
}

export interface ArtifactKind {
    name: string;
    adjective?: string;
    noun?: string;
    keyToTime?: number;
    special?: string;
}

/** Beschreibung einer Artefakt-Art: 1..90 Adjektiv × Nomen, 91..95 Key to Time, 96..100 Sonderstücke. */
export function artifactKind(type: number): ArtifactKind {
    const combinations = ARTIFACT_ADJECTIVES.length * ARTIFACT_NOUNS.length;
    if (type >= 1 && type <= combinations) {
        const adjective = ARTIFACT_ADJECTIVES[Math.floor((type - 1) / ARTIFACT_NOUNS.length)];
        const noun = ARTIFACT_NOUNS[(type - 1) % ARTIFACT_NOUNS.length];
        return { name: `${adjective} ${noun}`, adjective, noun };
    }
    const segment = type - combinations;
    if (segment >= 1 && segment <= KEY_TO_TIME_SEGMENTS) {
        return { name: `The Key to Time (segment ${segment})`, keyToTime: segment };
    }
    const special = SPECIAL_ARTIFACTS[type - combinations - KEY_TO_TIME_SEGMENTS - 1];
    return { name: special ?? `Artefakt ${type}`, special };
}

export function artifactName(artifact: Artifact): string {
    return `V${artifact.number} ${artifactKind(artifact.type).name}`;
}

export function pandoraType(): number {
    return ARTIFACT_TYPE_COUNT;
}

export function isPandora(artifact: Artifact): boolean {
    return artifactKind(artifact.type).special === PANDORAS_BOX;
}

/** Punkte, die ein Artefakt seinem Besitzer je Runde bringt. */
export function artifactPoints(player: Player, artifact: Artifact): number {
    const type = player.characterType;
    if (type === null) {
        return 0;
    }
    const table = type === 'collector' ? ARTIFACT_POINTS.collector : ARTIFACT_POINTS.other;
    const kind = artifactKind(artifact.type);
    if (kind.keyToTime !== undefined) {
        return table.keyToTime;
    }
    if (kind.special !== undefined) {
        return table.special[kind.special] ?? table.default;
    }
    if (kind.adjective === CURSED) {
        return table.cursed;
    }
    const treasure = CHARACTER_TREASURES[type];
    if (kind.adjective === treasure.adjective && kind.noun === treasure.noun) {
        return table.treasure;
    }
    if (kind.adjective === treasure.adjective || kind.noun === treasure.noun) {
        return table.half;
    }
    return table.default;
}

/** Alle Artefakte, die dem Spieler gehören: auf seinen Welten und auf seinen Flotten. */
export function ownedArtifacts(player: Player, worlds: Array<World>): Array<Artifact> {
    const result: Array<Artifact> = [];
    for (const world of worlds) {
        if (world.player === player) {
            result.push(...world.artifacts);
        }
        for (const fleet of world.fleets) {
            if (fleet.player === player) {
                result.push(...fleet.artifacts);
            }
        }
    }
    return result;
}

export function artifactTurnPoints(player: Player, worlds: Array<World>): number {
    return ownedArtifacts(player, worlds).reduce((sum, artifact) => sum + artifactPoints(player, artifact), 0);
}

/** Bonus am Spielende: vollständige Sätze (Key to Time, Adjektiv und Nomen des Charakters ohne Cursed) und Museen. */
export function artifactEndBonus(player: Player, worlds: Array<World>): { points: number; reasons: Array<string> } {
    const type = player.characterType;
    const reasons: Array<string> = [];
    if (type === null) {
        return { points: 0, reasons };
    }
    const bonus = type === 'collector' ? ARTIFACT_SET_BONUS.collector : ARTIFACT_SET_BONUS.other;
    const kinds = ownedArtifacts(player, worlds).map(artifact => artifactKind(artifact.type));
    const treasure = CHARACTER_TREASURES[type];
    let points = 0;
    const segments = new Set(kinds.filter(kind => kind.keyToTime !== undefined).map(kind => kind.keyToTime));
    if (segments.size === KEY_TO_TIME_SEGMENTS) {
        points += bonus.keyToTime;
        reasons.push(`Key to Time vollständig (+${bonus.keyToTime})`);
    }
    const nouns = new Set(kinds.filter(kind => kind.adjective === treasure.adjective).map(kind => kind.noun));
    if (nouns.size === ARTIFACT_NOUNS.length) {
        points += bonus.adjective;
        reasons.push(`alle ${treasure.adjective}-Artefakte (+${bonus.adjective})`);
    }
    const adjectives = new Set(kinds.filter(kind => kind.noun === treasure.noun && kind.adjective !== CURSED).map(kind => kind.adjective));
    if (adjectives.size === ARTIFACT_ADJECTIVES.length - 1) {
        points += bonus.noun;
        reasons.push(`alle ${treasure.noun}-Artefakte ohne Cursed (+${bonus.noun})`);
    }
    if (bonus.museum > 0) {
        for (const world of worlds) {
            if (world.player === player && world.artifacts.length >= MUSEUM_ARTIFACTS) {
                points += bonus.museum;
                reasons.push(`Museum auf ${world.name} (+${bonus.museum})`);
            }
        }
    }
    return { points, reasons };
}

/** Boni am Spielende aller Spieler als Funktion für checkGameEnd; protokolliert die Gründe. */
export function classicEndBonus(worlds: Array<World>, log: (message: string) => void = () => undefined): (player: Player) => number {
    return player => {
        const bonus = artifactEndBonus(player, worlds);
        if (bonus.points > 0) {
            log(`${player.playerName}: +${bonus.points} Punkte am Spielende (${bonus.reasons.join(', ')})`);
        }
        return bonus.points;
    };
}

/**
 * Verteilt die Artefakte zu Spielbeginn zufällig auf Welten (keine Heimatwelten, keine Schwarzen Löcher):
 * etwa 100 je 15 Spieler mal Zufallsfaktor, die Arten zufällig (Duplikate erst ab mehr als 100),
 * immer genau eine Pandora's Box mit zufälligem Verhalten.
 */
export function placeArtifacts(worlds: Array<World>, playerCount: number, random: () => number = Math.random): Array<Artifact> {
    const targets = worlds.filter(world => world.player === null && world.blackHole === false);
    if (targets.length === 0) {
        return [];
    }
    const factor = ARTIFACT_RANDOM_FACTOR_MIN + random() * (ARTIFACT_RANDOM_FACTOR_MAX - ARTIFACT_RANDOM_FACTOR_MIN);
    const count = Math.max(1, Math.round(playerCount * ARTIFACTS_PER_PLAYER * factor));
    const artifacts: Array<Artifact> = [];
    const pickRandom = <T>(list: Array<T>): T => list.splice(Math.floor(random() * list.length), 1)[0];
    let pool: Array<number> = [];
    // Die Pandora's Box kommt genau einmal vor.
    artifacts.push({ number: 1, type: pandoraType(), pandora: PANDORA_BEHAVIORS[Math.floor(random() * PANDORA_BEHAVIORS.length)] });
    while (artifacts.length < count) {
        if (pool.length === 0) {
            pool = Array.from({ length: ARTIFACT_TYPE_COUNT - 1 }, (_, i) => i + 1);
        }
        artifacts.push({ number: artifacts.length + 1, type: pickRandom(pool) });
    }
    // Nummern zufällig vergeben, damit die Pandora's Box nicht immer V1 ist.
    const numbers = artifacts.map(artifact => artifact.number);
    for (const artifact of artifacts) {
        artifact.number = pickRandom(numbers);
        targets[Math.floor(random() * targets.length)].artifacts.push(artifact);
    }
    for (const world of targets) {
        world.artifacts.sort((a, b) => a.number - b.number);
    }
    return artifacts;
}

/** Wo liegt das Artefakt mit dieser Nummer: auf einer Welt oder auf einer Flotte (samt deren Welt)? */
export function findArtifact(worlds: Array<World>, number: number): { artifact: Artifact; world: World; fleet: Fleet | null } | null {
    for (const world of worlds) {
        const onWorld = world.artifacts.find(artifact => artifact.number === number);
        if (onWorld !== undefined) {
            return { artifact: onWorld, world, fleet: null };
        }
        for (const fleet of world.fleets) {
            const onFleet = fleet.artifacts.find(artifact => artifact.number === number);
            if (onFleet !== undefined) {
                return { artifact: onFleet, world, fleet };
            }
        }
    }
    return null;
}

/** Nimmt ein Artefakt von seiner Welt bzw. Flotte. */
export function removeArtifact(holder: { artifacts: Array<Artifact> }, artifact: Artifact) {
    const index = holder.artifacts.indexOf(artifact);
    if (index !== -1) {
        holder.artifacts.splice(index, 1);
    }
}

/** Verstreut Artefakte zufällig über die Galaxie (z. B. nach einem Schwarzen Loch). */
export function scatterArtifacts(artifacts: Array<Artifact>, worlds: Array<World>, random: () => number = Math.random) {
    const targets = worlds.filter(world => world.blackHole === false);
    if (targets.length === 0) {
        return;
    }
    for (const artifact of artifacts) {
        targets[Math.floor(random() * targets.length)].artifacts.push(artifact);
    }
}
