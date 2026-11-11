import { Worker, type ConnectionOptions } from 'bullmq';
import { CompressionProcessor } from './processors/compression.processor';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

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

    console.log('[Worker] 🚀 Compression worker started, listening on queue: compression');
    console.log(`[Worker] Connected to Redis at ${REDIS_URL}`);

    // Graceful shutdown
    const shutdown = async () => {
      console.log('[Worker] Shutting down...');
      await this.worker.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}
