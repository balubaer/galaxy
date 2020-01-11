import { Edge, Node } from '@swimlane/ngx-graph';

export interface RespondTurnData {
    turnDataTxt: string;
    points: number;
    turnCommanTxt: string;
    links: Edge[];
    nodes: Node[];
}
