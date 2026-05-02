import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { ApiConfig } from './config/api.config';
import routes from './routes';
import httpLogger from './middlewares/http-logger.middleware';
import Logger from './config/logger.config';
import { ErrorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { AppDataSource } from './config/data-source';
import { connectRedis } from './config/redis.config';
import { queueService } from './services/queue-service';
import { handlerRegistry } from './handlers/registry';

const app = express();
const PORT = ApiConfig.port;

app.set('trust proxy', 1);

app.use(express.json());
app.use(
  cors({
    origin: ApiConfig.cors.origin,
    methods: ApiConfig.cors.methods,
    allowedHeaders: ApiConfig.cors.allowedHeaders,
  }),
);
app.use(httpLogger);

app.use('/', routes);

app.use(ErrorHandlerMiddleware);

(async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    Logger.info('Data Source has been initialized!');

    await connectRedis();

    handlerRegistry.forEach(({ type, handler }) => {
      queueService.registerHandler(type, handler);
    });
    queueService
      .startConsumer()
      .catch((err) => Logger.error('Failed to start queue consumer:', err));

    app.listen(PORT, () => {
      Logger.info(`API Listening on port ${PORT}`);
      Logger.info(`We are in ${ApiConfig.environment} mode`);
    });
  } catch (err: unknown) {
    const errMsg =
      err instanceof Error ? err.message : 'Unexpected error occurred during app bootstrapping';

    Logger.error(errMsg);
    process.exit(1);
  }
})();
