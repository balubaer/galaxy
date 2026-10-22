import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Edge, Node } from '@galaxy/api-interfaces';
import {
  brokenCommands,
  buildCommandGroups,
  CommandGroup,
  CommandOption,
  CommandRow,
  isDisabled,
  MAX_ROUTE_STEPS,
  multiStepMoves,
  routeCommand,
  RoutePlan,
  splitCommands,
} from './command-options';

@Component({
  selector: 'galaxy-command-table',
  standalone: true,
  templateUrl: './command-table.component.html',
  styleUrls: ['./command-table.component.css'],
})
export class CommandTableComponent {
  @Input() node: Node | undefined;
  @Input() links: Edge[] = [];
  @Input() ownColor = '';
  /** Aktueller Inhalt des Befehls-Textfelds. */
  @Input() commandText = '';
  @Input() readonly = false;
  /** Aktive Routenplanung (Welten werden im Graphen angeklickt). */
  @Input() routePlan: RoutePlan | null = null;
  @Output() routeStarted = new EventEmitter<number>();
  @Output() routeStepBack = new EventEmitter<void>();
  @Output() routeConfirmed = new EventEmitter<void>();
  @Output() routeCancelled = new EventEmitter<void>();
  @Output() commandToggled = new EventEmitter<{
    command: string;
    selected: boolean;
  }>();

  count = 1;

  get groups(): CommandGroup[] {
    return this.node
      ? buildCommandGroups(
          this.node,
          this.links,
          this.ownColor,
          this.count,
          splitCommands(this.commandText),
        )
      : [];
  }

  /** Gewählte Befehle, die an fehlenden Schiffen scheitern würden. */
  get broken(): string[] {
    return this.node
      ? brokenCommands(
          this.node,
          this.ownColor,
          splitCommands(this.commandText),
        )
      : [];
  }

  isBroken(option: CommandOption): boolean {
    return this.broken.includes(option.command);
  }

  isSelected(option: CommandOption): boolean {
    return splitCommands(this.commandText).includes(option.command);
  }

  isOptionDisabled(option: CommandOption): boolean {
    return (
      this.readonly ||
      !!option.insufficient ||
      isDisabled(option.command, splitCommands(this.commandText))
    );
  }

  /** Schon eingetragene Flüge mit mehr als einem Schritt, damit der Befehl sichtbar bleibt. */
  multiStepRoutes(row: CommandRow): CommandOption[] {
    return multiStepMoves(splitCommands(this.commandText), row.fleet).map(
      (command) => ({
        command,
        label: command,
      }),
    );
  }

  readonly maxRouteSteps = MAX_ROUTE_STEPS;

  routeText(): string {
    return this.routePlan ? routeCommand(this.routePlan) : '';
  }

  /** Eine Flotte pro Zug nur eine Aktion: bereits belegte Flotten können keine Route planen. */
  isRouteDisabled(row: CommandRow): boolean {
    return (
      this.readonly ||
      this.routePlan !== null ||
      row.fleet === undefined ||
      isDisabled(`F${row.fleet}W`, splitCommands(this.commandText))
    );
  }

  setCount(value: string) {
    const parsed = Math.floor(+value);
    this.count = parsed > 0 ? parsed : 1;
  }

  press(option: CommandOption) {
    if (!this.isOptionDisabled(option)) {
      this.commandToggled.emit({
        command: option.command,
        selected: !this.isSelected(option),
      });
    }
  }
}
