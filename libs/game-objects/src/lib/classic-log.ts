export type ClassicLogSink = (message: string) => void;

function isTestRun(): boolean {
    // Kein Node-Typ nötig, die Bibliothek wird auch im Browser eingebunden.
    const env = (globalThis as { process?: { env?: { [key: string]: string | undefined } } }).process?.env;
    return env?.['JEST_WORKER_ID'] !== undefined;
}

const defaultSink: ClassicLogSink = message => {
    if (isTestRun() === false) {
        console.log(message);
    }
};

let sink: ClassicLogSink = defaultSink;

/** Leitet die Classic-Logs um (z. B. in Tests); ohne Argument wieder auf die Konsole. */
export function setClassicLogSink(newSink?: ClassicLogSink) {
    sink = newSink ?? defaultSink;
}

/** Protokoll der Classic-Auswertung, z. B. warum keine Schiffe gebaut werden. */
export function classicLog(message: string) {
    sink(`[Classic] ${message}`);
}
