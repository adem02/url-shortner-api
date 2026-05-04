import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { ApiConfig } from './config/api.config';
import { swaggerSpec } from './config/swagger.config';
import routes from './routes';
import httpLogger from './middlewares/http-logger.middleware';
import { ErrorHandlerMiddleware } from './middlewares/error-handler.middleware';

const app = express();

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

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', routes);

app.use(ErrorHandlerMiddleware);

export { app };
