import mongoose from 'mongoose';
import Photo from './models/Photo.js';

let _bucket = null;

// 사진 저장용 GridFS 버킷 (최초 호출 시 생성)
export function getBucket() {
  if (!_bucket) {
    _bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'photos',
    });
  }
  return _bucket;
}

/**
 * 버퍼를 GridFS 에 저장하고 Photo 메타데이터를 생성한다.
 * @param {{buffer:Buffer, originalname:string, mimetype:string, size:number}} file
 */
export async function storeToGridFS(file, user, source = 'upload') {
  const bucket = getBucket();
  const stream = bucket.openUploadStream(file.originalname, { contentType: file.mimetype });
  await new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', resolve);
    stream.end(file.buffer);
  });
  return Photo.create({
    filename: file.originalname,
    contentType: file.mimetype,
    size: file.size,
    gridfsId: stream.id,
    uploadedBy: user?.uid || '',
    uploadedByName: user?.name || '',
    source,
  });
}
