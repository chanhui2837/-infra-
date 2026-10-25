import { Router } from 'express';
import User, { NNUMBER_REGEX } from '../models/User.js';
import { signToken, requireAuth, APPROVER_NNUMBER } from '../middleware/auth.js';

const router = Router();

function normalize(s) {
  return String(s || '').trim().toUpperCase();
}

// 회원가입: 이름 + 사번(N+숫자7자리) 만 등록 (비밀번호 없음)
router.post('/signup', async (req, res) => {
  try {
    const nnumber = normalize(req.body.nnumber);
    const name = String(req.body.name || '').trim();

    if (!name) return res.status(400).json({ error: '이름을 입력해 주세요.' });
    if (!NNUMBER_REGEX.test(nnumber)) {
      return res.status(400).json({ error: '사번은 N + 숫자 7자리 형식이어야 합니다. (예: N1101924)' });
    }

    const isApprover = nnumber === APPROVER_NNUMBER;
    const exists = await User.findOne({ nnumber });
    if (exists) {
      if (exists.status === 'pending') {
        return res.status(409).json({ error: `이미 가입 요청이 접수되어 ${APPROVER_NNUMBER} 사용자의 승인을 기다리는 중입니다.` });
      }
      if (exists.status === 'rejected') {
        // 거절된 사번은 다시 가입 요청 가능
        exists.name = name;
        exists.status = 'pending';
        exists.requestedAt = new Date();
        exists.decidedAt = undefined;
        exists.decidedBy = '';
        await exists.save();
        return res.status(202).json({ pending: true, message: `가입 요청을 다시 보냈습니다. ${APPROVER_NNUMBER} 사용자의 승인 후 로그인할 수 있습니다.` });
      }
      return res.status(409).json({ error: '이미 등록된 사번입니다. 로그인해 주세요.' });
    }

    // 승인 담당자 본인은 자동 승인 (아니면 아무도 승인할 수 없음)
    if (isApprover) {
      const user = await User.create({ nnumber, name, status: 'approved', lastLoginAt: new Date(), decidedAt: new Date(), decidedBy: 'system' });
      return res.status(201).json({ token: signToken(user), user: user.toPublic() });
    }

    await User.create({ nnumber, name, status: 'pending', requestedAt: new Date() });
    return res.status(202).json({ pending: true, message: `가입 요청이 접수되었습니다. ${APPROVER_NNUMBER} 사용자의 승인 후 로그인할 수 있습니다.` });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: '이미 등록된 사번입니다.' });
    return res.status(500).json({ error: err.message });
  }
});

// 로그인: 사번만 입력
router.post('/login', async (req, res) => {
  try {
    const nnumber = normalize(req.body.nnumber);
    if (!NNUMBER_REGEX.test(nnumber)) {
      return res.status(400).json({ error: '사번은 N + 숫자 7자리 형식이어야 합니다. (예: N1101924)' });
    }
    const user = await User.findOne({ nnumber });
    if (!user) {
      return res.status(404).json({ error: '등록되지 않은 사번입니다. 회원가입을 먼저 해주세요.' });
    }
    if (user.status === 'pending') {
      return res.status(403).json({ error: `아직 승인 대기 중입니다. ${APPROVER_NNUMBER} 사용자의 승인 후 로그인할 수 있습니다.` });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ error: '가입 요청이 거절되었습니다. 회원가입 탭에서 다시 요청해 주세요.' });
    }
    user.lastLoginAt = new Date();
    await user.save();
    return res.json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.uid);
  if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  return res.json({ user: user.toPublic() });
});

// 전체 가입자 목록 (공유/동기화 화면에서 사용)
router.get('/users', requireAuth, async (_req, res) => {
  const users = await User.find({ status: { $ne: 'pending' } }).sort({ createdAt: 1 });
  res.json({ users: users.map((u) => u.toPublic()) });
});

export default router;
