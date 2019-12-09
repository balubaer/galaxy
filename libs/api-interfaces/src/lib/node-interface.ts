import {NodePosition, NodeDimension } from '@swimlane/ngx-graph';

export interface Node {
    id: string;
    position?: NodePosition;
    dimension?: NodeDimension;
    transform?: string;
    label?: string;
    data?: any;
    meta?: any;
  }