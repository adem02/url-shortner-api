import pinoHttp from 'pino-http';
import Logger from '@/config/logger.config';
import { Request } from 'express';

const httpLogger = pinoHttp({
  logger: Logger,
  redact: {
    paths: ['req', 'res', 'responseTime'],
    remove: true,
  },
  transport: {
    target: 'pino-http-print', // use the pino-http-print transport and its formatting output
    options: {
      destination: 1,
      all: true,
      translateTime: true,
    },
  },
  customLogLevel: function (_, res, err) {
    if (err) {
      return 'error'; // Erreur serveur ou autre
    } else if (res.statusCode >= 400) {
      return 'warn'; // Erreurs 4xx
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'debug'; // Redirections
    }
    return 'info'; // Réponses 2xx
  },
  customSuccessMessage(req, res, responseTime) {
    const request = req as Request;
    const clientIp = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    const fullRoute = request.originalUrl || req.url;
    return `${req.method} ${fullRoute} ${res.statusCode} ${responseTime}ms - IP: ${clientIp}`;
  },
});

export default httpLogger;
