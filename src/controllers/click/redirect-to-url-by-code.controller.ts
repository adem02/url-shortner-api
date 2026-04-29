// import { clickRepository } from '@/repositories/click.repository';
import Logger from '@/config/logger.config';
import { linkRepository } from '@/repositories/link.repository';
import { cacheService } from '@/services/cache.service';
import { ClickService } from '@/services/click.services';
import { queueService } from '@/services/queue-service';
import { RedirectToUrlByCodeParams, SaveClickDataPayload } from '@/types/click.types';
import { Request, Response, NextFunction } from 'express';
import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';

export const RedirectToUrlByCodeController = async (
  req: Request<RedirectToUrlByCodeParams>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code } = req.params;

    const clickService = new ClickService(linkRepository, cacheService);

    const link = await clickService.getLinkByCode(code);

    res.status(302).redirect(link.longUrl);

    const userAgent = req.headers['user-agent'] ?? null;
    const parser = new UAParser.UAParser(userAgent ?? '');
    const deviceType = parser.getDevice().type || 'desktop';
    const browserName = parser.getBrowser().name || null;

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip ?? '0.0.0.0';
    const geo = geoip.lookup(ip) ?? null;
    const country = geo ? geo.country : null;

    const clickData: SaveClickDataPayload = {
      linkId: link.id,
      country: country,
      device: deviceType,
      browser: browserName,
      clickedAt: new Date(),
    };

    queueService
      .publish<SaveClickDataPayload>({
        type: 'click.save',
        occuredAt: clickData.clickedAt.toISOString(),
        payload: clickData,
      })
      .catch((err) => Logger.error('[CONTROLLER] Failed to publish click event:', err));
  } catch (error) {
    next(error);
  }
};
