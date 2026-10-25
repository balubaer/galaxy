/** Gesicherte Position einer Welt in einer Anordnung ("save"). */
export interface LayoutNode {
  id: string;
  fx: number;
  fy: number;
}

/** Eintrag der Save-Liste: Schlüssel und Zeitpunkt der letzten Speicherung (ms seit 1970). */
export interface LayoutInfo {
  key: string;
  updated: number;
}

/** Eine auf dem Server gespeicherte Anordnung. */
export interface LayoutData extends LayoutInfo {
  nodes: LayoutNode[];
}

export interface RequestLayouts {
  playerName: string;
}

export interface RequestLayout extends RequestLayouts {
  key: string;
}

export interface SaveLayout extends RequestLayout {
  nodes: LayoutNode[];
}
