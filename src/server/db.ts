import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export interface DatabaseHealthResult {
  connected: boolean;
  version?: string;
  database?: string;
  serverTime?: string;
  error?: string;
}

/**
 * Pool de conexões com o PostgreSQL 18.6
 * Configurado estritamente para conexões internas/locais na VM (porta 5432 não exposta publicamente).
 * Credenciais parametrizadas via variáveis de ambiente.
 */
export const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'regcobre',
  user: process.env.DB_USER || 'regcobre_app',
  password: process.env.DB_PASSWORD || '',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '5000', 10),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Unexpected Error]:', err.message);
});

/**
 * Testa a integridade da conexão executando consulta leve (SELECT NOW(), version()).
 * Não expõe senhas ou dados sensíveis em caso de falha de conexão.
 */
export async function checkDatabaseConnection(): Promise<DatabaseHealthResult> {
  const targetDb = process.env.DB_NAME || 'regcobre';
  let client: pg.PoolClient | null = null;

  try {
    client = await pool.connect();
    const res = await client.query('SELECT NOW() as now, version() as version;');
    const row = res.rows[0];

    return {
      connected: true,
      database: targetDb,
      serverTime: row?.now instanceof Date ? row.now.toISOString() : String(row?.now),
      version: row?.version || 'PostgreSQL (versão não retornada)',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha desconhecida na conexão com o banco';
    return {
      connected: false,
      database: targetDb,
      error: errorMsg,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}
