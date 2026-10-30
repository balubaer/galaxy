import { Fleet } from './fleet';
import { World } from './world';
import { Player } from './player';
import { classicLog } from './classic-log';

// Trader im Classic Game (Handbuch "The Trader" und "Loading and Unloading Metal").
/** Metall, das ein Schiff tragen kann: Trader 2, alle anderen 1. */
export const TRADER_METAL_PER_SHIP = 2;
/** Punkte je an einen anderen Spieler geliefertem Metall. */
export const TRADER_POINTS_PER_METAL = 8;
/** Geliefertes Metall zählt je Welt und Runde nur bis zum Doppelten der Industrie der Welt. */
export const TRADER_DELIVERY_INDUSTRY_FACTOR = 2;
/** Punkte für Konsumgüter je Welt: beim 1., 2., 3., 4. Mal, danach TRADER_CONSUMER_GOODS_POINTS_AFTER. */
export const TRADER_CONSUMER_GOODS_POINTS = [10, 8, 5, 3];
export const TRADER_CONSUMER_GOODS_POINTS_AFTER = 1;

export function metalPerShip(player: Player | null): number {
    return player !== null && player.characterType === 'trader' ? TRADER_METAL_PER_SHIP : 1;
}

/** Metall, das die Flotte insgesamt tragen kann. */
export function metalCapacity(fleet: Fleet): number {
    return fleet.ships * metalPerShip(fleet.player);
}

/** Metall über dem Laderaum der Flotte geht verloren (nach Verlust oder Abgabe von Schiffen). */
export function capFleetMetal(fleet: Fleet) {
    fleet.metal = Math.max(0, Math.min(fleet.metal, metalCapacity(fleet)));
}

/** Schiffe mit Metall: zuerst trägt jedes Schiff eine Einheit. */
export function loadedShips(fleet: Fleet): number {
    return Math.min(fleet.ships, fleet.metal);
}

/** Überladene Schiffe (Trader mit 2 Metall): sie feuern nicht. */
export function overloadedShips(fleet: Fleet): number {
    return Math.max(0, Math.min(fleet.ships, fleet.metal - fleet.ships));
}

/** Punkte des Traders für Konsumgüter; count ist die Zahl der Entladungen auf dieser Welt einschließlich dieser. */
export function consumerGoodsPoints(count: number): number {
    return TRADER_CONSUMER_GOODS_POINTS[count - 1] ?? TRADER_CONSUMER_GOODS_POINTS_AFTER;
}

function addPoints(player: Player, points: number, reason: string) {
    player.points = (player.points ?? 0) + points;
    classicLog(`${player.playerName}: +${points} Punkte (${reason})`);
}

/**
 * Trader entlädt Metall auf der Welt eines anderen Spielers: 8 Punkte je Metall, je Welt und Runde
 * höchstens für das Doppelte ihrer Industrie.
 */
export function awardDelivery(trader: Player, world: World, metal: number) {
    if (trader.characterType !== 'trader' || world.player === null || world.player.playerName === trader.playerName) {
        return;
    }
    const limit = world.industry * TRADER_DELIVERY_INDUSTRY_FACTOR;
    const before = world.deliveredBy.get(trader.playerName) ?? 0;
    const counted = Math.max(0, Math.min(metal, limit - before));
    world.deliveredBy.set(trader.playerName, before + metal);
    if (counted > 0) {
        addPoints(trader, counted * TRADER_POINTS_PER_METAL, `${counted} Metall an ${world.player.playerName} auf ${world.name} geliefert`);
    }
}

/** Trader entlädt Konsumgüter (auf jeder Welt): Punkte je Entladung, weniger bei jeder Wiederholung auf derselben Welt. */
export function awardConsumerGoods(trader: Player, world: World) {
    if (trader.characterType !== 'trader') {
        return;
    }
    const count = (world.consumerGoodsBy[trader.playerName] ?? 0) + 1;
    world.consumerGoodsBy[trader.playerName] = count;
    addPoints(trader, consumerGoodsPoints(count), `Konsumgüter auf ${world.name} zum ${count}. Mal`);
}
