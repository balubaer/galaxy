import { CharacterType } from './player';
import { CLASSIC_BUILD_COST, CLASSIC_EMPEROR_INDUSTRY_COST, CLASSIC_EMPEROR_SCRAP_I_SHIPS, CLASSIC_SCRAP_I_SHIPS } from './classic-economy';
import {
    EMPEROR_POPULATION_PER_POINT, PENALTY_PER_PLUNDER, RAIDER_PLUNDER_POINTS, RAIDER_PLUNDER_POINTS_AFTER,
    RAIDER_POINTS_PER_FLEET
} from './classic-scoring';
import {
    TRADER_CONSUMER_GOODS_POINTS, TRADER_CONSUMER_GOODS_POINTS_AFTER, TRADER_DELIVERY_INDUSTRY_FACTOR,
    TRADER_METAL_PER_SHIP, TRADER_POINTS_PER_METAL
} from './classic-trader';
import { COMMANDEER_RATIO } from './final-phase-classic-game';

/** Beschreibung eines Charakters für die Auswahl (Registrierung, Spielanlage). */
export interface CharacterInfo {
    summary: string;
    points: Array<string>;
    abilities: Array<string>;
}

/** Infos zu den spielbaren Charakteren des Classic Games, aus den Regelkonstanten erzeugt. */
export const CHARACTER_INFOS: { [key in CharacterType]?: CharacterInfo } = {
    emperor: {
        summary: 'Baut ein großes, produktives Reich auf.',
        points: [
            `Je Runde für jede eigene Welt: 1 Punkt je ${EMPEROR_POPULATION_PER_POINT} Bevölkerung, je Industrie und je Mine`,
        ],
        abilities: [
            `Industrie kostet nur ${CLASSIC_EMPEROR_INDUSTRY_COST} statt ${CLASSIC_BUILD_COST}`,
            `Eine Industrie aus ${CLASSIC_EMPEROR_SCRAP_I_SHIPS} statt ${CLASSIC_SCRAP_I_SHIPS} verschrotteten I-Schiffen`,
        ],
    },
    raider: {
        summary: 'Lebt von Flotten und Plünderungen.',
        points: [
            `Je Runde ${RAIDER_POINTS_PER_FLEET} Punkte für jede eigene Flotte`,
            `Plündern derselben Welt: ${RAIDER_PLUNDER_POINTS.join(', ')}, danach ${RAIDER_PLUNDER_POINTS_AFTER} Punkte`,
        ],
        abilities: [
            `Plündert ohne Strafe (andere verlieren ${PENALTY_PER_PLUNDER} Punkte)`,
            `Kapert am Rundenende fremde Flotten, wenn er mehr als ${COMMANDEER_RATIO}-mal so viele Schiffe auf der Welt hat`,
        ],
    },
    trader: {
        summary: 'Handelt mit Metall und Konsumgütern.',
        points: [
            `${TRADER_POINTS_PER_METAL} Punkte je Metall, das an andere Spieler geliefert wird `
                + `(je Welt und Runde bis zum ${TRADER_DELIVERY_INDUSTRY_FACTOR}-fachen ihrer Industrie)`,
            `Konsumgüter je Welt: ${TRADER_CONSUMER_GOODS_POINTS.join(', ')}, danach ${TRADER_CONSUMER_GOODS_POINTS_AFTER} Punkt`,
        ],
        abilities: [
            `Jedes Schiff trägt ${TRADER_METAL_PER_SHIP} Metall (überladene Schiffe feuern nicht)`,
        ],
    },
};
