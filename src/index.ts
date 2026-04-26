import express from 'express';
import cors from 'cors';
import { ApiConfig } from './config/api.config';
import routes from './routes';
import httpLogger from './middlewares/http-logger.middleware';
import Logger from './config/logger.config';
import { ErrorHandlerMiddleware } from './middlewares/error-handler.middleware';
import { AppDataSource } from './config/data-source';

const app = express();
const PORT = ApiConfig.port;

app.use(express.json());
app.use(
  cors({
    origin: ApiConfig.cors.origin,
    methods: ApiConfig.cors.methods,
    allowedHeaders: ApiConfig.cors.allowedHeaders,
  }),
);
app.use(httpLogger);

app.use('/api', routes);

app.use(ErrorHandlerMiddleware);

AppDataSource.initialize().then(() => {
  Logger.info('Data Source has been initialized!');

  app.listen(PORT, () => {
  Logger.info(`API Listening on port ${PORT}`);
  Logger.info(`We are in ${ApiConfig.environment} mode`);
});

}).catch(() => {
  Logger.error('Error during Data Source initialization');
  process.exit(1);
});
