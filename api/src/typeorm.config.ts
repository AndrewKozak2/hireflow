import "dotenv/config";
import { DataSource, DataSourceOptions } from "typeorm";
import { join } from "path";

export const TypeORMConfig: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database:
    process.env.NODE_ENV === "test"
      ? process.env.DB_TEST_NAME
      : process.env.DB_NAME,
  synchronize: false,

  entities: [join(__dirname, "**", "*.entity{.ts,.js}")],
  migrations: [join(__dirname, "database", "migrations", "{*.ts,*.js}")],

  logging: false,
};

export const dataSource = new DataSource(TypeORMConfig);
