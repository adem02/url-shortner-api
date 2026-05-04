import { app } from './app';
import { ApiConfig } from './config/api.config';
import Logger from './config/logger.config';
import { AppDataSource } from './config/data-source';
import { connectRedis } from './config/redis.config';
import { queueService } from './services/queue-service';
import { handlerRegistry } from './handlers/registry';

const PORT = ApiConfig.port;

(async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    Logger.info('Data Source has been initialized!');

    await AppDataSource.runMigrations();
    Logger.info('Migrations applied successfully');

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
