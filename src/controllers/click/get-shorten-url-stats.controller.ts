import { clickRepository } from '@/repositories/click.repository';
import { linkRepository } from '@/repositories/link.repository';
import { cacheService } from '@/services/cache.service';
import { StatsService } from '@/services/stats.service';
import { GetShortenUrlStatsOutputDTO, GetShortenUrlStatsParams } from '@/types/click.types';
import { Request, Response, NextFunction } from 'express';

export const GetShortenUrlStatsController = async (
  req: Request<GetShortenUrlStatsParams>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code } = req.params;

    const statsService = new StatsService(linkRepository, clickRepository, cacheService);

    const { statsLink, stats } = await statsService.getStatsByCode(code);

    const responseData: GetShortenUrlStatsOutputDTO = {
      success: true,
      data: {
        link: statsLink,
        stats,
      },
    };

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};
