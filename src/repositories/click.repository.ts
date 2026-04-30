import { ApiConfig } from '@/config/api.config';
import { AppDataSource } from '@/config/data-source';
import Logger from '@/config/logger.config';
import { ApiError, ApiErrorCode } from '@/errors';
import { Click } from '@/models/Clicks';
import {
  ClicksMetrics,
  ClicksPerHour,
  RecentClick,
  SaveClickDataPayload,
  StatsCountry,
  StatsDevices,
} from '@/types/click.types';
import { Repository } from 'typeorm';

export class ClickRepository {
  private readonly clickRepository: Repository<Click>;

  constructor() {
    this.clickRepository = AppDataSource.getRepository(Click);
  }

  async create(data: SaveClickDataPayload): Promise<void> {
    try {
      await this.clickRepository.save({
        link: { id: data.linkId },
        country: data.country,
        device: data.device,
        browser: data.browser,
        clickedAt: data.clickedAt,
      });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to save click data: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'sql/failed',
        'Failed saving click data',
      );
    }
  }

  async getDevicesMetricsByLinkId(linkId: string): Promise<StatsDevices> {
    try {
      const qb = this.clickRepository.createQueryBuilder('c');
      const devicesMetrics = await qb
        .select('c.device', 'device')
        .addSelect('COUNT(c.id)', 'clicks')
        .where('c.link_id = :linkId', { linkId })
        .groupBy('c.device')
        .getRawMany();

      const devices: StatsDevices = {
        mobile: 0,
        tablet: 0,
        desktop: 0,
      };

      devicesMetrics.forEach(({ device, clicks }: { device: string; clicks: number }) => {
        const deviceKey: keyof StatsDevices =
          device !== 'mobile' && device !== 'tablet' ? 'desktop' : device;

        devices[deviceKey] = Number(clicks);
      });

      return devices;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to get devices metrics by link id: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'sql/failed',
        'Failed getting devices metrics',
      );
    }
  }

  async getCountryClicksByLinkId(linkId: string): Promise<StatsCountry[]> {
    try {
      const qb = this.clickRepository.createQueryBuilder('c');
      const rawCountryClicks = await qb
        .select('c.country', 'country')
        .addSelect('COUNT(c.id)', 'clicks')
        .where('c.link_id = :linkId', { linkId })
        .groupBy('c.country')
        .orderBy('"clicks"', 'DESC')
        .getRawMany();

      const total = rawCountryClicks.reduce((sum, c) => sum + Number(c.clicks), 0);

      return rawCountryClicks.map<StatsCountry>(({ country, clicks }) => ({
        country,
        clicks,
        percentage: Math.round((Number(clicks) / total) * 100),
      }));
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to get country clicks by link id: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'sql/failed',
        'Failed getting country clicks',
      );
    }
  }

  async getClicksPerHourByLinkId(linkId: string): Promise<ClicksPerHour[]> {
    try {
      const qb = this.clickRepository.createQueryBuilder('c');

      const rawClicksPerHour = await qb
        .select("DATE_TRUNC('hour', c.clicked_at)", 'hour')
        .addSelect('COUNT(c.id)', 'clicks')
        .where('c.link_id = :linkId', { linkId })
        .andWhere("c.clicked_at > NOW() - INTERVAL '24 hours'")
        .groupBy('"hour"')
        .orderBy('"hour"', 'ASC')
        .getRawMany();

      return rawClicksPerHour.map<ClicksPerHour>(({ hour, clicks }) => {
        const date = new Date(hour);
        const h = date.getUTCHours().toString().padStart(2, '0');
        const m = date.getUTCMinutes().toString().padStart(2, '0');
        const formattedHour = `${h}:${m}`;

        return { hour: formattedHour, clicks };
      });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to get clicks per hour by link id: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'sql/failed',
        'Failed getting clicks per hour',
      );
    }
  }

  async getClicksMetricsByLinkId(linkId: string): Promise<ClicksMetrics> {
    try {
      const qb = this.clickRepository.createQueryBuilder('c');

      const rawClicksMetrics = await qb
        .select('COUNT(c.link_id)', 'total')
        .addSelect("COUNT(c.id) FILTER (WHERE c.clicked_at >= DATE_TRUNC('day', NOW()))", 'today')
        .addSelect(
          "COUNT(c.id) FILTER (WHERE c.clicked_at >= NOW() - INTERVAL '7 days')",
          'thisWeek',
        )
        .addSelect(
          "COUNT(c.id) FILTER (WHERE c.clicked_at >= NOW() - INTERVAL '30 days')",
          'thisMonth',
        )
        .where('c.link_id = :linkId', { linkId })
        .getRawOne();

      return {
        total: Number(rawClicksMetrics.total as string),
        today: Number(rawClicksMetrics.today as string),
        thisWeek: Number(rawClicksMetrics.thisWeek as string),
        thisMonth: Number(rawClicksMetrics.thisMonth as string),
      } as ClicksMetrics;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to get clicks metrics by link id: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'sql/failed',
        'Failed getting clicks metrics',
      );
    }
  }

  async getRecentClicksByLinkId(linkId: string): Promise<RecentClick[]> {
    try {
      const qb = this.clickRepository.createQueryBuilder('c');

      const rawRecentClicks = await qb
        .select('c.country', 'country')
        .addSelect('c.device', 'device')
        .addSelect('c.browser', 'browser')
        .addSelect('c.clicked_at', 'timestamp')
        .where('c.link_id = :linkId', { linkId })
        .orderBy('c.clicked_at', 'DESC')
        .limit(5)
        .getRawMany();

      const recentClicks = rawRecentClicks.map<RecentClick>(
        ({ country, device, browser, timestamp }) => ({
          timestamp: timestamp as string,
          device: device !== 'mobile' && device !== 'tablet' ? 'desktop' : device,
          country: country as string,
          browser: browser as string,
        }),
      );

      return recentClicks;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to get recent clicks by link id: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'sql/failed',
        'Failed getting recent clicks',
      );
    }
  }
}

export const clickRepository = new ClickRepository();
