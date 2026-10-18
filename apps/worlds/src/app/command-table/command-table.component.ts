import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Edge, Node } from '@galaxy/api-interfaces';
import {
  buildCommandGroups,
  CommandGroup,
  CommandOption,
  isDisabled,
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
  @Output() commandToggled = new EventEmitter<{
    command: string;
    selected: boolean;
  }>();

  count = 1;

  get groups(): CommandGroup[] {
    return this.node
      ? buildCommandGroups(this.node, this.links, this.ownColor, this.count)
      : [];
  }

  isSelected(option: CommandOption): boolean {
    return splitCommands(this.commandText).includes(option.command);
  }

  isOptionDisabled(option: CommandOption): boolean {
    return (
      this.readonly ||
      isDisabled(option.command, splitCommands(this.commandText))
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
