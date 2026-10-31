import { createGameLogger } from './game-log';

export type ClassicLogSink = (message: string) => void;

const logger = createGameLogger('Classic');

let sink: ClassicLogSink | undefined;

/** Leitet die Classic-Logs um (z. B. in Tests); ohne Argument wieder auf den Spiel-Logger. */
export function setClassicLogSink(newSink?: ClassicLogSink) {
    sink = newSink;
}

/** Protokoll der Classic-Auswertung, z. B. warum keine Schiffe gebaut werden. */
export function classicLog(message: string) {
    if (sink) {
        sink(`[Classic] ${message}`);
    } else {
        logger.log(message);
    }
}
