import mysql, { Pool, PoolOptions, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const config: PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jarac',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  dateStrings: true,
  decimalNumbers: true,
};

declare global {
  // eslint-disable-next-line no-var
  var __jaracPool: Pool | undefined;
}

export const pool: Pool = globalThis.__jaracPool ?? mysql.createPool(config);
if (process.env.NODE_ENV !== 'production') globalThis.__jaracPool = pool;

export async function query<T = RowDataPacket>(
  sql: string,
  params: ReadonlyArray<unknown> = []
): Promise<T[]> {
  const [rows] = await pool.query(sql, params as unknown[]);
  return rows as T[];
}

export async function queryOne<T = RowDataPacket>(
  sql: string,
  params: ReadonlyArray<unknown> = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params: ReadonlyArray<unknown> = []
): Promise<ResultSetHeader> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [res] = await pool.execute(sql, params as any);
  return res as ResultSetHeader;
}
