import pino from 'pino';
import { config } from '../config';

// Simple logger without pino-pretty transport
const logger = pino({
    level: config.logLevel,
    base: {
        env: config.nodeEnv,
    },
    ...(config.isDev && {
        formatters: {
            level: (label: string) => ({ level: label }),
        },
    }),
});

export { logger };
export default logger;
