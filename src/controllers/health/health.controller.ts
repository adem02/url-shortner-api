import { Request, Response } from 'express';

export const GetApiHealthController = async (_: Request, res: Response): Promise<void> => {
  res.status(200).send({
    status: 'UP',
    name: 'url-shortner-api',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
};
