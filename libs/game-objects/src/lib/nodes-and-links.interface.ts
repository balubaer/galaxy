import { Edge, Node } from "@galaxy/api-interfaces";

export interface NodesAndLinks {
    links: Edge[];
    nodes: Node[];
    /** Verbindungen zu Welten außerhalb des Distanzlevels: source ist sichtbar, target nicht. */
    hiddenLinks?: Edge[];
}
