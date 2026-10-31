export type GameLogLevel = 'log' | 'warn' | 'error' | 'debug' | 'verbose';

export type GameLogSink = (level: GameLogLevel, context: string, message: string) => void;

export interface GameLogger {
    log(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    debug(message: string): void;
    verbose(message: string): void;
}

function isTestRun(): boolean {
    // Kein Node-Typ nötig, die Bibliothek wird auch im Browser eingebunden.
    const env = (globalThis as { process?: { env?: { [key: string]: string | undefined } } }).process?.env;
    return env?.['JEST_WORKER_ID'] !== undefined;
}

const consoleSink: GameLogSink = (level, context, message) => {
    if (isTestRun() === false) {
        const line = `[${context}] ${message}`;
        if (level === 'error') {
            console.error(line);
        } else if (level === 'warn') {
            console.warn(line);
        } else {
            console.log(line);
        }
    }
};

let sink: GameLogSink = consoleSink;

/**
 * Leitet alle Logs der Spiellogik um, z. B. im API auf den Nest.js Logger.
 * Ohne Argument wieder auf die Konsole.
 */
export function setGameLogSink(newSink?: GameLogSink) {
    sink = newSink ?? consoleSink;
}

/** Logger mit festem Kontext; der Sink wird erst beim Schreiben ermittelt. */
export function createGameLogger(context: string): GameLogger {
    return {
        log: message => sink('log', context, message),
        warn: message => sink('warn', context, message),
        error: message => sink('error', context, message),
        debug: message => sink('debug', context, message),
        verbose: message => sink('verbose', context, message),
    };
}
