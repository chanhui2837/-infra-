import { Router } from 'express';
import User from '../models/User.js';
import { requireApprover } from '../middleware/auth.js';

const router = Router();
router.use(requireApprover);

const toItem = (u) => ({
  id: u._id,
  nnumber: u.nnumber,
  name: u.name,
  status: u.status,
  requestedAt: u.requestedAt || u.createdAt,
  decidedAt: u.decidedAt || null,
});

// 대기 중 요청 + 최근 처리 내역
router.get('/', async (_req, res) => {
  const pending = await User.find({ status: 'pending' }).sort({ requestedAt: 1, createdAt: 1 });
  const done = await User.find({ status: { $in: ['approved', 'rejected'] }, decidedBy: { $ne: '' } })
    .sort({ decidedAt: -1 })
    .limit(30);
  res.json({ pending: pending.map(toItem), done: done.map(toItem) });
});

// 뱃지용 대기 건수
router.get('/count', async (_req, res) => {
  res.json({ pending: await User.countDocuments({ status: 'pending' }) });
});

async function decide(req, res, status) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: '요청을 찾을 수 없습니다.' });
  if (user.status !== 'pending') {
    return res.status(409).json({ error: '이미 처리된 요청입니다.' });
  }
  user.status = status;
  user.decidedAt = new Date();
  user.decidedBy = req.user.nnumber;
  await user.save();
  res.json({ item: toItem(user) });
}

router.post('/:id/approve', (req, res) => decide(req, res, 'approved'));
router.post('/:id/reject', (req, res) => decide(req, res, 'rejected'));

export default router;
