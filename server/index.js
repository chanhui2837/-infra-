import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, isMemoryDB } from './db.js';
import { runSeed } from './seed.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import revisionRoutes from './routes/revisions.js';
import photoRoutes from './routes/photos.js';
import summaryRoutes from './routes/summary.js';
import exportRoutes from './routes/export.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ----- API -----
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/trips', requireAuth, tripRoutes);
app.use('/api/revisions', requireAuth, revisionRoutes);
app.use('/api/summary', requireAuth, summaryRoutes);
app.use('/api/export', requireAuth, exportRoutes);
app.use('/api/photos', photoRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'API 경로를 찾을 수 없습니다.' }));

// ----- 프론트엔드 정적 파일 (client/dist) -----
const distDir = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  app.get('/', (_req, res) =>
    res.send('Infra 포털 서버 실행 중입니다. 프론트엔드는 client/dist 빌드 후 제공됩니다.')
  );
}

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  // 최초 기동 시(또는 AUTO_SEED=1) 엑셀 데이터 자동 적재
  if (process.env.AUTO_SEED !== '0') {
    await runSeed({ withImages: !isMemoryDB() || process.env.SEED_IMAGES === '1' });
  }

  app.listen(PORT, () => console.log(`[server] http://localhost:${PORT} 실행 중`));
}

start().catch((err) => {
  console.error('[server] 기동 실패:', err);
  process.exit(1);
});
