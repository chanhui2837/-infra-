import { Router } from 'express';
import multer from 'multer';
import { getBucket, storeToGridFS } from '../gridfs.js';
import Photo from '../models/Photo.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// 사진 업로드 (여러 장 동시 업로드 가능)
router.post('/', requireAuth, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: '파일이 없습니다.' });
    const photos = [];
    for (const f of files) photos.push(await storeToGridFS(f, req.user));
    res.status(201).json({ photos: photos.map((p) => p.toPublic()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 공유 갤러리용 사진 목록
router.get('/meta/list', requireAuth, async (_req, res) => {
  const photos = await Photo.find().sort({ createdAt: -1 }).limit(500);
  res.json({ photos: photos.map((p) => p.toPublic()) });
});

// 사진 원본 (공유를 위해 인증 없이 조회 가능)
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).send('not found');
    res.setHeader('Content-Type', photo.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    getBucket().openDownloadStream(photo.gridfsId).pipe(res);
  } catch {
    res.status(404).send('not found');
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
    await getBucket().delete(photo.gridfsId).catch(() => {});
    await photo.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
