import { Router } from 'express';
import Trip from '../models/Trip.js';

const router = Router();

const TEXT_FIELDS = [
  'region', 'facilityCode', 'siteName', 'occurredDate', 'manager', 'breakerType',
  'breakerLocation', 'occurCount', 'breakerStatus', 'insulationResistance',
  'inspectProgress', 'defectCause', 'actionResult', 'keyMission', 'actionDate',
  'actionBy', 'actionNote', 'etcNote', 'spd', 'acta',
];

function pickText(body) {
  const out = {};
  for (const f of TEXT_FIELDS) {
    if (body[f] !== undefined) out[f] = String(body[f] ?? '');
  }
  return out;
}

// 목록 (검색/지역 필터)
router.get('/', async (req, res) => {
  const { region, q, status } = req.query;
  const filter = {};
  if (region) filter.region = region;
  if (status === '진행중') filter.actionResult = { $not: /완료/ };
  if (status === '완료') filter.actionResult = /완료/;
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ siteName: rx }, { facilityCode: rx }, { manager: rx }, { actionBy: rx }];
  }
  const items = await Trip.find(filter).sort({ seq: 1, createdAt: 1 });
  res.json({ items });
});

router.get('/:id', async (req, res) => {
  const item = await Trip.findById(req.params.id);
  if (!item) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  res.json({ item });
});

// 추가 등록
router.post('/', async (req, res) => {
  try {
    const data = pickText(req.body);
    if (req.body.seq !== undefined && req.body.seq !== '') data.seq = Number(req.body.seq);
    if (Array.isArray(req.body.visits)) data.visits = req.body.visits;
    if (Array.isArray(req.body.beforePhotos)) data.beforePhotos = req.body.beforePhotos;
    if (Array.isArray(req.body.afterPhotos)) data.afterPhotos = req.body.afterPhotos;
    data.createdBy = req.user.name;
    data.updatedBy = req.user.name;
    const item = await Trip.create(data);
    res.status(201).json({ item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 수정 (누구나 수정 가능 - 공유/동기화)
router.patch('/:id', async (req, res) => {
  try {
    const data = pickText(req.body);
    if (req.body.seq !== undefined && req.body.seq !== '') data.seq = Number(req.body.seq);
    if (Array.isArray(req.body.visits)) data.visits = req.body.visits;
    if (Array.isArray(req.body.beforePhotos)) data.beforePhotos = req.body.beforePhotos;
    if (Array.isArray(req.body.afterPhotos)) data.afterPhotos = req.body.afterPhotos;
    data.updatedBy = req.user.name;
    const item = await Trip.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!item) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
    res.json({ item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const item = await Trip.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  res.json({ ok: true });
});

export default router;
