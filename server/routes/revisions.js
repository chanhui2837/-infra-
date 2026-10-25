import { Router } from 'express';
import Revision from '../models/Revision.js';
import { requireDeleter } from '../middleware/auth.js';
import { renumber } from '../renumber.js';

const router = Router();

const TEXT_FIELDS = ['region', 'facilityCode', 'siteName', 'date', 'manager', 'done', 'worker', 'actionDate', 'note'];

function pickText(body) {
  const out = {};
  for (const f of TEXT_FIELDS) {
    if (body[f] !== undefined) out[f] = String(body[f] ?? '');
  }
  return out;
}

router.get('/', async (req, res) => {
  const { region, q, status } = req.query;
  const filter = {};
  if (region) filter.region = region;
  if (status === '완료') filter.done = /완료/;
  if (status === '미완료') filter.done = { $not: /완료/ };
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ siteName: rx }, { facilityCode: rx }, { manager: rx }, { worker: rx }];
  }
  const items = await Revision.find(filter).sort({ seq: 1, createdAt: 1 });
  res.json({ items });
});

router.get('/:id', async (req, res) => {
  const item = await Revision.findById(req.params.id);
  if (!item) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  res.json({ item });
});

router.post('/', async (req, res) => {
  try {
    const data = pickText(req.body);
    if (req.body.seq !== undefined && req.body.seq !== '') data.seq = Number(req.body.seq);
    data.createdBy = req.user.name;
    data.updatedBy = req.user.name;
    const item = await Revision.create(data);
    res.status(201).json({ item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const data = pickText(req.body);
    if (req.body.seq !== undefined && req.body.seq !== '') data.seq = Number(req.body.seq);
    if (Array.isArray(req.body.photos)) data.photos = req.body.photos;
    data.updatedBy = req.user.name;
    const item = await Revision.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!item) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
    res.json({ item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireDeleter, async (req, res) => {
  const item = await Revision.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  // 삭제 후 순번을 1부터 다시 매김 (2번 삭제 시 3번 → 2번)
  await renumber(Revision);
  res.json({ ok: true });
});

export default router;
