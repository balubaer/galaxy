import { Edge, Node } from "@galaxy/api-interfaces";

export interface RespondTurnData {
    turnDataTxt: string;
    points: number;
    turnCommanTxt: string;
    links: Edge[];
    nodes: Node[];
    homeWorldName: string;
}
