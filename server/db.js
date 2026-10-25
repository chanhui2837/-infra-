import 'dotenv/config';
import mongoose from 'mongoose';

let memoryServer = null;

/**
 * MongoDB 연결. MONGODB_URI 가 없으면 로컬 개발용 인메모리 MongoDB 를 사용한다.
 * (인메모리 모드는 테스트 전용이며, Render 배포 시에는 MONGODB_URI 를 반드시 설정한다.)
 */
export async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('[db] MONGODB_URI 미설정 -> 인메모리 MongoDB 사용 (개발용)');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log('[db] MongoDB 연결 완료');

  mongoose.connection.on('error', (e) => console.error('[db] 연결 오류:', e.message));
  return mongoose.connection;
}

export function isMemoryDB() {
  return memoryServer !== null;
}

export default mongoose;
