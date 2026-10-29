import { Edge, Node } from "@galaxy/api-interfaces";
import type { CharacterType } from "./player";

export interface RespondTurnData {
    turnDataTxt: string;
    points: number;
    turnCommanTxt: string;
    links: Edge[];
    nodes: Node[];
    /** Verbindungen zu Welten außerhalb des Distanzlevels: source ist sichtbar, target nicht. */
    hiddenLinks?: Edge[];
    homeWorldName: string;
    /** Classic Game: Charakter des anfragenden Spielers (für Anzeigen wie die Plünderpunkte). */
    characterType?: CharacterType | null;
}
