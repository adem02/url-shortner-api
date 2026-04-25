import pino from 'pino';
import { ApiConfig } from '@/config/api.config';

const Logger = pino({
  level: ApiConfig.logging.level,
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export default Logger;
