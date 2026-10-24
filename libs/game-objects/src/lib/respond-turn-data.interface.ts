import { Edge, Node } from "@galaxy/api-interfaces";

export interface RespondTurnData {
    turnDataTxt: string;
    points: number;
    turnCommanTxt: string;
    links: Edge[];
    nodes: Node[];
    /** Verbindungen zu Welten außerhalb des Distanzlevels: source ist sichtbar, target nicht. */
    hiddenLinks?: Edge[];
    homeWorldName: string;
}
