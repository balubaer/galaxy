export interface CommandError {
    errorNumber: number;
    errorString: string;
}

export const FleetNotOnWorld_Error: CommandError = { errorNumber: 1, errorString: 'Flotte ist nicht auf Welt' };
export const UnknownCommand_Error: CommandError = { errorNumber: 2, errorString: 'Unbekannter Befehl' };
export const FleetNotFound_Error: CommandError = { errorNumber: 3, errorString: 'Flotte gibt es nicht' };
export const WorldNotFound_Error: CommandError = { errorNumber: 4, errorString: 'Welt gibt es nicht' };
export const FleetNotOwned_Error: CommandError = { errorNumber: 5, errorString: 'Flotte gehört nicht dem Spieler' };
export const WorldNotOwned_Error: CommandError = { errorNumber: 6, errorString: 'Welt gehört nicht dem Spieler' };
export const NotSameWorld_Error: CommandError = { errorNumber: 7, errorString: 'Ziel ist nicht auf derselben Welt' };
export const NotEnoughShips_Error: CommandError = { errorNumber: 8, errorString: 'Nicht genug Schiffe' };
export const NoConnection_Error: CommandError = { errorNumber: 9, errorString: 'Keine Verbindung zwischen den Welten' };
export const FleetAlreadyActed_Error: CommandError = { errorNumber: 10, errorString: 'Flotte hat schon einen Flug- oder Feuerbefehl' };
export const FleetHasNoShips_Error: CommandError = { errorNumber: 11, errorString: 'Flotte hat keine Schiffe' };
export const FireOnOwnFleet_Error: CommandError = { errorNumber: 12, errorString: 'Eigene Flotte kann nicht beschossen werden' };
export const PlayerNotFound_Error: CommandError = { errorNumber: 13, errorString: 'Spieler gibt es nicht' };
export const NotInCoreGame_Error: CommandError = { errorNumber: 14, errorString: 'Befehl gibt es im Core Game nicht' };
export const TooManyWorlds_Error: CommandError = { errorNumber: 15, errorString: 'Eine Flotte fliegt höchstens über drei Welten' };
export const DShipsAlreadyFired_Error: CommandError = { errorNumber: 16, errorString: 'D-Schiffe haben schon einen Feuerbefehl' };
export const FireOnOwnDShips_Error: CommandError = { errorNumber: 17, errorString: 'Eigene D-Schiffe können nicht beschossen werden' };
export const NotInClassicGame_Error: CommandError = { errorNumber: 18, errorString: 'Befehl gibt es im Classic Game nicht' };
export const NotEnoughIndustry_Error: CommandError = { errorNumber: 19, errorString: 'Nicht genug nutzbare Industrie' };
export const NotEnoughMetal_Error: CommandError = { errorNumber: 20, errorString: 'Nicht genug Metall' };
export const NotEnoughPopulation_Error: CommandError = { errorNumber: 21, errorString: 'Nicht genug Bevölkerung' };
export const FleetNoCapacity_Error: CommandError = { errorNumber: 22, errorString: 'Flotte hat nicht genug Laderaum' };
export const LoadNotAllowed_Error: CommandError = { errorNumber: 23, errorString: 'Metall darf von dieser Welt nicht geladen werden' };
export const AlreadyMigrating_Error: CommandError = { errorNumber: 24, errorString: 'Von dieser Welt wird schon Bevölkerung migriert' };
export const InvalidAmount_Error: CommandError = { errorNumber: 25, errorString: 'Anzahl fehlt oder ist 0' };
