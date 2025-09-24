import mysql from 'mysql2/promise';

const globalForMysql = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
  shutdownHandlersAdded?: boolean;
};

if (!globalForMysql.mysqlPool) {
  globalForMysql.mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'drgg',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 30,
    queueLimit: 0,
    idleTimeout: 600000 // 10 min
  });

  if (!globalForMysql.shutdownHandlersAdded) {
    process.on('SIGINT', async () => {
      await closeDbPool();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await closeDbPool();
      process.exit(0);
    });

    globalForMysql.shutdownHandlersAdded = true;
  }
}

export function getDbPool(): mysql.Pool {
  return globalForMysql.mysqlPool!;
}

export async function closeDbPool(): Promise<void> {
  if (globalForMysql.mysqlPool) {
    await globalForMysql.mysqlPool.end();
    globalForMysql.mysqlPool = undefined;
  }
}

/**
 * Executa uma query com retry automático em erros temporários
 */
export async function queryDb<T = any>(query: string, params?: any[]): Promise<T> {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const pool = getDbPool();
    try {
      const [rows] = await pool.query(query, params);
      return rows as T;
    } catch (err: any) {
      const retryableErrors = [
        'ETIMEDOUT',
        'ECONNREFUSED',
        'PROTOCOL_CONNECTION_LOST',
        'ENOTFOUND',
        'ER_CON_COUNT_ERROR'
      ];

      const isLastAttempt = attempt === maxRetries;

      if (retryableErrors.includes(err.code) && !isLastAttempt) {
        console.warn(
          `[MySQL Retry] Tentativa ${attempt} falhou com erro ${err.code}. Retentando em ${attempt * 1000}ms...`
        );

        await new Promise(res => setTimeout(res, attempt * 1000));

        if (['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR'].includes(err.code)) {
          try {
            await pool.end();
            globalForMysql.mysqlPool = undefined;
          } catch (closeErr) {
            console.error('Erro ao encerrar o pool:', closeErr);
          }
        }
      } else {
        throw err;
      }
    }
  }

  throw new Error('Erro ao executar query após várias tentativas');
}
