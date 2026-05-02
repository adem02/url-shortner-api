import { AppDataSource } from './../src/config/data-source';
import Logger from '../src/config/logger.config';
import { ApiConfig } from '../src/config/api.config';

export class TestDbConfig {
  static async Close(): Promise<void> {
    if (!ApiConfig.isTestMode) {
      throw new Error('Close data source should only be called in test mode');
    }

    if (!AppDataSource.isInitialized) {
      Logger.warn('Data source is not initialized, skipping close');
      return;
    }

    Logger.debug('Closing data source');
    await AppDataSource.destroy();
  }

  static async ClearDatabase(): Promise<void> {
    if (!ApiConfig.isTestMode) {
      throw new Error('ClearDatabase should only be called in test mode');
    }

    Logger.debug('Clearing database');
    const dataSource = AppDataSource;

    if (!dataSource.isInitialized) {
      throw new Error('Data source is not initialized');
    }

    const orderedEntities = [
      'Click',
      'Link',
    ];

    for (const entityName of orderedEntities) {
      const repository = dataSource.getRepository(entityName);
      
      try {
        await repository.createQueryBuilder().delete().execute();
      } catch (error) {
        Logger.error(`Error clearing ${entityName} table: ${error}`);
      }
    }
  }

  static async Reset(): Promise<void> {
    if (!ApiConfig.isTestMode) {
      throw new Error('Reset should only be called in test mode');
    }

    if (AppDataSource.isInitialized) {
      await TestDbConfig.Close();
    }

    Logger.debug('Initializing data source for test environment');
    const { Link } = await import('../src/models/Links');
    const { Click } = await import('../src/models/Clicks');
    (AppDataSource.options as unknown as Record<string, unknown>).entities = [Link, Click];
    await AppDataSource.initialize();
    Logger.debug('Data source initialized');
    await AppDataSource.synchronize(true);
    Logger.debug('Database schema synchronized');
  }
}
