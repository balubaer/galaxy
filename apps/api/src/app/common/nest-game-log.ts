import { Logger } from '@nestjs/common';
import { setGameLogSink } from '@galaxy/game-objects';

/** Leitet die Logs der Spiellogik (libs/game-objects) auf den Nest.js Logger um. */
export function useNestLoggerForGameLog() {
    const loggers = new Map<string, Logger>();
    setGameLogSink((level, context, message) => {
        let logger = loggers.get(context);
        if (!logger) {
            logger = new Logger(context);
            loggers.set(context, logger);
        }
        logger[level](message);
    });
}
