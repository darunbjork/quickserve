import pino from 'pino';

// WHY: Structured JSON logging is non-negotiable for distributed tracing. 
// We output standard JSON in production for log aggregators (Datadog/ELK) to parse easily, 
// but use pino-pretty in development so engineers can actually read the console.
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: (label) => ({ level: label }), 
  },
});