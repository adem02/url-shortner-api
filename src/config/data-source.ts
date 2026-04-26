import { DataSource } from "typeorm";
import { ApiConfig } from "./api.config";

const {isDevMode, dbConfig} = ApiConfig;

export const AppDataSource = new DataSource({
  type: "postgres",
  host: dbConfig.host || 'postgres',
  port: dbConfig.port || 5432,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  synchronize: false,
  logging: false,
  entities: isDevMode ? 
    [__dirname + "/../models/**/*.ts"] : [__dirname + "/../models/**/*.js"],
  migrations: isDevMode ?
    [__dirname + "/../migrations/**/*.ts"] : [__dirname + "/../migrations/**/*.js"],
});
