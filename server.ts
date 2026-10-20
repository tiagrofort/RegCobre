import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkDatabaseConnection, pool } from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createExpressApp() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // =========================================================================
  // ENDPOINTS DE INFRAESTRUTURA & SAÚDE DO SISTEMA
  // =========================================================================

  /**
   * GET /api/health
   * Endpoint oficial de monitoramento de saúde do backend e do banco PostgreSQL 18.6.
   * Não expõe senhas ou dados sensíveis.
   * Distingue com precisão o estado do servidor HTTP (online) do estado da conexão com o PostgreSQL.
   */
  app.get('/api/health', async (_req: Request, res: Response) => {
    const dbHealth = await checkDatabaseConnection();
    const isDbConnected = dbHealth.connected;

    res.status(200).json({
      status: isDbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      server: {
        status: 'online',
        uptimeSeconds: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        service: 'regcobre-api',
        port: parseInt(process.env.PORT || '3000', 10),
      },
      database: {
        status: isDbConnected ? 'connected' : 'unreachable',
        connected: isDbConnected,
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: dbHealth.database,
        user: process.env.DB_USER || 'regcobre_app',
        version: dbHealth.version,
        serverTime: dbHealth.serverTime,
        error: dbHealth.error,
      },
    });
  });

  // =========================================================================
  // INTEGRAÇÃO COM FRONTEND (Vite em Desenvolvimento / Dist em Produção)
  // =========================================================================

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Inicialização autônoma se executado diretamente
const isDirectExecution = process.argv[1] && (
  process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')
);

if (isDirectExecution) {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  createExpressApp().then((app) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[RegCobre] Servidor operacional em http://0.0.0.0:${PORT} (Ambiente: ${process.env.NODE_ENV || 'development'})`);
      console.log(`[RegCobre] Endpoint de saúde disponível em http://localhost:${PORT}/api/health`);
    });

    const shutdown = async () => {
      console.log('\n[RegCobre] Encerrando servidor HTTP e liberando conexões do pool...');
      server.close(async () => {
        try {
          await pool.end();
          console.log('[RegCobre] Pool PostgreSQL finalizado.');
        } catch (err) {
          console.error('[RegCobre] Erro ao fechar pool:', err);
        }
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }).catch((err) => {
    console.error('[RegCobre FATAL] Falha na inicialização do servidor Express:', err);
    process.exit(1);
  });
}
