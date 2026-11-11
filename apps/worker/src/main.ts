import 'dotenv/config';
import { CompressionApp } from './app';

async function main() {
  const app = new CompressionApp();
  await app.start();
}

main().catch((err) => {
  console.error('[Worker] Fatal startup error:', err);
  process.exit(1);
});
