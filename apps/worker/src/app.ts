import http from 'http';
import { Worker, type ConnectionOptions } from 'bullmq';
import { CompressionProcessor } from './processors/compression.processor';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const HEALTH_PORT = parseInt(process.env.WORKER_HEALTH_PORT || '4001', 10);

function parseRedisUrl(url: string): ConnectionOptions {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      db: parsed.pathname ? parseInt(parsed.pathname.slice(1) || '0', 10) : 0,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

export class CompressionApp {
  private worker!: Worker;
  private healthServer?: http.Server;

  async start() {
    const connection = parseRedisUrl(REDIS_URL);
    const processor = new CompressionProcessor();

    this.worker = new Worker(
      'compression',
      async (job) => processor.process(job),
      {
        connection,
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    );

    this.worker.on('completed', (job) => {
      console.log(`[Worker] Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed:`, err.message);
    });

    this.worker.on('progress', (job, progress) => {
      console.log(`[Worker] Job ${job.id} progress: ${progress}%`);
    });

    this.worker.on('error', (err) => {
      console.error('[Worker] Worker error:', err);
    });

    // Lightweight HTTP health check server
    this.healthServer = http.createServer((req, res) => {
      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            service: 'compression-worker',
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
          }),
        );
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    this.healthServer.listen(HEALTH_PORT, () => {
      console.log(`[Worker] 🩺 Health server listening on http://localhost:${HEALTH_PORT}/health`);
    });

    console.log('[Worker] 🚀 Compression worker started, listening on queue: compression');
    console.log(`[Worker] Connected to Redis at ${REDIS_URL}`);

    // Graceful shutdown
    const shutdown = async () => {
      console.log('[Worker] Shutting down...');
      if (this.healthServer) {
        this.healthServer.close();
      }
      await this.worker.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}
