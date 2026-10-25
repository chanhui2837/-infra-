import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import User from './models/User.js';
import Trip from './models/Trip.js';
import Revision from './models/Revision.js';
import Photo from './models/Photo.js';
import { storeToGridFS } from './gridfs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

function readJson(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf-8'));
  } catch {
    return null;
  }
}

const MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

/**
 * 엑셀에서 추출한 데이터를 MongoDB 에 적재한다.
 * 이미 데이터가 있으면(force=false) 건너뛴다.
 */
export async function runSeed({ force = false, withImages = false, log = console.log } = {}) {
  const created = { trips: 0, revisions: 0, users: 0, photos: 0 };

  // 1) 차단기 트립 (엑셀 2번 시트)
  const trips = readJson('trips.json') || [];
  const tripCount = await Trip.countDocuments();
  if (force) await Trip.deleteMany({});
  if (force || tripCount === 0) {
    if (trips.length) {
      await Trip.insertMany(
        trips.map((t) => ({ ...t, createdBy: '엑셀 가져오기', updatedBy: '엑셀 가져오기' })),
        { ordered: false }
      );
      created.trips = trips.length;
    }
  }

  // 2) DORS415 리비전 (엑셀 3번 시트)
  const revisions = readJson('revisions.json') || [];
  const revCount = await Revision.countDocuments();
  if (force) await Revision.deleteMany({});
  if (force || revCount === 0) {
    if (revisions.length) {
      await Revision.insertMany(
        revisions.map((r) => ({ ...r, createdBy: '엑셀 가져오기', updatedBy: '엑셀 가져오기' })),
        { ordered: false }
      );
      created.revisions = revisions.length;
    }
  }

  // 3) 기본 계정 (최초 1회)
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create({ nnumber: 'N1101924', name: '이상민' });
    created.users = 1;
  }

  // 4) 엑셀에 첨부된 사진을 GridFS 로 적재
  const photoCount = await Photo.countDocuments();
  if ((force || photoCount === 0) && withImages) {
    const imgDir = path.join(DATA_DIR, 'excel-images');
    const list = readJson('excel-images.json') || [];
    for (const img of list) {
      const fp = path.join(imgDir, img.file);
      if (!fs.existsSync(fp)) continue;
      const buffer = fs.readFileSync(fp);
      await storeToGridFS(
        {
          buffer,
          originalname: img.file,
          mimetype: MIME[path.extname(img.file).toLowerCase()] || 'application/octet-stream',
          size: buffer.length,
        },
        { uid: '', name: '엑셀 첨부' },
        'excel'
      );
      created.photos += 1;
    }
  }

  log(
    `[seed] 트립 ${created.trips}건 / 리비전 ${created.revisions}건 / 계정 ${created.users}개 / 사진 ${created.photos}장 적재`
  );
  return created;
}

// 직접 실행: node server/seed.js [--force] [--with-images]
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDB } = await import('./db.js');
  await connectDB();
  await runSeed({
    force: process.argv.includes('--force'),
    withImages: process.argv.includes('--with-images'),
  });
  process.exit(0);
}
