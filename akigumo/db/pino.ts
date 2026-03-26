import pino from 'pino';

export const logger = pino({
    level: 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,label',
            messageFormat: '[{label}] {msg}',
            singleLine: false,
        }
    }
});
